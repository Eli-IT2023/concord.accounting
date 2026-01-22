const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");

const {
  Cutoff,
  SalesInvoice,
  Customer,
  BulkCollectionPayment,
  Expenses,
  Expenses2,
  Expenses1,
  Payable,
  StockManagement,
} = require("../db/models/associations");

router.route("/getIncomeReports").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const data = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      where: {
        invoice_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
      },
    });

    const lastCutoffReceivableQuery = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const bulkCollectionPayment = await BulkCollectionPayment.findAll({
      where: {
        status: {
          [Op.or]: ["Approved", "Claimed"],
        },
        date_issued: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
      },
    });

    const lastCutoffReceivable = lastCutoffReceivableQuery
      .filter((item) => {
        return (
          item.status == "Approved" &&
          item.invoice_date < startDate &&
          item.payAdded == 0
        );
      })
      .reduce((total, value) => {
        return total + value.total_amount;
      }, 0);

    const currentSalesTotal = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        return total + value.total_amount;
      }, 0);

    const currentTotalDiscount = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        return (
          total +
          parseFloat(value.transaction_discount) +
          parseFloat(value.item_discount)
        );
      }, 0);

    const totalCollection = bulkCollectionPayment
      .filter((item) => {
        return item.status === "Approved";
      })
      .reduce((total, value) => {
        return total + parseFloat(value.amount);
      }, 0);

    const currentCutoffReceivable = data
      .filter((item) => {
        return item.status === "Approved";
      })
      .reduce((total, value) => {
        return total + parseFloat(value.total_amount);
      }, 0);

    res.json({
      data,
      lastCutoffReceivable,
      currentSalesTotal,
      currentTotalDiscount,
      totalCollection,
      currentCutoffReceivable,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getSalesInvoice").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const filteredInvoice = await SalesInvoice.findAll({
      where: {
        due_date: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
        status: "Approved",
      },
    });

    const totalRevenue = filteredInvoice.reduce((acc, invoice) => {
      return acc + (invoice.total_amount || 0);
    }, 0);

    const totalSalesDiscount = filteredInvoice.reduce((acc, invoice) => {
      return acc + (invoice.item_discount || 0);
    }, 0);

    res.json({
      salesInvoices: filteredInvoice,
      totalRevenue,
      totalSalesDiscount,
      netRevenue: totalRevenue - totalSalesDiscount
    });
  } catch (err) {
    console.error("Error fetching sales invoices:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.route("/getCostOfGoodsSold").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const openingInventoryData = await StockManagement.findAll({
      where: {
        date_in: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
      },
    });

    const openingInventory = openingInventoryData.reduce((acc, inventory) => {
      return acc + (inventory.price_in || 0); 
    }, 0);

    const incomeTaxExpenses = await Expenses.findAll({
      where: {
        expenses_date: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
        status: "Approved",
      },
      include: [
        {
          model: Expenses2,
          where: {
            sub_type: "Income Tax Expenses",
          },
          required: true,
          attributes: ["id", "sub_type"],
        },
      ],
    })

    const purchasesData = await Payable.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
        status: {
          [Op.notIn]: ['Pending', 'Rejected'],
        },
      },
    });

    const totalIncomeTaxExpenses = incomeTaxExpenses.reduce((acc, data) => {
      return acc + (data.totalAmount || 0);
    }, 0);

    const totalPurchases = purchasesData.reduce((acc, purchase) => {
      return acc + (purchase.totalPrice || 0);
    }, 0);

    const closingInventoryData = await StockManagement.findAll({
      where: {
        date_in: {
          [Op.lte]: cutoff_todate,
        },
      },
      order: [['date_in', 'DESC']], 
      limit: 1,
    });

    const closingInventory = closingInventoryData.reduce((acc, inventory) => {
      return acc + (inventory.amount || 0); 
    }, 0);

    const cogs = openingInventory + totalPurchases - closingInventory;

    res.json({
      openingInventory,
      totalPurchases,
      closingInventory,
      cogs,
      totalIncomeTaxExpenses,
    });
  } catch (err) {
    console.error("Error fetching Cost of Goods Sold:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.route("/getOperatingExpensesSubTypes").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const operatingExpensesSubTypes = await Expenses.findAll({
      where: {
        expenses_date: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
        status: "Approved",
      },
      include: [
        {
          model: Expenses2,
          required: true, 
          include: [
            {
              model: Expenses1,
              where: { expenses_type_one: {
                [Op.or]: [
                  "Selling Expenses",        
                  "Administrative Expenses",  
                  "Financial Expenses",       
                  "Other Operating Expenses", 
                  "Depreciation Expenses"
                ]
              }, },
              required: true, 
            },
          ],
          attributes: ["id", "sub_type"],
        },
      ],
      attributes: ["id", "totalAmount"],
    });

    res.json(operatingExpensesSubTypes);
  } catch (err) {
    console.error("Error fetching sub_types for operating expenses:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


router.route("/getTotalPurchased").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const filteredPayable = await Payable.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
        status: "Paid",
      },
    });

    const totalPurchased = filteredPayable.reduce((acc, data) => {
      return acc + (data.totalPrice || 0);
    }, 0);

    res.json({ filteredPayable, totalPurchased });
  } catch (err) {
    console.error("Error fetching payables:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



module.exports = router;
