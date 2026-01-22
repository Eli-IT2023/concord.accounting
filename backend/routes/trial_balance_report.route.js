const router = require("express").Router();
const { where, Op, CIDR } = require("sequelize");
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
        module_type: "Account-List",
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
        module_type: "Account-List",
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

module.exports = router;
