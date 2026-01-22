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
} = require("../db/models/associations");

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
      },
    });

    const isPosted = findCutoff.isPosted;

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
        },
      ],
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
    const data = await Warehouse.findAll();

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
      },
    });

    const isPosted = findCutoff.isPosted;

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
    itemList = [],
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
    const itemListPromises = itemList.map(async (item) => {
      // Find the warehouse_id based on warehouseName
      const warehouse = await Warehouse.findOne({
        where: { name: item.warehouseName },
        attributes: ["warehouse_id"],
      });

      if (!warehouse) {
        throw new Error(`Warehouse not found for name: ${item.warehouseName}`);
      }

      // Step 3: Create the InventoryCountingItemList record
      return InventoryCountingItemList.create({
        product_id: item.productId,
        inventory_counting_id: inventoryCounting.inventory_counting_id,
        stock_management_id: item.stock_management_id,
        system_quantity: item.systemQuality,
        actual_count: item.actualCount,
        warehouse_id: warehouse.warehouse_id,
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

    console.log("----------------------------------------------itemList: ", itemList);

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
      const { productId, warehouseId, quantity, actualCount } = item;

      const totalAdjustment = actualCount - quantity;

      console.log(
        `Product ID: ${productId}, Warehouse ID: ${warehouseId}, Quantity: ${quantity}, Actual Count: ${actualCount}, Adjustment: ${totalAdjustment}`
      );

      // Find the latest stock_management_id for the given product_id and warehouse_id
      const latestRecord = await StockManagement.findOne({
        where: { product_id: productId, warehouse_id: warehouseId },
        order: [["stock_management_id", "DESC"]], // Get the latest record by stock_management_id
        transaction,
      });


      //add here later, if adjustment is + add to stockmgmt if - add to inv report
      if (totalAdjustment > 0) {
          if (latestRecord) {
          await StockManagement.create({
          product_id: productId,
          warehouse_id: warehouseId,
          stock: totalAdjustment,
          in: totalAdjustment,
          date_in: new Date(),
          vendor_id: latestRecord.vendor_id || null,
          price: latestRecord.price || 0,
          price_in: latestRecord.price_in || 0,
          module_in_from: "Inventory Counting",
        }, { transaction });
      }
      } else if (totalAdjustment < 0) {    
        await Inventory_Report.create(
          {
            product_id: productId,
            product_out: Math.abs(totalAdjustment),
            average_price: latestRecord.price || 0, 
            unit_price: latestRecord.price_in || 0,
            cut_off_id: findCutoff.id || null, 
          },
          { transaction }
        );
      }
    }

    Activity_Log.create({
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

module.exports = router;
