const router = require("express").Router();
const { Op, Sequelize, where } = require("sequelize");
const { TaxSettings, Activity_Log } = require("../db/models/associations");
const moment = require("moment");
const sequelize = require("../db/config/sequelize.config");
router.route("/getTaxSettings").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await TaxSettings.findAndCountAll({
      where: {
        status: "active",
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

router.route("/getTaxSettingsSortdata").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await TaxSettings.findAndCountAll({
      where: {
        status: "active",
      },
      order: [[sortDBTableColumn, sortType]],
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

router.route("/getTaxSettingsBySearch").get(async (req, res) => {
  try {
    const { searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    // Clean up the search text
    const cleanSearchText = searchText?.trim() || "";
    const numericValue = !isNaN(parseFloat(cleanSearchText.replace(/,/g, "")))
      ? parseFloat(cleanSearchText.replace(/,/g, ""))
      : null;

    // Define text and numeric columns
    const textColumns = ["name", "applicability", "transaction_type"];
    const numericColumns = ["rate", "threshold_amount"];

    // Build the where clause
    let whereClause = {};

    if (filterColumn !== "all") {
      // Single column search
      if (numericColumns.includes(filterColumn)) {
        // For numeric columns - convert to string for LIKE operations
        if (numericValue !== null) {
          whereClause[filterColumn] = sequelize.where(
            sequelize.cast(sequelize.col(filterColumn), "char"),
            { [Op.like]: `%${numericValue}%` }
          );
        } else {
          // If not a valid number, use a condition that will likely return no matches
          whereClause[filterColumn] = sequelize.where(
            sequelize.cast(sequelize.col(filterColumn), "char"),
            { [Op.like]: `%${cleanSearchText}%` }
          );
        }
      } else {
        // For text columns
        whereClause[filterColumn] = { [Op.like]: `%${cleanSearchText}%` };
      }
    } else {
      // Combined search across all columns
      const conditions = textColumns.map((column) => ({
        [column]: { [Op.like]: `%${cleanSearchText}%` },
      }));

      // Add numeric conditions
      if (numericValue !== null) {
        // For numeric search, cast the column to string and then use LIKE
        numericColumns.forEach((column) => {
          conditions.push(
            sequelize.where(sequelize.cast(sequelize.col(column), "char"), {
              [Op.like]: `%${numericValue}%`,
            })
          );
        });
      }

      whereClause = { [Op.or]: conditions };
    }

    const { count, rows } = await TaxSettings.findAndCountAll({
      where: whereClause,
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "name"} ${sortType || "DESC"}`
        ),
      ],
      limit,
      offset,
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

router.route("/getTaxSettingsById").get(async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const taxSettings = await TaxSettings.findOne({
      where: {
        id: id,
      },
    });

    if (!taxSettings) {
      return res.status(404).json({ message: "Tax settings not found" });
    }

    return res.status(200).json(taxSettings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/tax_create").post(async (req, res) => {
  try {
    const {
      name,
      applicableRates,
      thresholdAmount,
      applicability,
      transactionType,
      description,
      userLoggedID,
    } = req.body;

    // Check if the TaxSettings already exists
    const existingTaxSettings = await TaxSettings.findOne({
      where: { name: name.trim() },
    });

    if (existingTaxSettings) {
      return res.status(201).json();
    }

    const newTaxSettings = await TaxSettings.create({
      name: name.trim(),
      rate: applicableRates,
      threshold_amount: thresholdAmount,
      applicability: applicability,
      transaction_type: transactionType,
      description: description,
    });

    if (newTaxSettings) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Created a new TaxSettings: ${name}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/tax_edit").post(async (req, res) => {
  try {
    const {
      id,
      name,
      applicableRates,
      thresholdAmount,
      applicability,
      transactionType,
      description,
      userLoggedID,
    } = req.body;

    // Check if the TaxSettings already exists
    const existingTaxSettings = await TaxSettings.findOne({
      where: {
        name: name.trim(),
        id: { [Op.ne]: id },
      },
    });

    if (existingTaxSettings) {
      return res.status(201).json();
    }

    const newTaxSettings = await TaxSettings.update(
      {
        name: name.trim(),
        rate: applicableRates,
        threshold_amount: thresholdAmount,
        applicability: applicability,
        transaction_type: transactionType,
        description: description,
      },
      {
        where: { id: id },
      }
    );

    if (newTaxSettings) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Updated the a TaxSettings: ${name} with ID ${id}`,
      });

      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
