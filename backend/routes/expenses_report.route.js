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

module.exports = router;
