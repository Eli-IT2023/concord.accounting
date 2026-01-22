const router = require("express").Router();
const { Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");

const {
  Inventory_Report,
  ProductList,
  Cutoff,
  StockManagement,
  Inventory_Journal,
} = require("../db/models/associations");
const session = require("express-session");
const { inventoryReport } = require("../services");

const irService = inventoryReport.inventoryReportService; // Inventory report service layer
const irHelper = inventoryReport.inventoryReportHelper; // Inventory report helper

router.route("/getInventoryReport").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const previousCutoff = await Cutoff.findOne({
      where: {
        to: { [Op.lt]: cutoff_fromdate },
        isDeleted: false,
      },
      order: [["to", "DESC"]],
    });

    const firstCutOff = await Cutoff.findOne({
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "ASC"]],
    });

    let beginningInventory = [];

    let currentInventory = [];

    let previousInCalculation = [];
    let previousOutCalculation = [];

    if (previousCutoff) {
      const { from: previousFromdate, to: previousTodate } = previousCutoff;

      beginningInventory = await StockManagement.findAll({
        attributes: [
          "product_id",
          [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
          [sequelize.fn("AVG", sequelize.col("price")), "totalPrice"],
          [sequelize.fn("MAX", sequelize.col("price")), "highestPrice"],

          [sequelize.fn("SUM", sequelize.col("in")), "totalIn"],
          [sequelize.fn("AVG", sequelize.col("price_in")), "totalPriceIn"],
          [sequelize.fn("MAX", sequelize.col("price_in")), "highestPriceIn"],
        ],
        include: [{ model: ProductList }],
        where: {
          isDeleted: false,
          // stock: { [Op.gt]: 0 },
          date_in: { [Op.between]: [firstCutOff.from, previousTodate] },
        },
        group: ["product_id"],
      });

      previousInCalculation = await StockManagement.findAll({
        attributes: [
          "product_id",
          [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
          [sequelize.fn("AVG", sequelize.col("price")), "totalPrice"],
          [sequelize.fn("MAX", sequelize.col("price")), "highestPrice"],

          [sequelize.fn("SUM", sequelize.col("in")), "totalIn"],
          [sequelize.fn("AVG", sequelize.col("price_in")), "totalPriceIn"],
          [sequelize.fn("MAX", sequelize.col("price_in")), "highestPriceIn"],
        ],
        include: [{ model: ProductList }],
        where: {
          isDeleted: false,
          // stock: { [Op.gt]: 0 },
          // module_in_from: { [Op.ne]: "Inventory Counting" },
          date_in: { [Op.between]: [firstCutOff.from, previousTodate] },
        },
        group: ["product_id"],
      });

      previousOutCalculation = await Inventory_Report.findAll({
        attributes: [
          "product_id",
          [sequelize.fn("SUM", sequelize.col("product_out")), "stockOut"],
          [sequelize.fn("AVG", sequelize.col("unit_price")), "averagePrice"],
        ],
        where: {
          isDeleted: false,
          date_in: {
            [Op.between]: [firstCutOff.from, previousTodate],
          }, // adjust as needed
        },
        group: ["product_id"],
        include: [{ model: ProductList }],
        // raw: true,
      });
    }

    currentInventory = await StockManagement.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [sequelize.fn("AVG", sequelize.col("price")), "totalPrice"],
        [sequelize.fn("MAX", sequelize.col("price")), "highestPrice"],

        [sequelize.fn("SUM", sequelize.col("in")), "totalIn"],
        [sequelize.fn("AVG", sequelize.col("price_in")), "totalPriceIn"],
        [sequelize.fn("MAX", sequelize.col("price_in")), "highestPriceIn"],
      ],
      include: [{ model: ProductList }],
      where: {
        isDeleted: false,
        // stock: { [Op.gt]: 0 },
        module_in_from: { [Op.ne]: "Inventory Counting" },
        date_in: { [Op.between]: [cutoff_fromdate, cutoff_todate] },
      },
      group: ["product_id"],
    });

    const outInventory = await Inventory_Report.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("product_out")), "stockOut"],
        [sequelize.fn("AVG", sequelize.col("unit_price")), "averagePrice"],
      ],
      where: {
        from_counting: false,
        isDeleted: false,
        date_in: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        }, // adjust as needed
      },
      group: ["product_id"],
      include: [{ model: ProductList }],
      // raw: true,
    });

    let inCalculation = await StockManagement.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [sequelize.fn("AVG", sequelize.col("price")), "totalPrice"],
        [sequelize.fn("MAX", sequelize.col("price")), "highestPrice"],

        [sequelize.fn("SUM", sequelize.col("in")), "totalIn"],
        [sequelize.fn("AVG", sequelize.col("price_in")), "totalPriceIn"],
        [sequelize.fn("MAX", sequelize.col("price_in")), "highestPriceIn"],
      ],
      include: [{ model: ProductList }],
      where: {
        isDeleted: false,
        // stock: { [Op.gt]: 0 },
        // module_in_from: { [Op.ne]: "Inventory Counting" },
        date_in: { [Op.between]: [cutoff_fromdate, cutoff_todate] },
      },
      group: ["product_id"],
    });

    const outCalculation = await Inventory_Report.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("product_out")), "stockOut"],
        [sequelize.fn("AVG", sequelize.col("unit_price")), "averagePrice"],
      ],
      where: {
        isDeleted: false,
        date_in: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        }, // adjust as needed
      },
      group: ["product_id"],
      include: [{ model: ProductList }],
      // raw: true,
    });

    const finalInventory = await StockManagement.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [sequelize.fn("AVG", sequelize.col("price")), "totalPrice"],
        [sequelize.fn("MAX", sequelize.col("price")), "highestPrice"],
      ],
      include: [{ model: ProductList }],
      where: {
        isDeleted: false,
        // stock: { [Op.gt]: 0 },
        date_in: {
          [Op.between]: [firstCutOff.from, cutoff_todate],
        },
      },
      group: ["product_id"],
    });

    const productMap = new Map();

    beginningInventory.forEach((item) => {
      productMap.set(item.product_id, {
        product_id: item.product_id,
        totalStock: item.dataValues.totalStock || 0,
        totalPrice: item.dataValues.totalPrice || 0,
        highestPrice: item.dataValues.highestPrice || 0,
        totalIn: item.dataValues.totalIn || 0,
        totalPriceIn: item.dataValues.totalPriceIn || 0,
        highestPriceIn: item.dataValues.highestPriceIn || 0,
        product_list: item.product_list,
      });
    });

    finalInventory.forEach((item) => {
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, {
          product_id: item.product_id,
          totalStock: 0,
          totalPrice: 0,
          highestPrice: 0,
          totalIn: 0,
          totalPriceIn: 0,
          highestPriceIn: 0,
          product_list: item.product_list,
        });
      }
    });

    const mergedInventory = Array.from(productMap.values());

    res.json({
      beginningInventory: mergedInventory,
      previousInCalculation,
      previousOutCalculation,
      currentInventory,
      finalInventory,
      outInventory,
      outCalculation,
      inCalculation,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for inventory report (Raw materials, Finished product, Consumable Tab)
router.route("/inventory/summary").get(async (req, res) => {
  try {
    const { startDate, endDate, productCategory } = req.query;

    // Validate query params
    if (!startDate || !endDate || !productCategory)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    const { inventory, total } = await irService.getInventorySummaryAndTotal(
      startDate,
      endDate,
      productCategory
    );

    res.status(200).json({ inventory, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get the inventory report overview
router.route("/overview").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // For current and previous final inventory
    const overview = await irService.getOverview(startDate, endDate);

    res.status(200).json({ overview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
