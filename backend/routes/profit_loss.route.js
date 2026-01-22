const router = require("express").Router();
const { where, Op, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");
// const Currency = require("../db/models/currency.model");
const BankTransaction = require("../db/models/bank_transaction.model");
const {
  accountlist_sub3,
  Previous_Profit_Loss,
  SalesInvoice,
  P_L_v2_report,
  SalesJournal,
  Currency,
} = require("../db/models/associations");
const {
  accountlist_transaction_subject,
} = require("../db/models/ModelsBySubject/associations_sub");
// const TransactionSubject = require("../db/models/ModelsBySubject/accountlist_transaction_subject.model");
// const IssuedCheck = require("../db/models/issued_check.model");

const { getReceivableData } = require("../services/profit_loss/receivables");
const { getPayableData } = require("../services/profit_loss/payables");
const { getAccountsData } = require("../services/profit_loss/funds");

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
        // createdAt: {
        //   [Op.between]: [thisFromdate, thisTodate],
        // },
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

    const getRate = accountUSD[0]?.currency?.currency_rate || 0;
    const getCurrName = accountUSD[0]?.currency?.currency_name;

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

// router.route("/getJournalv2Data").get(async (req, res) => {
//   try {
//     const { date_from, date_to } = req.query;

//     const journalData = await P_L_v2_report.findAll({
//       order: [["date", "DESC"]],
//       where: {
//         // received_rate: { [Op.ne]: 0 }, // commented kasi skip na sa create journal yung mga 0 rate (transfer other currency)
//         date: {
//           [Op.between]: [date_from, date_to],
//         },
//       },
//     });

//     if (journalData) {
//       return res.status(200).json(journalData);
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// ---------------------------------------------v2 pl journal routes-------------------------------------------------- //

router.route("/getJournalv2Data-Exchange").get(async (req, res) => {
  try {
    const { date_from, date_to, page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // console.log(`date_fromgetJournalv2Data`, date_from);
    // console.log(`date_togetJournalv2Data`, date_to);

    const { count, rows: journalData } = await P_L_v2_report.findAndCountAll({
      order: [["date", "DESC"]],
      where: {
        date: {
          [Op.between]: [date_from, date_to],
        },
      },
      limit: parseInt(limit),
      offset: offset,
    });

    if (journalData) {
      return res.status(200).json({
        data: journalData,
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//comment kasi d na need sa jsx
// separate route to get total without pagination
// router.route("/getJournalv2DataTotals").get(async (req, res) => {
//   try {
//     const { date_from, date_to } = req.query;

//     // Get all data for total calculation (without pagination)
//     const allJournalData = await P_L_v2_report.findAll({
//       where: {
//         date: {
//           [Op.between]: [date_from, date_to],
//         },
//       },
//     });

//     if (allJournalData) {
//       return res.status(200).json(allJournalData);
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/getTotalGainLossInfos-exchange").get(async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // console.log(`date_fromgetTotalGainLossInfos`, date_from);
    // console.log(`date_togetTotalGainLossInfos`, date_to);

    const previous_cutoff_gain_loss = await P_L_v2_report.findOne({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("profit_loss_amount")),
          "total_gain_loss",
        ],
      ],
      where: {
        date: {
          [Op.lt]: date_from,
        },
      },
      raw: true,
    });

    const get_percentage_previous = await P_L_v2_report.findAll({
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.literal("amount_from * received_rate")),
          "totalCapital",
        ],
      ],
      where: {
        date: {
          [Op.lt]: date_from,
        },
      },
      raw: true,
    });

    const previous_cutoff_percentage =
      get_percentage_previous[0]?.totalCapital || 0;

    const current_cutoff_gain_loss = await P_L_v2_report.findOne({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("profit_loss_amount")),
          "total_gain_loss",
        ],
      ],
      where: {
        date: {
          [Op.between]: [date_from, date_to],
        },
      },
      raw: true,
    });

    const get_percentage_current = await P_L_v2_report.findAll({
      attributes: [
        [
          Sequelize.fn("SUM", Sequelize.literal("amount_from * received_rate")),
          "totalCapital",
        ],
      ],
      where: {
        date: {
          [Op.between]: [date_from, date_to],
        },
      },
      raw: true,
    });

    // console.log(`current_cutoff_percentage`, get_percentage_current);

    const current_cutoff_percentage =
      get_percentage_current[0]?.totalCapital || 0;

    // console.log(
    //   "current_cutoff_percentage:",
    //   100 *
    //     (current_cutoff_gain_loss.total_gain_loss / current_cutoff_percentage)
    // );

    return res.status(200).json({
      previous_cutoff_gain_loss: previous_cutoff_gain_loss.total_gain_loss,
      previous_cutoff_percentage:
        100 *
        (previous_cutoff_gain_loss.total_gain_loss /
          previous_cutoff_percentage),
      current_cutoff_gain_loss: current_cutoff_gain_loss.total_gain_loss,
      current_cutoff_percentage:
        100 *
        (current_cutoff_gain_loss.total_gain_loss / current_cutoff_percentage),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.route("/forecast/getData").get(async (req, res) => {
//   try {
//     const { date_from, date_to } = req.query;

//     // Get grouped data by currency_rate and currency_name
//     const ReceivablesDebit = await SalesJournal.findAll({
//       attributes: [
//         "currency_rate",
//         "currency_name",
//         [sequelize.fn("SUM", sequelize.col("total_amount")), "total_sum"],
//       ],
//       where: {
//         date: {
//           [Op.lte]: date_to,
//         },
//         payment_type: "Debit",
//       },
//       group: ["currency_rate", "currency_name"],
//       order: [["currency_rate", "DESC"]],
//       raw: true,
//     });

//     const getCurrencySystemRate = await Currency.findAll({
//       attributes: ["currency_name", "currency_rate"],
//       where: {
//         currency_name: {
//           [Op.in]: ReceivablesDebit.map((item) => item.currency_name),
//         },
//       },
//       raw: true,
//     });

//     console.log(`getCurrencySystemRateforecast/getData`, getCurrencySystemRate);

//     if (ReceivablesDebit) {
//       console.log(`ReceivablesDebit`, ReceivablesDebit);
//       return res.status(200).json({ data: ReceivablesDebit });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.route("/forecast/getData").get(async (req, res) => {
//   try {
//     const { date_from, date_to } = req.query;

//     // Get grouped data by currency_rate and currency_name
//     const ReceivablesDebit = await SalesJournal.findAll({
//       attributes: [
//         "currency_rate",
//         "currency_name",
//         [sequelize.fn("SUM", sequelize.col("total_amount")), "total_sum"],
//       ],
//       where: {
//         date: {
//           [Op.lte]: date_to,
//         },
//         payment_type: "Debit",
//         currency_name: { [Op.ne]: "PHP" },
//       },
//       group: ["currency_rate", "currency_name"],
//       order: [["currency_rate", "DESC"]],
//       raw: true,
//     });

//     const getCurrencySystemRate = await Currency.findAll({
//       attributes: ["currency_name", "currency_rate"],
//       where: {
//         currency_name: {
//           [Op.in]: ReceivablesDebit.map((item) => item.currency_name),
//         },
//       },
//       raw: true,
//     });

//     // console.log(`getCurrencySystemRateforecast/getData`, getCurrencySystemRate);
//     // console.log(`ReceivablesDebit`, ReceivablesDebit);

//     // Create a map for quick lookup of system rates
//     const systemRateMap = getCurrencySystemRate.reduce((map, item) => {
//       map[item.currency_name] = item.currency_rate;
//       return map;
//     }, {});

//     // Merge the data
//     const mergedData = ReceivablesDebit.map((item) => {
//       const systemRate = systemRateMap[item.currency_name] || 1;
//       // const convertedAmount = parseFloat(item.total_sum) * systemRate;

//       return {
//         currency_name: item.currency_name,
//         transaction_rate: parseFloat(item.currency_rate),
//         system_rate: systemRate,
//         original_amount: parseFloat(item.total_sum),
//         // converted_amount: convertedAmount,
//       };
//     });

//     return res.status(200).json({ data: mergedData });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/forecast/getData").get(async (req, res) => {
  try {
    const { date_to } = req.query;

    const p_l_array = [];

    const receivabledata = await getReceivableData(date_to);
    const payabledata = await getPayableData(date_to);

    // Push receivables as objects
    if (receivabledata.length > 0) {
      receivabledata.forEach((item) => {
        p_l_array.push({
          ...item,
        });
      });
    }

    // Push payables as objects
    if (payabledata.length > 0) {
      payabledata.forEach((item) => {
        p_l_array.push({
          ...item,
        });
      });
    }

    console.log("p_l_array forecast/getData", p_l_array);
    return res.status(200).json({ data: p_l_array });
  } catch (error) {
    console.error("forecast/getData error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
