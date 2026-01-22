const router = require("express").Router();
const { Op, where } = require("sequelize");
const { Parameter, Activity_Log } = require("../db/models/associations");
const moment = require("moment");
router.route("/getParameter").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Parameter.findAndCountAll({
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

router.route("/getParameterFilter").get(async (req, res) => {
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

    const { count, rows } = await Parameter.findAndCountAll({
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

router.route("/getParameterBySearch").get(async (req, res) => {
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

    const { count, rows } = await Parameter.findAndCountAll({
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

router.route("/para_create").post(async (req, res) => {
  try {
    const { specificationName, description, status, userLoggedID } = req.body;

    // Check if the parameter already exists
    const existingParameter = await Parameter.findOne({
      where: { name: specificationName.trim() },
    });

    if (existingParameter) {
      return res.status(201).json();
    }

    const newParameter = await Parameter.create({
      name: specificationName.trim(),
      description: description,
      status: status,
    });

    if (newParameter) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new parameter: ${specificationName}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/para_edit").post(async (req, res) => {
  try {
    const {
      specificationName,
      description,
      status,
      userLoggedID,
      forEditPrimary,
    } = req.body;

    // Check if the parameter already exists
    const existingParameter = await Parameter.findOne({
      where: {
        name: specificationName.trim(),
        id: { [Op.ne]: forEditPrimary },
      },
    });

    if (existingParameter) {
      return res.status(201).json();
    }

    const newParameter = await Parameter.update(
      {
        name: specificationName.trim(),
        description: description,
        status: status,
      },
      {
        where: { id: forEditPrimary },
      }
    );

    if (newParameter) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated the a parameter: ${specificationName} with ID ${forEditPrimary}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
