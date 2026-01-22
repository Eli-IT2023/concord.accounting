const express = require("express");
const router = express.Router();
const Currency = require("../db/models/currency.model");
const Activity_Log = require("../db/models/activity_log.model");
const { Op, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  accountlist_sub3,
  Previous_Profit_Loss,
  SalesInvoice,
  Cutoff,
  Expenses,
  Payable,
} = require("../db/models/associations");
const BankTransaction = require("../db/models/bank_transaction.model");

// Create a new currency
router.post("/addCurrency", async (req, res) => {
  try {
    const { basedCurrency, currencyName, currencyRate, userLoggedID } =
      req.body;
    const trimBasedCurrency = basedCurrency.trim();
    const trimCurrencyName = currencyName.trim();

    const isExist = await Currency.findOne({
      where: {
        based_currency: trimBasedCurrency,
        currency_name: trimCurrencyName,
      },
    });
    if (isExist) {
      res.status(201).json();
    } else {
      const currency = await Currency.create({
        based_currency: trimBasedCurrency,
        currency_name: trimCurrencyName,
        currency_rate: currencyRate,
        status: "Active",
      });

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Currency: User created a currency named ${trimCurrencyName} with a rate of ${currencyRate}`,
      });
      if (currency) {
        res.status(200).json(currency);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update currency
router.post("/updateCurrency", async (req, res) => {
  try {
    const {
      basedCurrency,
      currencyName,
      currencyRate,
      status,
      selectedID,
      userLoggedID,
    } = req.body;
    const trimBasedCurrency = basedCurrency.trim();
    const trimCurrencyName = currencyName.trim();

    const isExist = await Currency.findOne({
      where: {
        based_currency: trimBasedCurrency,
        currency_name: trimCurrencyName,
        status: status,
        id: {
          [Op.ne]: selectedID, // Exclude the current record
        },
      },
    });

    const getData = await Currency.findOne({
      where: {
        id: selectedID,
      },
    });

    if (isExist) {
      // If a duplicate record is found, respond with 201 (Created)
      res
        .status(201)
        .json({ message: "Currency with the same details already exists." });
    } else {
      // Perform the update

      // To insert Previous
      if (getData.currency_rate !== currencyRate) {
        const currentCutoff = await Cutoff.findOne({
          order: [["createdAt", "DESC"]],
        });

        const thisFromdate = currentCutoff.from;
        const thisTodate = currentCutoff.to;

        const accountUSD = await accountlist_sub3.findAll({
          include: [
            {
              model: Currency,
              where: {
                id: selectedID,
              },
            },
          ],
        });

        const invoices = await SalesInvoice.findAll({
          include: [
            {
              model: Currency,
            },
          ],

          where: {
            status: { [Op.in]: ["Collected", "Approved"] },
            currency_id: selectedID,
            invoice_date: { [Op.between]: [thisFromdate, thisTodate] },
          },
        });

        const totalAmount = invoices.reduce(
          (sum, invoice) => sum + invoice.total_amount,
          0
        );

        const getRate = accountUSD[0].currency.currency_rate;
        const getCurrName = accountUSD[0].currency.currency_name;
        const getCurrID = accountUSD[0].currency.id;

        const mergedInvoice = {
          amount: totalAmount || 0,
          account_name: "Sales Receivable",
          currency: {
            id: getCurrID,
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
            },
          ],
          where: {
            account_list_id_bank_from: accountUSDIds,
            module_from: "Account-List",
            description: "Transfer",
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

        if (mergedInvoice) {
          const systemValue = mergedInvoice.amount * getRate;

          const actualTransactionAmount = mergedInvoice.amount * currencyRate;

          const exchangeGainLoss = actualTransactionAmount - systemValue;

          await Previous_Profit_Loss.create({
            currency_id: getCurrID,
            amount: mergedInvoice.amount,
            system_rate: getRate,
            system_value: mergedInvoice.amount * getRate,
            actual_rate: currencyRate,
            actual_amount: mergedInvoice.amount * currencyRate,
            exchange_gain_loss: exchangeGainLoss,
          });
        }

        if (accountUSDWithTransactions) {
          for (let acc of accountUSDWithTransactions) {
            const systemValue = acc.amount * acc.currency.currency_rate;

            const actualTransactionAmount = acc.amount * currencyRate;

            const exchangeGainLoss = actualTransactionAmount - systemValue;

            await Previous_Profit_Loss.create({
              account_list_id: acc.id,
              currency_id: acc.currency.id,
              amount: acc.amount,
              system_rate: acc.currency.currency_rate,
              system_value: acc.currency.currency_rate * acc.amount,
              actual_rate: currencyRate,
              actual_amount: acc.amount * currencyRate,
              exchange_gain_loss: exchangeGainLoss,
            });
          }
        }
      }

      const updatedCurrency = await Currency.update(
        {
          based_currency: trimBasedCurrency,
          currency_name: trimCurrencyName,
          currency_rate: currencyRate,
          status: status,
        },
        {
          where: {
            id: selectedID,
          },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Currency: Update currency information: \n
        '${getData.currency_name}' to '${trimCurrencyName}',
       '${getData.currency_rate}' to '${currencyRate}',
       '${getData.status}' to '${status}',
       `,
      });

      if (updatedCurrency) {
        // If update is successful, respond with 200 (OK) and the updated currency object
        res.status(200).json(updatedCurrency);
      } else {
        // Handle the case where no currency was updated
        res.status(404).json({ message: "Currency not found." });
      }
    }
  } catch (error) {
    // Handle server errors
    console.error("Error updating currency:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Create a fetch currency
// used module sales invoice
// used module vendors
//used module collection.jsx
router.get("/fetchCurrency", async (req, res) => {
  try {
    const currency = await Currency.findAll();
    res.json(currency);
    // console.log(currency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/fetchCurrencyForFilter", async (req, res) => {
  try {
    const { searchText, filterColumn, statusFilter } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let currencyWhereClause = {};

    // Currency table column
    const currencyTableColumn = [
      "based_currency",
      "currency_name",
      "currency_rate",
    ];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Filter for based currency
        case "based_currency":
          currencyWhereClause = {
            based_currency: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for currency name
        case "currency_name":
          currencyWhereClause = {
            currency_name: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for currency rate
        case "currency_rate":
          if (searchText != "" && searchText != null) {
            currencyWhereClause = {
              currency_rate: sequelize.where(
                literal(`CAST (currency_rate AS CHAR)`),
                {
                  [Op.like]: `%${searchText}%`,
                }
              ),
            };
          }
          break;
        // Filter for all
        default:
          currencyWhereClause = {
            [Op.or]: currencyTableColumn.map((col) => {
              if (col === "currency_rate") {
                return {
                  [col]: sequelize.where(
                    literal(`CAST (currency_rate AS CHAR)`),
                    {
                      [Op.like]: `%${searchText}%`,
                    }
                  ),
                };
              } else {
                return {
                  [col]: {
                    [Op.like]: `%${searchText}%`,
                  },
                };
              }
            }),
          };
          break;
      }
    }

    if (statusFilter && statusFilter !== "All") {
      currencyWhereClause["status"] =
        statusFilter === "Active" ? "Active" : "Inactive";
    }

    const { count, rows: currency } = await Currency.findAndCountAll({
      where: currencyWhereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: currency,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk warehouse status update
router.route("/bulkCurrencyStatusUpdate").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { selectedCurrencies, changeToStatus } = req.body;

    const bulkStatusUpdate = await Currency.update(
      {
        status: changeToStatus,
      },
      {
        where: {
          id: {
            [Op.in]: selectedCurrencies,
          },
        },
        transaction,
      }
    );

    if (bulkStatusUpdate) {
      await transaction.commit();
      res.status(200).json({ message: "Status Updated Successfully" });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error);
  }
});

// Currency fetching for Local/Overseas Expense module
router.route("/expense-currency").get(async (req, res) => {
  try {
    const { foreign } = req.query;
    const expenseCurrency = await Currency.findAll({
      include: [
        {
          model: Expenses,
          required: true,
          where: {
            status: "Approved",
            isAdded: false,
            foreign,
            isDeleted: false,
          },
        },
      ],
      where: {
        isArchive: false,
        status: "Active",
      },
    });

    res.status(200).json(expenseCurrency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Currency fetching for Local/Overseas Purchase module
router.route("/payable-currency").get(async (req, res) => {
  try {
    const { foreign, selectedVendorId } = req.query;
    const payableCurrency = await Currency.findAll({
      include: [
        {
          model: Payable,
          required: true,
          where: {
            vendor_id: selectedVendorId,
            domestic_type: foreign,
            status: "Approved",
            isAdded: false,
            isDeleted: false,
          },
        },
      ],
      where: {
        isArchive: false,
        status: "Active",
      },
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json(payableCurrency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Currency fetching for Local/Overseas Collection module
router.route("/sales-currency").get(async (req, res) => {
  try {
    const { destination } = req.query;
    const salesCurrency = await Currency.findAll({
      include: [
        {
          model: SalesInvoice,
          required: true,
          where: {
            destination,
            status: "Approved",
            payAdded: false,
            isDeleted: false,
          },
        },
      ],
      where: {
        isArchive: false,
        status: "Active",
      },
    });

    res.status(200).json(salesCurrency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
