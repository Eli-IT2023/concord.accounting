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
  SalesInvoiceInventory,
  Currency,
  OtherIncome,
  Inventory_Journal,
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
      netRevenue: totalRevenue - totalSalesDiscount,
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
    });

    const purchasesData = await Payable.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [cutoff_fromdate, cutoff_todate],
        },
        status: {
          [Op.notIn]: ["Pending", "Rejected"],
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
      order: [["date_in", "DESC"]],
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
              where: {
                expenses_type_one: {
                  [Op.or]: [
                    "Selling Expenses",
                    "Administrative Expenses",
                    "Financial Expenses",
                    "Other Operating Expenses",
                    "Depreciation Expenses",
                  ],
                },
              },
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

// Endpoint for income statement subject 1 "revenue" section
router.route("/revenue").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validated query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    const totalWithItemDiscount = "total_amount + item_discount";
    const transactionDiscountValue = `((${totalWithItemDiscount}) * (transaction_discount / 100))`; // convert percentage to decimal

    // Get the sales revenue and sales discount total
    const sales = await SalesInvoice.findOne({
      attributes: [
        [
          sequelize.literal(
            `SUM(
              COALESCE(
                CASE
                  WHEN discount_type = "fixed"
                  THEN (transaction_discount + ${totalWithItemDiscount}) *  currency_rate -- For fixed discount_type
                  ELSE (${transactionDiscountValue} + ${totalWithItemDiscount}) * currency_rate -- For percentage discount_type
                END,
              0)
            )`
          ),
          "salesRevenue",
        ],
        [
          sequelize.literal(
            `SUM(
              COALESCE(
                CASE
                  WHEN discount_type = "fixed"
                  THEN (transaction_discount + item_discount) * currency_rate -- For fixed discount type
                  ELSE (${transactionDiscountValue} + item_discount) * currency_rate -- For percentage discount_type
                END,
              0)
            )`
          ),
          "salesDiscount",
        ],
      ],
      include: [
        {
          model: Currency,
          required: true,
          attributes: [],
        },
      ],
      where: {
        status: {
          [Op.notIn]: ["Pending", "Rejected"],
        },
        invoice_date: {
          [Op.between]: [startDate, endDate],
        },
        isDeleted: false,
      },
      subQuery: false,
      raw: true,
    });

    // Get the other income total amount
    const otherIncome = await OtherIncome.findOne({
      attributes: [[sequelize.literal(`SUM(totalAmount)`), "totalAmount"]],
      where: {
        status: "Approved",
        income_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
    });

    // Revenue breakdown for income statement
    const revenue = {
      salesRevenue: sales.salesRevenue,
      salesDiscount: sales.salesDiscount,
      otherIncome: otherIncome.totalAmount,
    };

    // Get the total revenue
    const totalRevenue = Object.entries(revenue).reduce(
      (acc, [_, amount], index) => (index === 0 ? acc + amount : acc - amount),
      0
    );

    res.status(200).json({
      ...revenue,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for income statement subject 1 "cost of goods sold" section
router.route("/cost-of-goods-sold").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validated query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    const escape = (value) => `${sequelize.escape(value)}`;

    // For inventory date conditions
    const dateConditions = {
      between: `BETWEEN ${escape(startDate)} AND ${escape(endDate)}`,
      lessThanStart: `< ${escape(startDate)}`,
      lessThanEqualEnd: `<= ${escape(endDate)}`,
    };

    // prettier-ignore
    // Helper: Sum the amount based on given date condition and entry type
    const sumAmount = (dateCondition, entryType) => `
      SUM(
        COALESCE(
          CASE 
            WHEN date_in ${dateCondition} AND type = ${escape(entryType)}
            THEN unit_price * quantity
            ELSE 0
          END,
        0)
      )
    `

    // Get the opening inventory and close inventory total amount
    const inventory = await Inventory_Journal.findOne({
      attributes: [
        [
          sequelize.literal(
            `${sumAmount(dateConditions.lessThanStart, "in")} 
              - ${sumAmount(dateConditions.lessThanStart, "out")}`
          ),
          "openingInventory",
        ],
        [
          sequelize.literal(
            `${sumAmount(dateConditions.lessThanEqualEnd, "in")} 
              - ${sumAmount(dateConditions.lessThanEqualEnd, "out")}`
          ),
          "closeInventory",
        ],
      ],
      where: {
        isDeleted: false,
      },
      raw: true,
    });

    // Get the purchases total amount
    const payable = await Payable.findOne({
      attributes: [
        [sequelize.literal(`SUM(totalPrice * currency_rate)`), "total"],
      ],
      include: [
        {
          model: Currency,
          required: true,
          attributes: [],
        },
      ],
      where: {
        status: {
          [Op.notIn]: ["Pending", "Rejected"],
        },
        purchaseDate: {
          [Op.between]: [startDate, endDate],
        },
        isDeleted: false,
      },
      raw: true,
    });

    // Get the total adjustments made on inventory counting
    const adjustments = await Inventory_Journal.findOne({
      attributes: [
        [
          sequelize.literal(`${sumAmount(dateConditions.between, "in")}`),
          "totalIn",
        ],
        [
          sequelize.literal(`${sumAmount(dateConditions.between, "out")}`),
          "totalOut",
        ],
      ],
      where: {
        module_from: "Inventory Counting",
      },
      raw: true,
    });

    const totalAdjustments = adjustments.totalOut - adjustments.totalIn;

    // prettier-ignore
    // Cost of goods sold breakdown for income statement
    const cogs = {
      openingInventory: inventory.openingInventory,
      purchases: payable.total,
      adjustments: totalAdjustments,
      closeInventory: inventory.closeInventory,
      costOfGoodsSold: (inventory.openingInventory + payable.total) - (totalAdjustments + inventory.closeInventory)
    };

    res.status(200).json({ ...cogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for income statement subject 1 "expense type" section
router.route("/expense-type").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validated query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // Fetch all expense types with their sub-types and computed amounts for the income statement
    const expenseType = await Expenses1.findAll({
      attributes: ["expenses_one_id", "expenses_type_one"],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [
            "id",
            "sub_type",
            [
              sequelize.literal(`SUM(totalAmount * currency_rate)`),
              "expenseSubTypeAmount",
            ],
          ],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              where: {
                expenses_date: {
                  [Op.between]: [startDate, endDate],
                },
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      group: ["expenses2s.id"],
      where: {
        isForIncomeStatement: true,
      },
    });

    // Get the total amount of all expense sub type for "Total Operating Expenses"
    const expenseSubType = await Expenses1.findOne({
      attributes: [
        [sequelize.literal(`SUM(totalAmount * currency_rate)`), "total"],
      ],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              where: {
                expenses_date: {
                  [Op.between]: [startDate, endDate],
                },
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      where: {
        isForIncomeStatement: true,
      },
      subQuery: false,
      raw: true,
    });

    res.status(200).json({
      expenseType,
      totalOperatingExpense: expenseSubType.total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
