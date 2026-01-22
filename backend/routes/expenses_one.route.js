const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const Expenses1 = require("../db/models/expenses1.model");
const Activity_Log = require("../db/models/activity_log.model");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/create").post(async (req, res) => {
  try {
    const {
      expensesTypeOne,
      description,
      incomeStatementCheckBox,
      userLoggedID,
    } = req.body;

    const existingDataCode = await Expenses1.findOne({
      where: {
        expenses_type_one: expensesTypeOne,
      },
    });

    if (existingDataCode) {
      res.status(201).send("Exist");
    } else {
      const newData = await Expenses1.create({
        expenses_type_one: expensesTypeOne,
        description: description,
        isForIncomeStatement: incomeStatementCheckBox,
        isArchive: false,
      });

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Expenses Type 1: User created new expenses type named ${expensesTypeOne}`,
      });

      res.status(200).json(newData);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.route("/getExpensesOne").get(async (req, res) => {
  try {
    const data = await Expenses1.findAll({
      // where: {
      //   expenses_one_id: {
      //     [Op.ne]: "11111111-1111-1111-1111-111111111111",
      //   },
      // },
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getExpensesOneForFilter").get(async (req, res) => {
  try {
    const { filterStatus, filterColumn, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let expensesOneWhereClause = {};

    switch (filterColumn) {
      // Filter expense type
      case "expenses_type_one":
        expensesOneWhereClause = {
          expenses_type_one: {
            [Op.like]: `%${searchText}%`,
          },
        };
        break;
      // Filter description
      case "description":
        expensesOneWhereClause = {
          description: {
            [Op.like]: `%${searchText}%`,
          },
        };
        break;
      // Filter all
      default:
        expensesOneWhereClause = {
          [Op.or]: [
            {
              expenses_type_one: {
                [Op.like]: `%${searchText}%`,
              },
            },
            {
              description: {
                [Op.like]: `%${searchText}%`,
              },
            },
          ],
        };
        break;
    }

    if (filterStatus !== "All") {
      expensesOneWhereClause["isArchive"] =
        filterStatus === "Archive" ? true : false;
    }
    const { count, rows } = await Expenses1.findAndCountAll({
      // where: {
      //   expenses_one_id: {
      //     [Op.ne]: "11111111-1111-1111-1111-111111111111",
      //   },
      // },
      where: expensesOneWhereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/updateExpenses1").put(async (req, res) => {
  try {
    const {
      expensesId,
      expensesTypeOne,
      description,
      incomeStatementCheckBox,
      userLoggedID,
    } = req.body;

    const isExist = await Expenses1.findOne({
      where: {
        expenses_type_one: expensesTypeOne,
        expenses_one_id: { [Op.ne]: expensesId },
      },
    });

    if (isExist) {
      return res.status(201).json();
    } else {
      const getData = await Expenses1.findOne({
        where: {
          expenses_one_id: expensesId,
        },
      });

      const isCreated = await Expenses1.update(
        {
          expenses_type_one: expensesTypeOne,
          description: description,
          isForIncomeStatement: incomeStatementCheckBox,
        },
        {
          where: {
            expenses_one_id: expensesId,
          },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Expenses Type 1: User updated the expenses type information: \n
        ${getData.expenses_type_one} to ${expensesTypeOne}, 
         ${getData.description} to ${description}, 
        `,
      });

      if (isCreated) {
        return res.status(200).json();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/unarchiveExpense").put(async (req, res) => {
  try {
    const { expensesId, userLoggedID } = req.body;

    const getData = await Expenses1.findOne({
      where: {
        expenses_one_id: expensesId,
      },
    });

    const updateResult = await Expenses1.update(
      {
        isArchive: false,
      },
      {
        where: {
          expenses_one_id: expensesId,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Expenses Type 1: User unarchived the expenses type named ${getData.expenses_type_one}`,
    });

    if (updateResult) {
      res.status(200).send({ message: "Updated Successfully" });
    } else {
      res
        .status(202)
        .send({ message: "Expenses Type One not found or cannot be deleted" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/deleteExpenseOne").delete(async (req, res) => {
  try {
    const { expensesId, userLoggedID } = req.body;

    // const expensesToDelete = await Expense2.findAll({
    //   where: {
    //       expenses_one_id: expensesId,
    //   },
    // })

    // if (expensesToDelete && expensesToDelete.length > 0) {
    //   res.status(202).json({ success: true });
    // } else {

    //     }

    const getData = await Expenses1.findOne({
      where: {
        expenses_one_id: expensesId,
      },
    });

    const updateResult = await Expenses1.update(
      {
        isArchive: true,
      },
      {
        where: {
          expenses_one_id: expensesId,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Expenses Type 1: User archived the expenses type named ${getData.expenses_type_one}`,
    });

    if (updateResult) {
      res.status(200).send({ message: "Updated Successfully" });
    } else {
      res
        .status(202)
        .send({ message: "Expenses Type One not found or cannot be deleted" });
    }
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
