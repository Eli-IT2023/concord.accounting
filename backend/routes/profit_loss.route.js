const router = require("express").Router();
const { where, Op, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");
const Currency = require("../db/models/currency.model");
const BankTransaction = require("../db/models/bank_transaction.model");
const {
  accountlist_sub3,
  Previous_Profit_Loss,
  SalesInvoice,
} = require("../db/models/associations");
const {
  accountlist_transaction_subject,
} = require("../db/models/ModelsBySubject/associations_sub");
const TransactionSubject = require("../db/models/ModelsBySubject/accountlist_transaction_subject.model");
const IssuedCheck = require("../db/models/issued_check.model");

router.route("/get").get(async (req, res) => {
  const isFetch = await Cutoff.findAll({
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json(isFetch);
});

router.route("/fetchAccountListUSD").get(async (req, res) => {
  try {
    const { id, thisFromdate, thisTodate } = req.query;

    const accountUSD = await accountlist_sub3.findAll({
      include: [
        {
          model: Currency,
        },
      ],
      where: {
        currency_id: id,
        isDeleted: false,
      },
    });

    const invoices = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
        },
      ],

      where: {
        status: { [Op.in]: ["Collected", "Approved"] },
        currency_id: id,
        isDeleted: false,
        invoice_date: { [Op.between]: [thisFromdate, thisTodate] },
      },
    });

    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.total_amount,
      0
    );

    const getRate = accountUSD[0].currency.currency_rate;
    const getCurrName = accountUSD[0].currency.currency_name;

    const mergedInvoice = {
      amount: totalAmount || 0,
      account_name: "Sales Receivable",
      currency: {
        currency_name: getCurrName,
        currency_rate: getRate,
      },
      transactions: [],
    };

    const accountUSDIds = accountUSD.map((account) => account.id);

    const transacData = await BankTransaction.findAll({
      include: [
        {
          model: accountlist_sub3,
          as: "account_list_id_bank_tos",
          attributes: ["account_name"],
          include: [
            {
              model: Currency,
            },
          ],
        },
      ],
      where: {
        account_list_id_bank_from: accountUSDIds,
        module_from: { [Op.in]: ["Account-List", "Issued Check"] },
        description: "Transfer",
        isDeleted: false,
        transaction_date: { [Op.between]: [thisFromdate, thisTodate] },
      },
    });

    const transactionsByAccount = transacData.reduce((acc, transac) => {
      if (!acc[transac.account_list_id_bank_from]) {
        acc[transac.account_list_id_bank_from] = [];
      }
      acc[transac.account_list_id_bank_from].push(transac);
      return acc;
    }, {});
    const accountUSDWithTransactions = accountUSD.map((account) => ({
      ...account.toJSON(),
      transactions: (transactionsByAccount[account.id] || []).map(
        (transaction) => ({
          ...transaction.dataValues,
          exchangeGainLoss: 0,
          currency: {
            ...transaction.dataValues.currency,
            currency_rate: transaction.rate || 1,
          },
        })
      ),
    }));

    let mergedData = [mergedInvoice, ...accountUSDWithTransactions];

    res.status(200).send(mergedData);
  } catch (error) {
    console.error(error);
  }
});

router.route("/fetchPreviousCurrency").get(async (req, res) => {
  try {
    const { id, thisFromdate, thisTodate } = req.query;

    const data = await Previous_Profit_Loss.findAll({
      include: [
        {
          model: accountlist_sub3,
          attributes: ["account_name"],
        },
        {
          model: Currency,
        },
      ],
      where: {
        currency_id: id,
        createdAt: { [Op.between]: [thisFromdate, thisTodate] },
      },
    });

    res.status(200).send(data);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
