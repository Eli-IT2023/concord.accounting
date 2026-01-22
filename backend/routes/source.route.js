const router = require("express").Router();
const { Op, where } = require("sequelize");
const { Source, Activity_Log } = require("../db/models/associations");
const moment = require("moment");
router.route("/getSource").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Source.findAndCountAll({
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

router.route("/getSourceFilter").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: filterStatus,
    };

    if (filterDateCreated) {
      const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .startOf("day") // 00:00:00
        .toDate();

      const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .endOf("day") // 23:59:59.999
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const { count, rows } = await Source.findAndCountAll({
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

router.route("/getSourceBySearch").get(async (req, res) => {
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
        { name: { [Op.like]: `%${searchText}%` } },
        { description: { [Op.like]: `%${searchText}%` } },
      ];
      whereClause.status = filterStatus;
    }

    const { count, rows } = await Source.findAndCountAll({
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

router.route("/source_create").post(async (req, res) => {
  try {
    const { sourceName, description, status, userLoggedID } = req.body;

    // Check if the Source already exists
    const existingSource = await Source.findOne({
      where: { name: sourceName.trim() },
    });

    if (existingSource) {
      return res.status(201).json();
    }

    const newSource = await Source.create({
      name: sourceName.trim(),
      description: description,
      status: status,
    });

    if (newSource) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new Source: ${sourceName}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/source_edit").post(async (req, res) => {
  try {
    const { sourceName, description, status, userLoggedID, forEditPrimary } =
      req.body;

    // Check if the Source already exists
    const existingSource = await Source.findOne({
      where: {
        name: sourceName.trim(),
        id: { [Op.ne]: forEditPrimary },
      },
    });

    if (existingSource) {
      return res.status(201).json();
    }

    const newSource = await Source.update(
      {
        name: sourceName.trim(),
        description: description,
        status: status,
      },
      {
        where: { id: forEditPrimary },
      }
    );

    if (newSource) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated the a Source: ${sourceName} with ID ${forEditPrimary}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
