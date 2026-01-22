const router = require("express").Router();
const { Op, where, Sequelize } = require("sequelize");
const { Mixer, Activity_Log } = require("../db/models/associations");
const moment = require("moment");
router.route("/getMixer").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await Mixer.findAndCountAll({
      where: {
        status: "Active",
      },
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "name"} ${sortType || "DESC"}`
        ),
      ],
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

router.route("/getMixerSort").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await Mixer.findAndCountAll({
      where: {
        status: "Active",
      },
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "name"} ${sortType || "DESC"}`
        ),
      ],
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

router.route("/getMixerFilter").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    // Initialize whereClause as an empty object
    const whereClause = {};

    // Handle status filter
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

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

    const { count, rows } = await Mixer.findAndCountAll({
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

router.route("/getMixerBySearch").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

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

    const { count, rows } = await Mixer.findAndCountAll({
      where: whereClause,
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "name"} ${sortType || "DESC"}`
        ),
      ],
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

router.route("/Mixer_create").post(async (req, res) => {
  try {
    const { MixerName, description, status, userLoggedID } = req.body;

    // Check if the Mixer already exists
    const existingMixer = await Mixer.findOne({
      where: { name: MixerName.trim() },
    });

    if (existingMixer) {
      return res.status(201).json();
    }

    const newMixer = await Mixer.create({
      name: MixerName.trim(),
      description: description,
      status: status,
    });

    if (newMixer) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new Mixer: ${MixerName}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/Mixer_edit").post(async (req, res) => {
  try {
    const { MixerName, description, status, userLoggedID, forEditPrimary } =
      req.body;

    // Check if the Mixer already exists
    const existingMixer = await Mixer.findOne({
      where: {
        name: MixerName.trim(),
        id: { [Op.ne]: forEditPrimary },
      },
    });

    if (existingMixer) {
      return res.status(201).json();
    }

    const newMixer = await Mixer.update(
      {
        name: MixerName.trim(),
        description: description,
        status: status,
      },
      {
        where: { id: forEditPrimary },
      }
    );

    if (newMixer) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated the a Mixer: ${MixerName} with ID ${forEditPrimary}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
