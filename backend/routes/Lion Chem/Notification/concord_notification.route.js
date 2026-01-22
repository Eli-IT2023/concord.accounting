const router = require("express").Router();
const { where, Op, fn, col, Sequelize } = require("sequelize");
const sequelize = require("../../../db/config/sequelize.config");
const {
  Packaging,
  Activity_Log,
  PackagingImage,
  ConcordNotification,
} = require("../../../db/models/associations");
const session = require("express-session");
const moment = require("moment");

// find active notifications
router.route("/getActiveNotification").get(async (req, res) => {
  try {
    const fetchData = await ConcordNotification.findAll({
      where: {
        isRead: false,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: fetchData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("error");
  }
});

// count active notifications
router.route("/countActiveNotifications").get(async (req, res) => {
  try {
    const count = await ConcordNotification.count({
      where: {
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("error");
  }
});

// read notification upon clicking
router.route("/readNotification/:id").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const checkNotification = await ConcordNotification.findOne({
      where: {
        id,
      },
    });

    if (!checkNotification && !id) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const updateNotification = await ConcordNotification.update(
      {
        isRead: true,
      },
      {
        where: { id },
        transaction,
      }
    );

    if (updateNotification) {
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Notification updated successfully",
      });
    }
  } catch (error) {
    // Rollback on error
    await transaction.rollback();

    console.error("Notification Update Failed:", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Error updating notification",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
