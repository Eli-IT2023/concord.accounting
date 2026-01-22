const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Currency,
  Cutoff,
  Vendors,
  Product_Tag_Vendor,
  ProductList,
  Expenses,
  Expenses2,
  Expenses1,
  PayBulkExpensesTransaction,
  PayBulkExpenses,
  PayBulkAddDeductExpenses,
  PayBulkExpensesPayment,
  FixedAsset,
  Activity_Log,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  currency_sub,
  bank_transaction,
  CashFlow,
  issued_check,
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
// Used Module:
// Expenses
router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await Expenses.findOne({
      where: {
        transaction_id: {
          [Op.like]: `EXP-${currentMonth}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_id) {
      // console.log(`Last Pay Code: ${lastPayCode.transaction_id}`);
      const latestRefCode = lastPayCode.transaction_id;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `EXP-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `EXP-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `EXP-${currentMonth}-00001`;
    }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Used Module:
// Expenses
// Local Expenses
// overseas Expenses
// router.route("/fetch_data").get(async (req, res) => {
//   const { type, fromDate, toDate } = req.query;
//   // console.log(`fromDate: ${fromDate}, toDate: ${toDate}`);

//   try {
//     // Parse and format dates using moment.js
//     const fromDateTime = moment(fromDate)
//       .startOf("day")
//       .format("YYYY-MM-DD HH:mm:ss");
//     const toDateTime = moment(toDate)
//       .endOf("day")
//       .format("YYYY-MM-DD HH:mm:ss");

//     console.log(`Formatted dates - From: ${fromDateTime}, To: ${toDateTime}`);

//     const whereClause =
//       type === "All"
//         ? {
//             createdAt: {
//               [Op.between]: [fromDateTime, toDateTime],
//             },
//           }
//         : {
//             foreign: type,
//             createdAt: {
//               [Op.between]: [fromDateTime, toDateTime],
//             },
//           };

//     const isFetch = await Expenses.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Expenses2,
//           required: false,
//           include: [
//             {
//               model: Expenses1,
//               required: true,
//             },
//           ],
//         },
//         {
//           model: ProductList,
//           required: false,
//         },
//         {
//           model: Expenses_Payment,
//           required: false,
//         },
//       ],
//     });

//     if (isFetch && isFetch.length > 0) {
//       return res.json(isFetch);
//     }
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// });

// Used Module:
// Expenses
router.route("/fetch_data_update").get(async (req, res) => {
  const { id } = req.query;
  const isFetch = await Expenses.findOne({
    where: {
      id: id,
    },
    include: [
      {
        model: Expenses2,
        required: false,
        include: [
          {
            model: Expenses1,
            required: true,
          },
        ],
      },
    ],
  });

  const findCutoff = await Cutoff.findOne({
    where: {
      [Op.and]: [
        {
          from: { [Op.lte]: isFetch.expenses_date },
        },
        {
          to: { [Op.gte]: isFetch.expenses_date },
        },
      ],
    },
  });

  const isPosted = findCutoff.isPosted;

  const plainData = isFetch.get({ plain: true });
  plainData.isPosted = isPosted;

  if (isFetch) {
    return res.json(plainData);
  }
});

router.route("/getVendorProduct").get(async (req, res) => {
  try {
    const isFetch = await Vendors.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          required: false,

          include: [
            {
              model: ProductList,
              required: true,
              where: {
                product_category: "Fixed Asset",
              },
            },
          ],
        },
      ],
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getExpensesData").get(async (req, res) => {
  try {
    const { startDate, endDate, filterColumn, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let expensesWhereClause = {
      expenses_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    let expenseOneWhereClause = {};
    let expenseTwoWhereClause = {};
    const expensesTableColumn = [
      "transaction_id",
      "foreign",
      "totalAmount",
      "desc",
      "expenses_date",
      "status",
    ];

    switch (filterColumn) {
      // Filter transaction id
      case "transaction_id":
        expensesWhereClause["transaction_id"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter Expense type 1
      case "expenses_type1":
        expenseOneWhereClause["expenses_type_one"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      case "expenses_type2":
        expenseTwoWhereClause["sub_type"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter foreign type
      case "foreign_type":
        expensesWhereClause["foreign"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter amount
      case "amount":
        if (searchText !== null && searchText !== "") {
          expensesWhereClause["totalAmount"] = sequelize.where(
            literal(`CAST(totalAmount AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
        }
        break;
      // Filter Description
      case "description":
        expensesWhereClause["desc"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter Expenses Date
      case "expenses_date":
        expensesWhereClause = {
          [Op.and]: [
            {
              expenses_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            sequelize.where(literal(`CAST(expenses_date AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            }),
          ],
        };
        break;
      // Filter Status
      case "status":
        expensesWhereClause["status"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter for all
      default:
        expensesWhereClause = {
          [Op.and]: [
            {
              expenses_date: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },

            {
              [Op.or]: expensesTableColumn.map((col) => {
                if (col === "totalAmount") {
                  return {
                    [col]: sequelize.where(
                      literal(`CAST(totalAmount AS CHAR)`),
                      {
                        [Op.like]: `%${searchText}%`,
                      }
                    ),
                  };
                } else if (col === "expenses_date") {
                  return sequelize.where(
                    literal(`CAST(expenses_date AS CHAR)`),
                    {
                      [Op.like]: `%${searchText}%`,
                    }
                  );
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

    let { count, rows: data } = await Expenses.findAndCountAll({
      include: [
        {
          model: Expenses2,
          required: true,
          include: [
            {
              model: Expenses1,
              required: true,
              where: expenseOneWhereClause,
            },
          ],
          where: expenseTwoWhereClause,
        },
        {
          model: Currency,
          required: true,
        },
      ],
      where: { ...expensesWhereClause, isDeleted: false },
      order: [["transaction_id", "DESC"]],
      limit: limit,
      offset: offset,
    });

    // Filter for "All" // if data is empty, search for expense type 1 or expense type 2
    if (data.length === 0 && filterColumn === "all") {
      // reset all where clause
      expenseOneWhereClause = {};
      expenseTwoWhereClause = {};
      const whereClauseArray = ["expenses_type_one", "sub_type"];

      for (let index = 0; index < whereClauseArray.length; index++) {
        expensesWhereClause = {
          expenses_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };
        if (whereClauseArray[index] === "sub_type") {
          expenseOneWhereClause = {};
          expenseTwoWhereClause = {
            sub_type: {
              [Op.like]: `%${searchText}%`,
            },
          };
        } else {
          expenseTwoWhereClause = {};
          expenseOneWhereClause = {
            expenses_type_one: {
              [Op.like]: `%${searchText}%`,
            },
          };
        }
        ({ count, rows: data } = await Expenses.findAndCountAll({
          include: [
            {
              model: Expenses2,
              required: true,
              include: [
                {
                  model: Expenses1,
                  required: true,
                  where: expenseOneWhereClause,
                },
              ],
              where: expenseTwoWhereClause,
            },
            {
              model: Currency,
              required: true,
            },
          ],
          where: { ...expensesWhereClause, isDeleted: false },
          order: [["transaction_id", "DESC"]],
          distinct: true,
          limit: limit,
          offset: offset,
        }));

        if (data.length > 0) {
          break;
        }
      }
    }

    if (data) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//para sa pagredirect sa specific expenses na nagclick sa notification
router.route("/getExpensesDataNotification").get(async (req, res) => {
  const { startDate, endDate, id } = req.query;
  try {
    const data = await Expenses.findAll({
      include: [
        {
          model: Expenses2,
          required: true,
          include: [
            {
              model: Expenses1,
              required: true,
            },
          ],
        },
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        expenses_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        id: id,
      },
      order: [["transaction_id", "DESC"]],
    });
    return res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.route("/createExpenses").post(async (req, res) => {
  try {
    const {
      totalAmount,
      desc,
      expenses_date,
      dueDate,
      expensesSubType_id,
      transaction_id,
      foreign,
      selected_currency_id,
      productName,
      unitPrice,
      assetQuantity,
      userLoggedID,
      currencyRate,
    } = req.body;

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: expenses_date } },
          { to: { [Op.gte]: expenses_date } },
        ],
        isPosted: true,
      },
    });

    if (isPosted) {
      return res.status(201).json({ message: "Cutoff already posted" });
    }

    // const isDueDatePosted = await Cutoff.findOne({
    //   where: {
    //     [Op.and]: [
    //       { from: { [Op.lte]: dueDate } },
    //       { to: { [Op.gte]: dueDate } },
    //     ],
    //     isPosted: true,
    //   },
    // });

    // if (isPosted) {
    //   return res.status(202).json({ message: "Cutoff already posted" });
    // }

    // First, create the Expenses entry
    const isCreate = await Expenses.create({
      desc: desc,
      expenses_date: expenses_date,
      expenses2_id: expensesSubType_id || null,
      totalAmount: totalAmount,
      transaction_id: transaction_id,
      foreign: foreign,
      status: "For-Approval",
      due_date: dueDate,
      currency_id: selected_currency_id,
      product_name: productName === "" ? null : productName,
      unitPrice: unitPrice === "" ? null : unitPrice,
      assetQuantity: assetQuantity === "" ? null : assetQuantity,
      created_by: userLoggedID,
      rate: currencyRate,
    });

    if (isCreate) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Expenses: User created new expenses with transaction ID ${transaction_id}`,
      });
    }
    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/updateExpenses").post(async (req, res) => {
  try {
    const {
      id,
      totalAmount,
      desc,
      expenses_date,
      dueDate,
      expensesSubType_id,
      transaction_id,
      foreign,
      selected_currency_id,
      productName,
      unitPrice,
      assetQuantity,
      userLoggedID,
      currencyRate,
    } = req.body;

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: expenses_date } },
          { to: { [Op.gte]: expenses_date } },
        ],
        isPosted: true,
      },
    });

    if (isPosted) {
      return res.status(201).json({ message: "Cutoff already posted" });
    }

    const getData = await Expenses.findOne({
      include: [
        {
          model: Currency,
        },
        {
          model: Expenses2,
        },
      ],
      where: {
        id: id,
      },
    });

    console.log(
      "getData cyyyrr",
      getData.currency.currency_name,
      getData.expenses2.sub_type
    );

    // First, create the Expenses entry
    const isUpdate = await Expenses.update(
      {
        desc: desc,
        expenses_date: expenses_date,
        due_date: dueDate,
        expenses2_id: expensesSubType_id || null,
        totalAmount: totalAmount,
        foreign: foreign,
        currency_id: selected_currency_id,
        product_name: productName === "" ? null : productName,
        unitPrice: unitPrice === "" ? null : unitPrice,
        assetQuantity: assetQuantity === "" ? null : assetQuantity,
        rate: currencyRate,
      },
      {
        where: {
          id: id,
        },
      }
    );

    const findCurr = await Currency.findOne({
      where: {
        id: selected_currency_id,
      },
      attributes: ["currency_name"],
    });

    const findEx2 = await Expenses2.findOne({
      where: {
        id: expensesSubType_id,
      },
      attributes: ["sub_type"],
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Expenses: Update expenses information with transaction ID ${
        getData.transaction_id
      }: \n
      Expenses Date:'${getData.expenses_date}' to '${expenses_date}',
      Description '${getData.desc}' to '${desc}',
      Due Date'${getData.due_date}' to '${dueDate}',
      Total Amount: '${getData.totalAmount}' to '${totalAmount}',
      Currency: '${getData.currency.currency_name}' to '${
        findCurr.currency_name
      }',
      Type'${getData.expenses2.sub_type}' to '${findEx2.sub_type}',
      Foreign: '${getData.foreign}' to '${foreign}',
      Product Name:'${getData.product_name ? getData.product_name : ""}' to '${
        productName ? productName : ""
      }',
      Unit Price: '${getData.unitPrice ? getData.unitPrice : ""}' to '${
        unitPrice ? unitPrice : ""
      }',
      Asset QTY: '${getData.assetQuantity ? getData.assetQuantity : ""}' to '${
        assetQuantity ? assetQuantity : ""
      }',
     `,
    });

    if (isUpdate) {
      return res.status(200).json({ message: "Updates successful" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router
  .route("/deleteExpenses/:expensesId/:expensesDate")
  .delete(async (req, res) => {
    try {
      const { userLoggedID } = req.body;

      const id = req.params.expensesId;
      const expenses_Date = req.params.expensesDate;
      const getCutoff = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: expenses_Date, // from date is less than or equal to purchase date
              },
            },
            {
              to: {
                [Op.gte]: expenses_Date, // to date is greater than or equal to purchase date
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

      const getExpenses = await Expenses.findOne({
        where: { id: id, isDeleted: false },
      });

      const expensesDate = new Date(getExpenses.expenses_date);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (expensesDate >= cutoffFrom && expensesDate <= cutoffTo) {
          return res.status(202).json({
            success: false,
            expensesDate: getExpenses.expenses_date,
            CutoffName: CutoffName,
          });
        }
      }

      const checkTransaction = await PayBulkExpensesTransaction.findOne({
        where: { expenses_id: id, isDeleted: false },
        include: [{ model: PayBulkExpenses, required: true }],
      });

      if (checkTransaction) {
        const transactionNumber =
          checkTransaction.pay_bulk_expense.transaction_number;
        const moduleType = checkTransaction.pay_bulk_expense.module_from;
        return res.status(203).json({
          success: false,
          transactionNumber,
          moduleType,
        });
      }

      const checkFixedAsset = await FixedAsset.findOne({
        where: { expenses_id: id },
      });

      if (checkFixedAsset) {
        const fixedAssetTransactionNumber = checkFixedAsset.transaction_code;
        const module = "Fixed Asset";
        return res.status(300).json({
          success: false,
          fixedAssetTransactionNumber,
          module,
        });
      }

      // await Expenses.destroy({ where: { id: id } });

      await Expenses.update(
        { isDeleted: true },
        {
          where: { id: id },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Expenses: User deleted an expense with transaction ID ${getExpenses.transaction_id}`,
      });

      return res.status(200).json({
        success: true,
        message: "Expenses deleted successfully.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

router.route("/approved").post(async (req, res) => {
  try {
    const { id, userLoggedID } = req.query;

    const updateExpenses = await Expenses.update(
      {
        status: "Approved",
        approved_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    //For Activity Logs
    const getData = await Expenses.findOne({
      where: {
        id: id,
      },
      attributes: ["transaction_id"],
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Expenses: User approved the expenses with transaction ID ${getData.transaction_id}`,
    });

    if (updateExpenses) {
      return res.status(200).json({ message: "Updates successful" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/rejected").post(async (req, res) => {
  try {
    const { id, userLoggedID } = req.query;

    const updateExpenses = await Expenses.update(
      {
        status: "Rejected",
        approved_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    //For Activity Logs
    const getData = await Expenses.findOne({
      where: {
        id: id,
      },
      attributes: ["transaction_id"],
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Expenses: User rejected the expenses with transaction ID ${getData.transaction_id}`,
    });

    if (updateExpenses) {
      return res.status(200).json({ message: "Updates successful" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchLastCutoffExpense").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Calculate the totalAmount sum
    // const totalLastCutoffExpense = await Expenses.sum("totalAmount", {
    //   where: {
    //     [Op.and]: [
    //       {
    //         expenses_date: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //       },
    //       // { isPaid: false },
    //       { status: "Approved" },
    //     ],
    //   },
    // });

    const currentCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.gte]: startDate } },
          { to: { [Op.lte]: endDate } },
        ],
      },
    });

    if (!currentCutoff) {
      return res.status(404).json({ message: "Current cutoff not found" });
    }

    // Calculate the totalAmount sum
    // const totalLastCutoffExpense = await Expenses.sum("totalAmount", {
    //   where: {
    //     [Op.and]: [
    //       { expenses_date: { [Op.lt]: currentCutoff.from } },
    //       { isAdded: false },
    //       { status: "Approved" },
    //     ],
    //   },
    // });
    const data = await Expenses.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          { expenses_date: { [Op.lt]: currentCutoff.from } },
          // { isAdded: false },
          { status: "Approved" },
        ],
      },
    });

    const totalLastCutoffExpense = data.reduce((total, value) => {
      return total + value.totalAmount * value.rate;
    }, 0);

    res.json({ totalPrice: totalLastCutoffExpense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentTotalExpense").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const currentCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.gte]: startDate } },
          { to: { [Op.lte]: endDate } },
        ],
      },
    });

    if (!currentCutoff) {
      return res.status(404).json({ message: "Current cutoff not found" });
    }

    // Calculate the totalPrice sum
    // const totalCurrentCutoffPrice = await Expenses.sum("totalAmount", {
    //   where: {
    //     [Op.and]: [
    //       {
    //         expenses_date: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //       },
    //       // { isPaid: false },
    //       { status: { [Op.ne]: "Rejected" } },
    //       { status: { [Op.ne]: "For-Approval" } },
    //     ],
    //   },
    // });

    const data = await Expenses.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          {
            expenses_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          // { isPaid: false },
          { status: { [Op.ne]: "Rejected" } },
          { status: { [Op.ne]: "For-Approval" } },
        ],
      },
    });

    const totalCurrentCutoffPrice = data.reduce((total, value) => {
      return total + value.totalAmount * value.rate;
    }, 0);

    res.json(totalCurrentCutoffPrice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchTotalIssued").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await PayBulkExpensesTransaction.findAll({
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          where: {
            status: "Approved",
            pay_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
        },
        {
          model: Expenses,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
          where: {
            isAdded: true,
            expenses_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
        },
      ],
    });
    const totalIssued = data.reduce((total, value) => {
      return (
        total + value.expense.totalAmount * value.expense.currency.currency_rate
      );
    }, 0);
    res.json(totalIssued);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentCutoffExpense").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // const totalCurrentCutoffExpense = await Expenses.sum("totalAmount", {
    //   where: {
    //     [Op.and]: [
    //       {
    //         expenses_date: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //       },
    //       { status: "Approved" },
    //     ],
    //   },
    // });
    const data = await Expenses.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          {
            expenses_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          { status: "Approved" },
        ],
      },
    });

    const totalCurrentCutoffExpense = data.reduce((total, value) => {
      return total + value.totalAmount * value.currency.currency_rate;
    }, 0);
    res.json(totalCurrentCutoffExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchTotalExpense").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate } = req.query;
    const data = await PayBulkExpenses.findAll({
      where: {
        module_from:
          domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
        pay_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        status: "Approved",
        isDeleted: false,
      },
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          include: [
            {
              model: Expenses,
              required: true,
              include: [{ model: Currency }],
            },
          ],
        },
        {
          model: PayBulkExpensesPayment,
          required: true,
        },
        {
          model: PayBulkAddDeductExpenses,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const expensesWithTotal = data.map((expenses) => {
      // Sum totalAmount from Expenses
      const totalAmountExpenses =
        expenses.pay_bulk_expenses_transactions.reduce(
          (sum, transaction) => sum + transaction.expense.totalAmount,
          0
        );

      // Sum amount from PayBulkAddDeductExpenses where type_expenses is "deduction"
      const totalDeductions = expenses.pay_bulk_add_deduct_expenses.reduce(
        (sum, addDeduct) => {
          if (addDeduct.type_expenses === "deduction") {
            return sum + addDeduct.amount * addDeduct.rate;
          }
          return sum;
        },
        0
      );
      const totalAdditional = expenses.pay_bulk_add_deduct_expenses.reduce(
        (sum, addDeduct) => {
          if (addDeduct.type_expenses === "additional") {
            return sum + addDeduct.amount * addDeduct.rate;
          }
          return sum;
        },
        0
      );

      // Combine totalAmount from Expenses and totalDeductions
      const totalExpenses = totalAdditional - totalDeductions;

      return {
        ...expenses.toJSON(),
        totalExpenses,
      };
    });

    // const totalExpense = expensesWithTotal.reduce((total, value) => {
    //   console.log("dsdsds", value);
    //   return total + value.totalExpenses;
    // }, 0);

    const totalExpense = expensesWithTotal.reduce((total, value) => {
      const amount = value.pay_bulk_expenses_transactions.reduce(
        (subtotal, transaction) => {
          const expenseRate = transaction.expense?.rate || 1;
          console.log("Rate", expenseRate);

          const expensePrice = transaction.expense.totalAmount;

          const transactionTotal =
            expenseRate * expensePrice + value.totalExpenses;

          return subtotal + transactionTotal;
        },
        0
      );

      return total + amount;
    }, 0);

    res.status(200).json(totalExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Internal Error" });
  }
});

router.route("/fetchTotalPaid").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate } = req.query;
    const payBulkExpense = await PayBulkExpenses.findAll({
      include: [
        {
          model: PayBulkExpensesTransaction,
          required: true,
          include: [
            {
              model: Expenses,
              required: true,
              where: {
                foreign: domestic_type === "local" ? "Local" : "Overseas",
              },
            },
          ],
        },
        {
          model: PayBulkAddDeductExpenses,
          required: false,
        },
      ],
      where: {
        pay_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        isDeleted: false,
        module_from:
          domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
      },
    });

    const payBulkExpenseTransactionNumber = payBulkExpense.map((item) => {
      return item.transaction_number;
    });

    const confirmedBankTransactions = await bank_transaction.findAll({
      where: {
        transaction_number: payBulkExpenseTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
        status: "Confirmed",
      },
      attributes: ["transaction_number"],
    });

    const confirmedIssuedCheck = await issued_check.findAll({
      where: {
        transaction_number: payBulkExpenseTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
        status: "Paid",
      },
      attributes: ["transaction_number"],
    });

    const totalPaidCashflow = await CashFlow.findAll({
      where: {
        transaction_number: payBulkExpenseTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
        status: "Paid",
      },
      attributes: ["transaction_number"],
    });

    const confirmedTransactionNumbers = confirmedBankTransactions.map(
      (tx) => tx.transaction_number
    );
    const confirmedIssuedTransactionNumbers = confirmedIssuedCheck.map(
      (tx) => tx.transaction_number
    );

    const confirmedCashTransactionNumbers = totalPaidCashflow.map(
      (tx) => tx.transaction_number
    );

    const countedIds = new Set();

    const expensesWithTotal = payBulkExpense.map((expenses) => {
      // Sum amount from PayBulkAddDeductExpenses where type_expenses is "deduction"
      const totalDeductions = expenses.pay_bulk_add_deduct_expenses.reduce(
        (sum, addDeduct) => {
          if (addDeduct.type_expenses === "deduction") {
            return sum + addDeduct.amount * addDeduct.rate;
          }
          return sum;
        },
        0
      );
      const totalAdditional = expenses.pay_bulk_add_deduct_expenses.reduce(
        (sum, addDeduct) => {
          if (addDeduct.type_expenses === "additional") {
            return sum + addDeduct.amount * addDeduct.rate;
          }
          return sum;
        },
        0
      );

      // Combine totalAmount from Expenses and totalDeductions
      const totalExpenses = totalAdditional - totalDeductions;

      return {
        ...expenses.toJSON(),
        totalExpenses,
      };
    });

    const totalPaidTransactions = expensesWithTotal
      .filter((item) => item.status === "Paid")
      .reduce((total, value) => {
        const amount = value.pay_bulk_expenses_transactions.reduce(
          (subtotal, transaction) => {
            const id = transaction.expense?.transaction_id;
            const payableRate = transaction.expense?.rate || 1;
            const payableAmount = transaction.expense?.totalAmount;
            const transactionNumber = value.transaction_number;

            console.log(
              "Transaction ID:",
              id,
              "Amount:",
              payableRate,
              "Rate:",
              payableAmount,
              "Transaction Number:",
              transactionNumber,

              "Bank Confirmed List:",
              confirmedTransactionNumbers.map(String),
              "Issued Confirmed List:",
              confirmedIssuedTransactionNumbers.map(String)
            );

            if (
              confirmedTransactionNumbers.includes(transactionNumber) ||
              confirmedIssuedTransactionNumbers.includes(transactionNumber) ||
              confirmedCashTransactionNumbers.includes(transactionNumber)
            ) {
              countedIds.add(id);
              const transactionTotal = payableRate * payableAmount;
              return subtotal + transactionTotal + value.totalExpenses;
            }

            return subtotal;
          },
          0
        );

        return total + amount;
      }, 0);
    // const totalPaidBankTransactions = await bank_transaction.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
    //     status: "Confirmed",
    //     transaction_number: {
    //       [Op.in]: payBulkExpenseTransactionNumber,
    //     },
    //   },
    // });

    // const totalPaidIssuedCheck = await issued_check.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
    //     status: "Paid",
    //     transaction_number: {
    //       [Op.in]: payBulkExpenseTransactionNumber,
    //     },
    //   },
    // });

    // const totalPaidCashflow = await CashFlow.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Expenses" : "Overseas Expenses",
    //     status: "Paid",
    //     transaction_number: {
    //       [Op.in]: payBulkExpenseTransactionNumber,
    //     },
    //   },
    // });

    // const totalPaid =
    //   totalPaidBankTransactions + totalPaidIssuedCheck + totalPaidCashflow;

    res.status(200).json(totalPaidTransactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/pdfExpense").get(async (req, res) => {
  try {
    const { id } = req.query;
    const data = await Expenses.findOne({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Expenses2,
          required: true,
          include: [
            {
              model: Expenses1,
              required: true,
            },
          ],
        },
      ],
      where: {
        id: id,
      },
    });

    res.status(200).send(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// router.route("/approved").post(async (req, res) => {
//   try {
//     const { id, payment_data, tableMultiple, expenses_date, transaction_id } =
//       req.query;

//     if (payment_data && payment_data.length > 0) {
//       await Promise.all(
//         payment_data.map(async (data) => {
//           if (data.payment_type === "Check") {
//             await issued_check.create({
//               account_list_id_issued_from: data.accountListSub_id,
//               account_list_id_issued_to: null,
//               amount: data.amount || 0,
//               transaction_number: transaction_id,
//               module_from: "Expenses",
//               transaction_date: data.date_issued,
//               check_number: data.check_number === "" ? null : data.check_number,
//               description: "",
//               status: "Pending",
//             });
//           } else if (data.payment_type === "Bank") {
//             await bank_transaction.create({
//               account_list_id_bank_from: data.accountListSub_id,
//               account_list_id_bank_to: null,
//               amount: data.amount || 0,
//               transaction_number: transaction_id,
//               module_from: "Expenses",
//               transaction_date: data.date_issued,
//               description: "",
//               status: "Pending",
//             });
//           } else if (data.payment_type === "Cash") {
//             await CashFlow.create({
//               account_list_id_cash_from: data.accountListSub_id,
//               account_list_id_cash_to: null,
//               amount: data.amount || 0,
//               check_number: data.check_number === "" ? null : data.check_number,
//               transaction_number: transaction_id,
//               module_from: "Expenses",
//               transaction_date: data.date_issued,
//               description: "",
//               status: "Transfered",
//             });

//             await accountlist_sub3.decrement("amount", {
//               by: parseFloat(data.amount || 0),
//               where: { id: data.accountListSub_id },
//             });

//             await accountlist_transaction_subject.create({
//               account_list_sub3_id_transacted: data.accountListSub_id,
//               payment_method: data.payment_type,
//               amount: data.amount || 0,
//               date: data.date_issued,
//               check_or_remarks:
//                 data.check_number === "" ? null : data.check_number,
//               type: "Credit",
//             });
//           } else {
//             console.log("INVALID PAYMENT TYPE");
//             return res.status(400).json({ message: "Invalid payment type" });
//           }
//         })
//       );
//     }

//     if (tableMultiple && Object.keys(tableMultiple).length > 0) {
//       await Promise.all(
//         Object.entries(tableMultiple).map(async ([rowId, row]) => {
//           await accountlist_sub3.decrement("amount", {
//             by: parseFloat(row.amount || 0),
//             where: { id: row.subject3 },
//           });

//           await accountlist_transaction_subject.create({
//             account_list_sub3_id_transacted: row.subject3,
//             payment_method: "---",
//             amount: row.amount || 0,
//             date: expenses_date,
//             check_or_remarks: row.remarks === "" ? null : row.remarks,
//             type: "Credit",
//           });
//         })
//       );
//     }

//     const updateExpenses = await Expenses.update(
//       {
//         status: "Approved",
//       },
//       {
//         where: {
//           id: id,
//         },
//       }
//     );

//     if (updateExpenses) {
//       return res.status(200).json({ message: "Updates successful" });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

// Used Module:
// Expenses
// router.route("/fetchMother").get(async (req, res) => {
//   try {
//     const isMotherFetch = await Loan_label_mother.findAll({
//       include: [
//         {
//           model: Label,
//           required: true,
//         },
//         {
//           model: AccountList,
//           required: true,
//         },
//       ],
//     });

//     if (isMotherFetch) {
//       return res.json(isMotherFetch);
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json();
//   }
// });

// Used Module:
// Expenses
// router.route("/fetchLoan").get(async (req, res) => {
//   try {
//     const isLoanFetch = await Loan.findAll({
//       include: [
//         {
//           model: MasterList,
//           required: true,
//         },
//       ],
//     });

//     if (isLoanFetch) {
//       return res.json(isLoanFetch);
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json();
//   }
// });
module.exports = router;
