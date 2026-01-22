const router = require("express").Router();
const { where, Op, CIDR, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Cutoff,
  BulkCollectionPayment,
  // accountlist_sub3,
  OtherIncome,
  Expenses,
  BulkCollection,
  Currency,
} = require("../db/models/associations");

const {
  accountlist_transaction_subject,
  accountlist_base_subject,
  issued_check,
  accountlist_sub3,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
const CheckJournal = require("../db/models/check_journal.model");
const { trialBalance } = require("../services");
const tbService = trialBalance.trialBalanceService; // Alias for trial balance service
const tbHelper = trialBalance.trialBalanceHelpers; // Alias for trial balance helper

router.route("/getCutoffs").get(async (req, res) => {
  try {
    const data = await Cutoff.findAll({
      where: {
        isDeleted: false,
      },
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getCurrentAssetsDataReport").get(async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const allCutoff = await Cutoff.findAll({
      order: [["from", "DESC"]],
    });

    // Get the previous cutoff
    // const previousCutoff = await Cutoff.findOne({
    //   where: {
    //     from: { [Op.lt]: allCutoff.from },
    //   },
    //   order: [["from", "DESC"]],
    // });

    const fromDate = dateFrom || allCutoff.from;
    const toDate = dateTo || allCutoff.to;

    // Get the last month date range
    // const lastMonthFromDate = previousCutoff ? previousCutoff.from : null;
    // const lastMonthToDate = previousCutoff ? previousCutoff.to : null;

    const mappedCutOffDate = allCutoff?.map((item) => {
      return item.to;
    }); // get all end date
    const sortedDate = mappedCutOffDate.sort(
      (a, b) => new Date(a) - new Date(b)
    );
    let index = sortedDate.indexOf(dateTo); // current cut off end date
    let prevDate = sortedDate[parseInt(index) - 1]; // get the previous cut off end date
    const filteredCutOffDate = allCutoff?.find((item) => {
      return item.to == prevDate;
    }); // returns previous cut off date in object form

    const lastMonthFromDate = filteredCutOffDate?.from;
    const lastMonthToDate = filteredCutOffDate?.to;

    //************************* Cash payment method section *********************************\\
    // Calculate the sums for Debit and Credit types for past cutoff (CASH)
    const pastBaseSubjects = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        subject_type: "Cash",
        module_type: {
          [Op.in]: ["Account-List", "Owner's Equity Account"],
        },
      },
    });

    let pastDebitCash = 0;
    let pastCreditCash = 0;

    pastBaseSubjects.forEach((pastbaseSubject) => {
      const sub3s = pastbaseSubject.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            pastDebitCash +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            pastCreditCash +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const beginningTotalCash = pastDebitCash - pastCreditCash;

    // Calculate the sums for Debit and Credit types for current cutoff (CASH)
    const currentBaseSubjects = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [fromDate, toDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        subject_type: "Cash",
        module_type: {
          [Op.in]: ["Account-List", "Owner's Equity Account"],
        },
      },
    });

    let debitCash = 0;
    let creditCash = 0;

    currentBaseSubjects.forEach((baseSubject) => {
      const sub3s = baseSubject.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            debitCash += (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            creditCash += (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const endOfTotalCash = debitCash - creditCash;
    //************************* Bank payment method section *********************************\\
    // Calculate the sums for Debit and Credit types for past cutoff (BANK)
    const pastBaseSubjectsBank = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        subject_type: "Bank",
        module_type: "Account-List",
      },
    });

    let pastDebitBank = 0;
    let pastCreditBank = 0;

    pastBaseSubjectsBank.forEach((pastbankSubject) => {
      const sub3s = pastbankSubject.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            pastDebitBank +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            pastCreditBank +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const beginningTotalBank = pastDebitBank - pastCreditBank;

    const currentBaseSubjectsBank = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [fromDate, toDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        subject_type: "Bank",
        module_type: "Account-List",
      },
    });

    let debitBank = 0;
    let creditBank = 0;

    currentBaseSubjectsBank.forEach((pastbankSubject) => {
      const sub3s = pastbankSubject.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            debitBank += (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            creditBank += (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const endOfTotalBank = debitBank - creditBank;

    //************************* Collection check section ************************************\\
    // const pastCollection = await BulkCollectionPayment.sum("amount", {
    //   where: {
    //     date_issued: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
    //     status: "Approved",
    //   },
    // });

    // const currentCollection = await BulkCollectionPayment.sum("amount", {
    //   where: {
    //     date_issued: { [Op.between]: [fromDate, toDate] },
    //     status: "Approved",
    //   },
    // });

    const dataPastCollection = await BulkCollectionPayment.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        date_issued: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
        status: "Approved",
      },
    });

    const pastCollection = dataPastCollection.reduce((total, value) => {
      return (
        total + value.amount * value.account_list_sub3.currency.currency_rate
      );
    }, 0);

    const dataCurrentCollection = await BulkCollectionPayment.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        date_issued: { [Op.between]: [fromDate, toDate] },
        status: "Approved",
      },
    });

    const currentCollection = dataCurrentCollection.reduce((total, value) => {
      return (
        total + value.amount * value.account_list_sub3.currency.currency_rate
      );
    }, 0);

    //************************* Asset account section ************************************\\
    const pastBaseAsset = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        module_type: "Asset Account",
      },
    });

    let pastAssetAmountDebit = 0;
    let pastAssetAmountCredit = 0;

    pastBaseAsset.forEach((pastAsset) => {
      const sub3s = pastAsset.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            pastAssetAmountDebit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            pastAssetAmountCredit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const beginningAssetAmount = pastAssetAmountDebit - pastAssetAmountCredit;

    const currentBaseAsset = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [fromDate, toDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        module_type: "Asset Account",
      },
    });

    let currentAssetAmountDebit = 0;
    let currentAssetAmountCredit = 0;

    currentBaseAsset.forEach((currentAsset) => {
      const sub3s = currentAsset.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            currentAssetAmountDebit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            currentAssetAmountCredit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const endTotalAssetAmount =
      currentAssetAmountDebit - currentAssetAmountCredit;

    return res.json({
      beginningTotalCash,
      debitCash,
      creditCash,
      endOfTotalCash,
      beginningTotalBank,
      debitBank,
      creditBank,
      endOfTotalBank,
      pastCollection,
      currentCollection,
      beginningAssetAmount,
      currentAssetAmountDebit,
      currentAssetAmountCredit,
      endTotalAssetAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getCurrentLiabilitiesDataReport").get(async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const allCutoff = await Cutoff.findAll({
      order: [["from", "DESC"]],
    });

    // Get the previous cutoff
    // const previousCutoff = await Cutoff.findOne({
    //   where: {
    //     from: { [Op.lt]: allCutoff.from },
    //   },
    //   order: [["from", "DESC"]],
    // });

    const fromDate = dateFrom || allCutoff.from;
    const toDate = dateTo || allCutoff.to;

    // Get the last month date range
    // const lastMonthFromDate = previousCutoff ? previousCutoff.from : null;
    // const lastMonthToDate = previousCutoff ? previousCutoff.to : null;

    const mappedCutOffDate = allCutoff?.map((item) => {
      return item.to;
    }); // get all end date
    const sortedDate = mappedCutOffDate.sort(
      (a, b) => new Date(a) - new Date(b)
    );
    let index = sortedDate.indexOf(dateTo); // current cut off end date
    let prevDate = sortedDate[parseInt(index) - 1]; // get the previous cut off end date
    const filteredCutOffDate = allCutoff?.find((item) => {
      return item.to == prevDate;
    }); // returns previous cut off date in object form

    const lastMonthFromDate = filteredCutOffDate?.from;
    const lastMonthToDate = filteredCutOffDate?.to;

    //************************** Posted payable checks *****************************\\
    // const pastAmountIssuedCheck =
    //   (await issued_check.sum("amount", {
    //     where: {
    //       transaction_date: {
    //         [Op.between]: [lastMonthFromDate, lastMonthToDate],
    //       },
    //       status: "Pending",
    //     },
    //   })) || 0;

    // const currentAmountIssuedCheck =
    //   (await issued_check.sum("amount", {
    //     where: {
    //       transaction_date: {
    //         [Op.between]: [fromDate, toDate],
    //       },
    //       status: "Pending",
    //     },
    //   })) || 0;

    const dataPastAmountIssuedCheck = await issued_check.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          as: "account_list_id_issued_froms",
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        transaction_date: {
          [Op.between]: [lastMonthFromDate, lastMonthToDate],
        },
        status: "Pending",
      },
    });

    const pastAmountIssuedCheck = dataPastAmountIssuedCheck.reduce(
      (total, value) => {
        return (
          total +
          value.amount *
            value.account_list_id_issued_froms.currency.currency_rate
        );
      },
      0
    );

    const dataCurrentAmountIssuedCheck = await issued_check.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          as: "account_list_id_issued_froms",
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        transaction_date: {
          [Op.between]: [fromDate, toDate],
        },
        status: "Pending",
      },
    });

    const currentAmountIssuedCheck = dataCurrentAmountIssuedCheck.reduce(
      (total, value) => {
        return (
          total +
          value.amount *
            value.account_list_id_issued_froms.currency.currency_rate
        );
      },
      0
    );

    //************************** Other current liabilities *****************************\\
    const pastBaseLiabilities = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        module_type: "Liabilities Account",
      },
    });

    let pastLiabilitiesAmountDebit = 0;
    let pastLiabilitiesAmountCredit = 0;

    pastBaseLiabilities.forEach((pastLiability) => {
      const sub3s = pastLiability.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            pastLiabilitiesAmountDebit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            pastLiabilitiesAmountCredit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const beginningLiabilitiesAmount =
      pastLiabilitiesAmountDebit - pastLiabilitiesAmountCredit;

    const currentBaseLiabilities = await accountlist_base_subject.findAll({
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_transaction_subject,
              required: true,
              as: "transacteds",
              where: {
                date: { [Op.between]: [fromDate, toDate] },
              },
            },
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        module_type: "Liabilities Account",
      },
    });

    let currentLiabilitiesAmountDebit = 0;
    let currentLiabilitiesAmountCredit = 0;

    currentBaseLiabilities.forEach((currentLiability) => {
      const sub3s = currentLiability.account_list_sub3s || [];
      sub3s.forEach((sub3) => {
        const transactions = sub3.transacteds || [];
        const currency_rate = sub3?.currency?.currency_rate;
        transactions.forEach((transaction) => {
          if (transaction.type === "Debit") {
            currentLiabilitiesAmountDebit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          } else if (transaction.type === "Credit") {
            currentLiabilitiesAmountCredit +=
              (parseFloat(transaction.amount) || 0) * currency_rate;
          }
        });
      });
    });

    const endTotalLiabilitiesAmount =
      currentLiabilitiesAmountDebit - currentLiabilitiesAmountCredit;

    return res.json({
      pastAmountIssuedCheck,
      currentAmountIssuedCheck,
      beginningLiabilitiesAmount,
      currentLiabilitiesAmountDebit,
      currentLiabilitiesAmountCredit,
      endTotalLiabilitiesAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getAdditionalItemsDataReport").get(async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const allCutoff = await Cutoff.findAll({
      order: [["from", "DESC"]],
    });

    // Get the previous cutoff
    // const previousCutoff = await Cutoff.findOne({
    //   where: {
    //     from: { [Op.lt]: allCutoff.from },
    //   },
    //   order: [["from", "DESC"]],
    // });

    const fromDate = dateFrom || allCutoff.from;
    const toDate = dateTo || allCutoff.to;

    // Get the last month date range
    // const lastMonthFromDate = previousCutoff ? previousCutoff.from : null;
    // const lastMonthToDate = previousCutoff ? previousCutoff.to : null;

    const mappedCutOffDate = allCutoff?.map((item) => {
      return item.to;
    }); // get all end date
    const sortedDate = mappedCutOffDate.sort(
      (a, b) => new Date(a) - new Date(b)
    );
    let index = sortedDate.indexOf(dateTo); // current cut off end date
    let prevDate = sortedDate[parseInt(index) - 1]; // get the previous cut off end date
    const filteredCutOffDate = allCutoff?.find((item) => {
      return item.to == prevDate;
    }); // returns previous cut off date in object form

    const lastMonthFromDate = filteredCutOffDate?.from;
    const lastMonthToDate = filteredCutOffDate?.to;

    // const capitalAmount =
    //   (await accountlist_sub3.sum("investment_amount", {
    //     where: {
    //       investment_amount: {
    //         [Op.ne]: 0,
    //       },
    //     },
    //   })) || 0;

    const dataCapitalAmount = await accountlist_sub3.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        investment_amount: {
          [Op.ne]: 0,
        },
      },
    });

    const capitalAmount = dataCapitalAmount.reduce((total, value) => {
      return total + value.investment_amount * value.currency.currency_rate;
    }, 0);

    // const pastCollected =
    //   (await BulkCollectionPayment.sum("amount", {
    //     where: {
    //       date_issued: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
    //       status: "Claimed",
    //     },
    //   })) || 0;

    // const currentCollected =
    //   (await BulkCollectionPayment.sum("amount", {
    //     where: {
    //       date_issued: { [Op.between]: [fromDate, toDate] },
    //       status: "Claimed",
    //     },
    //   })) || 0;

    // Current collected
    const dataCurrentCollected = await BulkCollectionPayment.findAll({
      include: [
        {
          model: BulkCollection,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        date_issued: { [Op.between]: [fromDate, toDate] },
        status: "Claimed",
      },
    });

    const currentCollected = dataCurrentCollected.reduce((total, value) => {
      return (
        total + value.amount * value.bulk_collection.currency.currency_rate
      );
    }, 0);

    // Past collected
    const dataPastCollected = await BulkCollectionPayment.findAll({
      include: [
        {
          model: BulkCollection,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
      where: {
        date_issued: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
        status: "Claimed",
      },
    });

    const pastCollected = dataPastCollected.reduce((total, value) => {
      return (
        total + value.amount * value.bulk_collection.currency.currency_rate
      );
    }, 0);

    const pastOtherIncome =
      (await OtherIncome.sum("totalAmount", {
        where: {
          income_date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
          status: "Approved",
        },
      })) || 0;

    const currentOtherIncome =
      (await OtherIncome.sum("totalAmount", {
        where: {
          income_date: { [Op.between]: [fromDate, toDate] },
          status: "Approved",
        },
      })) || 0;

    res.json({
      capitalAmount,
      pastCollected,
      currentCollected,
      pastOtherIncome,
      currentOtherIncome,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getDeductionItemsDataReport").get(async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const allCutoff = await Cutoff.findAll({
      order: [["from", "DESC"]],
    });

    // Get the previous cutoff
    // const previousCutoff = await Cutoff.findOne({
    //   where: {
    //     from: { [Op.lt]: allCutoff.from },
    //   },
    //   order: [["from", "DESC"]],
    // });

    const fromDate = dateFrom || allCutoff.from;
    const toDate = dateTo || allCutoff.to;

    // Get the last month date range
    // const lastMonthFromDate = previousCutoff ? previousCutoff.from : null;
    // const lastMonthToDate = previousCutoff ? previousCutoff.to : null;

    const mappedCutOffDate = allCutoff?.map((item) => {
      return item.to;
    }); // get all end date
    const sortedDate = mappedCutOffDate.sort(
      (a, b) => new Date(a) - new Date(b)
    );
    let index = sortedDate.indexOf(dateTo); // current cut off end date
    let prevDate = sortedDate[parseInt(index) - 1]; // get the previous cut off end date
    const filteredCutOffDate = allCutoff?.find((item) => {
      return item.to == prevDate;
    }); // returns previous cut off date in object form

    const lastMonthFromDate = filteredCutOffDate?.from;
    const lastMonthToDate = filteredCutOffDate?.to;

    // const pastExpenses =
    //   (await Expenses.sum("totalAmount", {
    //     where: {
    //       expenses_date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
    //       status: "Approved",
    //       isAdded: false,
    //     },
    //   })) || 0;

    // const currentExpenses =
    //   (await Expenses.sum("totalAmount", {
    //     where: {
    //       expenses_date: { [Op.between]: [fromDate, toDate] },
    //       status: "Approved",
    //       isAdded: false,
    //     },
    //   })) || 0;

    // Current expenses
    const dataCurrentExpenses = await Expenses.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        expenses_date: { [Op.between]: [fromDate, toDate] },
        status: "Approved",
        isAdded: false,
      },
    });

    const currentExpenses = dataCurrentExpenses.reduce((total, value) => {
      return total + value.totalAmount * value.currency.currency_rate;
    }, 0);

    // Past expenses
    const dataPastExpenses = await Expenses.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        expenses_date: { [Op.between]: [lastMonthFromDate, lastMonthToDate] },
        status: "Approved",
        isAdded: false,
      },
    });

    const pastExpenses = dataPastExpenses.reduce((total, value) => {
      return total + value.totalAmount * value.currency.currency_rate;
    }, 0);

    res.json({ pastExpenses, currentExpenses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint for trial balance current assets section
router.route("/current-assets").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    const dateRange = [startDate, endDate];

    // Where clause for check journal used for collection check
    const checkJournalClause = {
      module_from: {
        [Op.in]: [
          "Collection Check",
          "Local Collection",
          "Overseas Collection",
        ],
      },
    };

    // Get the current assets subjects row
    const [cashAccount, bankAccount, collectionCheck, otherCurrentAsset] =
      await Promise.all([
        tbService.getJournalTotal("Cash", ...dateRange), // Get the cash account row
        tbService.getJournalTotal("Bank", ...dateRange), // Get the bank account row
        tbService.getChecks(...dateRange, checkJournalClause), // Get the collection checks / outstanding checks row
        tbService.getJournalTotal("Other Current Asset", ...dateRange), // Get the other current asset row
      ]);

    // List of current assets subject
    const currentAssets = {
      cashAccount,
      bankAccount,
      collectionCheck,
      otherCurrentAsset,
    };

    const currentAssetsTotals = tbHelper.getTotals(currentAssets); // For the footer total

    res.status(200).json({
      ...currentAssets,
      currentAssetsTotals,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for trial balance current liabilities section
router.route("/current-liabilities").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    const dateRange = [startDate, endDate];

    // Where clause for check journal used for posted payable checks
    const checkJournalClause = {
      module_from: {
        [Op.notIn]: [
          "Collection Check",
          "Local Collection",
          "Overseas Collection",
        ],
      },
    };

    // Get the current liabilities subjects row
    const [postedPayableChecks, otherCurrentLiabilities] = await Promise.all([
      tbService.getChecks(...dateRange, checkJournalClause), // Get the posted payable checks row
      tbService.getJournalTotal("Other Current Liabilities", ...dateRange), // Get the other current liabilities row
    ]);

    // List of current liabilities subject
    const currentLiabilities = {
      postedPayableChecks,
      otherCurrentLiabilities,
    };

    const currentLiabilitiesTotals = tbHelper.getTotals(currentLiabilities); // For the footer total

    res.status(200).json({ ...currentLiabilities, currentLiabilitiesTotals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for trial balance additional items section
router.route("/additional-items").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // Where clause for check journal used for collection check
    const checkJournalClause = {
      module_from: {
        [Op.in]: [
          "Collection Check",
          "Local Collection",
          "Overseas Collection",
        ],
      },
    };

    const dateRange = [startDate, endDate];

    // prettier-ignore
    // Get the additional items subjects row
    const [startupCapital, mainBusinessIncome, otherIncome] = await Promise.all([
      tbService.getJournalTotal("Startup Capital", ...dateRange), // Get the startup capital row
      tbService.getChecks(...dateRange, checkJournalClause, "Main Business Income"), // Get the main business income row
      tbService.getOtherIncome(...dateRange), // Get the other income row
    ]);

    // List of additional items subject
    const additionalItems = {
      startupCapital,
      mainBusinessIncome,
      otherIncome,
    };

    // For the footer total
    const additionalItemsTotals = tbHelper.getTotals(
      additionalItems,
      "adjusted"
    );

    res.status(200).json({ ...additionalItems, additionalItemsTotals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for trial balance deduction items section
router.route("/deduction-items").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and query params are required.",
      });

    res.status(200).json({ message: "onhold" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
