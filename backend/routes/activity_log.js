const router = require("express").Router();
const { Op, where } = require("sequelize");
const MasterList = require("../db/models/masterlist.model");
const Activity_Log = require("../db/models/activity_log.model");

router.route("/getUserAccounts").get(async (req, res) => {
  try {
    const isFetch = await MasterList.findAll({
      where: {
        id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
      },

      order: [["createdAt", "DESC"]],
    });

    if (isFetch) {
      return res.status(200).json(isFetch);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getUserActivityLog").get(async (req, res) => {
  try {
    const { dateFrom, dateTo, userLoggedID, selectedAccount } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (userLoggedID == undefined) {
      console.log("Undeff");
    }

    if (!dateFrom || !dateTo) {
      return res.status(404).json({ message: "Date Not found" });
    }

    const startOfDay = new Date(dateFrom);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);

    // For Filtering
    if (selectedAccount != undefined) {
      const selectedAccountIds = selectedAccount.map(
        (account) => account.value
      );
      const { count, rows: data } = await Activity_Log.findAndCountAll({
        include: [
          {
            model: MasterList,
            required: true,
            attributes: ["uname"],
          },
        ],
        where: {
          masterlist_id: {
            [Op.in]: selectedAccountIds,
          },
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },

        order: [["createdAt", "DESC"]],
        distinct: true,
        limit: limit,
        offset: offset,
      });
      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    }

    if (userLoggedID == "11111111-1111-1111-1111-111111111111") {
      const { count, rows: data } = await Activity_Log.findAndCountAll({
        include: [
          {
            model: MasterList,
            required: true,
            attributes: ["uname"],
          },
        ],
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },

        order: [["createdAt", "DESC"]],
        distinct: true,
        limit: limit,
        offset: offset,
      });
      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    } else {
      const { count, rows: data } = await Activity_Log.findAndCountAll({
        include: [
          {
            model: MasterList,
            required: true,
            attributes: ["uname"],
          },
        ],
        where: {
          ...(userLoggedID && { masterlist_id: userLoggedID }),
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },

        order: [["createdAt", "DESC"]],
        distinct: true,
        limit: limit,
        offset: offset,
      });

      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
