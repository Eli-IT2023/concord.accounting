const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  InventoryCounting,
  InventoryCountingItemList,
  StockManagement,
  ProductList,
  Warehouse,
  Cutoff,
  Activity_Log,
  Inventory_Report,
  Inventory_Journal,
} = require("../db/models/associations");
const { inventoryReport, stockTransfer } = require("../services");

// For inventory report service layer
const irService = inventoryReport.inventoryReportService;
const irHelper = inventoryReport.inventoryReportHelper;

// For stock transfer service layer
const stService = stockTransfer.stockTransferService;
const stHelper = stockTransfer.stockTransferHelper;

router.route("/getInventoryCounting").get(async (req, res) => {
  try {
    const { startDate, endDate, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let inventoryCountingWhereClause = {
      counting_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };
    const inventoryCountingTableColumn = [
      "inventory_counting_id",
      "counting_date",
      "remarks",
      "user",
      "status",
    ];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "remarks":
        case "inventory_counting_id":
        case "status":
        case "counting_date":
        case "user": // Consolidated case
          if (
            filterColumn === "inventory_counting_id" ||
            filterColumn === "counting_date"
          ) {
            inventoryCountingWhereClause = {
              [Op.and]: [
                {
                  counting_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
                sequelize.where(literal(`CAST (${filterColumn} AS CHAR)`), {
                  [Op.like]: `%${searchText}%`,
                }),
              ],
            };
          } else {
            inventoryCountingWhereClause[filterColumn] = {
              [Op.like]: `%${searchText}%`,
            };
          }
          break;

        // Handle Filter for "All"
        default:
          inventoryCountingWhereClause = {
            [Op.and]: [
              {
                counting_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: inventoryCountingTableColumn.map((col) => {
                  if (
                    col === "inventory_counting_id" ||
                    col === "counting_date"
                  ) {
                    return {
                      // Convert column to String then search for user input
                      [col]: sequelize.where(literal(`CAST (${col} AS CHAR)`), {
                        [Op.like]: `%${searchText}%`,
                      }),
                    };
                  } else {
                    return {
                      [col]: {
                        [Op.like]: `%${searchText}%`,
                      },
                    };
                  }
                }),
              },
            ],
          };
          break;
      }
    }

    const { count, rows: data } = await InventoryCounting.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: inventoryCountingWhereClause,
    });

    if (data) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    } else {
      res.status(400);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getInventoryCounting/:id").get(async (req, res) => {
  const { id } = req.params;
  try {
    const data = await InventoryCounting.findOne({
      where: { inventory_counting_id: id },
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: data.counting_date },
          },
          {
            to: { [Op.gte]: data.counting_date },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    const plainData = data.get({ plain: true });
    plainData.isPosted = isPosted;

    if (data) {
      return res.json(plainData);
    } else {
      return res.status(404).json("No data found for this inventory counting");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getInventoryItemList/:id").get(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows: data } =
      await InventoryCountingItemList.findAndCountAll({
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        where: { inventory_counting_id: id },
        include: [
          {
            model: ProductList,
            required: true,
          },
          {
            model: Warehouse,
            attributes: ["name"],
          },
        ],
      });

    if (data) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    } else {
      return res
        .status(404)
        .json("No data found for this inventory counting item list");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

const { fn, col, literal } = require("sequelize");

router.route("/getProductList").get(async (req, res) => {
  try {
    const data = await StockManagement.findAll({
      attributes: [
        "product_id",
        [fn("SUM", col("stock")), "totalStock"],
        [fn("AVG", col("price")), "averagePrice"],
      ],
      include: [
        {
          model: ProductList,
          attributes: ["product_name", "product_category"],
        },
        {
          model: Warehouse,
          attributes: ["name"],
          where: {
            isDeleted: false,
          },
        },
      ],
      where: {
        isDeleted: false,
      },
      group: ["stock_management.product_id", "stock_management.warehouse_id"],
    });

    if (data) {
      return res.json(data);
    } else {
      res.status(400).send("No data found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getWarehouses").get(async (req, res) => {
  try {
    const data = await Warehouse.findAll({
      where: {
        status: 1,
        isDeleted: false,
      },
    });

    if (data) {
      return res.json(data);
    } else {
      res.status(400);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/update/:id").put(async (req, res) => {
  try {
    const { id } = req.params;
    const { countingDate, remarks, itemList, userLoggedID, countingId } =
      req.body;

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
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const getInventoryCountingData = await InventoryCounting.findOne({
      where: {
        inventory_counting_id: id,
      },
    });

    const dataToGetPreviousItemList = await InventoryCountingItemList.findAll({
      include: [
        {
          model: ProductList,
          required: true,
        },
      ],
      where: {
        inventory_counting_id: id,
      },
    });

    const previousItemList = dataToGetPreviousItemList.map((item) => {
      return `
      Product ID: ${item.product_list.product_id}
      Actual Count: ${item.actual_count}
      `;
    });

    const currentItemList = itemList.map((item) => {
      return `
      Product ID: ${item.product_id}
      Actual Count: ${item.actual_count}
      `;
    });

    await InventoryCounting.update(
      {
        counting_date: countingDate,
        remarks: remarks,
      },
      {
        where: {
          inventory_counting_id: id,
        },
      }
    );

    for (const item of itemList) {
      await InventoryCountingItemList.update(
        {
          actual_count: item.actual_count,
          actual_price: item.actual_price,
        },
        {
          where: {
            [Op.and]: [
              {
                inventory_counting_id: id,
              },
              {
                product_id: item.product_id,
              },
            ],
          },
        }
      );
    }

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Inventory Counting: User updated information about inventory counting with Counting ID ${countingId}.
      Counting Time: ${getInventoryCountingData.counting_date} to ${countingDate}
      Remarks: ${getInventoryCountingData.remarks} to ${remarks}

      Item List -------
      ${previousItemList}
      to
      ${currentItemList}
      `,
    });

    res
      .status(200)
      .json({ message: "Inventory Counting Updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/saveInventoryCounting").post(async (req, res) => {
  const {
    countingDate,
    remarks,
    user,
    transactionId,
    itemList,
    selectedRows, // List of product ids
    userLoggedID,
    warehouseId,
  } = req.body;

  try {
    const findCutoff = await Cutoff.findOne({
      where: {
        isDeleted: false,
        [Op.and]: [
          {
            from: { [Op.lte]: countingDate },
          },
          {
            to: { [Op.gte]: countingDate },
          },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const countingProducts = new Map(Object.entries(itemList)); // For quick lookup by product id

    // Step 1: Create the inventory counting record
    const inventoryCounting = await InventoryCounting.create({
      counting_date: countingDate,
      remarks,
      user,
      transaction_id: transactionId,
      status: "For Approval",
      created_by: userLoggedID,
    });

    // Step 2: Process itemList and resolve warehouse_id
    const itemListPromises = selectedRows.map(async (productId) => {
      // Find the warehouse_id based on warehouseName
      // const warehouse = await Warehouse.findOne({
      //   where: { name: item.warehouseName, isDeleted: false },
      //   attributes: ["warehouse_id"],
      // });

      // if (!warehouse) {
      //   throw new Error(`Warehouse not found for name: ${item.warehouseName}`);
      // }

      // Get the latest cutoff
      const latestCutoff = await Cutoff.findOne({
        attributes: ["to"],
        where: {
          isDeleted: false,
        },
        order: [["to", "DESC"]],
        raw: true,
      });

      // To get the final inventory summary of the given product and warehouse
      const inventory = await irService.getInventorySummaryByProduct({
        selectedDate: latestCutoff.to,
        productId,
        warehouseId,
        method: "findOne", // Model method
        transaction: null, // For sequelize.transaction
      });

      const systemAveragePrice = inventory.finalInventoryAveragePrice || 0;

      // Current product in a loop
      const currentProduct = countingProducts.get(productId);
      const stockManagementId = currentProduct?.stock_management_id;
      const actualCount = currentProduct?.actual_count;
      const actualPrice = currentProduct?.actual_price;

      // Step 3: Create the InventoryCountingItemList record
      return InventoryCountingItemList.create({
        product_id: productId,
        inventory_counting_id: inventoryCounting.inventory_counting_id,
        stock_management_id: stockManagementId || null,
        system_quantity: inventory.finalInventoryQuantity,
        actual_count: actualCount || 0,
        average_price: systemAveragePrice,
        actual_price: actualPrice || systemAveragePrice,
        warehouse_id: warehouseId,
      });
    });

    // Wait for all itemList promises to resolve
    await Promise.all(itemListPromises);

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Inventory Counting: User created new inventory counting with Counting ID ${transactionId}`,
    });

    res.status(200).json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving data", error: err.message });
  }
});

router.post("/updateInventoryCounting", async (req, res) => {
  const { countingDate, remarks, itemList, inventoryCountingId } = req.body;

  try {
    // Update the InventoryCounting record
    await InventoryCounting.update(
      { counting_date: countingDate, remarks },
      { where: { inventory_counting_id: inventoryCountingId } }
    );

    // Update the InventoryCountingItemList records
    for (const item of itemList) {
      await InventoryCountingItemList.update(
        { actual_count: item.actualCount },
        {
          where: {
            inventory_counting_id: inventoryCountingId,
            product_id: item.productId,
          },
        }
      );
    }

    res.json({ message: "Inventory counting updated successfully." });
  } catch (error) {
    console.error("Error updating inventory counting:", error);
    res.status(500).json({ message: "Failed to update inventory counting." });
  }
});

router.route("/approveInventoryCounting").post(async (req, res) => {
  const { countingDate, remarks, itemList, inventoryCountingId, userLoggedID } =
    req.body;

  console.log(
    "----------------------------------------------itemList: ",
    itemList
  );

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
      isDeleted: false,
    },
    order: [["createdAt", "DESC"]],
  });

  const isPosted = findCutoff?.isPosted || false;

  if (isPosted) {
    return res.status(409).json({ message: "Cutoff is already posted" });
  }

  const transaction = await sequelize.transaction();

  try {
    await InventoryCounting.update(
      {
        counting_date: countingDate,
        remarks,
        status: "Approved",
        approved_by: userLoggedID,
      },
      { where: { inventory_counting_id: inventoryCountingId }, transaction }
    );

    // Update the StockManagement stock
    for (const item of itemList) {
      const {
        productId,
        warehouseId,
        quantity,
        actualCount,
        actualPrice,
        transaction_id,
      } = item;

      const totalAdjustment = actualCount - quantity;

      console.log(
        `Product ID: ${productId}, Warehouse ID: ${warehouseId}, Quantity: ${quantity}, Actual Count: ${actualCount}, Adjustment: ${totalAdjustment}`
      );

      // Get the current cutoff
      // const currentCutoff = await Cutoff.findOne({
      //   attributes: ["from", "to"],
      //   where: {
      //     from: {
      //       [Op.lte]: countingDate,
      //     },
      //     to: {
      //       [Op.gte]: countingDate,
      //     },
      //   },
      //   raw: true,
      //   transaction,
      // });

      // // Get the previous cutoff
      // const previousCutoff = await Cutoff.findOne({
      //   attributes: ["from", "to"],
      //   where: {
      //     to: {
      //       [Op.lt]: countingDate,
      //     },
      //   },
      //   order: [["to", "DESC"]],
      //   raw: true,
      //   transaction,
      // });

      // // prettier-ignore
      // // For sql date conditions
      // const dateConditions = {
      //   lessThanEnd: `< ${sequelize.escape(previousCutoff?.to)}`,
      //   between: `BETWEEN ${sequelize.escape(currentCutoff?.from)} AND ${sequelize.escape(currentCutoff?.to)}`
      // }

      // // --- For no inventory counting sql aggregation ---
      // const sumAmount = (type, col, dateCondition) => `
      //   SUM(
      //     COALESCE(
      //       CASE
      //         WHEN date_in ${dateCondition}
      //         AND type = ${sequelize.escape(type)} THEN ${col}
      //         ELSE 0
      //       END,
      //     0)
      //   )
      // `;

      // // --- For inventory counting sql aggregation ---
      // const sumInventoryCounting = (condition, col) => `
      //   SUM(
      //     COALESCE(
      //       CASE
      //         WHEN ${condition} THEN ${col}
      //         ELSE 0
      //       END,
      //     0)
      //   )
      // `;

      // // For SQL: Conditions to get the total amount based on entry type
      // const inventoryCountingConditions = {
      //   in: "type IS NULL OR type = 'in'",
      //   out: "type = 'out'",
      // };

      // const getInventory = async () => {
      //   // Check if there's existing inventory counting transaction within the selected date
      //   const existingInventoryCounting = async (dateRange) => {
      //     const inventory = await Inventory_Journal.findOne({
      //       attributes: ["id"],
      //       where: {
      //         module_from: "Inventory Counting",
      //         warehouse_id: warehouseId,
      //         product_id: productId,
      //         date_in: dateRange,
      //         isDeleted: false,
      //       },
      //       raw: true,
      //       transaction,
      //     });

      //     return inventory;
      //   };

      //   // No Inventory Counting (Default): Handle the final inventory computations
      //   const totalInventory = await Inventory_Journal.findOne({
      //     // prettier-ignore
      //     attributes: [
      //       [
      //         sequelize.literal(
      //           `${sumAmount("in", "quantity", dateConditions.lessThanEnd)}
      //             - ${sumAmount("out", "quantity", dateConditions.lessThanEnd)}`
      //         ),
      //         "previousTotalQuantity",
      //       ],
      //       [
      //         sequelize.literal(
      //           `${sumAmount("in", "unit_price * quantity", dateConditions.lessThanEnd)}
      //             - ${sumAmount("out", "unit_price * quantity", dateConditions.lessThanEnd)}`
      //         ),
      //         "previousTotalAmount",
      //       ],
      //       [
      //         sequelize.literal(
      //           `${sumAmount("in", "quantity", dateConditions.between)}
      //             - ${sumAmount("out", "quantity", dateConditions.between)}`
      //         ),
      //         "currentTotalQuantity",
      //       ],
      //       [
      //         sequelize.literal(
      //           `${sumAmount("in", "unit_price * quantity", dateConditions.between)}
      //             - ${sumAmount("out", "unit_price * quantity", dateConditions.between)}`
      //         ),
      //         "currentTotalAmount",
      //       ],
      //     ],
      //     include: [
      //       {
      //         model: ProductList,
      //         required: true,
      //         attributes: [],
      //         where: {
      //           product_id: productId,
      //           status: "Active",
      //         },
      //       },
      //     ],
      //     where: {
      //       warehouse_id: warehouseId,
      //       isDeleted: false,
      //     },
      //     raw: true,
      //     transaction,
      //   });

      //   // Inventory Counting: Handle the final inventory computations
      //   const inventoryCounting = async (dateRange) => {
      //     const inventory = await Inventory_Journal.findOne({
      //       // prettier-ignore
      //       attributes: [
      //       [
      //         sequelize.literal(
      //           `${sumInventoryCounting(inventoryCountingConditions.in, "quantity")}
      //             - ${sumInventoryCounting(inventoryCountingConditions.out, "quantity")}`
      //         ),
      //         "totalQuantity",
      //       ],
      //       [
      //         sequelize.literal(`
      //           ${sumInventoryCounting(inventoryCountingConditions.in, "unit_price * quantity")}
      //            - ${sumInventoryCounting(inventoryCountingConditions.out, "unit_price * quantity")}`
      //         ),
      //         "totalAmount",
      //       ],
      //     ],
      //       include: [
      //         {
      //           model: ProductList,
      //           required: true,
      //           attributes: [],
      //           where: {
      //             product_id: productId,
      //             status: "Active",
      //           },
      //         },
      //       ],
      //       where: {
      //         warehouse_id: warehouseId,
      //         date_in: dateRange,
      //         is_overridden: false,
      //         isDeleted: false,
      //       },
      //       raw: true,
      //       transaction,
      //     });

      //     return inventory;
      //   };

      //   const dateRange = {
      //     current: {
      //       [Op.between]: [currentCutoff?.from, currentCutoff?.to],
      //     },
      //     previous: {
      //       [Op.between]: [previousCutoff?.from, previousCutoff?.to],
      //     },
      //     lessThanStart: {
      //       [Op.lt]: currentCutoff?.from,
      //     },
      //   };

      //   // Checker: Check if theres existing inventory counting transaction for the current cutoff and date less than the cutoff start date
      //   const currentDateInventoryCounting = await existingInventoryCounting(
      //     dateRange.current
      //   );
      //   const previousDateInventoryCounting = await existingInventoryCounting(
      //     dateRange.previous
      //   );
      //   const olderDateInventoryCounting = await existingInventoryCounting(
      //     dateRange.lessThanStart
      //   );

      //   // Final inventory for the current period with inventory counting and date less than the cutoff start date with inventory counting
      //   const currentPeriodInventoryTotals = await inventoryCounting(
      //     dateRange.current
      //   );
      //   const previousPeriodInventoryTotals = await inventoryCounting(
      //     dateRange.previous
      //   );
      //   const olderPeriodInventoryTotals = await inventoryCounting(
      //     dateRange.lessThanStart
      //   );

      //   // Current Date Inventory Counting:
      //   // If theres existing inventory counting for the current cutoff return that inventory counting final inventory total
      //   if (currentDateInventoryCounting) {
      //     return {
      //       totalQuantity: currentPeriodInventoryTotals?.totalQuantity,
      //       totalAmount: currentPeriodInventoryTotals?.totalAmount,
      //     };
      //   }

      //   // Previous Date Inventory Counting:
      //   // If theres existing inventory counting for the previous cutoff return that inventory counting final inventory total
      //   if (previousDateInventoryCounting) {
      //     return {
      //       totalQuantity:
      //         previousPeriodInventoryTotals?.totalQuantity +
      //         totalInventory?.currentTotalQuantity,
      //       totalAmount:
      //         previousPeriodInventoryTotals?.totalAmount +
      //         totalInventory?.currentTotalAmount,
      //     };
      //   }

      //   // Older Date Inventory Counting:
      //   // If theres existing inventory counting for the older date return that inventory counting final inventory total
      //   if (olderDateInventoryCounting) {
      //     return {
      //       totalQuantity:
      //         olderPeriodInventoryTotals?.totalQuantity +
      //         totalInventory?.currentTotalQuantity,
      //       totalAmount:
      //         olderPeriodInventoryTotals?.totalAmount +
      //         totalInventory?.currentTotalAmount,
      //     };
      //   }

      //   // No Inventory Counting (Default):
      //   // If theres no existing inventory counting return the normal computation
      //   return {
      //     totalQuantity:
      //       totalInventory?.previousTotalQuantity +
      //       totalInventory?.currentTotalQuantity,
      //     totalAmount:
      //       totalInventory?.previousTotalAmount +
      //       totalInventory?.currentTotalAmount,
      //   };
      // };

      // const endingInventory = await getInventory();

      // Update all overridden inventory
      // (where date_in less than or equal counting date and greater than the previous cutoff end date)
      // await Inventory_Journal.update(
      //   {
      //     is_overridden: true,
      //     is_overridden_from: inventoryCountingId,
      //   },
      //   {
      //     where: {
      //       date_in: {
      //         ...(previousCutoff?.to ? { [Op.gt]: previousCutoff.to } : {}), // Add Op.gt only when a previous cutoff date exists
      //         [Op.lte]: countingDate,
      //       },
      //       product_id: productId,
      //       warehouse_id: warehouseId,
      //     },
      //     transaction,
      //   }
      // );

      // To get the final inventory summary of the given product and warehouse
      const inventory = await irService.getInventorySummaryByProduct({
        selectedDate: countingDate,
        productId,
        warehouseId,
        method: "findOne", // Model method
        transaction, // For sequelize.transaction
      });

      // Create an inventory counting record for new price and new inventory count
      await Inventory_Journal.create(
        {
          module_from: "Inventory Counting",
          transaction_number: transaction_id,
          product_id: productId,
          warehouse_id: warehouseId,
          unit_price: actualPrice,
          date_in: countingDate,
          quantity: actualCount,
          type: "in",
          // is_overridden: false,
          // is_overridden_from: inventoryCountingId,
        },
        { transaction }
      );

      const unitPrice = inventory.finalInventoryQuantity
        ? inventory.finalInventoryAmount / inventory.finalInventoryQuantity
        : 0;

      // prettier-ignore
      // Create an inventory counting record for ending inventory
      await Inventory_Journal.create(
        {
          module_from: "Inventory Counting",
          transaction_number: transaction_id,
          product_id: productId,
          warehouse_id: warehouseId,
          unit_price: unitPrice,
          date_in: countingDate,
          quantity: inventory.finalInventoryQuantity || 0,
          type: "out",
          // is_overridden: true,
          // is_overridden_from: inventoryCountingId,
        },
        { transaction }
      );

      // --- For stock management ---
      const activeCutoffForCountingDate = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: countingDate,
              },
            },
            {
              to: {
                [Op.gte]: countingDate,
              },
            },
          ],
          isDeleted: false,
        },
        order: [["createdAt", "DESC"]],
      });

      await StockManagement.update(
        {
          price: actualPrice,
        },
        {
          where: {
            [Op.and]: [
              { product_id: productId },
              {
                date_in: {
                  [Op.between]: [
                    activeCutoffForCountingDate.from,
                    activeCutoffForCountingDate.to,
                  ],
                },
              },
            ],
            warehouse_id: warehouseId,
            isDeleted: false,
          },
          transaction,
        }
      );

      // Find the latest stock_management_id for the given product_id and warehouse_id
      const latestRecord = await StockManagement.findOne({
        where: {
          product_id: productId,
          warehouse_id: warehouseId,
          isDeleted: false,
        },
        order: [["stock_management_id", "DESC"]], // Get the latest record by stock_management_id
        transaction,
      });

      //add here later, if adjustment is + add to stockmgmt if - add to inv report
      if (totalAdjustment > 0) {
        if (latestRecord) {
          await StockManagement.create(
            {
              product_id: productId,
              warehouse_id: warehouseId,
              stock: totalAdjustment,
              in: totalAdjustment,
              date_in: countingDate,
              vendor_id: latestRecord.vendor_id || null,
              price: latestRecord.price || 0,
              price_in: latestRecord.price_in || 0,
              transaction_number: transaction_id,
              module_in_from: "Inventory Counting",
            },
            { transaction }
          );

          // Create an inventory journal "in" entry
          // await Inventory_Journal.create(
          //   {
          //     module_from: "Inventory Counting",
          //     transaction_number: transaction_id,
          //     product_id: productId,
          //     unit_price: latestRecord.price || 0,
          //     date_in: countingDate,
          //     quantity: totalAdjustment,
          //     type: "in",
          //     warehouse_id: warehouseId,
          //   },
          //   { transaction }
          // );
        }
      } else if (totalAdjustment < 0) {
        await Inventory_Report.create(
          {
            product_id: productId,
            product_out: Math.abs(totalAdjustment),
            average_price: latestRecord.price || 0,
            unit_price: latestRecord.price_in || 0,
            cut_off_id: findCutoff.id || null,
            from_counting: true,
            date_in: countingDate,
            sales_invoice_id: null,
            transaction_id: transaction_id,
            module_in_from: "Inventory Counting",
          },
          { transaction }
        );

        // Create an inventory journal "out" entry
        // await Inventory_Journal.create(
        //   {
        //     module_from: "Inventory Counting",
        //     transaction_number: transaction_id,
        //     product_id: productId,
        //     unit_price: latestRecord.price || 0,
        //     date_in: countingDate,
        //     quantity: Math.abs(totalAdjustment),
        //     type: "out",
        //     warehouse_id: warehouseId,
        //   },
        //   { transaction }
        // );

        const findStocks = await StockManagement.findAll({
          where: {
            product_id: productId,
            warehouse_id: warehouseId,
            isDeleted: false,
          },
          order: [["createdAt", "ASC"]],
        });

        let remainingAdjustment = Math.abs(totalAdjustment);

        for (const stock of findStocks) {
          if (remainingAdjustment === 0) break;

          const availableStock = stock.stock;

          if (availableStock >= remainingAdjustment) {
            // This stock can fully cover the adjustment
            await stock.decrement("stock", {
              by: remainingAdjustment,
              transaction,
            });
            remainingAdjustment = 0;
          } else {
            await stock.decrement("stock", { by: availableStock, transaction });
            remainingAdjustment -= availableStock;
          }
        }
      }
    }

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Inventory Counting: User Approved inventory counting with Counting ID ${inventoryCountingId}`,
    });

    await transaction.commit(); // Commit the transaction

    return res.status(200).json({
      message: "Inventory counting approved and stock updated successfully.",
    });
  } catch (error) {
    await transaction.rollback(); // Rollback the transaction on error
    console.error("Error approving inventory counting:", error);
    res.status(500).json({ message: "Failed to approve inventory counting." });
  }
});

// New endpoint for inventory counting approval
router.route("/transactions/approve").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      countingDate,
      remarks,
      itemList,
      inventoryCountingId,
      transactionId,
      userLoggedID,
    } = req.body;

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
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    // Validation: Cutoff validation for posted cutoff
    if (findCutoff.isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    // Approve inventory counting transaction
    await InventoryCounting.update(
      {
        counting_date: countingDate,
        remarks,
        status: "Approved",
        approved_by: userLoggedID,
      },
      { where: { inventory_counting_id: inventoryCountingId }, transaction }
    );

    // Get all product items within current inventory counting transaction
    const inventoryProductList = await InventoryCountingItemList.findAll({
      attributes: [
        "product_id",
        "warehouse_id",
        "system_quantity",
        "actual_count",
        "actual_price",
      ],
      where: {
        inventory_counting_id: inventoryCountingId,
      },
      raw: true,
    });

    // Apply changes to StockManagement and InventoryJournal database table
    for (const item of inventoryProductList) {
      const {
        product_id: productId,
        warehouse_id: warehouseId,
        system_quantity: quantity,
        actual_count: actualCount,
        actual_price: actualPrice,
      } = item;

      // --- For inventory journal ---

      // To get the final inventory summary of the given product and warehouse
      const inventory = await irService.getInventorySummaryByProduct({
        selectedDate: countingDate,
        productId,
        warehouseId,
        method: "findOne", // Model method
        transaction, // For sequelize.transaction
      });

      // Create an inventory journal record for new price and new inventory count
      await Inventory_Journal.create(
        {
          module_from: "Inventory Counting",
          transaction_number: transactionId,
          product_id: productId,
          warehouse_id: warehouseId,
          unit_price: actualPrice,
          date_in: countingDate,
          quantity: actualCount,
          type: "in",
        },
        { transaction }
      );

      // Get the average price of the final inventory
      const unitPrice = inventory.finalInventoryQuantity
        ? inventory.finalInventoryAmount / inventory.finalInventoryQuantity
        : 0;

      // prettier-ignore
      // Create an inventory counting record for ending inventory
      await Inventory_Journal.create(
        {
          module_from: "Inventory Counting",
          transaction_number: transactionId,
          product_id: productId,
          warehouse_id: warehouseId,
          unit_price: unitPrice,
          date_in: countingDate,
          quantity: inventory.finalInventoryQuantity || 0,
          type: "out",
        },
        { transaction }
      );

      // --- For stock management ---

      // Find the cutoff within the selected counting date
      const activeCutoffForCountingDate = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: countingDate,
              },
            },
            {
              to: {
                [Op.gte]: countingDate,
              },
            },
          ],
          isDeleted: false,
        },
        order: [["createdAt", "DESC"]],
        transaction,
      });

      // Update product's actual price within the specified cutoff date range
      await StockManagement.update(
        {
          price: actualPrice,
        },
        {
          where: {
            [Op.and]: [
              { product_id: productId },
              {
                date_in: {
                  [Op.between]: [
                    activeCutoffForCountingDate.from,
                    activeCutoffForCountingDate.to,
                  ],
                },
              },
            ],
            warehouse_id: warehouseId,
            isDeleted: false,
          },
          transaction,
        }
      );

      // Find the latest stock_management_id for the given product_id and warehouse_id
      const latestRecord = await StockManagement.findOne({
        where: {
          product_id: productId,
          warehouse_id: warehouseId,
          isDeleted: false,
        },
        order: [["stock_management_id", "DESC"]], // Get the latest record by stock_management_id
        transaction,
      });

      const totalAdjustment = actualCount - quantity;

      //add here later, if adjustment is + add to stockmgmt if - add to inv report
      if (totalAdjustment > 0) {
        // Create a StockManagement record for product "in"
        if (latestRecord) {
          await StockManagement.create(
            {
              product_id: productId,
              warehouse_id: warehouseId,
              stock: totalAdjustment,
              in: totalAdjustment,
              date_in: countingDate,
              vendor_id: latestRecord.vendor_id || null,
              price: latestRecord.price || 0,
              price_in: latestRecord.price_in || 0,
              transaction_number: transactionId,
              module_in_from: "Inventory Counting",
            },
            { transaction }
          );
        }
      } else if (totalAdjustment < 0) {
        // Create an Inventory_Report record for product "out"
        await Inventory_Report.create(
          {
            product_id: productId,
            product_out: Math.abs(totalAdjustment),
            average_price: latestRecord.price || 0,
            unit_price: latestRecord.price_in || 0,
            cut_off_id: findCutoff.id || null,
            from_counting: true,
            date_in: countingDate,
            sales_invoice_id: null,
            transaction_id: transactionId,
            module_in_from: "Inventory Counting",
          },
          { transaction }
        );

        // Get the stocks of the product in stock managemenet
        const findStocks = await StockManagement.findAll({
          where: {
            product_id: productId,
            warehouse_id: warehouseId,
            isDeleted: false,
          },
          order: [["createdAt", "ASC"]],
          transaction,
        });

        let remainingAdjustment = Math.abs(totalAdjustment);

        // Decrement the stocks from StockManagement
        // loop through stocks until remainingAdjustment is 0
        for (const stock of findStocks) {
          if (remainingAdjustment === 0) break;

          const availableStock = stock.stock;

          if (availableStock >= remainingAdjustment) {
            // This stock can fully cover the adjustment
            await stock.decrement("stock", {
              by: remainingAdjustment,
              transaction,
            });
            remainingAdjustment = 0;
          } else {
            await stock.decrement("stock", { by: availableStock, transaction });
            remainingAdjustment -= availableStock;
          }
        }
      }
    }

    // Create an activity log record
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Inventory Counting: User Approved inventory counting with Counting ID ${inventoryCountingId}`,
    });

    await transaction.commit(); // Commit the transaction

    res.status(200).json({
      message: "Inventory counting successfully approved.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback transaction on error
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/rejectInventoryCounting").put(async (req, res) => {
  const { id, userLoggedID } = req.body;
  try {
    await InventoryCounting.update(
      {
        status: "Rejected",
        approved_by: userLoggedID,
      },
      {
        where: {
          inventory_counting_id: id,
        },
      }
    );

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Inventory Counting: User Rejected inventory counting with Counting ID ${id}`,
    });

    return res.status(200).json();
  } catch (error) {
    await transaction.rollback();
    console.error("Error rejecting inventory counting:", error);
    res.status(500).json({ message: "Failed to reject inventory counting." });
  }
});

// Endpoint to get the stock transfer product list for table (Item List)
router.route("/products/summary").post(async (req, res) => {
  try {
    const { warehouseId, productList } = req.body;

    // For pagination
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const offset = (page - 1) * limit;

    // Main query
    const { count, products } = await stService.getProductsSummary({
      module: "Inventory Counting",
      productCategory: null,
      warehouseId,
      limit,
      offset,
      productIdList: productList,
      operator: "IN",
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get the inventory counting product list for modal's table
router.route("/products/summary/selectable").post(async (req, res) => {
  try {
    const { warehouseId, productList } = req.body;

    // For pagination
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const offset = (page - 1) * limit;

    // Main query
    const { count, products } = await stService.getProductsSummary({
      module: "Inventory Counting",
      productCategory: null,
      warehouseId,
      limit,
      offset,
      productIdList: productList,
      operator: "NOT IN",
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Search inventory counting products for modal, excluding already selected items
router.route("/products/summary/selectable/search").post(async (req, res) => {
  try {
    const { warehouseId, productList, searchText, productCategory } = req.body;

    // For pagination
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const offset = (page - 1) * limit;

    const likeSearch = stHelper.likeFilter("product_name", searchText);

    // Main query
    const { count, products } = await stService.getProductsSummary({
      module: "Inventory Counting",
      productCategory,
      warehouseId,
      limit,
      offset,
      likeSearch,
      productIdList: productList,
      operator: "NOT IN",
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
