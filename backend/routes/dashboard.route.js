const router = require("express").Router();
const { where, Op, fn, col, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Payable,
  SalesInvoice,
  BulkCollectionPayment,
  Expenses,
  Cutoff,
  Customer,
  Vendors,
  Currency,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  bank_transaction,
  CashFlow,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");

router.route("/getTotalPurchased").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    const data = await Payable.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
        status: "Paid",
      },
      include: [
        {
          model: Currency,
          attributes: ["currency_rate"],
        },
      ],
    });

    const totalPurchase = data.reduce(
      (sum, purchase) =>
        sum + purchase.totalPrice * purchase.currency.currency_rate,
      0
    );

    console.log("Total Purrr", totalPurchase, data);

    return res.json({
      totalPurchased: totalPurchase || 0,
      purchaseCount: data.length || 0,
    });

    // const today = new Date().toISOString().split("T")[0];

    // const totalPurchased = await Payable.findOne({
    //   attributes: [
    //     [sequelize.fn("SUM", sequelize.col("totalPrice")), "totalPrice"],
    //     [sequelize.fn("COUNT", sequelize.col("id")), "purchaseCount"],
    //   ],
    //   where: {
    //     status: "Paid",
    //     // purchaseDate: today,
    //   },
    // });

    // return res.json({
    //   totalPurchased: totalPurchased
    //     ? totalPurchased.dataValues.totalPrice || 0
    //     : 0,
    //   purchaseCount: totalPurchased
    //     ? totalPurchased.dataValues.purchaseCount || 0
    //     : 0,
    // });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getTotalSales").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    // const today = new Date().toISOString().split("T")[0];

    // const total_amount = await SalesInvoice.findOne({
    //   attributes: [
    //     [sequelize.fn("SUM", sequelize.col("total_amount")), "total_amount"],
    //   ],
    //   where: {
    //     status: "Approved",
    //   },
    // });

    // return res.json({
    //   total_amount: total_amount
    //     ? total_amount.dataValues.total_amount || 0
    //     : 0,
    // });

    const data = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          attributes: ["currency_rate"],
        },
      ],
      where: {
        invoice_date: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
        status: {
          [Op.or]: ["Approved", "Collected"],
        },
      },
    });

    const totalSales = data.reduce(
      (sum, invoice) =>
        sum + invoice.total_amount * invoice.currency.currency_rate,
      0
    );

    return res.json({
      total_amount: totalSales || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCollectionCheck").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    // const today = new Date().toISOString().split("T")[0];

    const amount = await BulkCollectionPayment.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "amount"]],
      where: {
        status: "Approved",
        date_issued: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
      },
    });

    return res.json({
      amount: amount ? amount.dataValues.amount || 0 : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getAccountList").get(async (req, res) => {
  try {
    const data = await accountlist_sub3.findAll({
      include: [
        {
          model: accountlist_base_subject,
          where: {
            module_type: "Account-List",
          },
        },
      ],
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getBankTransaction").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    const data = await bank_transaction.findAll({
      include: [
        {
          model: accountlist_sub3,
          as: "account_list_id_bank_froms",
        },
        {
          model: accountlist_sub3,
          as: "account_list_id_bank_tos",
        },
      ],

      where: {
        transaction_date: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
      },
      order: [["transaction_date", "DESC"]],
      limit: 10,
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCashFlow").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    const data = await CashFlow.findAll({
      include: [
        {
          model: accountlist_sub3,
          as: "account_list_id_cash_froms",
        },
        {
          model: accountlist_sub3,
          as: "account_list_id_cash_tos",
        },
      ],
      where: {
        transaction_date: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
      },
      order: [["transaction_date", "DESC"]],
      limit: 10,
    });

    return res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getPayables").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    const data = await Payable.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
        status: "Paid",
      },
    });

    const payablesByDate = data.reduce((acc, payable) => {
      const date = payable.purchaseDate;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += payable.totalPrice * payable.rate;
      return acc;
    }, {});

    return res.json(payablesByDate);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getSalesInvoice").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    const data = await SalesInvoice.findAll({
      where: {
        invoice_date: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
        status: {
          [Op.or]: ["Approved", "Collected"],
        },
      },
    });

    const salesByDate = data.reduce((acc, salesInvoice) => {
      const date = salesInvoice.invoice_date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += salesInvoice.total_amount * salesInvoice.rate;
      return acc;
    }, {});

    return res.json(salesByDate);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getTotalExpenses").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;

    const data = await Expenses.findAll({
      include: [
        {
          model: Currency,
          attributes: ["currency_rate"],
        },
      ],
      where: {
        expenses_date: {
          [Op.between]: [cutOffFrom, cutOffTo],
        },
        status: "Approved",
      },
    });

    const totalExpenses = data.reduce(
      (sum, expense) =>
        sum + expense.totalAmount * expense.currency.currency_rate,
      0
    );

    return res.json({ totalExpenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching total expenses" });
  }
});

router.route("/getCutoffs").get(async (req, res) => {
  try {
    const data = await Cutoff.findAll({
      order: [["to", "DESC"]],
      where: {
        isDeleted: false,
      },
    });

    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomerGraph").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;
    const transactions = await SalesInvoice.findAll({
      attributes: [
        "customer_id",
        [
          Sequelize.fn("COUNT", Sequelize.col("customer_id")),
          "total_transactions",
        ],
      ],
      where: {
        status: {
          [Op.or]: ["Collected"],
        },
        invoice_date: {
          [Op.lt]: cutOffTo,
        },
      },
      group: ["customer_id"],
      order: [[Sequelize.literal("total_transactions"), "DESC"]],
      limit: 5,
      raw: true,
    });

    const customerIds = transactions.map((t) => t.customer_id);

    const customers = await Customer.findAll({
      attributes: ["customer_id", "first_name", "last_name"],
      where: {
        customer_id: customerIds,
        isDeleted: false,
      },
      raw: true,
    });

    const result = transactions.map((transaction) => {
      const customer = customers.find(
        (c) => c.customer_id === transaction.customer_id
      );
      return {
        ...transaction,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
      };
    });

    console.log(result, "Customeer GrAPH");

    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});
router.route("/getVendorGraph").get(async (req, res) => {
  try {
    const { cutOffFrom, cutOffTo } = req.query;
    const transactions = await Payable.findAll({
      attributes: [
        "vendor_id",
        [
          Sequelize.fn("COUNT", Sequelize.col("vendor_id")),
          "total_transactions",
        ],
      ],
      where: {
        status: {
          [Op.or]: ["Paid"],
        },
        purchaseDate: {
          [Op.lt]: cutOffTo,
        },
      },
      group: ["vendor_id"],
      order: [[Sequelize.literal("total_transactions"), "DESC"]],
      limit: 5,
      raw: true,
    });

    const vendorIds = transactions.map((t) => t.vendor_id);

    const vendors = await Vendors.findAll({
      attributes: ["id", "company_name"],
      where: {
        id: vendorIds,
      },
      raw: true,
    });

    const result = transactions.map((transaction) => {
      const vendor = vendors.find((c) => c.id === transaction.vendor_id);
      return {
        ...transaction,
        vendor_name: vendor ? `${vendor.company_name}` : "Unknown",
      };
    });

    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
