const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const Warehouse = require("../db/models/warehouse.model");
const Activity_Log = require("../db/models/activity_log.model");
const sequelize = require("../db/config/sequelize.config");

// Fetch Warehouse
// Used MOdule:
// -- Payable Purchase
// -- Stock Transfer
router.route("/getWarehouse").get(async (req, res) => {
  try {
    const data = await Warehouse.findAll({
      order: [["name", "ASC"]],
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

router.route("/getPaginatedWarehouse").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Warehouse.findAndCountAll({
      order: [["name", "ASC"]],
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / page),
      currentPage: page,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getWarehouseForFilter").get(async (req, res) => {
  try {
    const { filterColumn, searchText, statusFilter } = req.query;
    let warehouseWhereClause = {};
    const warehouseTableColumn = ["name", "branch_type", "address"];
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
        warehouseWhereClause = sequelize.where(
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
        );
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

    if (statusFilter !== "All") {
      warehouseWhereClause["status"] = statusFilter === "Active" ? true : false;
    }

    const data = await Warehouse.findAll({
      where: warehouseWhereClause,
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

router.get("/getPaginatedWarehouseForFilter", async (req, res) => {
  try {
    const { searchText, filterColumn, statusFilter } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let warehouseWhereClause = {};

    // Warehouse table columns
    const warehouseTableColumn = ["name", "branch_type"];

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
      // Filter for address (includes municipality and province)
      case "address":
        warehouseWhereClause = {
          [Op.or]: [
            { address: { [Op.like]: `%${searchText}%` } },
            { municipality: { [Op.like]: `%${searchText}%` } },
            { province: { [Op.like]: `%${searchText}%` } },
            sequelize.where(
              sequelize.fn(
                "CONCAT",
                sequelize.col("address"),
                " ",
                sequelize.fn("TRIM", sequelize.col("municipality")),
                " ",
                sequelize.fn("TRIM", sequelize.col("province"))
              ),
              {
                [Op.like]: `%${searchText}%`,
              }
            ),
          ],
        };
        break;
      // Filter for all
      default:
        warehouseWhereClause = {
          [Op.or]: [
            ...warehouseTableColumn.map((column) => ({
              [column]: {
                [Op.like]: `%${searchText}%`,
              },
            })),
            { address: { [Op.like]: `%${searchText}%` } },
            { municipality: { [Op.like]: `%${searchText}%` } },
            { province: { [Op.like]: `%${searchText}%` } },
            sequelize.where(
              sequelize.fn(
                "CONCAT",
                sequelize.col("address"),
                " ",
                sequelize.fn("TRIM", sequelize.col("municipality")),
                " ",
                sequelize.fn("TRIM", sequelize.col("province"))
              ),
              {
                [Op.like]: `%${searchText}%`,
              }
            ),
          ],
        };
        break;
    }

    if (statusFilter !== "All") {
      warehouseWhereClause["status"] = statusFilter === "Active" ? true : false;
    }

    const { count, rows } = await Warehouse.findAndCountAll({
      where: warehouseWhereClause,
      limit: limit,
      offset: offset,
      order: [["warehouse_id", "DESC"]], // Added to match your frontend sorting
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
      },
    });

    if (existingWarehouse) {
      return res.status(201).send("Exist");
    }

    if (branchType === "Main") {
      const mainBranch = await Warehouse.findOne({
        where: {
          branch_type: "Main",
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

    const existingData = await Warehouse.findOne({
      where: {
        name: name,
        warehouse_id: { [Op.ne]: warehouseId },
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
        },
      });

      if (mainBranch) {
        return res.status(202).send("MainBranchExists");
      }
    }

    const getData = await Warehouse.findOne({
      where: {
        warehouse_id: warehouseId,
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

module.exports = router;
