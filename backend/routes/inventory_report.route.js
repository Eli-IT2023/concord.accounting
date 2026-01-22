const router = require("express").Router();
const { Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");

const {
  Inventory_Report,
  ProductList,
  Cutoff,
  StockManagement,
} = require("../db/models/associations");
const session = require("express-session");

router.route("/getInventoryReport").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const previousCutoff = await Cutoff.findOne({
      where: {
        to: { [Op.lt]: cutoff_fromdate },
      },
      order: [["to", "DESC"]],
    });

    let beginningInventory = [];

    let currentInventory = [];

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
          stock: { [Op.gt]: 0 },
          date_in: { [Op.between]: [previousFromdate, previousTodate] },
        },
        group: ["product_id"],
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
        stock: { [Op.gt]: 0 },
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
        createdAt: { [Op.between]: [cutoff_fromdate, cutoff_todate] }, // adjust as needed
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
        stock: { [Op.gt]: 0 },
        date_in: { [Op.between]: [cutoff_fromdate, cutoff_todate] },
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
      currentInventory,
      finalInventory,
      outInventory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
