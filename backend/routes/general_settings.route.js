const router = require("express").Router();
const { Op, where } = require("sequelize");
const { SeriesNumber } = require("../db/models/associations");

const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/get-series-numbers").get(async (req, res) => {
  try {
    const seriesNumbers = await SeriesNumber.findAll({
      where: {
        category: ["SI", "DC", "DR"],
      },
    });

    const response = {
      salesInvoice: {
        value: "",
        alphabeticalValue: "", // NEW
        isActive: false,
      },
      deliveryConfirmation: {
        value: "",
        alphabeticalValue: "", // NEW
        isActive: false,
      },
      deliveryReceipt: {
        value: "",
        alphabeticalValue: "", // NEW
        isActive: false,
      },
    };

    seriesNumbers.forEach((record) => {
      switch (record.category) {
        case "SI":
          response.salesInvoice.value = record.series_number;
          response.salesInvoice.alphabeticalValue =
            record.alphabetical_value || ""; // NEW
          response.salesInvoice.isActive = record.status === "active";
          break;
        case "DC":
          response.deliveryConfirmation.value = record.series_number;
          response.deliveryConfirmation.alphabeticalValue =
            record.alphabetical_value || ""; // NEW
          response.deliveryConfirmation.isActive = record.status === "active";
          break;
        case "DR":
          response.deliveryReceipt.value = record.series_number;
          response.deliveryReceipt.alphabeticalValue =
            record.alphabetical_value || ""; // NEW
          response.deliveryReceipt.isActive = record.status === "active";
          break;
      }
    });

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching series numbers:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

router.route("/update-series-numbers").put(async (req, res) => {
  try {
    const { salesInvoice, deliveryConfirmation, deliveryReceipt, updatedBy } =
      req.body;

    const categories = [
      {
        category: "SI",
        data: salesInvoice,
        defaultValue: "",
        alphabeticalDefaultValue: "", // NEW
      },
      {
        category: "DC",
        data: deliveryConfirmation,
        defaultValue: "",
        alphabeticalDefaultValue: "", // NEW
      },
      {
        category: "DR",
        data: deliveryReceipt,
        defaultValue: "",
        alphabeticalDefaultValue: "", // NEW
      },
    ];

    const results = [];

    for (const {
      category,
      data,
      defaultValue,
      alphabeticalDefaultValue,
    } of categories) {
      try {
        let existingRecord = await SeriesNumber.findOne({
          where: { category: category },
        });

        if (existingRecord) {
          const updatedRecord = await SeriesNumber.update(
            {
              series_number: data.value || defaultValue,
              alphabetical_value:
                data.alphabeticalValue || alphabeticalDefaultValue, // NEW
              status: data.isActive ? "active" : "inactive",
              updatedBy: updatedBy,
              updatedAt: new Date(),
            },
            {
              where: { category: category },
              returning: true,
            }
          );

          results.push({
            category,
            action: "updated",
            record: updatedRecord[1][0],
          });
        } else {
          const newRecord = await SeriesNumber.create({
            category: category,
            series_number: data.value || defaultValue,
            alphabetical_value:
              data.alphabeticalValue || alphabeticalDefaultValue, // NEW
            status: data.isActive ? "active" : "inactive",
            createdBy: updatedBy,
            updatedBy: updatedBy,
          });
          results.push({
            category,
            action: "created",
            record: newRecord,
          });
        }
      } catch (categoryError) {
        console.error(`Error processing category ${category}:`, categoryError);
        results.push({
          category,
          action: "error",
          error: categoryError.message,
        });
      }
    }

    const errors = results.filter((result) => result.action === "error");
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Some operations failed",
        results: results,
        errors: errors,
      });
    }

    res.status(200).json({
      message: "Series numbers updated successfully",
      results: results,
    });
  } catch (err) {
    console.error("Error in update-series-numbers:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message,
    });
  }
});

module.exports = router;
