const getAccurateDate = require("../utils/accurate_date_time_today");
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
  FixedAssetForecast,
  ExpenseJournal,
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

const {
  dateFormatFilter,
  castFilter,
  likeFilter,
  createdAtFilter,
} = require("../utils/filters/sequelizeSearchFilter.js");

const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
const { expense } = require("../services");
const CheckJournal = require("../db/models/check_journal.model.js");

// Used Module:
// Expenses
router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}${month}`;

  const generateTwoNum = Math.floor(10 + Math.random() * 90);
  const time = new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  try {
    // const lastPayCode = await Expenses.findOne({
    //   where: {
    //     transaction_id: {
    //       [Op.like]: `EXP-${currentMonth}%`,
    //     },
    //   },
    //   order: [["createdAt", "DESC"]],
    // });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode = `EXP-${currentMonth}${time}${generateTwoNum}`;

    // if (lastPayCode && lastPayCode.transaction_id) {
    //   // console.log(`Last Pay Code: ${lastPayCode.transaction_id}`);
    //   const latestRefCode = lastPayCode.transaction_id;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `EXP-${currentMonth}-${newSequence}`;
    //   } else {
    //     // If the refCode doesn't split correctly or sequence is not a number
    //     newRefCode = `EXP-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `EXP-${currentMonth}-00001`;
    // }

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
      isDeleted: false,
    },
  });

  const isPosted = findCutoff?.isPosted || false;
  const cutoffExists = findCutoff;

  const existInFixedAsset = await FixedAssetForecast.findOne({
    where: {
      expense_id: isFetch.id,
    },
  });

  const plainData = isFetch.get({ plain: true });

  plainData.isPosted = isPosted;
  plainData.cutoffExists = cutoffExists;
  plainData.existInFixedAsset = existInFixedAsset ? true : false;

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

//commented para ma separate ang default fetching to pagsearch ng expenses

// router.route("/getExpensesData").get(async (req, res) => {
//   try {
//     const { startDate, endDate, filterColumn, searchText, currencyId } =
//       req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     let expensesWhereClause = {
//       expenses_date: {
//         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//       },
//     };

//     let expenseOneWhereClause = {};
//     let expenseTwoWhereClause = {};
//     const expensesTableColumn = [
//       "transaction_id",
//       "foreign",
//       "totalAmount",
//       "desc",
//       "expenses_date",
//       "status",
//     ];

//     switch (filterColumn) {
//       // Filter transaction id
//       case "transaction_id":
//         expensesWhereClause["transaction_id"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter Expense type 1
//       case "expenses_type1":
//         expenseOneWhereClause["expenses_type_one"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       case "expenses_type2":
//         expenseTwoWhereClause["sub_type"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter foreign type
//       case "foreign_type":
//         expensesWhereClause["foreign"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter amount
//       case "amount":
//         if (searchText !== null && searchText !== "") {
//           expensesWhereClause["totalAmount"] = sequelize.where(
//             literal(`CAST(totalAmount AS CHAR)`),
//             {
//               [Op.like]: `%${searchText}%`,
//             }
//           );
//         }
//         break;
//       // Filter Description
//       case "description":
//         expensesWhereClause["desc"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter Expenses Date
//       case "expenses_date":
//         expensesWhereClause = {
//           [Op.and]: [
//             {
//               expenses_date: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//             },
//             sequelize.where(literal(`CAST(expenses_date AS CHAR)`), {
//               [Op.like]: `%${searchText}%`,
//             }),
//           ],
//         };
//         break;
//       // Filter Status
//       case "status":
//         expensesWhereClause["status"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       // Filter for all
//       default:
//         expensesWhereClause = {
//           [Op.and]: [
//             {
//               expenses_date: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//             },

//             {
//               [Op.or]: expensesTableColumn.map((col) => {
//                 if (col === "totalAmount") {
//                   return {
//                     [col]: sequelize.where(
//                       literal(`CAST(totalAmount AS CHAR)`),
//                       {
//                         [Op.like]: `%${searchText}%`,
//                       }
//                     ),
//                   };
//                 } else if (col === "expenses_date") {
//                   return sequelize.where(
//                     literal(`CAST(expenses_date AS CHAR)`),
//                     {
//                       [Op.like]: `%${searchText}%`,
//                     }
//                   );
//                 } else {
//                   return {
//                     [col]: {
//                       [Op.like]: `%${searchText}%`,
//                     },
//                   };
//                 }
//               }),
//             },
//           ],
//         };
//         break;
//     }

//     let { count, rows: data } = await Expenses.findAndCountAll({
//       include: [
//         {
//           model: Expenses2,
//           required: true,
//           include: [
//             {
//               model: Expenses1,
//               required: true,
//               where: expenseOneWhereClause,
//             },
//           ],
//           where: expenseTwoWhereClause,
//         },
//         {
//           model: Currency,
//           required: true,
//           where: {
//             ...(currencyId && currencyId !== "All" && { id: currencyId }),
//           },
//         },
//       ],
//       where: { ...expensesWhereClause, isDeleted: false },
//       order: [["transaction_id", "DESC"]],
//       limit: limit,
//       offset: offset,
//     });

//     // Filter for "All" // if data is empty, search for expense type 1 or expense type 2
//     if (data.length === 0 && filterColumn === "all") {
//       // reset all where clause
//       expenseOneWhereClause = {};
//       expenseTwoWhereClause = {};
//       const whereClauseArray = ["expenses_type_one", "sub_type"];

//       for (let index = 0; index < whereClauseArray.length; index++) {
//         expensesWhereClause = {
//           expenses_date: {
//             [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//           },
//         };
//         if (whereClauseArray[index] === "sub_type") {
//           expenseOneWhereClause = {};
//           expenseTwoWhereClause = {
//             sub_type: {
//               [Op.like]: `%${searchText}%`,
//             },
//           };
//         } else {
//           expenseTwoWhereClause = {};
//           expenseOneWhereClause = {
//             expenses_type_one: {
//               [Op.like]: `%${searchText}%`,
//             },
//           };
//         }
//         ({ count, rows: data } = await Expenses.findAndCountAll({
//           include: [
//             {
//               model: Expenses2,
//               required: true,
//               include: [
//                 {
//                   model: Expenses1,
//                   required: true,
//                   where: expenseOneWhereClause,
//                 },
//               ],
//               where: expenseTwoWhereClause,
//             },
//             {
//               model: Currency,
//               required: true,
//               where: {
//                 ...(currencyId && currencyId !== "All" && { id: currencyId }),
//               },
//             },
//           ],
//           where: { ...expensesWhereClause, isDeleted: false },
//           order: [["transaction_id", "DESC"]],
//           distinct: true,
//           limit: limit,
//           offset: offset,
//         }));

//         if (data.length > 0) {
//           break;
//         }
//       }
//     }
//     console.log(data);
//     if (data) {
//       return res.json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: data,
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// });

router.route("/getExpensesData").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId, status_tab } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let { count, rows: data } = await Expenses.findAndCountAll({
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
          where: {
            ...(currencyId && currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        expenses_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        status: status_tab,
        isDeleted: false,
      },
      order: [["client_transaction_id", "DESC"]],
      limit: limit,
      offset: offset,
    });

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

router.route("/getExpensesData-search").get(async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      currencyId,
      filterColumn,
      searchText,
      status_tab,
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      expenses_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
      status: status_tab,
      isDeleted: false,
    };

    if (filterColumn !== "all" && filterColumn !== "expenses_date") {
      whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
    } else if (filterColumn === "expenses_date") {
      whereClause = {
        ...whereClause,
        ...dateFormatFilter(searchText, filterColumn, filterColumn),
      };
    } else {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { client_transaction_id: { [Op.like]: `%${searchText}%` } },
          {
            "$expenses2.expenses_one.expenses_type_one$": {
              [Op.like]: `%${searchText}%`,
            },
          },
          { "$expenses2.sub_type$": { [Op.like]: `%${searchText}%` } },
          { foreign: { [Op.like]: `%${searchText}%` } },
          castFilter(searchText, "totalAmount", "totalAmount"),
          { desc: { [Op.like]: `%${searchText}%` } },
          dateFormatFilter(searchText, "expenses_date"),
        ],
      };
    }

    let { count, rows: data } = await Expenses.findAndCountAll({
      where: whereClause,
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
          where: {
            ...(currencyId && currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      order: [["client_transaction_id", "DESC"]],
      limit: limit,
      offset: offset,
    });

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
      clientTransactionId,
      foreign,
      selected_currency_id,
      productName,
      unitPrice,
      assetQuantity,
      userLoggedID,
      currencyRate,
      fixedAssetIds,
    } = req.body;

    // Client Transaction Id duplicate validation
    const existingClientTransactionId = await Expenses.findOne({
      where: {
        client_transaction_id: clientTransactionId,
        isDeleted: false,
      },
    });

    if (existingClientTransactionId) {
      return res.status(409).json({ error: "Transction Id Already Exists." });
    }

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: expenses_date } },
          { to: { [Op.gte]: expenses_date } },
        ],
        isPosted: true,
        isDeleted: false,
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
      client_transaction_id: clientTransactionId,
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

    if (fixedAssetIds.length > 0) {
      for (const fixedAssetId of fixedAssetIds) {
        await FixedAssetForecast.update(
          {
            isCreated: true,
            expense_id: isCreate.id,
          },
          {
            where: {
              id: fixedAssetId,
            },
          }
        );
      }
    }

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
      clientTransactionId,
      foreign,
      selected_currency_id,
      productName,
      unitPrice,
      assetQuantity,
      userLoggedID,
      currencyRate,
    } = req.body;

    // Client Transaction Id duplicate validation
    const existingClientTransactionId = await Expenses.findOne({
      where: {
        id: {
          [Op.ne]: id,
        },
        client_transaction_id: clientTransactionId,
        isDeleted: false,
      },
    });

    if (existingClientTransactionId) {
      return res.status(409).json({ error: "Transction Id Already Exists." });
    }

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: expenses_date } },
          { to: { [Op.gte]: expenses_date } },
        ],
        isPosted: true,
        isDeleted: false,
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
        client_transaction_id: clientTransactionId,
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

      // const checkFixedAsset = await FixedAsset.findOne({
      //   where: { expenses_id: id },
      // });

      // if (checkFixedAsset) {
      //   const fixedAssetTransactionNumber = checkFixedAsset.transaction_code;
      //   const module = "Fixed Asset";
      //   return res.status(300).json({
      //     success: false,
      //     fixedAssetTransactionNumber,
      //     module,
      //   });
      // }

      // await Expenses.destroy({ where: { id: id } });

      const findFixedAssetForecast = await FixedAssetForecast.findOne({
        where: {
          expense_id: id,
        },
      });

      if (findFixedAssetForecast) {
        await FixedAssetForecast.update(
          {
            isPaid: false,
            isCreated: false,
            expense_id: null,
          },
          {
            where: {
              expense_id: id,
            },
          }
        );
      }

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
    const {
      expenseJournal: {
        expenses2Id,
        date,
        totalAmount,
        paymentType,
        currencyName,
        currencyRate,
      },
    } = req.body;

    const updateExpenses = await Expenses.update(
      {
        status: "Approved",
        approved_by: userLoggedID,
        date_approved: await getAccurateDate(),
      },
      {
        where: {
          id: id,
        },
      }
    );

    const findFixedAssetForecast = await FixedAssetForecast.findOne({
      where: {
        expense_id: id,
      },
    });

    if (findFixedAssetForecast) {
      await FixedAssetForecast.update(
        {
          isPaid: true,
        },
        {
          where: {
            expense_id: id,
          },
        }
      );
    }

    // Create an expense journal record for expense report
    await ExpenseJournal.create({
      expenses2_id: expenses2Id,
      date,
      total_amount: totalAmount,
      payment_type: paymentType,
      currency_name: currencyName,
      currency_rate: currencyRate,
    });

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

    const findFixedAssetForecast = await FixedAssetForecast.findOne({
      where: {
        expense_id: id,
      },
    });

    if (findFixedAssetForecast) {
      await FixedAssetForecast.update(
        {
          isCreated: false,
          expense_id: null,
        },
        {
          where: {
            expense_id: id,
          },
        }
      );
    }

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
    const { startDate, endDate, currencyId } = req.query;
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
        isDeleted: false,
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
    let data = await Expenses.findAll({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        [Op.and]: [
          { expenses_date: { [Op.lt]: currentCutoff.from } },
          // { isAdded: false },
          { status: "Approved" },
        ],
        isDeleted: false,
      },
    });

    const allCutoffs = await Cutoff.findAll({
      where: {
        isDeleted: false,
      },
    });

    // Check every expenses if expenses_date is within the range of existing cutoff dates
    data = data.filter((expense) => {
      const isInsideAnyCutoff = allCutoffs.some((cutoff) => {
        const expenseDate = new Date(expense.expenses_date);
        const from = new Date(cutoff.from);
        const to = new Date(cutoff.to);

        return expenseDate >= from && expenseDate <= to;
      });

      return isInsideAnyCutoff;
    });

    const totalLastCutoffExpense = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.totalAmount * value.rate
          : value.totalAmount)
      );
    }, 0);

    res.json({ totalPrice: totalLastCutoffExpense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentTotalExpense").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;
    const currentCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.gte]: startDate } },
          { to: { [Op.lte]: endDate } },
        ],
        isDeleted: false,
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
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
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
        isDeleted: false,
      },
    });

    const totalCurrentCutoffPrice = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.totalAmount * value.rate
          : value.totalAmount)
      );
    }, 0);

    res.json(totalCurrentCutoffPrice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchTotalIssued").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;
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
              where: {
                ...(currencyId !== "All" && { id: currencyId }),
              },
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
      where: {
        isDeleted: false,
      },
    });
    const totalIssued = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.expense.totalAmount * value.expense.rate
          : value.expense.totalAmount)
        //  * value.expense.currency.currency_rate
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
    const { startDate, endDate, currencyId } = req.query;
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
    // const data = await Expenses.findAll({
    //   include: [
    //     {
    //       model: Currency,
    //       required: true,
    //     },
    //   ],
    //   where: {
    //     [Op.and]: [
    //       {
    //         expenses_date: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //       },
    //       { status: "Approved" },
    //     ],
    //     isDeleted: false,
    //   },
    // });

    // const totalCurrentCutoffExpense = data.reduce((total, value) => {
    //   return total + value.totalAmount * value.currency.currency_rate;
    // }, 0);

    // res.json(totalCurrentCutoffExpense);

    const totalExpensesFetch = await Expenses.findAll({
      where: {
        status: "Approved",
        isAdded: false,
        isDeleted: false,
        expenses_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
      },
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
    });

    let totalExpenses = 0;
    totalExpensesFetch?.forEach((expense) => {
      totalExpenses +=
        currencyId === "All"
          ? expense.totalAmount * expense.rate
          : expense.totalAmount;
    });

    res.json(totalExpenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchTotalExpense").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate, currencyId } = req.query;
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
              include: [
                {
                  model: Currency,
                  where: {
                    ...(currencyId !== "All" && { id: currencyId }),
                  },
                },
              ],
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
          // console.log("Rate", expenseRate);

          const expensePrice = transaction.expense.totalAmount;

          const transactionTotal =
            (currencyId === "All" ? expenseRate * expensePrice : expensePrice) +
            value.totalExpenses;

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
    const { domestic_type, startDate, endDate, currencyId } = req.query;
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
              include: [
                {
                  model: Currency,
                  where: {
                    ...(currencyId !== "All" && { id: currencyId }),
                  },
                },
              ],
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

            // console.log(
            //   "Transaction ID:",
            //   id,
            //   "Amount:",
            //   payableRate,
            //   "Rate:",
            //   payableAmount,
            //   "Transaction Number:",
            //   transactionNumber,

            //   "Bank Confirmed List:",
            //   confirmedTransactionNumbers.map(String),
            //   "Issued Confirmed List:",
            //   confirmedIssuedTransactionNumbers.map(String)
            // );

            if (
              confirmedTransactionNumbers.includes(transactionNumber) ||
              confirmedIssuedTransactionNumbers.includes(transactionNumber) ||
              confirmedCashTransactionNumbers.includes(transactionNumber)
            ) {
              countedIds.add(id);
              // const transactionTotal = payableRate * payableAmount;
              const transactionTotal =
                currencyId === "All"
                  ? payableRate * payableAmount
                  : payableAmount;
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

// For expense total expense widget
router.route("/summary/total-expense").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;

    const isLocal = domestic_type === "local";
    const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

    const [expenseSummary, paymentSummary] = await Promise.all([
      PayBulkExpenses.findOne({
        attributes: [
          [
            sequelize.literal(`SUM(
              CASE
                WHEN '${currencyId}' != 'All' THEN pay_bulk_expenses.totalAmount
                ELSE pay_bulk_expenses.totalAmount * currency_rate
              END
            )`),
            "totalExpense",
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
          ...(currencyId !== "All" && { currency_id: currencyId }),
          pay_date: { [Op.between]: [startDate, endDate] },
          module_from: moduleFrom,
          isDeleted: false,
        },
        raw: true,
      }),

      PayBulkExpensesPayment.findOne({
        attributes: [
          [
            sequelize.literal(`SUM(
              CASE
                WHEN ${
                  currencyId !== "All"
                } THEN pay_bulk_expenses_payment.amount
                ELSE pay_bulk_expenses_payment.amount * currency_rate
              END
            )`),
            "totalPaid",
          ],
        ],
        include: [
          {
            model: PayBulkExpenses,
            required: true,
            attributes: [],
            where: {
              module_from: moduleFrom,
              isDeleted: false,
            },
          },
          {
            model: accountlist_sub3,
            required: true,
            attributes: [],
            include: [
              {
                model: Currency,
                required: true,
                attributes: [],
              },
            ],
          },
        ],
        where: {
          ...(currencyId !== "All" && {
            "$account_list_sub3.currency_id$": currencyId,
          }),
          date_issued: { [Op.between]: [startDate, endDate] },
          payment_status: "Approved",
          isDeleted: false,
        },
        raw: true,
      }),
    ]);

    const totalExpense = (expenseSummary.totalExpense || 0) - (paymentSummary.totalPaid || 0); // prettier-ignore

    res.status(200).json(totalExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// For expense total paid widget
router.route("/summary/total-paid").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;

    const isLocal = domestic_type === "local";
    const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

    const paymentSummary = await PayBulkExpensesPayment.findOne({
      attributes: [
        [
          sequelize.literal(`SUM(
            CASE
              WHEN ${currencyId !== "All"} THEN pay_bulk_expenses_payment.amount
              ELSE pay_bulk_expenses_payment.amount * currency_rate
            END
          )`),
          "totalPaid",
        ],
      ],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
          where: {
            module_from: moduleFrom,
            isDeleted: false,
          },
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
          include: [
            {
              model: Currency,
              required: true,
              attributes: [],
            },
          ],
        },
      ],
      where: {
        ...(currencyId !== "All" && {
          "$account_list_sub3.currency_id$": currencyId,
        }),
        date_issued: { [Op.between]: [startDate, endDate] },
        payment_status: "Approved",
        isDeleted: false,
      },
      raw: true,
    });

    res.status(200).json(paymentSummary?.totalPaid || 0);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Old route
// Endpoint for expense type with remaining balance (Transaction list modal)
router.route("/transaction-list/expense-type").get(async (req, res) => {
  try {
    const { domestic_type } = req.query;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const isLocal = domestic_type === "local";
    const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

    // Get expense type 1 and expense type 2 with their remaining balance
    const { count, rows: expenseType } = await Expenses2.findAndCountAll({
      attributes: [
        "id",
        [sequelize.literal(`expenses_one.expenses_type_one`), "expenseTypeOne"],
        "sub_type",
        [
          sequelize.literal(`
          (SELECT COALESCE(SUM(pbe.totalAmount), 0) - COALESCE(SUM(pbep.amount), 0)
          FROM expenses e
          INNER JOIN pay_bulk_expenses_transactions pbet ON pbet.expenses_id = e.id
          INNER JOIN pay_bulk_expenses pbe ON pbe.id = pbet.pay_bulk_id
          LEFT JOIN pay_bulk_expenses_payments pbep ON pbep.pay_bulk_id = pbe.id 
          WHERE e.isDeleted = false
          AND e.expenses2_id = expenses2.id
          AND pbe.module_from = ${sequelize.escape(moduleFrom)}
          AND pbe.isDeleted = false)`),
          "remainingBalance",
        ],
      ],
      include: [
        {
          model: Expenses1,
          required: true,
          attributes: [],
        },
        {
          model: Expenses,
          required: true,
          attributes: [],
          where: {
            isDeleted: false,
          },
          include: [
            {
              model: PayBulkExpensesTransaction,
              required: true,
              attributes: [],
              include: [
                {
                  model: PayBulkExpenses,
                  required: true,
                  attributes: [],
                  where: {
                    module_from: moduleFrom,
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: expenseType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Old route
// Endpoint to search for expense type (Transaction list modal)
router.route("/transaction-list/expense-type/search").get(async (req, res) => {
  try {
    const { domestic_type, searchText } = req.query;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const isLocal = domestic_type === "local";
    const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

    // Get expense type 1 and expense type 2 with their remaining balance
    const { count, rows: expenseType } = await Expenses2.findAndCountAll({
      attributes: [
        "id",
        [sequelize.literal(`expenses_one.expenses_type_one`), "expenseTypeOne"],
        "sub_type",
        [
          sequelize.literal(`
          (SELECT COALESCE(SUM(pbe.totalAmount), 0) - COALESCE(SUM(pbep.amount), 0)
          FROM expenses e
          INNER JOIN pay_bulk_expenses_transactions pbet ON pbet.expenses_id = e.id
          INNER JOIN pay_bulk_expenses pbe ON pbe.id = pbet.pay_bulk_id
          LEFT JOIN pay_bulk_expenses_payments pbep ON pbep.pay_bulk_id = pbe.id 
          WHERE e.isDeleted = false
          AND e.expenses2_id = expenses2.id
          AND pbe.module_from = ${sequelize.escape(moduleFrom)}
          AND pbe.isDeleted = false)`),
          "remainingBalance",
        ],
      ],
      include: [
        {
          model: Expenses1,
          required: true,
          attributes: [],
        },
        {
          model: Expenses,
          required: true,
          attributes: [],
          where: {
            isDeleted: false,
          },
          include: [
            {
              model: PayBulkExpensesTransaction,
              required: true,
              attributes: [],
              include: [
                {
                  model: PayBulkExpenses,
                  required: true,
                  attributes: [],
                  where: {
                    module_from: moduleFrom,
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      where: {
        ...likeFilter(searchText, "expenses_one.expenses_type_one"),
      },
      limit,
      offset,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: expenseType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Expense type's transactions from the Transaction List Modal
router
  .route("/transaction-list/expense-type/transactions")
  .get(async (req, res) => {
    try {
      const { domestic_type } = req.query;

      // For pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const isLocal = domestic_type === "local";
      const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

      // Get payable bulk expenses count
      const count = await PayBulkExpenses.count({
        attributes: [],
        where: {
          module_from: moduleFrom,
          isDeleted: false,
        },
      });

      // Get payable bulk expenses ids
      const expenseTypeIds = await PayBulkExpenses.findAll({
        attributes: ["id"],
        where: {
          module_from: moduleFrom,
          isDeleted: false,
        },
        limit,
        offset,
        raw: true,
      });

      // Main fetching to get bulk expense transaction with specific expense type
      const expenseTypeTransactions = await PayBulkExpenses.findAll({
        attributes: [
          "id",
          "transaction_number",
          "pay_date",
          "createdAt",
          "status",
          [
            sequelize.literal(`
            COALESCE(SUM(DISTINCT pay_bulk_expenses.totalAmount), 0)
            - COALESCE(SUM(${sequelize.escape(
              sequelize.col("pay_bulk_expenses_payments.amount")
            )}), 0)
          `),
            "remainingBalance",
          ],
        ],
        include: [
          {
            model: PayBulkExpensesPayment,
            required: false,
            attributes: [],
          },
        ],
        where: {
          id: {
            [Op.in]: expenseTypeIds.map((item) => item.id),
          },
        },
        group: ["id"],
      });

      res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: expenseTypeTransactions,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Handle Expense type's search transactions from the Transaction List Modal
router
  .route("/transaction-list/expense-type/transactions/search")
  .get(async (req, res) => {
    try {
      const { searchText, domestic_type } = req.query;

      // For pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const isLocal = domestic_type === "local";
      const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

      // Get payable bulk expenses count
      const count = await PayBulkExpenses.count({
        include: [
          {
            model: PayBulkExpensesTransaction,
            required: true,
            attributes: [],
            include: [
              {
                model: Expenses,
                required: true,
                attributes: [],
                where: {
                  isDeleted: false,
                },
                include: [
                  {
                    model: Expenses2,
                    required: true,
                    as: "expenses2",
                    attributes: [],
                    include: [
                      {
                        model: Expenses1,
                        required: true,
                        as: "expenses_one",
                        attributes: [],
                        where: {
                          ...likeFilter(searchText, "expenses_type_one"),
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where: {
          module_from: moduleFrom,
          isDeleted: false,
        },
      });

      // Get payable bulk expenses ids
      const expenseTypeIds = await PayBulkExpenses.findAll({
        attributes: ["id"],
        include: [
          {
            model: PayBulkExpensesTransaction,
            required: true,
            attributes: [],
            include: [
              {
                model: Expenses,
                required: true,
                attributes: [],
                where: {
                  isDeleted: false,
                },
                include: [
                  {
                    model: Expenses2,
                    required: true,
                    as: "expenses2",
                    attributes: [],
                    include: [
                      {
                        model: Expenses1,
                        required: true,
                        as: "expenses_one",
                        attributes: [],
                        where: {
                          ...likeFilter(searchText, "expenses_type_one"),
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where: {
          module_from: moduleFrom,
          isDeleted: false,
        },
        limit,
        offset,
        subQuery: false,
        distinct: true,
        raw: true,
      });

      // Main fetching to get bulk expense transaction with specific expense type
      const expenseTypeTransactions = await PayBulkExpenses.findAll({
        attributes: [
          "id",
          "transaction_number",
          "pay_date",
          "createdAt",
          "status",
          [
            sequelize.literal(`
            COALESCE(SUM(DISTINCT pay_bulk_expenses.totalAmount), 0)
            - COALESCE(SUM(${sequelize.escape(
              sequelize.col("pay_bulk_expenses_payments.amount")
            )}), 0)
          `),
            "remainingBalance",
          ],
        ],
        include: [
          {
            model: PayBulkExpensesPayment,
            required: false,
            attributes: [],
          },
        ],
        where: {
          id: {
            [Op.in]: expenseTypeIds.map((item) => item.id),
          },
        },
        group: ["id"],
      });

      res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: expenseTypeTransactions,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Get all payments from local/overseas expense
router.route("/bulk/payments").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const isLocal = domestic_type === "local";
    const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

    // Validate required query parameters
    const missingParams = Object.entries({
      startDate,
      endDate,
      domestic_type,
      currencyId,
    })
      .filter(([_, item]) => !item)
      .map(([item]) => item);

    if (missingParams.length)
      return res
        .status(400)
        .json({ error: `Missing query params: ${missingParams.join(", ")}` });

    // prettier-ignore
    const expensePaymentsClause = {
      "$pay_bulk_expenses_payment.isDeleted$": false,
      date_issued: { [Op.between]: [startDate, endDate] },
      "$pay_bulk_expense.module_from$": moduleFrom,
      "$pay_bulk_expense.isDeleted$": false,
      "$pay_bulk_expense.status$": { [Op.ne]: "For-Approval" },
      ...(currencyId !== "All" && { "$account_list_sub3.currency_id$": currencyId})
    }

    // Get all expense payments count
    const count = await PayBulkExpensesPayment.count({
      attributes: [],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
        },
      ],
      where: expensePaymentsClause,
    });

    // Get expense payments ids
    const expensePaymentsIds = await PayBulkExpensesPayment.findAll({
      attributes: ["id"],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
        },
      ],
      where: expensePaymentsClause,
      limit,
      offset,
      raw: true,
    });

    // Main fetching to get all expense payments
    const expensePayments = await PayBulkExpensesPayment.findAll({
      // prettier-ignore
      attributes: [
        "id",
        "check_number",
        "createdAt",
        "date_issued",
        "amount",
        "payment_status",
        "payment_type",
        [sequelize.literal(`pay_bulk_expense.id`), "bulkExpenseId"],
        [sequelize.literal(`pay_bulk_expense.totalAmount`), "totalAmount"],
        [sequelize.literal(`currency_name`), "currencyName"],
        [sequelize.col(`currency_rate`), "currencyRate"],
        [sequelize.literal(`pay_bulk_expense.transaction_number`), "transactionNumber"],
        [sequelize.literal(`pay_bulk_expense.pay_date`), "transactionDate"],
        [sequelize.literal(`expenses_type_one`), "expenseTypeOne"],
        [sequelize.literal(`sub_type`), "expenseTypeTwo"],
        [sequelize.literal(`account_list_sub3.account_name`), "accountName"],
        [sequelize.literal(`account_list_sub3.id`), "subject3Id"],
        [sequelize.col(`pay_bulk_expense.pay_bulk_expenses_transactions.expense.expenses2.id`), "expenses2Id"]
      ],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
          include: [
            {
              model: PayBulkExpensesTransaction,
              required: true,
              attributes: [],
              include: [
                {
                  model: Expenses,
                  required: true,
                  attributes: [],
                  include: [
                    {
                      model: Expenses2,
                      required: true,
                      attributes: [],
                      include: [
                        {
                          model: Expenses1,
                          required: true,
                          attributes: [],
                        },
                      ],
                    },
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
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
        },
      ],
      where: {
        id: {
          [Op.in]: expensePaymentsIds.map((item) => item.id),
        },
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: expensePayments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handle payments search from local/overseas expense
router.route("/bulk/payments/search").get(async (req, res) => {
  try {
    // prettier-ignore
    const { startDate, endDate, domestic_type, currencyId, filterColumn } = req.query;
    let { searchText } = req.query;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const isLocal = domestic_type === "local";
    const moduleFrom = isLocal ? "Local Expenses" : "Overseas Expenses";

    // Remove commas of searchText if it is numeric/number
    if (searchText && searchText.trim() !== "") {
      const numericText = searchText.replace(/,/g, "");
      if (!isNaN(numericText)) {
        searchText = numericText;
      }
    }

    // Validate required query parameters
    const missingParams = Object.entries({
      startDate,
      endDate,
      domestic_type,
      currencyId,
    })
      .filter(([_, item]) => !item)
      .map(([item]) => item);

    if (missingParams.length)
      return res
        .status(400)
        .json({ error: `Missing query params: ${missingParams.join(", ")}` });

    // prettier-ignore
    const expensePaymentsClause = {
      "$pay_bulk_expenses_payment.isDeleted$": false,
      date_issued: { [Op.between]: [startDate, endDate] },
      "$pay_bulk_expense.module_from$": moduleFrom,
      "$pay_bulk_expense.isDeleted$": false,
      "$pay_bulk_expense.status$": { [Op.ne]: "For-Approval" },
      ...(currencyId !== "All" && { "$account_list_sub3.currency_id$": currencyId})
    }

    // For search filter
    const shouldApplyFilter = (field) =>
      filterColumn === "all" || field === filterColumn;

    const searchFilter = {
      "pay_bulk_expense.transaction_number": likeFilter,
      "pay_bulk_expenses_payment.createdAt": createdAtFilter,
      date_issued: dateFormatFilter,
      "pay_bulk_expenses_payment.amount": castFilter,
      payment_status: likeFilter,
    };

    const buildFilters = Object.entries(searchFilter).reduce(
      (acc, [col, fn]) => {
        if (shouldApplyFilter(col)) acc.push(fn(searchText, col));
        return acc;
      },
      []
    );

    // Get all expense payments count
    const count = await PayBulkExpensesPayment.count({
      attributes: [],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
        },
      ],
      where: {
        ...expensePaymentsClause,
        ...(searchText.trim() !== "" && { [Op.or]: buildFilters }),
      },
    });

    // Get expense payments ids
    const expensePaymentsIds = await PayBulkExpensesPayment.findAll({
      attributes: ["id"],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
        },
      ],
      where: {
        ...expensePaymentsClause,
        ...(searchText.trim() !== "" && { [Op.or]: buildFilters }),
      },
      limit,
      offset,
      raw: true,
    });

    // Main fetching to get all expense payments
    const expensePayments = await PayBulkExpensesPayment.findAll({
      // prettier-ignore
      attributes: [
        "id",
        "check_number",
        "createdAt",
        "date_issued",
        "amount",
        "payment_status",
        "payment_type",
        [sequelize.literal(`pay_bulk_expense.id`), "bulkExpenseId"],
        [sequelize.literal(`pay_bulk_expense.totalAmount`), "totalAmount"],
        [sequelize.literal(`currency_name`), "currencyName"],
        [sequelize.col(`currency_rate`), "currencyRate"],
        [sequelize.literal(`pay_bulk_expense.transaction_number`), "transactionNumber"],
        [sequelize.literal(`pay_bulk_expense.pay_date`), "transactionDate"],
        [sequelize.literal(`expenses_type_one`), "expenseTypeOne"],
        [sequelize.literal(`sub_type`), "expenseTypeTwo"],
        [sequelize.literal(`account_list_sub3.account_name`), "accountName"],
        [sequelize.literal(`account_list_sub3.id`), "subject3Id"],
        [sequelize.col(`pay_bulk_expense.pay_bulk_expenses_transactions.expense.expenses2.id`), "expenses2Id"]
      ],
      include: [
        {
          model: PayBulkExpenses,
          required: true,
          attributes: [],
          include: [
            {
              model: PayBulkExpensesTransaction,
              required: true,
              attributes: [],
              include: [
                {
                  model: Expenses,
                  required: true,
                  attributes: [],
                  include: [
                    {
                      model: Expenses2,
                      required: true,
                      attributes: [],
                      include: [
                        {
                          model: Expenses1,
                          required: true,
                          attributes: [],
                        },
                      ],
                    },
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
        },
        {
          model: accountlist_sub3,
          required: true,
          attributes: [],
        },
      ],
      where: {
        id: {
          [Op.in]: expensePaymentsIds.map((item) => item.id),
        },
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: expensePayments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Payment approval from table action
router.route("/bulk/payments/:id/approve").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { domestic_type, transactionNumber, paymentData, bulkExpenseId } =
      req.body;

    const isLocal = domestic_type === "local";
    const moduleType = isLocal ? "Local Expenses" : "Overseas Expenses";

    // Service layer for handling payment approval
    const PaymentApprovalService = {
      // Update expense payment status
      updatePaymentStatus: async ({ id, transaction }) => {
        const [updatedCount] = await PayBulkExpensesPayment.update(
          {
            payment_status: "Approved",
          },
          {
            where: {
              id,
              isDeleted: false,
            },
            transaction,
          }
        );

        return updatedCount;
      },
      // Process cash payment
      handleCashPayment: async function ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) {
        await Promise.all([
          CashFlow.create(
            {
              account_list_id_cash_from: String(paymentData.subject3Id),
              transaction_date: paymentData.date_issued,
              transaction_number: transactionNumber,
              account_list_id_cash_to: null,
              module_from: moduleType,
              description: "",
              amount: paymentData.amount,
              status: "Paid",
            },
            { transaction }
          ),
          accountlist_sub3.decrement("amount", {
            by: parseFloat(paymentData.amount),
            where: { id: String(paymentData.subject3Id) },
            transaction,
          }),
          accountlist_transaction_subject.create(
            {
              account_list_sub3_id_transacted: String(paymentData.subject3Id), // prettier-ignore
              payment_method: paymentData.payment_type,
              amount: paymentData.amount,
              date: paymentData.date_issued,
              check_or_remarks: "",
              type: "Credit",
              module_from: moduleType,
              transaction_number: transactionNumber,
            },
            { transaction }
          ),
        ]);

        // --- For expense journal ---

        const transactionList = await expense.expenseService.getUnpaidExpenses({
          transactionNumber,
          transaction,
        });

        const expenseTransactions =
          expense.expenseHelpers.buildExpenseTransactions(transactionList);

        await expense.expenseService.applyPayment({
          paymentData,
          expenseTransactions,
          transaction,
        });
      },
      // Distribute data to Bank Transaction
      handleBankPayment: async ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) => {
        await bank_transaction.create(
          {
            account_list_id_bank_from: String(paymentData.subject3Id),
            transaction_date: paymentData.date_issued,
            transaction_number: transactionNumber,
            account_list_id_bank_to: null,
            module_from: moduleType,
            description: "",
            amount: paymentData.amount,
            status: "Pending",
          },
          { transaction }
        );
      },
      // Process payment with check number
      handleCheckPayment: async ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) => {
        // Distribute data to Issued Check
        await issued_check.create(
          {
            account_list_id_issued_from: String(paymentData.subject3Id),
            transaction_date: paymentData.date_issued,
            check_number: paymentData.check_number,
            transaction_number: transactionNumber,
            module_from: moduleType,
            description: "To pay",
            amount: paymentData.amount,
            status: "Pending",
          },
          {
            transaction,
          }
        );

        // Create a check journal "Debit" entry for trial balance
        await CheckJournal.create(
          {
            module_from: moduleType,
            transaction_number: transactionNumber,
            transaction_date: paymentData.transactionDate,
            issued_date: paymentData.date_issued,
            type: "Debit",
            amount: paymentData.amount,
            check_number: paymentData.check_number,
            currency_name: paymentData.currencyName,
            currency_rate: paymentData.currencyRate,
          },
          { transaction }
        );
      },
      // prettier-ignore
      distributePayments: async function ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) {
        const args = { paymentData, transactionNumber, moduleType, transaction };
        const paymentMethod = paymentData.payment_type;
        const checkNumber = paymentData.check_number

        if (paymentMethod === "Cash") await this.handleCashPayment(args);
        if (paymentMethod === "Bank" && !checkNumber) await this.handleBankPayment(args);
        if (paymentMethod === "Bank" && checkNumber) await this.handleCheckPayment(args);
      },
      // Check payments
      paymentSummary: async ({ transactionNumber, transaction }) => {
        const [issuedTotal = 0, bankTotal = 0, cashTotal = 0] =
          await Promise.all([
            issued_check.sum("amount", {
              where: {
                transaction_number: transactionNumber,
                status: "Paid",
                isDeleted: false,
              },
              transaction,
            }),

            bank_transaction.sum("amount", {
              where: {
                transaction_number: transactionNumber,
                module_from: {
                  [Op.in]: ["Local Expenses", "Overseas Expenses"],
                },
                status: "Confirmed",
                isDeleted: false,
              },
              transaction,
            }),

            CashFlow.sum("amount", {
              where: {
                transaction_number: transactionNumber,
                status: "Paid",
                isDeleted: false,
              },
              transaction,
            }),
          ]);

        return issuedTotal + bankTotal + cashTotal;
      },
      // Determine the status if its "Paid" or "Partially-Paid"
      getStatus: ({ totalPayment, paymentData }) => {
        const totalExpenseAmount = paymentData.totalAmount; // Total Expense
        const isPaid = totalPayment === totalExpenseAmount; // Payment is settled
        const expenseStatus = isPaid ? "Paid" : "Partially-Paid";

        return expenseStatus;
      },
      getExpenseIds: async ({ bulkExpenseId, transaction }) => {
        const expenseIds = await PayBulkExpensesTransaction.findAll({
          attributes: ["expenses_id"],
          where: {
            pay_bulk_id: bulkExpenseId,
          },
          transaction,
          raw: true,
        });

        return expenseIds.map((item) => item.expenses_id);
      },
      updateStatus: async ({ model, status, ids, transaction }) => {
        const idList = Array.isArray(ids) ? ids : [ids];

        await model.update(
          {
            status,
          },
          {
            where: {
              id: {
                [Op.in]: idList,
              },
            },
            transaction,
          }
        );
      },
    };

    // --- Payment approval work flow ---

    // 1. Update payment status
    const updatedCount = await PaymentApprovalService.updatePaymentStatus({
      id,
      transaction,
    });

    // Validation: Return 404 if no payment record was updated (invalid or non-existent ID)
    if (updatedCount === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: "Payment not found." });
    }

    // 2. Distribute payments (Bank/Check/Cash)
    await PaymentApprovalService.distributePayments({
      paymentData,
      transactionNumber,
      moduleType,
      transaction,
    });

    // 3. Check payments and determine status for Expenses/PayBulkExpenses
    const totalPayment = await PaymentApprovalService.paymentSummary({
      transactionNumber,
      transaction,
    });
    const expenseStatus = PaymentApprovalService.getStatus({
      totalPayment,
      paymentData,
    });

    // 4. Update expense and pay bulk expense status to "Paid" or "Partially-Paid"
    const expenseIds = await PaymentApprovalService.getExpenseIds({
      bulkExpenseId,
      transaction,
    });
    // await PaymentApprovalService.updateStatus({
    //   model: Expenses,
    //   status: expenseStatus,
    //   ids: expenseIds,
    //   transaction,
    // });
    await PaymentApprovalService.updateStatus({
      model: PayBulkExpenses,
      status: expenseStatus,
      ids: bulkExpenseId,
      transaction,
    });

    await transaction.commit();
    res.status(200).json({
      message: "Payment has been successfully approved.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to validate cutoff before payment approval
router.route("/payment/:id/cutoff-validation").get(async (req, res) => {
  try {
    const { id } = req.params;

    // Get the payment record to find the payment date
    const payment = await PayBulkExpensesPayment.findOne({
      where: {
        id: id,
        isDeleted: false,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Check if cutoff exists for the payment date
    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: payment.date_issued },
          },
          {
            to: { [Op.gte]: payment.date_issued },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;
    const cutoffExists = !!findCutoff;

    res.json({
      isPosted,
      cutoffExists,
      paymentDate: payment.date_issued,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
