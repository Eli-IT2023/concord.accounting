const router = require("express").Router();
const { Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  SalesInvoice,
  SalesInvoiceInventory,
  Customer,
  ProductList,
  StockManagement,
  Cutoff,
} = require("../db/models/associations");

router.route("/getSalesReport").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const data = await SalesInvoiceInventory.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: SalesInvoice,
          include: [
            {
              model: Customer,
            },
          ],
        },
      ],
    });
    res.json({
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSalesInvoiceInventoryByProduct").get(async (req, res) => {
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

    console.log(
      "************************************************************** previousCutoff: ",
      previousCutoff
    );

    const data = await SalesInvoiceInventory.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: SalesInvoice,
          where: {
            isDeleted: false,
            invoice_date: {
              [Op.between]: [cutoff_fromdate, cutoff_todate],
            },
            status: "Approved",
          },
        },
        {
          model: StockManagement,
          include: [
            {
              model: ProductList,
            },
          ],
        },
      ],
    });

    const previousSalesAmount = await SalesInvoiceInventory.findAll({
      include: [
        {
          model: SalesInvoice,
          where: {
            invoice_date: {
              [Op.between]: [previousCutoff?.from, previousCutoff?.to],
            },
            status: "Approved",
          },
        },
      ],
      where: {
        isDeleted: false,
      },
    });

    res.json({
      previousSalesAmount,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
