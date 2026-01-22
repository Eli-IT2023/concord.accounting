const router = require("express").Router();
const { Op, where } = require("sequelize");
const { Packaging, Activity_Log } = require("../../../db/models/associations");
const moment = require("moment");

// create
router.route("/create").post(async (req, res) => {
  try {
    const { packageName, description, status, userLoggedID } = req.body;

    // Check if the parameter already exists
    const existingParameter = await Packaging.findOne({
      where: { packaging_name: packageName.trim() },
    });

    if (existingParameter) {
      return res.status(201).json();
    }

    const createPackaging = await Packaging.create({
      packaging_name: packageName.trim(),
      description: description,
      status: status,
    });

    if (createPackaging) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new packaging: ${packageName}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// update
router.route("/update").post(async (req, res) => {
  try {
    const { packageName, description, status, userLoggedID, forEditPrimary } =
      req.body;

    // Check if the packaging already exists
    const existingPackaging = await Packaging.findOne({
      where: {
        packaging_name: packageName.trim(),
        id: { [Op.ne]: forEditPrimary },
      },
    });

    if (existingPackaging) {
      return res.status(201).json();
    }

    const newPackaging = await Packaging.update(
      {
        packaging_name: packageName.trim(),
        description: description,
        status: status,
      },
      {
        where: { id: forEditPrimary },
      }
    );

    if (newPackaging) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated the a packaging: ${packageName} with ID ${forEditPrimary}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// fetch
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Packaging.findAndCountAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
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

// filtered fetch
router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the where clause dynamically
    const whereClause = {};

    // Handle status filter (including "All" option)
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    // Handle date filter
    if (filterDateCreated) {
      const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .startOf("day")
        .toDate();

      const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .endOf("day")
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    // Add additional filters if needed
    // if (req.query.otherFilter) {
    //   whereClause.otherField = req.query.otherFilter;
    // }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows,
      filters: {
        status: filterStatus,
        date: filterDateCreated,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// search fetch
router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (filterColumn !== "all") {
      // const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
      //   .startOf("day") // 00:00:00
      //   .toDate();

      // const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
      //   .endOf("day") // 23:59:59.999
      //   .toDate();

      whereClause[filterColumn] = {
        [Op.like]: `%${searchText}%`,
      };
      whereClause.status = filterStatus;
    } else {
      whereClause[Op.or] = [
        { packaging_name: { [Op.like]: `%${searchText}%` } },
        { description: { [Op.like]: `%${searchText}%` } },
      ];
      whereClause.status = filterStatus;
    }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
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

module.exports = router;
