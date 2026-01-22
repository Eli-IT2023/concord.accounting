const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const Warehouse = require("../db/models/warehouse.model");
const Activity_Log = require("../db/models/activity_log.model");
const sequelize = require("../db/config/sequelize.config");
const StockManagement = require("../db/models/stock_management.model");

// Fetch Warehouse
// Used MOdule:
// -- Payable Purchase
// -- Stock Transfer
router.route("/getWarehouse").get(async (req, res) => {
  try {
    const data = await Warehouse.findAll({
      order: [["name", "ASC"]],
      where: {
        status: true,
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

router.route("/getWarehouseForFilter").get(async (req, res) => {
  try {
    const { filterColumn, searchText, statusFilter } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let warehouseWhereClause = {};
    const warehouseTableColumn = ["name", "branch_type", "address"];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Filter for name
        case "name":
          warehouseWhereClause = {
            name: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for branch type
        case "branch-type":
          warehouseWhereClause = {
            branch_type: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        case "address":
          warehouseWhereClause = {
            [Op.or]: [
              sequelize.where(
                fn(
                  "CONCAT",
                  col("address"),
                  " ",
                  fn("TRIM", col("municipality")),
                  " ",
                  fn("TRIM", col("province"))
                ),
                {
                  [Op.like]: `%${searchText}%`, // Search for the full address
                }
              ),
            ],
          };
          break;
        // Filter for all
        default:
          warehouseWhereClause = {
            [Op.or]: [
              ...warehouseTableColumn.map((column) => {
                return {
                  [column]: {
                    [Op.like]: `%${searchText}%`,
                  },
                };
              }),
              sequelize.where(
                fn(
                  "CONCAT",
                  col("address"),
                  " ",
                  fn("TRIM", col("municipality")),
                  " ",
                  fn("TRIM", col("province"))
                ),
                {
                  [Op.like]: `%${searchText}%`, // Search for the full address
                }
              ),
            ],
          };
          break;
      }
    }

    if (statusFilter && statusFilter !== "All") {
      warehouseWhereClause["status"] = statusFilter === "Active" ? true : false;
    }

    const { count, rows: data } = await Warehouse.findAndCountAll({
      where: { ...warehouseWhereClause, isDeleted: false },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
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

//Create Warehouse
router.route("/create").post(async (req, res) => {
  try {
    const {
      name,
      branchType,
      address,
      province,
      municipality,
      zipcode,
      status,
      description,
      userLoggedID,
    } = req.body;

    const existingWarehouse = await Warehouse.findOne({
      where: {
        name: name,
        isDeleted: false,
      },
    });

    if (existingWarehouse) {
      return res.status(201).send("Exist");
    }

    if (branchType === "Main") {
      const mainBranch = await Warehouse.findOne({
        where: {
          branch_type: "Main",
          isDeleted: false,
        },
      });

      if (mainBranch) {
        return res.status(201).send("MainBranchExists");
      }
    }

    const newData = await Warehouse.create({
      name: name,
      branch_type: branchType,
      address: address,
      province: province,
      municipality: municipality,
      zipcode: zipcode,
      status: status,
      description: description,
    });

    if (newData) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Branches: User created a new warehouse branch named ${name}`,
      });
    }

    res.status(200).json(newData);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

//Update Warehouse
router.route("/updateWarehouse/:param_id").put(async (req, res) => {
  try {
    const warehouseId = req.params.param_id;
    let {
      name,
      branchType,
      address,
      province,
      municipality,
      zipcode,
      status,
      description,
      userLoggedID,
    } = req.body;

    // Check if the specific warehouse has stock
    const warehouseStockSum = await StockManagement.sum("stock", {
      where: {
        warehouse_id: warehouseId,
      },
    });

    const hasStock = warehouseStockSum > 0;

    if (hasStock && status === "Inactive") {
      return res
        .status(409)
        .json({ message: "There's a stock in this Warehouse" });
    }

    if (status === "Inactive") {
      status = 0;
    } else {
      status = 1;
    }

    const existingData = await Warehouse.findOne({
      where: {
        name: name,
        warehouse_id: { [Op.ne]: warehouseId },
        isDeleted: false,
      },
    });

    if (existingData) {
      return res.status(202).send("Exist");
    }

    if (branchType === "Main") {
      const mainBranch = await Warehouse.findOne({
        where: {
          branch_type: "Main",
          warehouse_id: { [Op.ne]: warehouseId },
          isDeleted: false,
        },
      });

      if (mainBranch) {
        return res.status(202).send("MainBranchExists");
      }
    }

    const getData = await Warehouse.findOne({
      where: {
        warehouse_id: warehouseId,
        isDeleted: false,
      },
    });

    const affectedRows = await Warehouse.update(
      {
        name: name,
        branch_type: branchType,
        address: address,
        province: province,
        municipality: municipality,
        zipcode: zipcode,
        status: status,
        description: description,
      },
      {
        where: { warehouse_id: warehouseId },
      }
    );

    if (affectedRows) {
      const getDataStatus = getData.status ? "Active" : "Inactive";
      const currStatus = status ? "Active" : "Inactive";

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Branches: Update warehouse branch information: \n
         '${getData.name}' to '${name}',
        '${getData.branch_type}' to '${branchType}',
        '${getData.address}' to '${address}',
        '${getData.province}' to '${province}',
        '${getData.municipality}' to '${municipality}',
           '${getDataStatus}' to '${currStatus}',
        '${getData.zipcode}' to '${zipcode}',
        '${getData.description}' to '${description}',
        
        `,
      });
    }
    res
      .status(200)
      .json({ message: "Data updated successfully", affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

// Warehouse soft delete
router.route("/warehouseSoftDelete/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findOne({
      where: {
        warehouse_id: id,
        isDeleted: false,
      },
    });

    if (!warehouse) {
      await transaction.rollback();
      return res.status(404).json({ message: `No Warehouse id: ${id} found.` });
    }

    // Validate if there's associated product with the warehouse
    const hasAssociatedProduct = await StockManagement.findOne({
      where: {
        warehouse_id: id,
        isDeleted: false,
      },
    });

    if (hasAssociatedProduct) {
      await transaction.rollback();
      return res.status(409).json({
        message:
          "Cannot delete warehouse: there's still product associated with this warehouse.",
      });
    }

    // Proceed with soft delete
    const deleteWarehouse = await Warehouse.update(
      {
        isDeleted: true,
      },
      {
        where: {
          warehouse_id: id,
        },
        transaction,
      }
    );

    if (deleteWarehouse) {
      await transaction.commit();
      res
        .status(200)
        .json({ message: "The warehouse has been successfully deleted." });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error);
  }
});

// Bulk warehouse status update
router.route("/bulkWarehouseStatusUpdate").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { selectedWarehouse, selectedStatus } = req.body;

    const bulkStatusUpdate = await Warehouse.update(
      {
        status: selectedStatus === "Active" ? 1 : 0,
      },
      {
        where: {
          warehouse_id: {
            [Op.in]: selectedWarehouse,
          },
        },
        transaction,
      }
    );

    if (bulkStatusUpdate) {
      await transaction.commit();
      return res.status(200).json({ message: "Status Updated Successfully" });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error);
  }
});

module.exports = router;
