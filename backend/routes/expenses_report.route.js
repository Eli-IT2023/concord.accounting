const router = require("express").Router();
const { where, Op } = require("sequelize");
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
} = require("../db/models/associations");

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

// router.route("/getExpenses1Report").get(async (req, res) => {
//   try {
//     const { dateFrom, dateTo } = req.query;

//     const currentCutoff = await Cutoff.findOne({
//       order: [["from", "DESC"]],
//     });

//     const fromDate = dateFrom || currentCutoff.from;
//     const toDate = dateTo || currentCutoff.to;

//     const expenses1Datas = await Expenses1.findAll({
//       include: [
//         {
//           model: Expenses2,
//           required: true,
//           include: [
//             {
//               model: Expenses,
//               required: true,
//               where: {
//                 expenses_date: {
//                   [Op.between]: [fromDate, toDate],
//                 },
//                 status: "Approved",
//               },
//             },
//           ],
//         },
//       ],
//     });

//     return res.json(expenses1Datas);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

router.route("/getExpenses1Report").get(async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    console.log(
      "******************************************************************-" +
        dateFrom
    );
    console.log(
      "******************************************************************-" +
        dateTo
    );

    if (!dateFrom || !dateTo) {
      return res.status(404).json({ message: "Date not found" });
    }

    // Get the current cutoff
    const currentCutoff = await Cutoff.findOne({
      where: {
        from: { [Op.lte]: dateFrom }, // Find the cutoff that includes dateFrom
        to: { [Op.gte]: dateFrom },
      },
      order: [["from", "DESC"]],
    });

    const fallbackCutoff = await Cutoff.findOne({ order: [["from", "DESC"]] });
    const activeCutoff = currentCutoff || fallbackCutoff;

    // Get the previous cutoff
    const previousCutoff = await Cutoff.findOne({
      where: {
        from: { [Op.lt]: activeCutoff.from },
      },
      order: [["from", "DESC"]],
    });

    const fromDate = dateFrom || currentCutoff.from;
    const toDate = dateTo || currentCutoff.to;

    // Get the last month date range
    const lastMonthFromDate = previousCutoff ? previousCutoff.from : null;
    const lastMonthToDate = previousCutoff ? previousCutoff.to : null;

    console.log(
      "******************************************************************-" +
        lastMonthFromDate
    );
    console.log(
      "******************************************************************-" +
        lastMonthToDate
    );
    // Fetch data for the current month
    const expenses1Datas = await Expenses1.findAll({
      include: [
        {
          model: Expenses2,
          required: true,
          include: [
            {
              model: Expenses,
              required: true,
              where: {
                isDeleted: false,
                [Op.or]: [
                  {
                    expenses_date: {
                      [Op.between]: [fromDate, toDate], // Current month
                    },
                  },
                  {
                    expenses_date: {
                      [Op.between]: [lastMonthFromDate, lastMonthToDate], // Last month
                    },
                  },
                ],
                status: "Approved",
              },
              include: [
                {
                  model: Currency,
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    });

    const expenses2Datas = await Expenses2.findAll({
      include: [
        {
          model: Expenses,
          required: true,
          where: {
            isDeleted: false,
            [Op.or]: [
              {
                expenses_date: {
                  [Op.between]: [fromDate, toDate], // Current month
                },
              },
              {
                expenses_date: {
                  [Op.between]: [lastMonthFromDate, lastMonthToDate], // Last month
                },
              },
            ],
            status: "Approved",
          },
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
    });

    // Calculate totals for last month expenses 1
    const lastMonthTotals1 = {};
    expenses1Datas.forEach((expense1) => {
      expense1.expenses2s.forEach((expense2) => {
        expense2.expenses.forEach((expense) => {
          const currencyRate = expense.currency.currency_rate;
          const expenseDate = new Date(expense.expenses_date);
          if (
            expenseDate >= new Date(lastMonthFromDate) &&
            expenseDate <= new Date(lastMonthToDate)
          ) {
            const type = expense1.expenses_type_one;
            if (!lastMonthTotals1[type]) {
              lastMonthTotals1[type] = 0;
            }
            lastMonthTotals1[type] += expense.totalAmount * expense.rate;
          }
        });
      });
    });

    // Calculate totals for current month expenses 1
    const currentMonthTotals1 = {};
    expenses1Datas.forEach((expense1) => {
      const type = expense1.expenses_type_one;
      if (!currentMonthTotals1[type]) {
        currentMonthTotals1[type] = 0;
      }
      expense1.expenses2s.forEach((expense2) => {
        expense2.expenses.forEach((expense) => {
          const currencyRate = expense.currency.currency_rate;
          const expenseDate = new Date(expense.expenses_date);
          if (
            expenseDate >= new Date(fromDate) &&
            expenseDate <= new Date(toDate)
          ) {
            currentMonthTotals1[type] += expense.totalAmount * expense.rate;
          }
        });
      });
    });

    // Calculate totals for current month and last month expenses 2
    const lastMonthTotals2 = {};
    const currentMonthTotals2 = {};

    // Aggregating totals
    expenses2Datas.forEach((expense2) => {
      const type = expense2.sub_type;

      expense2.expenses.forEach((expense) => {
        const currencyRate = expense.currency.currency_rate || 1;
        const expenseDate = new Date(expense.expenses_date);

        if (!lastMonthTotals2[type]) lastMonthTotals2[type] = 0;
        if (!currentMonthTotals2[type]) currentMonthTotals2[type] = 0;

        // Last month totals
        if (
          lastMonthFromDate &&
          expenseDate >= new Date(lastMonthFromDate) &&
          expenseDate <= new Date(lastMonthToDate)
        ) {
          lastMonthTotals2[type] += expense.totalAmount * expense.rate;
        }

        // Current month totals
        if (
          expenseDate >= new Date(fromDate) &&
          expenseDate <= new Date(toDate)
        ) {
          currentMonthTotals2[type] += expense.totalAmount * expense.rate;
        }
      });
    });

    return res.json({
      currentMonthTotals1,
      lastMonthTotals1,
      currentMonthTotals2,
      lastMonthTotals2,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to get the summary of expense type 1 section
router.route("/summary/expense-type-one").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // Get the previous cutoff
    const prevCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    const lastMonth = `expenses_date BETWEEN ${sequelize.escape(prevCutoff?.from)} AND ${sequelize.escape(prevCutoff?.to)}` // prettier-ignore
    const currentMonth = `expenses_date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Get the total expense based on date condition provided
    const totalExpense = (dateCondition) =>
      `
        SUM(
          CASE
            WHEN ${dateCondition} THEN totalAmount * currency_rate
            ELSE 0
          END
        )
      `;

    const totalExpenseLastMonth = totalExpense(lastMonth);
    const totalExpenseCurrentMonth = totalExpense(currentMonth);
    const growthIndex = `(${totalExpenseCurrentMonth} - ${totalExpenseLastMonth}) / ${totalExpenseLastMonth} * 100`; // percentage

    // Get the expense type one summary
    const expenseTypeOne = await Expenses1.findAll({
      attributes: [
        "expenses_one_id",
        "expenses_type_one",
        [sequelize.literal(`${totalExpenseLastMonth}`), "lastMonth"],
        [sequelize.literal(`${totalExpenseCurrentMonth}`), "currentMonth"],
        [sequelize.literal(growthIndex), "growthIndex"],
      ],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
              where: {
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
            },
          ],
        },
      ],
      group: ["expenses_one.expenses_one_id"],
    });

    res.status(200).json(expenseTypeOne);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/expense-type-one-search").get(async (req, res) => {
  try {
    const { startDate, endDate, searchFunction, filterColumn } = req.query;

    // Validation for query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build search where clause
    let expenseType1WhereClause = {};
    const expenseType1ColumnTable = ["expenses_type_one", "description"];

    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        case "expenses_type_one":
          expenseType1WhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "description":
          expenseType1WhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        default:
          expenseType1WhereClause = {
            [Op.or]: expenseType1ColumnTable.map((col) => {
              return {
                [col]: {
                  [Op.like]: `%${searchFunction}%`,
                },
              };
            }),
          };
          break;
      }
    }

    // Get the previous cutoff
    const prevCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    // Raw SQL query approach to avoid complex Sequelize joins
    const query = `
      SELECT 
        e1.expenses_one_id,
        e1.expenses_type_one,
        COALESCE(SUM(
          CASE 
            WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
            THEN e.totalAmount * c.currency_rate 
            ELSE 0 
          END
        ), 0) as lastMonth,
        COALESCE(SUM(
          CASE 
            WHEN e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo 
            THEN e.totalAmount * c.currency_rate 
            ELSE 0 
          END
        ), 0) as currentMonth,
        CASE 
          WHEN SUM(
            CASE 
              WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
              THEN e.totalAmount * c.currency_rate 
              ELSE 0 
            END
          ) > 0
          THEN (
            SUM(
              CASE 
                WHEN e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo 
                THEN e.totalAmount * c.currency_rate 
                ELSE 0 
              END
            ) - SUM(
              CASE 
                WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
                THEN e.totalAmount * c.currency_rate 
                ELSE 0 
              END
            )
          ) / SUM(
            CASE 
              WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
              THEN e.totalAmount * c.currency_rate 
              ELSE 0 
            END
          ) * 100
          ELSE 0
        END as growthIndex
      FROM expenses_ones e1
      INNER JOIN expenses2s e2 ON e1.expenses_one_id = e2.expenses_type
      INNER JOIN expenses e ON e2.id = e.expenses2_id
      INNER JOIN currencies c ON e.currency_id = c.id
      WHERE e.status NOT IN ('For-Approval', 'Rejected')
        AND e.isDeleted = false
        AND (
          e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo
          OR e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo
        )
        ${
          searchFunction && searchFunction.trim() !== ""
            ? filterColumn === "expenses_type_one"
              ? `AND e1.expenses_type_one LIKE :searchTerm`
              : filterColumn === "description"
              ? `AND e1.description LIKE :searchTerm`
              : `AND (e1.expenses_type_one LIKE :searchTerm OR e1.description LIKE :searchTerm)`
            : ""
        }
      GROUP BY e1.expenses_one_id, e1.expenses_type_one
      ORDER BY e1.expenses_type_one
      LIMIT :limit OFFSET :offset
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT e1.expenses_one_id) as total
      FROM expenses_ones e1
      INNER JOIN expenses2s e2 ON e1.expenses_one_id = e2.expenses_type
      INNER JOIN expenses e ON e2.id = e.expenses2_id
      INNER JOIN currencies c ON e.currency_id = c.id
      WHERE e.status NOT IN ('For-Approval', 'Rejected')
        AND e.isDeleted = false
        AND (
          e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo
          OR e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo
        )
        ${
          searchFunction && searchFunction.trim() !== ""
            ? filterColumn === "expenses_type_one"
              ? `AND e1.expenses_type_one LIKE :searchTerm`
              : filterColumn === "description"
              ? `AND e1.description LIKE :searchTerm`
              : `AND (e1.expenses_type_one LIKE :searchTerm OR e1.description LIKE :searchTerm)`
            : ""
        }
    `;

    const replacements = {
      lastMonthFrom: prevCutoff?.from || null,
      lastMonthTo: prevCutoff?.to || null,
      currentMonthFrom: startDate,
      currentMonthTo: endDate,
      limit: limit,
      offset: offset,
      ...(searchFunction &&
        searchFunction.trim() !== "" && {
          searchTerm: `%${searchFunction}%`,
        }),
    };

    const [expenseTypeOne, countResult] = await Promise.all([
      sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(countQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }),
    ]);

    const count = countResult[0]?.total || 0;

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: expenseTypeOne,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get the summary expense type 2 section
router.route("/summary/expense-type-two").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // Get the previous cutoff
    const prevCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    const lastMonth = `expenses_date BETWEEN ${sequelize.escape(prevCutoff?.from)} AND ${sequelize.escape(prevCutoff?.to)}` // prettier-ignore
    const currentMonth = `expenses_date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Get the total expense based on date condition provided
    const totalExpense = (dateCondition) =>
      `
        SUM(
          CASE
            WHEN ${dateCondition} THEN totalAmount * currency_rate
            ELSE 0
          END
        )
      `;

    const totalExpenseLastMonth = totalExpense(lastMonth);
    const totalExpenseCurrentMonth = totalExpense(currentMonth);
    const growthIndex = `(${totalExpenseCurrentMonth} - ${totalExpenseLastMonth}) / ${totalExpenseLastMonth} * 100`; // percentage

    // Get the expense type two summary
    const expenseTypeTwo = await Expenses2.findAll({
      attributes: [
        "id",
        "sub_type",
        [sequelize.literal(`${totalExpenseLastMonth}`), "lastMonth"],
        [sequelize.literal(`${totalExpenseCurrentMonth}`), "currentMonth"],
        [sequelize.literal(growthIndex), "growthIndex"],
      ],
      include: [
        {
          model: Expenses,
          required: true,
          attributes: [],
          include: [
            {
              model: Currency,
              required: true,
              attributes: [],
            },
          ],
          where: {
            status: {
              [Op.notIn]: ["For-Approval", "Rejected"],
            },
            isDeleted: false,
          },
        },
      ],
      group: ["expenses2.id"],
    });

    res.status(200).json(expenseTypeTwo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/expense-type-two-search").get(async (req, res) => {
  try {
    const { startDate, endDate, searchFunction, filterColumn } = req.query;

    // Validation for query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get the previous cutoff
    const prevCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    // Raw SQL query approach to avoid complex Sequelize joins
    const query = `
      SELECT 
        e2.id,
        e2.sub_type,
        COALESCE(SUM(
          CASE 
            WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
            THEN e.totalAmount * c.currency_rate 
            ELSE 0 
          END
        ), 0) as lastMonth,
        COALESCE(SUM(
          CASE 
            WHEN e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo 
            THEN e.totalAmount * c.currency_rate 
            ELSE 0 
          END
        ), 0) as currentMonth,
        CASE 
          WHEN SUM(
            CASE 
              WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
              THEN e.totalAmount * c.currency_rate 
              ELSE 0 
            END
          ) > 0
          THEN (
            SUM(
              CASE 
                WHEN e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo 
                THEN e.totalAmount * c.currency_rate 
                ELSE 0 
              END
            ) - SUM(
              CASE 
                WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
                THEN e.totalAmount * c.currency_rate 
                ELSE 0 
              END
            )
          ) / SUM(
            CASE 
              WHEN e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo 
              THEN e.totalAmount * c.currency_rate 
              ELSE 0 
            END
          ) * 100
          ELSE 0
        END as growthIndex
      FROM expenses2s e2
      INNER JOIN expenses e ON e2.id = e.expenses2_id
      INNER JOIN currencies c ON e.currency_id = c.id
      WHERE e.status NOT IN ('For-Approval', 'Rejected')
        AND e.isDeleted = false
        AND (
          e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo
          OR e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo
        )
        ${
          searchFunction && searchFunction.trim() !== ""
            ? filterColumn === "expenses_type"
              ? `AND e2.expenses_type LIKE :searchTerm`
              : filterColumn === "sub_type"
              ? `AND e2.sub_type LIKE :searchTerm`
              : filterColumn === "description"
              ? `AND e2.description LIKE :searchTerm`
              : `AND (e2.expenses_type LIKE :searchTerm OR e2.sub_type LIKE :searchTerm OR e2.description LIKE :searchTerm)`
            : ""
        }
      GROUP BY e2.id, e2.sub_type
      ORDER BY e2.sub_type
      LIMIT :limit OFFSET :offset
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT e2.id) as total
      FROM expenses2s e2
      INNER JOIN expenses e ON e2.id = e.expenses2_id
      INNER JOIN currencies c ON e.currency_id = c.id
      WHERE e.status NOT IN ('For-Approval', 'Rejected')
        AND e.isDeleted = false
        AND (
          e.expenses_date BETWEEN :lastMonthFrom AND :lastMonthTo
          OR e.expenses_date BETWEEN :currentMonthFrom AND :currentMonthTo
        )
        ${
          searchFunction && searchFunction.trim() !== ""
            ? filterColumn === "expenses_type"
              ? `AND e2.expenses_type LIKE :searchTerm`
              : filterColumn === "sub_type"
              ? `AND e2.sub_type LIKE :searchTerm`
              : filterColumn === "description"
              ? `AND e2.description LIKE :searchTerm`
              : `AND (e2.expenses_type LIKE :searchTerm OR e2.sub_type LIKE :searchTerm OR e2.description LIKE :searchTerm)`
            : ""
        }
    `;

    const replacements = {
      lastMonthFrom: prevCutoff?.from || null,
      lastMonthTo: prevCutoff?.to || null,
      currentMonthFrom: startDate,
      currentMonthTo: endDate,
      limit: limit,
      offset: offset,
      ...(searchFunction &&
        searchFunction.trim() !== "" && {
          searchTerm: `%${searchFunction}%`,
        }),
    };

    const [expenseTypeTwo, countResult] = await Promise.all([
      sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(countQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }),
    ]);

    const count = countResult[0]?.total || 0;

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: expenseTypeTwo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for overview summary of expense type 1
router.route("/overview").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query params are required.",
      });

    // Get the previous cutoff
    const prevCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    const lastMonth = `expenses_date BETWEEN ${sequelize.escape(prevCutoff?.from)} AND ${sequelize.escape(prevCutoff?.to)}` // prettier-ignore
    const currentMonth = `expenses_date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Get the total expense based on date condition provided
    const totalExpense = (dateCondition) =>
      `
        SUM(
          CASE
            WHEN ${dateCondition} THEN totalAmount * currency_rate
            ELSE 0
          END
        )
      `;

    const totalExpenseLastMonth = totalExpense(lastMonth);
    const totalExpenseCurrentMonth = totalExpense(currentMonth);
    const growthIndex = `(${totalExpenseCurrentMonth} - ${totalExpenseLastMonth}) / ${totalExpenseLastMonth} * 100`; // percentage

    // Get the expense type one current month total amount
    const expenseTypeOneCurrentMonth = await Expenses1.findAll({
      attributes: [
        "expenses_one_id",
        "expenses_type_one",
        [sequelize.literal(`${totalExpenseCurrentMonth}`), "currentMonth"],
        [sequelize.literal(growthIndex), "growthIndex"],
      ],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
              where: {
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
            },
          ],
        },
      ],
      group: ["expenses_one.expenses_one_id"],
    });

    // Get the expense type one current month total amount
    const expenseTypeOneLastMonth = await Expenses1.findAll({
      attributes: [
        "expenses_one_id",
        "expenses_type_one",
        [sequelize.literal(`${totalExpenseLastMonth}`), "lastMonth"],
      ],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
              where: {
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
            },
          ],
        },
      ],
      group: ["expenses_one.expenses_one_id"],
    });

    // Get the total expense for current month
    const currentMonthTotalExpense = await Expenses1.findOne({
      attributes: [
        [
          sequelize.literal(
            `SUM(${sequelize.escape(
              sequelize.col("expenses2s.expenses.totalAmount")
            )} * currency_rate)`
          ),
          "total",
        ],
      ],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
              where: {
                expenses_date: {
                  [Op.between]: [startDate, endDate],
                },
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
            },
          ],
        },
      ],
      raw: true,
      subQuery: false,
    });

    // Get the total expense for last month
    const lastMonthTotalExpense = await Expenses1.findOne({
      attributes: [
        [
          sequelize.literal(
            `SUM(${sequelize.escape(
              sequelize.col("expenses2s.expenses.totalAmount")
            )} * currency_rate)`
          ),
          "total",
        ],
      ],
      include: [
        {
          model: Expenses2,
          required: true,
          attributes: [],
          include: [
            {
              model: Expenses,
              required: true,
              attributes: [],
              include: [
                {
                  model: Currency,
                  required: true,
                  attributes: [],
                },
              ],
              where: {
                expenses_date: {
                  [Op.between]: [prevCutoff?.from, prevCutoff?.to],
                },
                status: {
                  [Op.notIn]: ["For-Approval", "Rejected"],
                },
                isDeleted: false,
              },
            },
          ],
        },
      ],
      raw: true,
      subQuery: false,
    });

    const lastMonthExpense = lastMonthTotalExpense?.total || 0; // Get the total expense for last month
    const currentMonthExpense = currentMonthTotalExpense?.total || 0; // Get the total expense for current month

    // Get the growth index from the current and last month total expense
    const growthIndexTotalExpense = lastMonthExpense
      ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
      : 0;

    res.status(200).json({
      expenseTypeOneCurrentMonth,
      expenseTypeOneLastMonth,
      currentMonthTotalExpense: currentMonthExpense,
      lastMonthTotalExpense: lastMonthExpense,
      growthIndexTotalExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
