const router = require("express").Router();
const { Op, where, Sequelize } = require("sequelize");
const { PhysicalCategory, Activity_Log } = require("../db/models/associations");
const moment = require("moment");

router.route("/getPhysicalCategory").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await PhysicalCategory.findAndCountAll({
      where: {
        status: "Active",
      },
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getPhysicalCategoryFilter").get(async (req, res) => {
  try {
    const { filterStatus, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Initialize whereClause as an empty object
    const whereClause = {};

    // Handle status filter
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    const { count, rows } = await PhysicalCategory.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getPhysicalCategoryBySearch").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (filterColumn !== "all") {
      whereClause[filterColumn] = {
        [Op.like]: `%${searchText}%`,
      };
      whereClause.status = filterStatus;
    } else {
      whereClause[Op.or] = [{ attribute: { [Op.like]: `%${searchText}%` } }];
      whereClause.status = filterStatus;
    }

    const { count, rows } = await PhysicalCategory.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/create").post(async (req, res) => {
  try {
    const { attribute, status, userLoggedID } = req.body;

    // Check if the parameter already exists
    const existingPhysicalCategory = await PhysicalCategory.findOne({
      where: { attribute: attribute.trim() },
    });

    if (existingPhysicalCategory) {
      return res.status(201).json();
    }

    const newPhysicalCategory = await PhysicalCategory.create({
      attribute: attribute.trim(),
      status,
    });

    if (newPhysicalCategory) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new physical category: ${attribute}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/update").post(async (req, res) => {
  try {
    const { attribute, status, updateID, userLoggedID } = req.body;

    // Check if the parameter already exists
    const existingPhysicalCategory = await PhysicalCategory.findOne({
      where: {
        attribute: attribute.trim(),
        physical_id: { [Op.ne]: updateID },
      },
    });

    if (existingPhysicalCategory) {
      return res.status(201).json();
    }

    if (existingPhysicalCategory) {
      return res.status(201).json();
    }

    const newPhysicalCategory = await PhysicalCategory.update(
      {
        attribute: attribute.trim(),
        status,
      },
      {
        where: { physical_id: updateID },
      }
    );

    if (newPhysicalCategory) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated the physical category: ${attribute} with ID ${updateID}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
