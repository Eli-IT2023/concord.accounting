const getAccurateDate = require("../utils/accurate_date_time_today");
const router = require("express").Router();
const express = require("express");
const { Op, where, literal, fn, col } = require("sequelize");
const {
  AccountList,
  MasterList,
  Currency,
  BulkCollection,
  BulkCollectionTransaction,
  BulkCollectionPayment,
  SalesInvoice,
  Customer,
  Cutoff,
  Activity_Log,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  currency_sub,
  accountlist_transaction_subject,
  ProfitLossReport,
  CashFlow,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const moment = require("moment-timezone");
const sequelize = require("../db/config/sequelize.config");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");
const BankTransaction = require("../db/models/bank_transaction.model");
const {
  likeFilter,
  createdAtFilter,
  castFilter,
  dateFormatFilter,
} = require("../utils/filters/sequelizeSearchFilter");
const SalesJournal = require("../db/models/sales_journal.model");
const CheckJournal = require("../db/models/check_journal.model");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/getCutoffForDisplay").get(async (req, res) => {
  try {
    const latestData = await Cutoff.findOne({
      order: [["from", "DESC"]],
    });
    res.json(latestData);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCutoffPosted").get(async (req, res) => {
  try {
    const data = await Cutoff.findAll({
      where: {
        isPosted: 1,
        isDeleted: false,
      },
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//for total collection in local collection
router.route("/getBulkCollectionPaymentLocal").get(async (req, res) => {
  try {
    const data = await BulkCollectionPayment.findAll({
      include: [
        {
          model: BulkCollection,
          required: true,
          where: {
            type: "Local",
            status: "Approved",
          },
        },
      ],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/getCustomerLocalSales").get(async (req, res) => {
  try {
    const { currency_id } = req.query;
    const data = await SalesInvoice.findAll({
      include: [
        {
          model: Customer,
          required: true,
          where: {
            status: true,
            isDeleted: false,
          },
        },
      ],
      where: {
        destination: "Local",
        status: "Approved",
        currency_id: currency_id,
        payAdded: false,
        isDeleted: false,
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomerOverseasSales").get(async (req, res) => {
  try {
    const { currency_id } = req.query;
    const data = await SalesInvoice.findAll({
      include: [
        {
          model: Customer,
          required: true,
        },
      ],
      where: {
        destination: "Overseas",
        status: "Approved",
        currency_id: currency_id,
        payAdded: false,
        isDeleted: false,
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router
  .route("/getTransactionsByCustomer/:customerId/:selected_currency_id")
  .get(async (req, res) => {
    try {
      const { customerId, selected_currency_id } = req.params;
      const { filterColumn, selectedRow } = req.query;
      let { searchText } = req.query;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const numericText = searchText.replace(/,/g, "");

      if (!isNaN(numericText)) {
        searchText = numericText;
      }

      if (!customerId)
        return res.status(400).json({ error: "customerId is required." });

      // Sales Invoice Where clause
      let salesInvoiceWhereClause = {
        customer_id: customerId,
        currency_id: selected_currency_id,
        destination: "Local",
        status: "Approved",
        payAdded: false,
      };

      // Sales Invoice Table column name
      const salesInvoiceTableColumn = [
        "transaction_id",
        "remarks",
        "invoice_date",
        "due_date",
        "dr_number",
        "po_number",
        "total_amount",
        "discount",
      ];

      // Handle Search
      if (searchText && searchText.trim() !== "") {
        switch (filterColumn) {
          // case "transaction_id":
          // case "remarks":
          case "po_number":
            salesInvoiceWhereClause[filterColumn] = {
              [Op.like]: `%${searchText}%`,
            };
            break;

          case "dr_number":
            salesInvoiceWhereClause = {
              [Op.and]: [
                {
                  customer_id: customerId,
                  currency_id: selected_currency_id,
                  destination: "Local",
                  status: "Approved",
                  payAdded: false,
                },
                literal(
                  `COALESCE(NULLIF(dr_number, ""), container_number) LIKE '%${searchText}%'`
                ),
              ],
            };
            break;

          case "invoice_date":
          case "due_date":
          case "total_amount":
            salesInvoiceWhereClause = {
              [Op.and]: [
                {
                  customer_id: customerId,
                  currency_id: selected_currency_id,
                  destination: "Local",
                  status: "Approved",
                  payAdded: false,
                },
                sequelize.where(literal(`CAST(${filterColumn} AS CHAR)`), {
                  [Op.like]: `%${searchText}%`,
                }),
              ],
            };
            break;

          case "discount":
            salesInvoiceWhereClause = {
              [Op.and]: [
                {
                  customer_id: customerId,
                  currency_id: selected_currency_id,
                  destination: "Local",
                  status: "Approved",
                  payAdded: false,
                },
                // Use a raw query for the sum and like condition
                literal(
                  `CAST(COALESCE(item_discount, 0) + COALESCE(transaction_discount, 0) AS CHAR) LIKE '%${searchText}%'`
                ),
              ],
            };
            break;
          default:
            salesInvoiceWhereClause = {
              [Op.and]: [
                {
                  customer_id: customerId,
                  currency_id: selected_currency_id,
                  destination: "Local",
                  status: "Approved",
                  payAdded: false,
                },
                {
                  [Op.or]: salesInvoiceTableColumn.map((col) => {
                    switch (col) {
                      // case "transaction_id":
                      // case "remarks":
                      case "po_number":
                        return {
                          [col]: {
                            [Op.like]: `%${searchText}%`,
                          },
                        };
                        break;

                      case "dr_number":
                        return literal(
                          `COALESCE(NULLIF(dr_number, ""), container_number) LIKE '%${searchText}%'`
                        );

                      case "invoice_date":
                      case "due_date":
                      case "total_amount":
                        return sequelize.where(
                          literal(`CAST(${col} AS CHAR)`),
                          {
                            [Op.like]: `%${searchText}%`,
                          }
                        );
                        break;

                      default:
                        return literal(
                          `CAST(COALESCE(item_discount, 0) + COALESCE(transaction_discount, 0) AS CHAR) LIKE '%${searchText}%'`
                        );
                        break;
                    }
                  }),
                },
              ],
            };
            break;
        }
      }

      if (selectedRow) {
        salesInvoiceWhereClause["transaction_id"] = {
          [Op.notIn]: selectedRow,
        };
      }

      // For Modal Table
      const { count, rows: transactions } = await SalesInvoice.findAndCountAll({
        subQuery: false,
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        where: { ...salesInvoiceWhereClause, isDeleted: false },
      });

      // For Table
      const items = await SalesInvoice.findAll({
        where: {
          transaction_id: {
            [Op.in]: selectedRow?.length > 0 ? selectedRow : [],
          },
          isDeleted: false,
        },
      });

      res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: { transactions, items },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json("Error");
    }
  });

router.route("/transactionBulkCollection").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}${month}`;

  const generateTwoNum = Math.floor(10 + Math.random() * 90);
  const time = new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  try {
    // const lastPayCode = await BulkCollection.findOne({
    //   where: {
    //     transaction_number: {
    //       [Op.like]: `BC-${currentMonth}%`,
    //     },
    //   },
    //   order: [["createdAt", "DESC"]],
    // });

    let newRefCode = `BC-${currentMonth}${time}${generateTwoNum}`;
    // if (lastPayCode && lastPayCode.transaction_number) {
    //   const latestRefCode = lastPayCode.transaction_number;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `BC-${currentMonth}-${newSequence}`;
    //   } else {
    //     newRefCode = `BC-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `BC-${currentMonth}-00001`;
    // }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/addPaymentLocal").post(async (req, res) => {
  try {
    const {
      items,
      selectedCustomerId,
      collectionDate,
      floatPayment,
      transactionNumber,
      selected_currency_id,
      currencyRate,
      type,
      userLoggedID,
      totalAmount,
    } = req.body;

    const isCreate = await BulkCollection.create({
      customer_id: selectedCustomerId,
      collection_date: collectionDate || null,
      transaction_number: transactionNumber,
      status: "For Approval",
      module_from: "Local-Bulk-Collection",
      type: type,
      currency_id: selected_currency_id,
      rate: currencyRate,
      total_amount: totalAmount,
      created_by: userLoggedID,
    });

    if (isCreate) {
      let TotalToPay;
      for (const item of items) {
        const InsertTransaction = await BulkCollectionTransaction.create({
          bulk_collection_id: isCreate.id,
          sales_invoice_id: item.sales_invoice_id,
        });

        const findInvoice = await SalesInvoice.findOne({
          where: {
            sales_invoice_id: item.sales_invoice_id,
          },
        });

        TotalToPay = findInvoice.total_amount;
      }

      const removeComma = (num) =>
        parseFloat(String(num || 0).replace(/,/g, ""));

      if (floatPayment.length) {
        for (const data of floatPayment) {
          await BulkCollectionPayment.create({
            bulk_collection_id: isCreate.id,
            account_list_sub3_id: data.subject3 || null,
            payment_type: data.paymentMethod,
            check_number: data.checkNumber || null,
            ref_number: data.refNumber || null,
            amount: removeComma(data.amount),
            date_issued: data.issuedDate || null,
            check_or_online: data.checkOrOnline,
            status: data.status,
          });
        }
      }

      await SalesInvoice.update(
        {
          payAdded: true,
        },
        {
          where: {
            sales_invoice_id: items.map((item) => item.sales_invoice_id),
          },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Local Collection: User created new local collection with transaction ID ${transactionNumber}`,
      });

      return res.status(200).json();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/update").post(async (req, res) => {
  try {
    let {
      items,
      collectionDate,
      floatPayment,
      id,
      removeIds,
      removeIdsPaymentList,
      userLoggedID,
      totalAmount,
      currencyRate,
    } = req.body;

    // Filter to remove only necessary transactions
    removeIds = removeIds.filter((item) => {
      return !items.map((item) => item.sales_invoice_id).includes(item);
    });

    //For Act log
    const getData = await BulkCollectionTransaction.findAll({
      include: [
        {
          model: BulkCollection,
          attributes: ["transaction_number", "collection_date"],
        },
        {
          model: SalesInvoice,
          attributes: ["transaction_id"],
        },
      ],
      where: {
        bulk_collection_id: id,
      },
    });

    const getDataCollectionPayment = await BulkCollectionPayment.findAll({
      include: [
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        bulk_collection_id: id,
      },
    });

    const updateLocalCollection = await BulkCollection.update(
      {
        collection_date: collectionDate,
        total_amount: totalAmount,
        rate: currencyRate,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (updateLocalCollection) {
      for (const item of items) {
        const checkSalesId = await BulkCollectionTransaction.findOne({
          where: {
            bulk_collection_id: id,
            sales_invoice_id: item.sales_invoice_id,
            isDeleted: false,
          },
        });

        // If it exists, delete it
        // if (checkSalesId) {
        //   // await BulkCollectionTransaction.destroy({
        //   //   where: {
        //   //     bulk_collection_id: id,
        //   //     sales_invoice_id: item.sales_invoice_id,
        //   //   },
        //   // });

        //   await BulkCollectionTransaction.update(
        //     { isDeleted: true },
        //     {
        //       where: {
        //         bulk_collection_id: id,
        //         sales_invoice_id: item.sales_invoice_id,
        //       },
        //     }
        //   );
        // }

        if (!checkSalesId) {
          await BulkCollectionTransaction.create({
            bulk_collection_id: id,
            sales_invoice_id: item.sales_invoice_id,
          });
        }

        // Update to payAdded true
        await SalesInvoice.update(
          {
            payAdded: true,
          },
          {
            where: {
              sales_invoice_id: item.sales_invoice_id,
              transaction_id: item.transaction_id,
            },
          }
        );
      }

      // await BulkCollectionPayment.destroy({
      //   where: {
      //     bulk_collection_id: id,
      //   },
      // });
      // await BulkCollectionPayment.update(
      //   { isDeleted: false },
      //   {
      //     where: {
      //       bulk_collection_id: id,
      //     },
      //   }
      // );

      // Handle the removal of items in Order list
      if (removeIds) {
        for (const removeId of removeIds) {
          await SalesInvoice.update(
            {
              payAdded: false,
            },
            {
              where: {
                sales_invoice_id: removeId,
              },
            }
          );

          // await BulkCollectionTransaction.destroy({
          //   where: {
          //     bulk_collection_id: id,
          //     sales_invoice_id: removeId,
          //   },
          // });
          await BulkCollectionTransaction.update(
            { isDeleted: true },
            {
              where: {
                bulk_collection_id: id,
                sales_invoice_id: removeId,
              },
            }
          );
        }
      }

      // Handle removal of items in Payment list
      if (removeIdsPaymentList) {
        for (const removeId of removeIdsPaymentList) {
          await BulkCollectionPayment.update(
            {
              isDeleted: true,
            },
            {
              where: {
                id: removeId,
              },
            }
          );
        }
      }

      // Handle creation of new payment in Payment List
      if (floatPayment.length > 0) {
        for (const data of floatPayment) {
          if (!data.id) {
            await BulkCollectionPayment.create({
              bulk_collection_id: id,
              account_list_sub3_id: data.subject3 || null,
              payment_type: data.paymentMethod,
              check_number: data.checkNumber || null,
              ref_number: data.refNumber || null,
              amount: data.amount,
              date_issued: data.issuedDate || null,
              check_or_online: data.checkOrOnline || null,
              status: "Pending",
            });
          }
        }

        // Handle payment update
        for (const data of floatPayment.filter((item) => item.id)) {
          await BulkCollectionPayment.update(
            {
              amount: data.amount,
            },
            {
              where: {
                id: data.id,
                isDeleted: false,
              },
            }
          );
        }
      }

      const getUpdatedData = await BulkCollectionTransaction.findAll({
        include: [
          {
            model: BulkCollection,
            attributes: ["transaction_number"],
          },
          {
            model: SalesInvoice,
            attributes: ["transaction_id"],
          },
        ],
        where: {
          bulk_collection_id: id,
        },
      });

      const getUpdatedDataCollectionPayment =
        await BulkCollectionPayment.findAll({
          include: [
            {
              model: AccountListSub3,
              attributes: ["account_name"],
            },
          ],
          where: {
            bulk_collection_id: id,
          },
        });

      const getBulkCollectionData = getUpdatedData[0].bulk_collection;
      const getOldCollectionData = getData[0].bulk_collection;

      const oldOrderList = getData
        .map((record) => record.sales_invoice?.transaction_id)
        .join(", ");

      const updatedOrderList = getUpdatedData
        .map((record) => record.sales_invoice?.transaction_id)
        .join(", ");

      const oldPaymentList = getDataCollectionPayment
        .map((record) => record.account_list_sub3?.account_name)
        .join(", ");

      const updatedPaymentList = getUpdatedDataCollectionPayment
        .map((record) => record.account_list_sub3?.account_name)
        .join(", ");

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Local Collection: User updated local collection information with transaction ID ${getBulkCollectionData.transaction_number} \n 
        Collection Date: ${getOldCollectionData.collection_date} to ${collectionDate}
        Order List: [${oldOrderList}] to [${updatedOrderList}]
        Payment List: [${oldPaymentList}] to [${updatedPaymentList}]
        `,
      });
      return res.status(200).json({
        message: "Invoice approved and inventory updated successfully.",
      });
    } else {
      return res.status(400).json({ message: "Failed to update invoice." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router
  .route("/deleteLocalCollection/:localbulkId/:localCollectionDate")
  .delete(async (req, res) => {
    try {
      const id = req.params.localbulkId;
      const collectionDate = req.params.localCollectionDate;
      const { userLoggedID, transaction_id } = req.body;

      const getCutoff = await Cutoff.findOne({
        where: {
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
          isDeleted: false,
        },
      });
      const {
        from: dateFrom,
        to: dateTo,
        isPosted: postedCutoff,
        name: CutoffName,
      } = getCutoff;

      const getCollectionBulk = await BulkCollection.findOne({
        where: { id: id, isDeleted: false },
      });

      const issuedDate = new Date(getCollectionBulk.collection_date);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (issuedDate >= cutoffFrom && issuedDate <= cutoffTo) {
          return res.status(202).json({
            success: false,
            issuedDate: getCollectionBulk.collection_date,
            CutoffName: CutoffName,
          });
        }
      }

      // Data to Delete
      // const profitLossReportData = await ProfitLossReport.findAll({
      //   include: [
      //     {
      //       model: BulkCollectionPayment,
      //       required: true,
      //       include: [
      //         {
      //           model: BulkCollection,
      //           required: true,
      //           where: {
      //             transaction_number: transaction_id,
      //           },
      //         },
      //       ],
      //     },
      //   ],
      // });

      // for (const item of profitLossReportData) {
      //   // Delete Profit Loss Report
      //   await ProfitLossReport.destroy({
      //     where: {
      //       id: item.id,
      //     },
      //   });
      // }

      const checkBulk = await BulkCollection.findOne({
        where: {
          id: id,
          isDeleted: false,
        },
      });
      const { status: bulkStatus, transaction_number: transactionNumber } =
        checkBulk;

      const bulkTransaction = await BulkCollectionTransaction.findAll({
        where: { bulk_collection_id: id, isDeleted: false },
        attributes: ["sales_invoice_id"],
      });

      if (bulkStatus == "For Approval") {
        // await BulkCollectionPayment.destroy({
        //   where: { bulk_collection_id: id },
        // });

        await BulkCollectionPayment.update(
          { isDeleted: true },
          {
            where: { bulk_collection_id: id },
          }
        );

        if (bulkTransaction.length > 0) {
          for (const sales of bulkTransaction) {
            const { sales_invoice_id } = sales;
            await SalesInvoice.update(
              { payAdded: false },
              { where: { sales_invoice_id } }
            );
          }
        }

        // await CashFlow.destroy({
        //   where: { transaction_number: transactionNumber },
        // });
        await CashFlow.update(
          {
            isDeleted: true,
          },
          {
            where: { transaction_number: transactionNumber },
          }
        );

        // await BankTransaction.destroy({
        //   where: { transaction_number: transactionNumber },
        // });
        await BankTransaction.update(
          { isDeleted: true },
          {
            where: { transaction_number: transactionNumber },
          }
        );

        // await BulkCollectionTransaction.destroy({
        //   where: { bulk_collection_id: id },
        // });

        await BulkCollectionTransaction.update(
          {
            isDeleted: true,
          },
          {
            where: { bulk_collection_id: id },
          }
        );
        await BulkCollection.update({ isDeleted: true }, { where: { id: id } });
        // await BulkCollection.destroy({ where: { id: id } });

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Local Collection: User deleted local collection with transaction ID ${transactionNumber}`,
        });
        return res.status(200).json({
          success: true,
          message:
            "Local collection deleted successfully, and records cleared.",
        });
      }

      if (bulkStatus === "Approved" || bulkStatus === "Claimed") {
        const checkBulkData = await BulkCollectionPayment.findAll({
          where: { bulk_collection_id: id, isDeleted: false },
          include: [
            {
              model: BulkCollection,
              required: true,
            },
          ],
        });

        // await CashFlow.destroy({
        //   where: { transaction_number: transactionNumber },
        // });
        await CashFlow.update(
          {
            isDeleted: true,
          },
          {
            where: { transaction_number: transactionNumber },
          }
        );

        // await BankTransaction.destroy({
        //   where: { transaction_number: transactionNumber },
        // });

        await BankTransaction.update(
          { isDeleted: false },
          {
            where: { transaction_number: transactionNumber },
          }
        );

        for (const payment of checkBulkData) {
          const {
            status,
            payment_type,
            account_list_sub3_id,
            check_number,
            ref_number,
            check_or_online,
            amount,
            date_issued,
          } = payment;

          // if (
          //   (
          //     status === "Approved" && payment_type === "Cash") ||
          //   status === "Claimed"
          // )
          if (status === "Claimed") {
            await accountlist_sub3.decrement("amount", {
              by: amount,
              where: { id: account_list_sub3_id },
            });
          }
        }

        const bulkTransaction = await BulkCollectionTransaction.findAll({
          where: { bulk_collection_id: id, isDeleted: false },
          attributes: ["sales_invoice_id"],
        });

        if (bulkTransaction.length > 0) {
          for (const sales of bulkTransaction) {
            const { sales_invoice_id } = sales;
            await SalesInvoice.update(
              { payAdded: false },
              { where: { sales_invoice_id } }
            );
          }
        }

        // await BulkCollectionPayment.destroy({
        //   where: { bulk_collection_id: id },
        // });
        await BulkCollectionPayment.update(
          { isDeleted: true },
          {
            where: { bulk_collection_id: id },
          }
        );

        // await BulkCollectionTransaction.destroy({
        //   where: { bulk_collection_id: id },
        // });

        await BulkCollectionTransaction.update(
          { isDeleted: true },
          {
            where: { bulk_collection_id: id },
          }
        );

        // await BulkCollection.destroy({ where: { id: id } });

        await BulkCollection.update({ isDeleted: true }, { where: { id: id } });

        // await accountlist_transaction_subject.destroy({
        //   where: {
        //     transaction_number: transactionNumber,
        //   },
        // });

        await accountlist_transaction_subject.update(
          { isDeleted: true },
          {
            where: {
              transaction_number: transactionNumber,
            },
          }
        );

        return res.status(200).json({
          success: true,
          message:
            "Bulk collection deleted successfully, and transactions updated.",
        });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

//para sa pag approve o reject ng view local collection
router.route("/approveRejectLocalCollection").post(async (req, res) => {
  try {
    const {
      items,
      floatPayment,
      status,
      id,
      collectionDate,
      userLoggedID,
      transaction_num,
    } = req.body;

    const getCutoff = await Cutoff.findOne({
      where: {
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
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const {
      from: dateFrom,
      to: dateTo,
      isPosted: postedCutoff,
      name: CutoffName,
    } = getCutoff;

    const getInvoice = await BulkCollection.findOne({
      where: { id: id },
    });

    const invoiceDate = new Date(getInvoice.collection_date);
    const cutoffFrom = new Date(dateFrom);
    const cutoffTo = new Date(dateTo);

    if (postedCutoff == true) {
      if (invoiceDate >= cutoffFrom && invoiceDate <= cutoffTo) {
        return res.status(202).json({
          success: false,
          invoiceDate: getInvoice.collection_date,
          CutoffName: CutoffName,
          status: status,
        });
      }
    }
    // const { items, floatPayment, status, id,  } = req.body;

    const updateLocalCollection = await BulkCollection.update(
      {
        status: status,
        approved_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (updateLocalCollection) {
      for (const item of items) {
        // const checkSalesId = await BulkCollectionTransaction.findOne({
        //   where: {
        //     bulk_collection_id: id,
        //     sales_invoice_id: item.transactionId
        //   }
        // });

        // if(!checkSalesId){
        //   await BulkCollectionTransaction.create({
        //     bulk_collection_id: id,
        //     sales_invoice_id: item.transactionId
        //   })
        // }

        if (status === "Approved") {
          await SalesInvoice.update(
            { payAdded: true },
            { where: { sales_invoice_id: item.sales_invoice_id } }
          );

          for (const data of floatPayment) {
            const whereCondition = {
              bulk_collection_id: id,
              account_list_sub3_id:
                data.subject3 === null ? { [Op.eq]: null } : data.subject3,
            };

            const checkCollectionPayment = await BulkCollectionPayment.findOne({
              where: whereCondition,
            });

            if (checkCollectionPayment) {
              const checkAccount = await accountlist_sub3.findOne({
                where: { id: data.subject3 },
              });

              if (data.paymentMethod === "Cash") {
                const updatedAmount = data.amount + checkAccount.amount;
                await checkAccount.update({ amount: updatedAmount });

                await accountlist_transaction_subject.create({
                  account_list_sub3_id_transacted: data.subject3,
                  payment_method: data.paymentMethod,
                  amount: data.amount,
                  date: data.issuedDate,
                  check_or_remarks: data.checkNumber || data.refNumber,
                  type: "Debit",
                  module_from: "Local Collection",
                  transaction_number: transaction_num,
                });

                await BulkCollectionPayment.update(
                  {
                    status: "Claimed",
                    collected_by: userLoggedID,
                  },
                  {
                    where: whereCondition,
                  }
                );

                await CashFlow.create({
                  account_list_id_cash_to: data.subject3,
                  transaction_date: data.issuedDate,
                  transaction_number: transaction_num,
                  module_from: "Local Collection",
                  description: "Collection",
                  amount: data.amount,
                  status: "Collected",
                });
              } else {
                await BulkCollectionPayment.update(
                  {
                    status: status,
                  },
                  {
                    where: whereCondition,
                  }
                );
              }
            }
          }
        } else {
          await SalesInvoice.update(
            { payAdded: false },
            { where: { sales_invoice_id: item.sales_invoice_id } }
          );

          for (const data of floatPayment) {
            const whereCondition = {
              bulk_collection_id: id,
              account_list_sub3_id:
                data.subject3 === null ? { [Op.is]: null } : data.subject3,
            };

            const checkCollectionPayment = await BulkCollectionPayment.findOne({
              where: whereCondition,
            });

            if (checkCollectionPayment) {
              await BulkCollectionPayment.update(
                {
                  status: "Rejected",
                },
                {
                  where: whereCondition,
                }
              );
            }
          }
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Local Collection: User ${status.toLowerCase()} the local collection with transaction ID ${transaction_num}`,
      });

      return res
        .status(200)
        .json({ message: "Local collection approved successfully." });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to update local collection." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/collections/approve-reject").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      items,
      floatPayment,
      status,
      id,
      collectionDate,
      userLoggedID,
      transaction_num,
      module,
      salesJournal: { customerId, paymentType, currencyName, currencyRate },
    } = req.body;

    const isLocal = module === "Local";
    const moduleType = isLocal ? "Local Collection" : "Overseas Collection";

    // Determine if the current collection falls within a posted cutoff period
    const getCutoff = await Cutoff.findOne({
      where: {
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
        isDeleted: false,
      },
      transaction,
      order: [["createdAt", "DESC"]],
    });

    const {
      from: dateFrom,
      to: dateTo,
      isPosted: postedCutoff,
      name: CutoffName,
    } = getCutoff;

    const getInvoice = await BulkCollection.findOne({
      where: { id: id },
      transaction,
    });

    const invoiceDate = new Date(getInvoice.collection_date);
    const cutoffFrom = new Date(dateFrom);
    const cutoffTo = new Date(dateTo);

    if (postedCutoff == true) {
      if (invoiceDate >= cutoffFrom && invoiceDate <= cutoffTo) {
        return res.status(202).json({
          success: false,
          invoiceDate: getInvoice.collection_date,
          CutoffName: CutoffName,
          status: status,
        });
      }
    }

    // Update bulk collection status to "Approved" or "Rejected"
    const updateLocalCollection = await BulkCollection.update(
      {
        status: status,
        approved_by: userLoggedID,
        date_approved: await getAccurateDate(),
      },
      {
        where: {
          id: id,
        },
        transaction,
      }
    );

    if (updateLocalCollection) {
      const isApproved = status === "Approved";

      // Update sales invoice "payAdded" column
      for (const item of items) {
        await SalesInvoice.update(
          { payAdded: isApproved },
          {
            where: {
              sales_invoice_id: item.sales_invoice_id,
              isDeleted: false,
            },
            transaction,
          }
        );
      }

      // Handles float payment for approved transaction
      if (floatPayment.length && isApproved) {
        // For approved status
        for (const data of floatPayment) {
          const whereCondition = {
            bulk_collection_id: id,
            account_list_sub3_id:
              data.subject3 === null ? { [Op.eq]: null } : data.subject3,
          };

          const checkCollectionPayment = await BulkCollectionPayment.findOne({
            where: whereCondition,
            transaction,
          });

          if (checkCollectionPayment) {
            const isPaymentCash = data.paymentMethod === "Cash";

            // For cash payments
            if (isPaymentCash) {
              const getSub1 = await accountlist_sub3.findOne({
                where: {
                  id: data.subject3,
                },
                include: [
                  {
                    model: accountlist_base_subject,
                    required: true,
                  },
                ],
              });

              const sub3_AccountType =
                getSub1.account_list_base_sub.module_type;

              // await accountlist_sub3.increment("amount", {
              //   by: data.amount,
              //   where: { id: data.subject3 },
              //   transaction,
              // });

              if (sub3_AccountType === "Liabilities Account") {
                await accountlist_sub3.decrement("amount", {
                  by: data.amount,
                  where: { id: data.subject3 },
                  transaction,
                });
              } else {
                await accountlist_sub3.increment("amount", {
                  by: data.amount,
                  where: { id: data.subject3 },
                  transaction,
                });
              }

              await accountlist_transaction_subject.create(
                {
                  account_list_sub3_id_transacted: data.subject3,
                  payment_method: data.paymentMethod,
                  amount: data.amount,
                  date: data.issuedDate,
                  check_or_remarks: data.checkNumber || data.refNumber,
                  type:
                    sub3_AccountType === "Liabilities Account"
                      ? "Credit"
                      : "Debit",
                  module_from: moduleType,
                  transaction_number: transaction_num,
                  rate: currencyRate,
                },
                {
                  transaction,
                }
              );

              await BulkCollectionPayment.update(
                {
                  status: "Claimed",
                  collected_by: userLoggedID,
                },
                {
                  where: whereCondition,
                  transaction,
                }
              );

              await CashFlow.create(
                {
                  account_list_id_cash_to: data.subject3,
                  transaction_date: data.issuedDate,
                  transaction_number: transaction_num,
                  module_from: moduleType,
                  description:
                    sub3_AccountType === "Liabilities Account"
                      ? "Collected but recorded as Deduction"
                      : "Collection",
                  amount: data.amount,
                  status: "Collected",
                },
                { transaction }
              );

              // Make a sales journal record for sales report
              await SalesJournal.create(
                {
                  customer_id: customerId,
                  transaction_number: transaction_num,
                  date: data.issuedDate,
                  total_amount: data.amount,
                  total_quantity: 0,
                  avg_unit_price: 0,
                  payment_type: paymentType,
                  currency_name: currencyName,
                  currency_rate: currencyRate,
                },
                {
                  transaction,
                }
              );
            }

            // For bank payments
            if (!isPaymentCash) {
              await BulkCollectionPayment.update(
                {
                  status: status,
                },
                {
                  where: whereCondition,
                  transaction,
                }
              );

              // Create a check journal "Debit" entry for trial balance (Only for payment with check number)
              if (checkCollectionPayment.check_number) {
                await CheckJournal.create(
                  {
                    module_from: moduleType,
                    transaction_number: transaction_num,
                    transaction_date: collectionDate,
                    issued_date: data.issuedDate,
                    type: "Debit",
                    amount: data.amount,
                    check_number: checkCollectionPayment.check_number,
                    currency_name: currencyName,
                    currency_rate: currencyRate,
                  },
                  { transaction }
                );
              }
            }
          }
        }

        // --- Determine if the status of "BulkCollection" and "SalesInvoice" is "Partially Collected" or "Claimed/Collected" --- //
        const [receivable, claimedAmount, payments] = await Promise.all([
          // Find Total receivable and total claimed payment
          BulkCollection.findOne({
            attributes: ["total_amount"],
            where: {
              id,
              isDeleted: false,
            },
            transaction,
            raw: true,
          }),
          BulkCollectionPayment.sum("amount", {
            where: {
              bulk_collection_id: id,
              status: "Claimed",
              isDeleted: false,
            },
            transaction,
          }),
          // Get all payments
          BulkCollectionPayment.findAll({
            attributes: ["payment_type"],
            where: {
              bulk_collection_id: id,
              isDeleted: false,
            },
            transaction,
            raw: true,
          }),
        ]);

        // Check payments
        const isAllCash = payments.every((p) => p.payment_type === "Cash");
        const isAllBank = payments.every((p) => p.payment_type === "Bank");
        const allClaimed = receivable.total_amount === claimedAmount; // All payment claimed
        const isCollected = allClaimed && isAllCash; // All payment claimed and All payment is cash

        // Determines the final payment status
        const getStatus = (isAllBank, condition) => {
          const statusMap = {
            true: "Approved", // If all payment is bank return "Approved"
            false: condition, // if all payment is cash return "Claimed/Collected", if both bank and cash exist in payment return "Partially Collected"
          };

          return statusMap[isAllBank];
        };

        // Update "SalesInvoice" & "BulkCollection" status to "Partially Collected" or "Claimed/Collected"
        await SalesInvoice.update(
          {
            status: getStatus(
              isAllBank,
              isCollected ? "Collected" : "Partially Collected"
            ),
          },
          {
            where: {
              sales_invoice_id: {
                [Op.in]: items.map((item) => item.sales_invoice_id),
              },
              isDeleted: false,
            },
            transaction,
          }
        );

        await BulkCollection.update(
          {
            status: getStatus(
              isAllBank,
              isCollected ? "Claimed" : "Partially Collected"
            ),
          },
          {
            where: {
              id,
              isDeleted: false,
            },
            transaction,
          }
        );
      }

      // Handles float payment for rejected transaction
      if (floatPayment.length && !isApproved) {
        // For rejected status
        for (const data of floatPayment) {
          const whereCondition = {
            bulk_collection_id: id,
            account_list_sub3_id:
              data.subject3 === null ? { [Op.is]: null } : data.subject3,
          };

          const checkCollectionPayment = await BulkCollectionPayment.findOne({
            where: whereCondition,
            transaction,
          });

          if (checkCollectionPayment) {
            await BulkCollectionPayment.update(
              {
                status: "Rejected",
              },
              {
                where: whereCondition,
                transaction,
              }
            );
          }
        }
      }
    }

    // Create an activity log record
    await Activity_Log.create(
      {
        masterlist_id: userLoggedID,
        action_taken: `Local Collection: User ${status.toLowerCase()} the local collection with transaction ID ${transaction_num}`,
      },
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({
      message: "Local collection approved successfully.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//para sa fetching ng view local collection
router.route("/viewLocalBulkCollection").get(async (req, res) => {
  try {
    let data = await BulkCollection.findOne({
      where: {
        id: req.query.id,
        isDeleted: false,
      },
      include: [
        {
          model: Customer,
          required: true,
        },
        {
          model: Currency,
          required: true,
        },
        {
          model: BulkCollectionTransaction,
          required: false,
          include: [
            {
              model: SalesInvoice,
              required: true,
            },
          ],
          where: {
            isDeleted: false,
          },
        },
        {
          model: BulkCollectionPayment,
          required: false,
          include: [
            {
              model: accountlist_sub3,
              required: false,
            },
          ],
        },
      ],
    });

    const uniqueBySalesInvoiceId = [];
    const seen = new Set();

    if (data?.bulk_collection_transactions.length) {
      for (const item of data.bulk_collection_transactions) {
        const sales_invoice_id = item.sales_invoice_id;

        if (!seen.has(sales_invoice_id)) {
          seen.add(sales_invoice_id);
          uniqueBySalesInvoiceId.push(item);
        }
      }
    }

    const bulkPayments = data?.bulk_collection_payments.filter(
      (item) => item.isDeleted == false
    );

    // Filter only for bulk collection payment
    data = {
      ...data?.toJSON(),
      bulk_collection_transactions: uniqueBySalesInvoiceId,
      bulk_collection_payments: bulkPayments || [],
    };

    let isPosted;
    let cutoffExists;

    if (data?.collection_date && data?.collection_date !== null) {
      const findCutoff = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: { [Op.lte]: data.collection_date },
            },
            {
              to: { [Op.gte]: data.collection_date },
            },
          ],
          isDeleted: false,
        },
      });

      isPosted = findCutoff?.isPosted || false;
      cutoffExists = findCutoff;
    }

    if (!data) {
      return res.status(204).json();
    }
    return res.json({ data, isPosted, cutoffExists });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//for subject 1 dropdown pag nag-change "bulk collections"
router.route("/getSubject1LocalCollection").get(async (req, res) => {
  const { account_selected, selectedPayment, selected_currency_id } = req.query;

  try {
    const subjectWithSpecificCurrency = await accountlist_sub3.findOne({
      include: [
        {
          model: accountlist_base_subject,
          required: true,
          where: {
            module_type: account_selected,
          },
        },
        {
          model: Currency,
          required: true,
          where: {
            id: selected_currency_id,
          },
        },
      ],
    });

    if (!subjectWithSpecificCurrency) {
      return res.status(404).json({
        message: `No matching account (${account_selected}) exists for the selected currency.`,
      });
    }

    const subjects = await accountlist_base_subject.findAll({
      where: {
        module_type: account_selected,
        subject_type: selectedPayment,
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
router.route("/getSubject3LocalCollection").get(async (req, res) => {
  const { subjectId, selected_currency_id } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      where: {
        account_list_base_sub_id: subjectId,
        currency_id: selected_currency_id,
        isDeleted: false,
      },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getAccountList/:paymentMethod").get(async (req, res) => {
  const { paymentMethod } = req.params;
  try {
    const data = await AccountList.findAll({
      where: {
        account_type: paymentMethod,
      },
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: Currency,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getOutstanding_check").get(async (req, res) => {
  try {
    const data = await BulkCollection.findAll({
      include: [
        {
          model: BulkCollectionPayment,
          required: true,
          include: [
            {
              model: accountlist_sub3,
              required: true,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//for local collection module fetching
router.route("/getLocalCollectionData").get(async (req, res) => {
  try {
    const { startDate, endDate, filterColumn, currencyId } = req.query;
    let { searchTerm } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const numericText = searchTerm?.replace(/,/g, "");
    if (!isNaN(numericText)) {
      searchTerm = numericText;
    }

    let bulkCollectionWhereClause = {
      collection_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
      type: "Local",
    };
    let salesInvoiceWhereClause = {
      destination: "Local",
    };

    const bulkCollectionTableColumn = [
      "transaction_number",
      "collection_date",
      "status",
    ];

    if (searchTerm && searchTerm !== "") {
      switch (filterColumn) {
        // Filter For Transaction Number
        case "transaction_number":
          bulkCollectionWhereClause["transaction_number"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        // Filter for Transaction Date
        case "transaction_date":
          bulkCollectionWhereClause["collection_date"] = sequelize.where(
            literal(`CAST (collection_date AS CHAR)`),
            {
              [Op.like]: `%${searchTerm}%`,
            }
          );
          break;
        // Filter for discount
        case "discount":
          salesInvoiceWhereClause["transaction_discount"] = literal(
            `CAST(COALESCE(item_discount, 0) + COALESCE(transaction_discount, 0) AS CHAR) LIKE '%${searchTerm}%'`
          );
          break;
        // Filter for status
        case "status":
          if (searchTerm?.toLowerCase() == "collected") {
            bulkCollectionWhereClause["status"] = {
              [Op.like]: `%Claimed%`,
            };
          } else {
            bulkCollectionWhereClause["status"] = {
              [Op.like]: `%${searchTerm}%`,
            };
          }
          break;

        // Search filter for Transaction No., Transaction Date and Status
        default:
          bulkCollectionWhereClause = {
            [Op.and]: [
              {
                collection_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
                type: "Local",
              },
              {
                [Op.or]: bulkCollectionTableColumn.map((col) => {
                  switch (col) {
                    case "collection_date":
                      return {
                        [col]: sequelize.where(
                          literal(`CAST (collection_date AS CHAR)`),
                          {
                            [Op.like]: `%${searchTerm}%`,
                          }
                        ),
                      };
                      break;
                    case "status":
                      if (searchTerm?.toLowerCase() == "collected") {
                        return {
                          [col]: {
                            [Op.like]: `%Claimed%`,
                          },
                        };
                      } else {
                        return {
                          [col]: {
                            [Op.like]: `%${searchTerm}%`,
                          },
                        };
                      }
                      break;

                    default:
                      return {
                        [col]: {
                          [Op.like]: `%${searchTerm}%`,
                        },
                      };
                      break;
                  }
                }),
              },
            ],
          };
          break;
      }
    }

    async function dataQuery() {
      const { count, rows: data } = await BulkCollection.findAndCountAll({
        include: [
          {
            model: BulkCollectionTransaction,
            required: true,
            include: [
              {
                model: SalesInvoice,
                required: true,
                where: salesInvoiceWhereClause,
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
            model: BulkCollectionPayment,
            required: false,
          },
          {
            model: Currency,
            required: true,
            where: {
              ...(currencyId && currencyId !== "All" && { id: currencyId }),
            },
          },
        ],
        subQuery: false,
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        where: { ...bulkCollectionWhereClause, isDeleted: false },
      });

      return { count, data };
    }

    let { count, data } = await dataQuery();

    function collectionBalance(collections) {
      return collections?.map((collection) => {
        // const [rate] = collection.bulk_collection_transactions.map(
        //   (item) => item.sales_invoice.rate
        // );
        const totalPayments = collection.bulk_collection_payments
          .filter((item) => item.isDeleted === false)
          .reduce((sum, payment) => {
            return sum + payment.amount;
          }, 0);

        // const totalAmount =
        //   collection.bulk_collection_transactions[0]?.sales_invoice
        //     ?.total_amount || 0;

        const balance = totalPayments;

        return {
          ...collection.toJSON(),
          balance,
        };
      });
    }

    let collectionDataWithBalance = collectionBalance(data);

    // const totalCollection =
    //   parseFloat(
    //     data
    //       ?.flatMap(
    //         (item) =>
    //           item.bulk_collection_payments?.filter(
    //             (payment) => payment.status === "Approved"
    //           ) || []
    //       )
    //       .reduce((total, payment) => {
    //         return total + (parseFloat(payment.amount) || 0);
    //       }, 0) || 0
    //   ) || 0;
    // function collectionTotal(collections) {
    //   return (
    //     parseFloat(
    //       collections
    //         ?.flatMap((item) => {
    //           const currencyRate =
    //             item.bulk_collection_transactions[0]?.sales_invoice?.currency
    //               ?.currency_rate;
    //           console.log(currencyRate, "currency rate==============");
    //           console.log(item.bulk_collection_transactions);

    //           return (
    //             [
    //               ...item.bulk_collection_transactions,
    //               ...item.bulk_collection_payments
    //                 ?.filter((payment) => payment.status === "Approved")
    //                 .map((payment) => ({
    //                   ...payment,
    //                   convertedAmount: payment.amount,
    //                 })),
    //             ] || []
    //           );
    //         })
    //         .reduce((total, payment) => {
    //           const { amount } = payment;
    //           console.log(
    //             payment.sales_invoice?.currency?.currency_rate,
    //             "payment"
    //           );
    //           console.log(payment.currencyRate);
    //           console.log(amount, "invoice============");
    //           return (
    //             total +
    //             (parseFloat(
    //               payment.convertedAmount *
    //                 payment.sales_invoice?.currency?.currency_rate
    //             ) || 0)
    //           );
    //         }, 0) || 0
    //     ) || 0
    //   );
    // }

    // Orig Code
    // async function collectionTotal(collections) {
    //   const currencyData = await Currency.findAll();
    //   return collections
    //     .filter((item) => item.status === "Approved")
    //     .reduce((total, value) => {
    //       const amount = value.bulk_collection_payments.reduce(
    //         (total, value) => {
    //           return total + value.amount;
    //         },
    //         0
    //       );
    //       const findCurrencyRate = currencyData.find((item) => {
    //         return item.id == value.currency_id;
    //       });

    //       return total + parseFloat(amount * findCurrencyRate.currency_rate);
    //     }, 0);
    // }

    async function collectionTotal(collections) {
      return collections
        .filter((item) =>
          currencyId === "All"
            ? item.status === "Approved"
            : item.status === "Approved" && item.currency_id === currencyId
        )
        .reduce((total, bulkCollection) => {
          const amount = bulkCollection.bulk_collection_transactions.reduce(
            (subtotal, transaction) => {
              const salesInvoiceRate = transaction.sales_invoice?.rate || 1;
              // console.log("Rate", salesInvoiceRate);

              const salesInvoiceAmout = transaction.sales_invoice?.total_amount;

              // console.log("Amount", salesInvoiceAmout);

              // const transactionTotal = salesInvoiceRate * salesInvoiceAmout;
              const transactionTotal =
                currencyId === "All"
                  ? salesInvoiceRate * salesInvoiceAmout
                  : salesInvoiceAmout;

              return subtotal + transactionTotal;
            },
            0
          );

          return total + parseFloat(amount);
        }, 0);
    }

    let totalCollection = await collectionTotal(data);

    console.log("TOOOOOTALLL", totalCollection);

    // Search for balance
    if (filterColumn === "balance") {
      bulkCollectionWhereClause = {
        collection_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        type: "Local",
      };
      salesInvoiceWhereClause = {
        destination: "Local",
      };
      let { count, data } = await dataQuery();
      collectionDataWithBalance = collectionBalance(data);
      totalCollection = await collectionTotal(data);
      if (!searchTerm) {
        return res.json({
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page || 1),
          data: { collectionDataWithBalance, totalCollection },
        });
      }
      const filteredBalance = collectionDataWithBalance.filter((item) => {
        const balanceToString = item.balance.toString();
        return (
          balanceToString.includes(searchTerm) || balanceToString == searchTerm
        );
      });
      console.log(filteredBalance);

      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: { collectionDataWithBalance: filteredBalance, totalCollection },
      });
    }

    // If data is empty search for Discount and Balance
    if (data.length === 0 && filterColumn == "all") {
      const discountAndBalance = ["discount", "balance"];
      for (const item of discountAndBalance) {
        let filteredBalance;
        bulkCollectionWhereClause = {
          collection_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
          type: "Local",
        };
        salesInvoiceWhereClause = {
          destination: "Local",
        };

        // Conditional query between discount and balance
        if (item === "discount") {
          // Search for discount
          salesInvoiceWhereClause["transaction_discount"] = literal(
            `CAST(COALESCE(item_discount, 0) + COALESCE(transaction_discount, 0) AS CHAR) LIKE '%${searchTerm}%'`
          );

          let { count, data } = await dataQuery();
          collectionDataWithBalance = collectionBalance(data);
          totalCollection = await collectionTotal(data);

          if (data.length > 0) {
            return res.json({
              totalItems: count,
              totalPages: Math.ceil(count / limit),
              currentPage: parseInt(page || 1),
              data: { collectionDataWithBalance, totalCollection },
            });
          }
        } else {
          // Search for Balance
          let { count, data } = await dataQuery();
          collectionDataWithBalance = collectionBalance(data);
          totalCollection = await collectionTotal(data);
          if (!searchTerm) {
            return res.json({
              totalItems: count,
              totalPages: Math.ceil(count / limit),
              currentPage: parseInt(page || 1),
              data: { collectionDataWithBalance, totalCollection },
            });
          }
          filteredBalance = collectionDataWithBalance.filter((item) => {
            const balanceToString = item.balance.toString();
            return (
              balanceToString.includes(searchTerm) ||
              balanceToString === searchTerm
            );
          });

          if (data.length > 0) {
            return res.json({
              totalItems: count,
              totalPages: Math.ceil(count / limit),
              currentPage: parseInt(page || 1),
              data: {
                collectionDataWithBalance: filteredBalance,
                totalCollection,
              },
            });
          }
        }
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: { collectionDataWithBalance, totalCollection },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/collection-payment").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;

    // Validate query params
    const missingParams = Object.entries({
      startDate,
      endDate,
      domestic_type,
      currencyId,
    })
      .filter(([_, item]) => !item)
      .map(([key]) => key);

    if (missingParams.length)
      return res
        .status(400)
        .json({ error: `Missing query params: ${missingParams.join(", ")}` });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic

    const { count, rows: collectionPayment } =
      await BulkCollectionPayment.findAndCountAll({
        // prettier-ignore
        attributes: [
          "id",
          "createdAt",
          "date_issued",
          "amount",
          "status",
          "check_number",
          "ref_number",
          "payment_type",
          [
            sequelize.literal(`
            CASE
              WHEN company_name IS NULL OR company_name = "" THEN CONCAT(COALESCE(first_name, ""), " ", COALESCE(last_name, ""))
              ELSE company_name
            END
          `),
            "customerName",
          ],
          [sequelize.literal(`bulk_collection.customer_id`), "customerId"],
          [sequelize.literal(`currency_rate`), "currencyRate"],
          [sequelize.literal(`currency_name`), "currencyName"],
          [sequelize.literal(`transaction_number`), "transactionNumber"],
          [sequelize.literal(`account_name`), "accountName"],
          [sequelize.literal(`bulk_collection.id`), "bulkCollectionId"],
          [sequelize.literal(`bulk_collection.collection_date`), "transactionDate"],
          [sequelize.literal(`bulk_collection.type`), "domesticType"],
          [sequelize.literal(`account_list_sub3.id`), "subject3"],
        ],
        include: [
          {
            model: BulkCollection,
            required: true,
            attributes: [],
            include: [
              {
                model: Customer,
                required: true,
                attributes: [],
              },
              {
                model: Currency,
                required: true,
                attributes: [],
              },
            ],
            where: {
              ...(currencyId !== "All" && { currency_id: currencyId }),
              type,
              status: {
                [Op.in]: ["Approved", "Partially Collected", "Claimed"],
              },
              isDeleted: false,
            },
          },
          {
            model: accountlist_sub3,
            required: false, // Include payments with a check number and without the selected subject 3
            attributes: [],
          },
        ],
        where: {
          date_issued: {
            [Op.between]: [startDate, endDate],
          },
          isDeleted: false,
        },
        limit,
        offset,
      });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: collectionPayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/collection-payment/search").get(async (req, res) => {
  try {
    let { searchText } = req.query;
    const { startDate, endDate, domestic_type, currencyId, filterColumn } =
      req.query;

    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Remove commas of searchText if it is numeric/number
    if (searchText && searchText.trim() !== "") {
      const numericText = searchText.replace(/,/g, "");
      if (!isNaN(numericText)) {
        searchText = numericText;
      }
    }

    const bulkCollectionPaymentWhereClause = {
      date_issued: {
        [Op.between]: [startDate, endDate],
      },
      isDeleted: false,
    };

    // For search filter
    const filterCondition = (field) =>
      field === filterColumn || filterColumn === "all";

    const searchFilter = {
      date_issued: dateFormatFilter,
      "bulk_collection.transaction_number": likeFilter,
      "bulk_collection_payment.status": likeFilter,
      "bulk_collection_payment.amount": castFilter,
      "bulk_collection_payment.createdAt": createdAtFilter,
    };

    const bulidFilters = Object.entries(searchFilter).reduce(
      (acc, [col, fn]) => {
        if (filterCondition(col)) acc.push(fn(searchText, col));
        return acc;
      },
      []
    );

    // Main query
    const { count, rows: collectionPayment } =
      await BulkCollectionPayment.findAndCountAll({
        // prettier-ignore
        attributes: [
          "id",
          "createdAt",
          "date_issued",
          "amount",
          "status",
          "check_number",
          "ref_number",
          "payment_type",
          [
            sequelize.literal(`
            CASE
              WHEN company_name IS NULL OR company_name = "" THEN CONCAT(COALESCE(first_name, ""), " ", COALESCE(last_name, ""))
              ELSE company_name
            END
          `),
            "customerName",
          ],
          [sequelize.literal(`bulk_collection.customer_id`), "customerId"],
          [sequelize.literal(`currency_rate`), "currencyRate"],
          [sequelize.literal(`currency_name`), "currencyName"],
          [sequelize.literal(`transaction_number`), "transactionNumber"],
          [sequelize.literal(`account_name`), "accountName"],
          [sequelize.literal(`bulk_collection.id`), "bulkCollectionId"],
          [sequelize.literal(`bulk_collection.collection_date`), "transactionDate"],
          [sequelize.literal(`bulk_collection.type`), "domesticType"],
          [sequelize.literal(`account_list_sub3.id`), "subject3"],
        ],
        include: [
          {
            model: BulkCollection,
            required: true,
            attributes: [],
            include: [
              {
                model: Customer,
                required: true,
                attributes: [],
              },
              {
                model: Currency,
                required: true,
                attributes: [],
              },
            ],
            where: {
              ...(currencyId !== "All" && { currency_id: currencyId }),
              type,
              status: {
                [Op.in]: ["Approved", "Partially Collected", "Claimed"],
              },
              isDeleted: false,
            },
          },
          {
            model: accountlist_sub3,
            required: false, // Include payments with a check number and without the selected subject 3
            attributes: [],
          },
        ],
        where: {
          ...bulkCollectionPaymentWhereClause,
          ...(searchText.trim() !== "" && { [Op.or]: bulidFilters }),
        },
        limit,
        offset,
      });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: collectionPayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/searchSalesData").get(async (req, res) => {
  const { query, filterColumn } = req.query;

  try {
    let whereCondition = {};
    const baseCondition = {
      type: "Local",
    };

    if (filterColumn) {
      switch (filterColumn) {
        case "transaction_id":
          whereCondition = {
            transaction_number: {
              [Op.like]: `%${query}%`,
            },
          };
          break;
        case "transaction_date":
          whereCondition = {
            collection_date: {
              [Op.like]: `%${query}%`,
            },
          };
          break;
        case "status":
          whereCondition = {
            status: {
              [Op.like]: `%${query}%`,
            },
          };
          break;
        case "destination":
          whereCondition = {
            "$bulk_collection_transactions.sales_invoice.destination$": {
              [Op.like]: `%${query}%`,
            },
          };
          break;
        case "discount":
          whereCondition = {
            "$bulk_collection_transactions.sales_invoice.transaction_discount$":
              {
                [Op.like]: `%${query}%`,
              },
          };
          break;
        case "balance":
          break;
      }
    } else {
      whereCondition = {
        [Op.or]: [
          { transaction_number: { [Op.like]: `%${query}%` } },
          { collection_date: { [Op.like]: `%${query}%` } },
          { status: { [Op.like]: `%${query}%` } },
          {
            "$bulk_collection_transactions.sales_invoice.destination$": {
              [Op.like]: `%${query}%`,
            },
          },
          {
            "$bulk_collection_transactions.sales_invoice.transaction_discount$":
              { [Op.like]: `%${query}%` },
          },
        ],
      };
    }

    const data = await BulkCollection.findAll({
      include: [
        {
          model: BulkCollectionTransaction,
          required: true,
          include: [
            {
              model: SalesInvoice,
              required: true,
              where: {
                destination: "Local",
              },
            },
          ],
        },
        {
          model: BulkCollectionPayment,
          required: true,
        },
      ],
      where: {
        ...baseCondition,
        ...whereCondition,
      },
    });

    // Calculate balance after fetching the data
    const updatedData = data.map((collection) => {
      const totalPayments = collection.bulk_collection_payments.reduce(
        (sum, payment) => {
          return sum + payment.amount;
        },
        0
      );

      const balance = totalPayments;

      return {
        ...collection.toJSON(),
        balance,
      };
    });

    res.json(updatedData);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//fetching ng customer sa view bulk collection
router.route("/getTransactionsByCustomerLocal").get(async (req, res) => {
  try {
    const {
      customer_id,
      selected_currency_id,
      // searchText,
      filterColumn,
      selectedRow,
    } = req.query;

    let { searchText } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const numericText = searchText?.replace(/,/g, "");

    if (!isNaN(numericText)) {
      searchText = numericText;
    }

    // Where clause for sales invoice
    let salesInvoiceWhereClause = {
      customer_id: customer_id || null,
      currency_id: selected_currency_id || null,
      destination: "Local",
      status: "Approved",
      payAdded: false,
    };

    // Sales Invoice Table column name
    const salesInvoiceTableColumn = [
      // "transaction_id",
      // "remarks",
      "invoice_date",
      "due_date",
      "dr_number",
      "po_number",
      "total_amount",
      "discount",
    ];

    // Handle Search
    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_id":
        case "remarks":
        case "po_number":
          salesInvoiceWhereClause[filterColumn] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "dr_number":
          salesInvoiceWhereClause = {
            [Op.and]: [
              {
                customer_id: customer_id,
                currency_id: selected_currency_id,
                destination: "Local",
                status: "Approved",
                payAdded: false,
              },
              literal(
                `COALESCE(NULLIF(dr_number, ""), container_number) LIKE '%${searchText}%'`
              ),
            ],
          };
          break;

        case "invoice_date":
        case "due_date":
        case "total_amount":
          salesInvoiceWhereClause = {
            [Op.and]: [
              {
                customer_id: customer_id,
                currency_id: selected_currency_id,
                destination: "Local",
                status: "Approved",
                payAdded: false,
              },
              sequelize.where(literal(`CAST(${filterColumn} AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        case "discount":
          salesInvoiceWhereClause = {
            [Op.and]: [
              {
                customer_id: customer_id,
                currency_id: selected_currency_id,
                destination: "Local",
                status: "Approved",
                payAdded: false,
              },
              literal(
                `CAST(COALESCE(item_discount, 0) + COALESCE(transaction_discount, 0) AS CHAR) LIKE '%${searchText}%'`
              ),
            ],
          };
          break;
        default:
          salesInvoiceWhereClause = {
            [Op.and]: [
              {
                customer_id: customer_id,
                currency_id: selected_currency_id,
                destination: "Local",
                status: "Approved",
                payAdded: false,
              },
              {
                [Op.or]: salesInvoiceTableColumn.map((col) => {
                  switch (col) {
                    // case "transaction_id":
                    // case "remarks":
                    case "po_number":
                      return {
                        [col]: {
                          [Op.like]: `%${searchText}%`,
                        },
                      };
                      break;

                    case "dr_number":
                      return literal(
                        `COALESCE(NULLIF(dr_number, ""), container_number) LIKE '%${searchText}%'`
                      );

                    case "invoice_date":
                    case "due_date":
                    case "total_amount":
                      return sequelize.where(literal(`CAST(${col} AS CHAR)`), {
                        [Op.like]: `%${searchText}%`,
                      });
                      break;

                    case "discount":
                      return literal(
                        `CAST(COALESCE(item_discount, 0) + COALESCE(transaction_discount, 0) AS CHAR) LIKE '%${searchText}%'`
                      );
                      break;
                  }
                }),
              },
            ],
          };
          break;
      }
    }

    if (selectedRow) {
      salesInvoiceWhereClause["transaction_id"] = {
        [Op.notIn]: selectedRow,
      };
    }

    // For Modal Table
    const { count, rows: data } = await SalesInvoice.findAndCountAll({
      subQuery: false,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: { ...salesInvoiceWhereClause, isDeleted: false },
    });

    // For Table
    const items = await SalesInvoice.findAll({
      where: {
        transaction_id: {
          [Op.in]: selectedRow?.length > 0 ? selectedRow : [],
        },
        isDeleted: false,
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: { data, items },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

router.route("/getCustomerData").get(async (req, res) => {
  try {
    const data = await Customer.findAll({
      where: {
        isDeleted: false,
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/deleteOrderListTransaction").put(async (req, res) => {
  try {
    const { id, idToRemove } = req.body;

    await SalesInvoice.update(
      {
        payAdded: false,
      },
      {
        where: {
          sales_invoice_id: idToRemove,
        },
      }
    );

    await BulkCollectionTransaction.update(
      { isDeleted: true },
      {
        where: {
          bulk_collection_id: id,
          sales_invoice_id: idToRemove,
        },
      }
    );

    res.status(200).json({ message: "Order List Successfully Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router
  .route("/getBackOrderListTransaction")
  .post(express.text({ type: "*/*" }), async (req, res) => {
    try {
      const { id, idToAdd } = req.body;

      await SalesInvoice.update(
        {
          payAdded: true,
        },
        {
          where: {
            sales_invoice_id: {
              [Op.in]: idToAdd,
            },
          },
        }
      );

      await BulkCollectionTransaction.update(
        { isDeleted: false },
        {
          where: {
            bulk_collection_id: id,
            sales_invoice_id: {
              [Op.in]: idToAdd,
            },
          },
        }
      );

      res
        .status(200)
        .json({ message: "Order List Transaction Successfully Updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

module.exports = router;
