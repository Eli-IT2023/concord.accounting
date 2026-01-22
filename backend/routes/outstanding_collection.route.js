const router = require("express").Router();
const { where, Op, fn, col, literal, STRING } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  AccountList,
  MasterList,
  Currency,
  BulkCollection,
  BulkCollectionTransaction,
  BulkCollectionPayment,
  SalesInvoice,
  Customer,
  Loan_mother,
  Cutoff,
  ProfitLossReport,
  ReceivingCheck,
  Activity_Log,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  issued_check,
  currency_sub,
  bank_transaction,
  CashFlow,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const moment = require("moment-timezone");
const BankTransaction = require("../db/models/bank_transaction.model");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/getSubject2").get(async (req, res) => {
  const { account_selected } = req.query;

  try {
    const subjects = await accountlist_base_subject.findAll({
      where: {
        module_type: account_selected,
        isDeleted: false,
      },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: false,
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

//for local collection pag change ng dropdown sa subject 2
router.route("/getSubject3ChainDropdown").get(async (req, res) => {
  const { subjectId, currencyId } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      where: {
        account_list_base_sub_id: subjectId,
        currency_id: currencyId,
        isDeleted: false,
      },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getCutoffs").get(async (req, res) => {
  try {
    const cutoff = await Cutoff.findAll({
      where: {
        isDeleted: false,
      },
    });
    res.status(200).json(cutoff);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error");
  }
});

router.route("/getAccountListSub3ForSelect").get(async (req, res) => {
  try {
    const accountList = await accountlist_sub3.findAll({
      include: [
        {
          model: accountlist_base_subject,
        },
      ],
    });
    res.status(200).json(accountList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//for outstanding collection
router.route("/getOutstandingCollectionData").get(async (req, res) => {
  try {
    // const data = await BulkCollection.findAll({
    //   include: [
    //     {
    //       model: BulkCollectionTransaction,
    //       required: true,
    //       include: [
    //         {
    //           model: SalesInvoice,
    //           required: true,
    //         },
    //       ],
    //     },
    //     {
    //       model: BulkCollectionPayment,
    //       required: true,
    //     },
    //   ],
    //   order: [["createdAt", "DESC"]],
    //   where: {
    //     status: {
    //       [Op.in]: ["Approved", "Claimed"]
    //     }
    //   }
    // });

    // const totalCollection = data.map((collection) => {
    //   const totalPayments = collection.reduce(
    //     (sum, payment) => {
    //       return sum + payment.amount;
    //     },
    //     0
    //   );

    //   return {
    //     ...collection.toJSON(),
    //     totalPayments,
    //   };
    // });
    const { startDate, endDate, filterColumn, searchText, selectedAccount } =
      req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let accountlistBaseSubjectWhereClause = {};
    let loanWhereClause = {};
    let receivingCheckWhereClause = {};
    let bulkCollectionWhereClause = {};
    let tableColumns = [
      "date_issued",
      "payment_type",
      "check_number",
      "ref_number",
      "amount",
    ];
    let bulkCollectionPaymentWhereClause = {
      status: {
        [Op.in]: ["Approved", "Claimed"],
      },
      isDeleted: false,
      payment_type: {
        [Op.not]: ["Cash"],
      },
      date_issued: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_number":
          bulkCollectionWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };

          loanWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        case "transaction_date":
          bulkCollectionWhereClause = sequelize.where(
            literal(`CAST (bulk_collection.collection_date AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );

          loanWhereClause = sequelize.where(
            literal(`CAST (loan_mothers.transaction_date AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );

          receivingCheckWhereClause = sequelize.where(
            literal(`CAST (receiving_checks.transaction_date AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;
        case "issued_to":
          accountlistBaseSubjectWhereClause = sequelize.where(
            literal(
              `CONCAT(subject_name, ' - ' ,account_list_sub3.account_name)`
            ),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;
        case "issued_date":
          bulkCollectionPaymentWhereClause.date_issued = {
            [Op.and]: [
              {
                [Op.gte]: startDate,
              },
              {
                [Op.lte]: endDate,
              },
              sequelize.where(
                literal(`CAST (bulk_collection_payment.date_issued AS CHAR)`),
                {
                  [Op.like]: `%${searchText}%`,
                }
              ),
            ],
          };
          break;
        case "payment_method":
          bulkCollectionPaymentWhereClause["payment_type"] = {
            [Op.like]: `%${searchText}%`,
            [Op.notLike]: "Cash",
          };

          break;
        case "check_number":
          bulkCollectionPaymentWhereClause["check_number"] = {
            [Op.like]: `%${searchText}%`,
          };

          break;
        case "ref_number":
          bulkCollectionPaymentWhereClause["ref_number"] = {
            [Op.like]: `%${searchText}%`,
          };

          break;
        case "amount":
          bulkCollectionPaymentWhereClause["amount"] = sequelize.where(
            literal(`CAST (bulk_collection_payment.amount AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );

          break;
        default:
          bulkCollectionPaymentWhereClause = {
            [Op.and]: [
              {
                status: {
                  [Op.in]: ["Approved", "Claimed"],
                },
                payment_type: {
                  [Op.not]: ["Cash"],
                },
                isDeleted: false,
                date_issued: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: tableColumns.map((col) => {
                  if (col === "date_issued") {
                    return {
                      [col]: {
                        [Op.and]: [
                          {
                            [Op.gte]: startDate,
                          },
                          {
                            [Op.lte]: endDate,
                          },
                          sequelize.where(
                            literal(
                              `CAST (bulk_collection_payment.date_issued AS CHAR)`
                            ),
                            {
                              [Op.like]: `%${searchText}%`,
                            }
                          ),
                        ],
                      },
                    };
                  } else if (col === "amount") {
                    return {
                      [col]: sequelize.where(
                        literal(
                          `CAST (bulk_collection_payment.amount AS CHAR)`
                        ),
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
              },
            ],
          };
          break;
      }
    }

    // If there's selected account
    if (selectedAccount) {
      bulkCollectionPaymentWhereClause["account_list_sub3_id"] =
        // parseInt(selectedAccount);
        String(selectedAccount);
    }

    let { count, rows: data } = await BulkCollectionPayment.findAndCountAll({
      include: [
        {
          model: BulkCollection,
          required: false,
          include: [
            {
              model: BulkCollectionTransaction,
              required: true,
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  include: [
                    {
                      model: Currency,
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              model: Currency,
              required: true,
            },
          ],
          where: bulkCollectionWhereClause,
        },
        {
          model: ReceivingCheck,
          required: false,
          include: [
            {
              model: Currency,
            },
          ],
          where: receivingCheckWhereClause,
        },
        {
          model: accountlist_sub3,
          required: false,

          include: [
            {
              model: accountlist_base_subject,
              required: true,
              where: accountlistBaseSubjectWhereClause,
            },
          ],
        },
        {
          model: Loan_mother,
          required: false,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
          where: loanWhereClause,
        },
      ],
      where: bulkCollectionPaymentWhereClause,
      order: [["createdAt", "DESC"]],
      subQuery: false,
      limit: limit,
      offset: offset,
    });

    let currencyData = await Currency.findAll();

    const totalClaimed = data
      .filter((item) => {
        return item.status === "Claimed";
      })
      .reduce((total, value) => {
        const currencyRate = value.bulk_collection
          ? value.bulk_collection?.bulk_collection_transactions?.[0]
              ?.sales_invoice?.currency?.currency_rate
          : value.receiving_checks &&
            value.receiving_checks[0]?.currency?.currency_rate;

        const currencyRateFromLoanMother = currencyData.find((item) => {
          return item.id == value.loan_mothers[0]?.currency_id;
        });
        return (
          total +
          parseFloat(
            (value.amount || 0) *
              parseFloat(
                currencyRate || currencyRateFromLoanMother?.currency_rate
              )
          )
        );
        // return total + value.amount;
      }, 0);

    const totalUnclaimed = data
      .filter((item) => {
        return item.status === "Approved";
      })
      .reduce((total, value) => {
        const currencyRate = value.bulk_collection
          ? value.bulk_collection?.bulk_collection_transactions?.[0]
              ?.sales_invoice?.currency?.currency_rate
          : value.receiving_checks &&
            value.receiving_checks[0]?.currency?.currency_rate;

        const currencyRateFromLoanMother = currencyData.find((item) => {
          return item.id == value.loan_mothers[0]?.currency_id;
        });
        return (
          total +
          parseFloat(
            (value.amount || 0) *
              parseFloat(
                currencyRate || currencyRateFromLoanMother?.currency_rate
              )
          )
        );
        // return total + value.amount;
      }, 0);

    // For Issued to
    if (filterColumn === "issued_to" && searchText !== "") {
      const filteredAccountList = data.filter((col) => {
        return col.account_list_sub3 !== null;
      });
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: {
          data: filteredAccountList,
          totalClaimed,
          totalUnclaimed,
        },
      });
    }

    // For Transaction number
    if (filterColumn === "transaction_number" && searchText !== "") {
      const filteredTransactionNumber = data.filter((col) => {
        return (
          col.bulk_collection !== null ||
          (Array.isArray(col.loan_mothers) && col.loan_mothers.length > 0)
        );
      });
      console.log("transactionno =======");
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: {
          data: filteredTransactionNumber,
          totalClaimed,
          totalUnclaimed,
        },
      });
    }

    // For Transaction date
    if (filterColumn === "transaction_date" && searchText !== "") {
      const filteredTransactionDate = data.filter((col) => {
        return (
          col.bulk_collection !== null ||
          (Array.isArray(col.loan_mothers) && col.loan_mothers.length > 0) ||
          (Array.isArray(col.receiving_checks) &&
            col.receiving_checks.length > 0)
        );
      });
      console.log("transactiondate=====");
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: {
          data: filteredTransactionDate,
          totalClaimed,
          totalUnclaimed,
        },
      });
    }

    // search for issued_to, transaction_number, and transaction_date if data is empty
    if (data.length === 0 && filterColumn === "all" && searchText !== "") {
      const columns = ["issued_to", "transaction_number", "transaction_date"];
      let responseSent = false;
      for (let index = 0; index < columns.length; index++) {
        let accountlistBaseSubjectWhereClause = {};
        let loanWhereClause = {};
        let bulkCollectionWhereClause = {};
        let bulkCollectionPaymentWhereClause = {
          status: {
            [Op.in]: ["Approved", "Claimed"],
          },
          isDeleted: false,
          date_issued: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };

        // If there's selected account
        if (selectedAccount) {
          bulkCollectionPaymentWhereClause["account_list_sub3_id"] =
            // parseInt(selectedAccount);
            String(selectedAccount);
        }

        if (columns[index] === "issued_to") {
          accountlistBaseSubjectWhereClause = sequelize.where(
            literal(
              `CONCAT(subject_name, ' - ' ,account_list_sub3.account_name)`
            ),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
        } else if (columns[index] === "transaction_number") {
          bulkCollectionWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };

          loanWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
        } else {
          bulkCollectionWhereClause = sequelize.where(
            literal(`CAST (bulk_collection.collection_date AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );

          loanWhereClause = sequelize.where(
            literal(`CAST (loan_mothers.transaction_date AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
        }

        let { count, rows: data } = await BulkCollectionPayment.findAndCountAll(
          {
            include: [
              {
                model: BulkCollection,
                required: false,
                include: [
                  {
                    model: BulkCollectionTransaction,
                    required: true,
                    include: [
                      {
                        model: SalesInvoice,
                        required: true,
                      },
                    ],
                  },
                ],
                where: bulkCollectionWhereClause,
              },
              {
                model: accountlist_sub3,
                required: false,

                include: [
                  {
                    model: accountlist_base_subject,
                    required: true,
                    where: accountlistBaseSubjectWhereClause,
                  },
                ],
              },
              {
                model: Loan_mother,
                required: false,
                where: loanWhereClause,
              },
            ],
            where: bulkCollectionPaymentWhereClause,
            order: [["createdAt", "DESC"]],
            subQuery: false,
            limit: limit,
            offset: offset,
          }
        );

        const filteredData = data.filter((col) => {
          if (columns[index] === "issued_to") {
            return col.account_list_sub3 !== null;
          } else {
            return (
              col.bulk_collection !== null ||
              (Array.isArray(col.loan_mothers) && col.loan_mothers.length > 0)
            );
          }
        });

        if (filteredData.length > 0 && !responseSent) {
          responseSent = true; // Mark response as sent
          return res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: {
              data: filteredData,
              totalClaimed,
              totalUnclaimed,
            },
          });
        }
      }
      if (!responseSent) {
        return res.json({
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page || 1),
          data: {
            data: [],
            totalClaimed,
            totalUnclaimed,
          },
        });
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: {
        data: data,
        totalClaimed,
        totalUnclaimed,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router
  .route("/deleteCollection/:collectionId/:collectionDateIssued")
  .delete(async (req, res) => {
    try {
      const id = req.params.collectionId;
      const collectionDate = req.params.collectionDateIssued;

      const { userLoggedID } = req.body;

      const getCutoff = await Cutoff.findOne({
        where: {
          isDeleted: false,
          [Op.and]: [
            {
              from: {
                [Op.lte]: collectionDate,
              },
            },
            {
              to: {
                [Op.gte]: collectionDate,
              },
            },
          ],
        },
      });
      const {
        from: dateFrom,
        to: dateTo,
        isPosted: postedCutoff,
        name: CutoffName,
      } = getCutoff;

      const getCollectionBulk = await BulkCollectionPayment.findOne({
        where: { id: id },
      });

      const dateIssued = new Date(getCollectionBulk.date_issued);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (dateIssued >= cutoffFrom && dateIssued <= cutoffTo) {
          return res.status(202).json({
            success: false,
            dateIssued: getCollectionBulk.date_issued,
            CutoffName: CutoffName,
          });
        }
      }

      const getPayment = await BulkCollectionPayment.findOne({
        where: { id: id },
      });

      const {
        status: paymentStatus,
        payment_type: paymentMethod,
        amount: paymentAmount,
        date_issued: issuedDate,
        account_list_sub3_id: accountlistId,
      } = getPayment;

      if (getPayment.bulk_collection_id == null) {
        if (
          (paymentStatus === "Approved" && paymentMethod === "Cash") ||
          paymentStatus === "Claimed"
        ) {
          const decreaseAmount = await accountlist_sub3.decrement(
            { amount: paymentAmount },
            { where: { id: accountlistId } }
          );

          if (decreaseAmount) {
            await accountlist_transaction_subject.update(
              { isDeleted: true },
              {
                where: {
                  account_list_sub3_id_transacted: accountlistId,
                  date: issuedDate,
                  module_from: "Collection Check",
                },
              }
            );

            await getPayment.update({
              isDeleted: true,
            });

            await Activity_Log.create({
              masterlist_id: userLoggedID,
              action_taken: `Collection Check: User deleted a receving check #${getPayment.check_number}`,
            });
            return res
              .status(200)
              .json({ success: true, message: "Deleted successfully" });
          }
        } else if (paymentStatus === "Approved") {
          await getPayment.update({
            isDeleted: true,
          });
          await Activity_Log.create({
            masterlist_id: userLoggedID,
            action_taken: `Collection Check: User deleted a receving check #${getPayment.check_number}`,
          });
          return res
            .status(200)
            .json({ success: true, message: "Deleted successfully" });
        }
      } else {
        if (
          (paymentStatus === "Approved" && paymentMethod === "Cash") ||
          paymentStatus === "Claimed"
        ) {
          const decreaseAmount = await accountlist_sub3.decrement(
            { amount: paymentAmount },
            { where: { id: accountlistId } }
          );

          if (decreaseAmount) {
            // await accountlist_transaction_subject.destroy({
            //   where: {
            //     account_list_sub3_id_transacted: accountlistId,
            //     date: issuedDate,
            //   },
            // });
            await accountlist_transaction_subject.update(
              { isDeleted: true },
              {
                where: {
                  account_list_sub3_id_transacted: accountlistId,
                  date: issuedDate,
                },
              }
            );

            await getPayment.destroy();
            return res
              .status(200)
              .json({ success: true, message: "Deleted successfully" });
          }
        } else if (paymentStatus === "Approved") {
          await getPayment.destroy();
          return res
            .status(200)
            .json({ success: true, message: "Deleted successfully" });
        }
      }

      return res.status(203).json({ success: false, error: "Invalid status" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

//sa pag-claim ng hindi check
router.route("/claimCollections").post(async (req, res) => {
  try {
    const { id, bulkId, userLoggedID, date_issued, rowData, currencyRate } =
      req.body;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date_issued },
          },
          {
            to: { [Op.gte]: date_issued },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    await BulkCollectionPayment.update(
      {
        collected_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    const findCollection = await BulkCollectionPayment.findOne({
      where: { id: id },
      include: [
        {
          model: BulkCollection,
          required: true,
        },
      ],
    });

    if (findCollection) {
      const subject3Id = findCollection.account_list_sub3_id;
      const collectionAmount = findCollection.amount;
      const paymentType = findCollection.payment_type;
      const dateCollection = findCollection.date_issued;
      const checkNumber = findCollection.check_number;
      const refNumber = findCollection.ref_number;
      const trans_num = findCollection.bulk_collection.transaction_number;
      const module_from = findCollection.bulk_collection.module_from;

      const checkAccount = await accountlist_sub3.findOne({
        where: { id: subject3Id },
      });

      if (checkAccount) {
        const updatedAmount = checkAccount.amount + collectionAmount;
        await checkAccount.update({ amount: updatedAmount });

        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: subject3Id,
          payment_method: paymentType,
          amount: collectionAmount,
          date: dateCollection,
          check_or_remarks: checkNumber || refNumber,
          type: "Debit",
          transaction_number: trans_num,
          module_from: module_from,
          transferred_by: userLoggedID,
        });

        await BankTransaction.create({
          transaction_date: dateCollection,
          transaction_number: trans_num,
          account_list_id_bank_to: subject3Id,
          module_from: "Collection Check",
          amount: collectionAmount,
          status: "Confirmed",
          confirmed_by: userLoggedID,
        });
      }

      await findCollection.update({ status: "Claimed" });
    }

    const getSalesTransactions = await BulkCollectionTransaction.findAll({
      where: { bulk_collection_id: bulkId },
      attributes: ["sales_invoice_id"],
    });

    const salesInvoiceIds = getSalesTransactions.map(
      (transaction) => transaction.sales_invoice_id
    );

    const remainingApprovedCount = await BulkCollectionPayment.count({
      where: { bulk_collection_id: bulkId, status: "Approved" },
    });

    // If no "Approved" payments are found, update the BulkCollection status to "Claimed"
    if (remainingApprovedCount === 0) {
      await BulkCollection.update(
        { status: "Claimed" },
        { where: { id: bulkId } }
      );

      if (salesInvoiceIds.length > 0) {
        await SalesInvoice.update(
          { status: "Collected" },
          { where: { sales_invoice_id: salesInvoiceIds } }
        );
      }
    }

    if (rowData && currencyRate) {
      await ProfitLossReport.create({
        collection_check_id: rowData.id,
        currency_id: rowData.bulk_collection.currency.id,
        currency_rate: currencyRate,
        transaction_date: rowData.bulk_collection?.collection_date,
      });
    }

    res.status(200).json({
      success: true,
      message: "Payments processed and accounts updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//sa pag-claim ng check at need magtag ng subject 3
router.route("/claimSubjectCollections").post(async (req, res) => {
  try {
    const {
      subject1,
      subject3,
      id,
      selectedBulkCollectionId,
      userLoggedID,
      date_issued,
      rowData,
      currencyRate,
    } = req.body;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date_issued },
          },
          {
            to: { [Op.gte]: date_issued },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const findCollection = await BulkCollectionPayment.findOne({
      where: { id: id },
      include: [
        {
          model: BulkCollection,
          required: true,
        },
      ],
    });

    if (findCollection) {
      const bulkId = findCollection.bulk_collection_id;
      const collectionAmount = findCollection.amount;
      const paymentType = findCollection.payment_type;
      const dateCollection = findCollection.date_issued;
      const checkNumber = findCollection.check_number;
      const refNumber = findCollection.ref_number;
      const trans_num = findCollection.bulk_collection.transaction_number;
      const module_from = findCollection.bulk_collection.module_from;

      const checkAccount = await accountlist_sub3.findOne({
        where: { id: subject3 },
      });

      if (checkAccount) {
        const updatedAmount = checkAccount.amount + collectionAmount;
        await checkAccount.update({ amount: updatedAmount });

        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: subject3,
          payment_method: paymentType,
          amount: collectionAmount,
          date: dateCollection,
          check_or_remarks: checkNumber || refNumber,
          type: "Debit",
          transaction_number: trans_num,
          module_from: module_from,
          transferred_by: userLoggedID,
        });

        await findCollection.update({
          account_list_sub3_id: subject3,
        });

        await BankTransaction.create({
          transaction_date: dateCollection,
          transaction_number: trans_num,
          account_list_id_bank_to: subject3,
          module_from: "Collection Check",
          amount: collectionAmount,
          status: "Confirmed",
          confirmed_by: userLoggedID,
        });
      }

      await findCollection.update({ status: "Claimed" });
      // }

      const remainingApprovedCount = await BulkCollectionPayment.count({
        where: {
          bulk_collection_id: selectedBulkCollectionId,
          status: "Approved",
        },
      });

      // If no "Approved" payments are found, update the BulkCollection status to "Claimed"
      if (remainingApprovedCount === 0) {
        await BulkCollection.update(
          { status: "Claimed" },
          { where: { id: bulkId } }
        );
      }

      await BulkCollectionPayment.update(
        {
          collected_by: userLoggedID,
        },
        {
          where: {
            id: id,
          },
        }
      );

      if (rowData && currencyRate) {
        await ProfitLossReport.create({
          collection_check_id: rowData.id,
          currency_id: rowData.bulk_collection.currency.id,
          currency_rate: currencyRate,
          transaction_date: rowData.bulk_collection?.collection_date,
        });
      }

      res.status(200).json({
        success: true,
        message: "Payments processed and accounts updated",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.route("/claimReceivingCheck").post(async (req, res) => {
  try {
    const {
      subject1,
      subject3,
      id,
      userLoggedID,
      date_issued,
      rowData,
      currencyRate,
    } = req.body;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date_issued },
          },
          {
            to: { [Op.gte]: date_issued },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const findCollection = await BulkCollectionPayment.findOne({
      where: { id: id },
      include: [
        {
          model: ReceivingCheck,
          required: true,
        },
      ],
    });

    const checks = findCollection.receiving_checks[0];

    console.log("Cheeecks", checks);

    if (findCollection) {
      const collectionAmount = findCollection.amount;
      const paymentType = findCollection.payment_type;
      const dateCollection = findCollection.date_issued;
      const checkNumber = findCollection.check_number;

      const checkAccount = await accountlist_sub3.findOne({
        where: { id: subject3 },
      });

      // const receiveAccount = await accountlist_sub3.findOne({
      //   where: { id: checks.account_list_sub3_id },
      // });

      if (checkAccount) {
        const updatedAmount = checkAccount.amount + collectionAmount;
        await checkAccount.update({ amount: updatedAmount });
        // await receiveAccount.update({
        //   amount: receiveAccount.amount + checks.amount,
        // });

        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: subject3,
          payment_method: paymentType,
          amount: collectionAmount,
          date: dateCollection,
          check_or_remarks: checkNumber || refNumber,
          type: "Debit",
          transaction_number: "",
          module_from: "Collection Check",
          transferred_by: userLoggedID,
        });

        // await accountlist_transaction_subject.create({
        //   account_list_sub3_id_transacted: checks.account_list_sub3_id,
        //   payment_method: paymentType,
        //   amount: collectionAmount,
        //   date: dateCollection,
        //   check_or_remarks: checkNumber || refNumber,
        //   type: "Debit",
        //   transaction_number: "",
        //   module_from: "Collection Check",
        //   transferred_by: userLoggedID,
        // });

        await findCollection.update({
          account_list_sub3_id: subject3,
        });

        await BankTransaction.create({
          transaction_date: dateCollection,
          transaction_number: "",
          account_list_id_bank_from: subject3,
          module_from: "Collection Check",
          amount: collectionAmount,
          status: "Confirmed",
          confirmed_by: userLoggedID,
        });
      }

      await findCollection.update({ status: "Claimed" });

      res.status(200).json({
        success: true,
        message: "Payments processed and accounts updated",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.route("/addReceivingCheck").post(async (req, res) => {
  try {
    const data = req.body;

    const createPayment = await BulkCollectionPayment.create({
      payment_type: "Bank",
      check_number: data.checkNumber,
      amount: data.amount,
      date_issued: data.issuedDate,
      check_or_online: "Check",
      status: "Approved",
    });

    const createReceivingCheck = await ReceivingCheck.create({
      bulk_collection_payment_id: createPayment.id,
      account_list_sub3_id: data.subject3,
      transaction_date: data.transactionDate,
      issued_date: data.issuedDate,
      currency_id: data.currency_id,
      check_number: data.checkNumber,
      amount: data.amount,
    });

    // Update and Increment amount of selected subject 3
    const updateSubject3Amount = async () => {
      // Find Subject 3
      const subject3 = await accountlist_sub3.findOne({
        where: {
          id: data.subject3,
        },
      });

      // Not found validation
      if (!subject3) {
        res.status(404).json({ message: "Subject 3 Not found" });
      }

      // Increment the amount
      await subject3.increment("amount", {
        by: data.amount,
      });
    };

    await updateSubject3Amount();

    // Create accountlist_transaction_subject for transaction history
    await accountlist_transaction_subject.create({
      account_list_sub3_id_transacted: data.subject3,
      payment_method: "Bank",
      amount: data.amount,
      date: data.transactionDate,
      check_or_remarks: data.checkNumber,
      type: "Debit",
      isTransferOnly: false,
      module_from: "Collection Check",
      transaction_number: "",
      transferred_by: data.userLoggedID,
    });

    return res
      .status(201)
      .json({ message: "Receiving Check Created Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
