const router = require("express").Router();
const { Op, where, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  StockTransfer,
  StockManagement,
  ProductList,
  StockTransferProducts,
  Warehouse,
  StockTransferApproveProducts,
  Cutoff,
  Activity_Log,
} = require("../db/models/associations");
const moment = require("moment-timezone");

router.route("/getCodeStockTransfer").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await StockTransfer.findOne({
      where: {
        transaction_id: {
          [Op.like]: `ST-${currentMonth}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_id) {
      const latestRefCode = lastPayCode.transaction_id;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `ST-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `ST-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `ST-${currentMonth}-00001`;
    }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/createStockTransfer").post(async (req, res) => {
  const {
    countingDate,
    remarks,
    warehouseFrom_id,
    warehouseTo_id,
    transactionId,
    itemProductToTransfer,
    userLoggedID,
  } = req.body;
  try {
    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: countingDate },
          },
          {
            to: { [Op.gte]: countingDate },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const stockTransfer = await StockTransfer.create({
      transaction_id: transactionId,
      warehouse_from_id: warehouseFrom_id,
      warehouse_to_id: warehouseTo_id,
      date_transfer: countingDate,
      description: remarks,
      created_by: userLoggedID,
    });

    if (stockTransfer) {
      for (const item of itemProductToTransfer) {
        await StockTransferProducts.create({
          stock_transfer_id: stockTransfer.id,
          product_id: item.productId,
          available_quantity: item.available,
          quantity_to_transfer: item.quantity_to_transfer,
        });
      }

      Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Stock Transfer: User created new stock transfer with Stock Transfer ID ${transactionId}`,
      });

      res.status(200).json({ message: "Stock Transfer created successfully" });
    } else {
      res.status(400).json({ message: "Failed to create stock transfer" });
    }
  } catch (error) {
    console.error("Error creating stock transfer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/getInventoryList").get(async (req, res) => {
  try {
    const { warehouse_id, itemList, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let productListWhereClause = {};
    let productListTableColumn = [
      "product_code",
      "product_name",
      "product_category",
    ];

    if (searchText?.trim() !== "") {
      switch (filterColumn) {
        case "product_code":
        case "product_name":
        case "product_category":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          productListWhereClause = {
            [Op.or]: productListTableColumn.map((col) => {
              return {
                [col]: {
                  [Op.like]: `%${searchText}%`,
                },
              };
            }),
          };
          break;
      }
    }

    if (itemList) {
      productListWhereClause["product_id"] = {
        [Op.notIn]: itemList?.map((item) => item.productId),
      };
    }

    let { count, rows: data } = await StockManagement.findAndCountAll({
      distinct: true,
      limit: limit,
      offset: offset,
      where: {
        warehouse_id: warehouse_id,
        stock: {
          [Op.gt]: 0,
        },
      },
      attributes: [
        "product_id",
        "warehouse_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
        [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
        [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
      ],
      group: ["product_id", "warehouse_id"],
      include: [
        {
          model: ProductList,
          required: true,
          where: productListWhereClause,
        },
      ],
    });

    count = Array.isArray(count) ? count.length : count;

    if (data) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    } else {
      res.status(400).send("No data found");
    }
  } catch (error) {
    console.error("Error fetching inventory list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/getWarehouseTo").get(async (req, res) => {
  const { warehouse_id } = req.query;
  const data = await Warehouse.findAll({
    where: { warehouse_id: { [Op.ne]: warehouse_id } },
  });
  res.json(data);
});

router.route("/getStockTransfer").get(async (req, res) => {
  try {
    const { startDate, endDate, filterColumn, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let stockTransferWhereClause = {};
    let fromWhereClause = {};
    let toWhereClause = {};
    const stockTransferTableColumn = [
      "transaction_id",
      "date_transfer",
      "status",
      "warehouse_from",
      "warehouse_to",
    ];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_id":
          stockTransferWhereClause["transaction_id"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "from":
          fromWhereClause["name"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        case "to":
          toWhereClause["name"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        case "date_transfer":
          stockTransferWhereClause = {
            [Op.and]: [
              {
                ["date_transfer"]: {
                  [Op.and]: [
                    {
                      [Op.gte]: startDate,
                    },
                    {
                      [Op.lte]: endDate,
                    },
                  ],
                },
              },
              sequelize.where(literal(`CAST (date_transfer AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        case "status":
          stockTransferWhereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          stockTransferWhereClause = {
            [Op.or]: stockTransferTableColumn.map((col) => {
              if (col === "date_transfer") {
                return {
                  [Op.and]: [
                    {
                      ["date_transfer"]: {
                        [Op.and]: [
                          {
                            [Op.gte]: startDate,
                          },
                          {
                            [Op.lte]: endDate,
                          },
                        ],
                      },
                    },
                    sequelize.where(literal(`CAST (date_transfer AS CHAR)`), {
                      [Op.like]: `%${searchText}%`,
                    }),
                  ],
                };
              } else if (col === "warehouse_from" || col === "warehouse_to") {
                return {
                  [`$${col}.name$`]: {
                    [Op.like]: `%${searchText}%`,
                  },
                };
              } else {
                return {
                  [col]: {
                    [Op.like]: `%${searchText}%`,
                  },
                };
              }
            }),
          };

          break;
      }
    }

    // Initialize variable stockTransferWhereClause
    const applyDateFilter = () => {
      if (startDate !== "" && endDate !== "") {
        stockTransferWhereClause["date_transfer"] = {
          [Op.and]: [
            {
              [Op.gte]: startDate,
            },
            {
              [Op.lte]: endDate,
            },
          ],
        };
      }
    };

    async function fetchStockTransfers() {
      const { count, rows: data } = await StockTransfer.findAndCountAll({
        include: [
          {
            model: Warehouse,
            as: "warehouse_from",
            attributes: ["name"],
            where: fromWhereClause,
          },
          {
            model: Warehouse,
            as: "warehouse_to",
            attributes: ["name"],
            where: toWhereClause,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        where: stockTransferWhereClause,
      });

      return { count, data };
    }

    applyDateFilter();

    let { count, data } = await fetchStockTransfers();

    // If no data found, search for warehouse names in the "from" and "to" field
    // if (data.length === 0 && filterColumn == "all") {
    //   const searchFields = ["from", "to"];
    //   for (const field of searchFields) {
    //     stockTransferWhereClause = {};
    //     fromWhereClause = {};
    //     toWhereClause = {};
    //     if (field === "from") {
    //       fromWhereClause["name"] = {
    //         [Op.like]: `%${searchText}%`,
    //       };
    //     } else {
    //       toWhereClause["name"] = {
    //         [Op.like]: `%${searchText}%`,
    //       };
    //     }

    //     applyDateFilter();

    //     data = await fetchStockTransfers();

    //     if (data.length > 0) {
    //       return res.json(data);
    //     }
    //   }
    // }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/getDataCreated").get(async (req, res) => {
  const { stock_transfer_id } = req.query;
  try {
    const data = await StockTransfer.findOne({
      where: { id: stock_transfer_id },
      include: [
        {
          model: StockTransferProducts,
          required: true,
          include: [
            {
              model: ProductList,
              required: true,
            },
          ],
        },
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: data.date_transfer },
          },
          {
            to: { [Op.gte]: data.date_transfer },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    const plainData = data.get({ plain: true });
    plainData.isPosted = isPosted;

    return res.json(plainData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/updateStockTransfer").post(async (req, res) => {
  const {
    countingDate,
    remarks,
    warehouseFrom_id,
    warehouseTo_id,
    transactionId,
    itemProductToTransfer,
    stock_transfer_id,
    userLoggedID,
  } = req.query;
  console.log(req.query);
  try {
    const [getStockTransferData] = await StockTransfer.findAll({
      where: {
        id: stock_transfer_id,
        transaction_id: transactionId,
      },
    });

    const dataToGetPreviousItemList = await StockTransferProducts.findAll({
      include: [
        {
          model: ProductList,
          required: true,
        },
      ],
      where: {
        stock_transfer_id: stock_transfer_id,
      },
    });

    const previousItemList = dataToGetPreviousItemList.map((item) => {
      return `
        "Product Code": ${item.product_list.product_code},
        "Quantity to Transfer": ${item.quantity_to_transfer}
      `;
    });

    const currentItemList = itemProductToTransfer.map((item) => {
      return `
        "Product Code": ${item.productCode},
        "Quantity to Transfer": ${item.quantity_to_transfer}
      `;
    });

    const stockTransfer = await StockTransfer.update(
      {
        transaction_id: transactionId,
        warehouse_from_id: warehouseFrom_id,
        warehouse_to_id: warehouseTo_id,
        date_transfer: countingDate,
        description: remarks,
      },
      {
        where: {
          id: stock_transfer_id,
        },
      }
    );

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Stock Transfer: User updated information about stock transfer with Stock Transfer ID ${transactionId}.
      Transfer Date: ${getStockTransferData.date_transfer} to ${countingDate}
      Warehouse|Location From: ${getStockTransferData.warehouse_from_id} to ${warehouseFrom_id}
      Warehouse|Location To: ${getStockTransferData.warehouse_to_id} to ${warehouseTo_id}
      Remarks: ${getStockTransferData.description} to ${remarks}

      Item List ------
      ${previousItemList}
      to
      ${currentItemList}
      `,
    });

    if (stockTransfer) {
      await StockTransferProducts.destroy({
        where: {
          stock_transfer_id: stock_transfer_id,
        },
      });
      for (const item of itemProductToTransfer) {
        await StockTransferProducts.create({
          stock_transfer_id: stock_transfer_id,
          product_id: item.productId,
          available_quantity: item.available,
          quantity_to_transfer: item.quantity_to_transfer,
        });
      }
      res.status(200).json();
    } else {
      res.status(400).json();
    }
  } catch (error) {
    console.error("Error creating stock transfer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/approveStockTransfer").post(async (req, res) => {
  const {
    stock_transfer_id,
    transactionId,
    itemProductToTransfer,
    warehouse_from_id,
    warehouse_to_id,
    userLoggedID,
  } = req.query;

  // console.log(itemProductToTransfer);
  // return;

  try {
    // Helper function to round to 2 decimal places
    const roundToTwo = (num) => {
      return Math.round((num + Number.EPSILON) * 100) / 100;
    };

    let hasInsufficientStock = false;
    let toRemarks;

    for (const item of itemProductToTransfer) {
      const product_id = item.productId;
      const required_quantity = roundToTwo(Number(item.quantity_to_transfer));

      const inventories = await StockManagement.findAll({
        where: {
          product_id: product_id,
          warehouse_id: warehouse_from_id,
          stock: { [Op.gt]: 0 },
        },
        order: [["date_in", "ASC"]],
      });

      const totalAvailableStock = roundToTwo(
        inventories.reduce((sum, inv) => sum + Number(inv.stock), 0)
      );

      if (totalAvailableStock < required_quantity) {
        console.log();

        toRemarks = `
        Product ID: ${product_id}
        Required Quantity: ${required_quantity}
        Available Stock: ${totalAvailableStock}
        Missing: ${roundToTwo(required_quantity - totalAvailableStock)}
        `;

        hasInsufficientStock = true;
      }
    }

    if (hasInsufficientStock) {
      return res.status(202).json({
        success: false,
        message: toRemarks,
      });
    }

    const stockTransfers = [];

    for (const item of itemProductToTransfer) {
      let remaining_quantity = roundToTwo(Number(item.quantity_to_transfer));
      const product_id = item.productId;

      const inventories = await StockManagement.findAll({
        where: {
          product_id: product_id,
          warehouse_id: warehouse_from_id,
          stock: { [Op.gt]: 0 },
        },
        order: [["createdAt", "ASC"]],
      });

      for (const inventory of inventories) {
        if (remaining_quantity <= 0) break;

        const vendor_id = inventory.vendor_id;
        const date_in = inventory.date_in;
        const inventory_in = inventory.in;
        const price_in = inventory.price_in;
        // const transaction_number = inventory.transaction_number;
        // const module_in_from = inventory.module_in_from;

        const transfer_quantity = roundToTwo(
          Math.min(remaining_quantity, Number(inventory.stock))
        );

        const newStock = await StockManagement.create({
          product_id: product_id,
          warehouse_id: warehouse_to_id,
          stock: transfer_quantity,
          price: inventory.price,
          vendor_id: vendor_id,
          date_in: date_in,
          in: transfer_quantity,
          price_in: price_in,
          transaction_number: transactionId,
          module_in_from: "Stock Tranfer",
        });

        await inventory.update({
          stock: roundToTwo(Number(inventory.stock) - transfer_quantity),
        });

        await StockTransferApproveProducts.create({
          stock_transfer_products_id: item.stock_transfer_product_id,
          stockmanagement_id: inventory.stock_management_id,
          deducted_quantity: transfer_quantity,
        });

        stockTransfers.push({
          from_inventory_id: inventory.stock_management_id,
          to_inventory_id: newStock.stock_management_id,
          quantity: transfer_quantity,
          price: inventory.price,
        });

        remaining_quantity = roundToTwo(remaining_quantity - transfer_quantity);

        console.log(
          `Transfer completed - From inventory: ${inventory.stock_management_id}`,
          `To new inventory: ${newStock.stock_management_id}`,
          `Quantity: ${transfer_quantity}`,
          `Price: ${inventory.price}`
        );
      }
    }

    if (stock_transfer_id) {
      await StockTransfer.update(
        { status: "Approved", approved_by: userLoggedID },
        { where: { id: stock_transfer_id } }
      );

      Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Stock Transfer: User Approved stock transfer with Stock Transfer ID ${transactionId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stock transfer completed successfully",
      transfers: stockTransfers,
    });
  } catch (error) {
    console.error("Stock transfer error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred during stock transfer",
    });
  }
});

router.route("/approveStockTransfer_cy").post(async (req, res) => {
  const {
    stock_transfer_id,
    itemProductToTransfer,
    warehouse_from_id,
    warehouse_to_id,
  } = req.query;

  try {
    for (const item of itemProductToTransfer) {
      const quantity_to_transfer = item.quantity_to_transfer;
      const product_id = item.productId;
      const today = new Date().toISOString().split("T")[0];

      // Get total stock in by groupby in stockmgmt
      const getTotalStock = await StockManagement.findOne({
        attributes: [
          "product_id",
          "warehouse_id",
          [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
          [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
        ],
        where: { product_id, warehouse_id: warehouse_from_id },
        group: ["product_id", "warehouse_id"],
      });

      let totalStock = getTotalStock?.dataValues?.total_stock || 0;
      let averagePrice = getTotalStock?.dataValues?.average_price || 0;

      if (totalStock < quantity_to_transfer) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product_id} in warehouse ${warehouse_from_id}`,
        });
      }

      // Get the oldest stock record based on createdAt
      const oldStockRecord = await StockManagement.findOne({
        where: { product_id, warehouse_id: warehouse_from_id },
        order: [["createdAt", "ASC"]],
      });

      if (oldStockRecord) {
        // Deduct stock from the oldest record
        oldStockRecord.stock -= quantity_to_transfer;
        await oldStockRecord.save();
      }

      // Create new stock in warehouse_to_id
      await StockManagement.create({
        product_id: product_id,
        warehouse_id: warehouse_to_id,
        stock: quantity_to_transfer,
        price: averagePrice,
        vendor_id: 1,
        date_in: today,
        in: quantity_to_transfer,
        price_in: averagePrice,
      });

      const updateStockTransfer = await StockTransfer.update(
        {
          status: "Approved",
        },
        { where: { id: stock_transfer_id } }
      );

      console.log(
        `Stock transferred: ${quantity_to_transfer} units of product ${product_id}`
      );
    }

    return res
      .status(200)
      .json({ message: "Stock transfer approved successfully" });
  } catch (error) {
    console.error("Error approving stock transfer:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/rejectStockTransfer").post(async (req, res) => {
  const {
    stock_transfer_id,
    itemProductToTransfer,
    warehouse_from_id,
    warehouse_to_id,
    userLoggedID,
    transactionId,
  } = req.query;

  try {
    await StockTransfer.update(
      {
        status: "Rejected",
        approved_by: userLoggedID,
      },
      { where: { id: stock_transfer_id } }
    );

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Stock Transfer: User Rejected stock transfer with Stock Transfer ID ${transactionId}`,
    });

    return res.status(200).json({ message: "Stock transfer Rejected" });
  } catch (error) {
    console.error("Error rejecting stock transfer:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
