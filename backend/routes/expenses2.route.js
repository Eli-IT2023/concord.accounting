const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Expenses2,
  Expenses1,
  Activity_Log,
} = require("../db/models/associations");
const {
  createDateTimeSearchConditions,
} = require("../utils/dateTimeSearchConditions");
const session = require("express-session");

//used Module/s:
//Expenses 2
// Expenses Accouting
router.route("/fetchTable").get(async (req, res) => {
  try {
    const isFetch = await Expenses2.findAll({
      include: [
        {
          model: Expenses1,
          required: true,
        },
      ],

      where: {
        isArchive: false,
      },
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.get("/fetchPaginatedTable", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Expenses2.findAndCountAll({
      include: [
        {
          model: Expenses1,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.route("/fetchTableForFilter").get(async (req, res) => {
  try {
    const { filterStatus, filterColumn, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let expenseTwoWhereClause = {};
    let expenseOneWhereClause = {};

    // Only apply search filters if searchText is not empty
    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Filter expense type
        case "expenses_type":
          expenseOneWhereClause = {
            expenses_type_one: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter expense sub type
        case "expenses_sub_type":
          expenseTwoWhereClause = {
            sub_type: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for description
        case "description":
          expenseTwoWhereClause = {
            description: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for all
        default:
          expenseTwoWhereClause = {
            [Op.or]: [
              {
                sub_type: {
                  [Op.like]: `%${searchText}%`,
                },
              },
              {
                description: {
                  [Op.like]: `%${searchText}%`,
                },
              },
              ...createDateTimeSearchConditions("expenses2", searchText),
            ],
          };
          break;
      }
    }

    // Always apply status filter if not "All"
    if (filterStatus !== "All") {
      expenseTwoWhereClause.isArchive =
        filterStatus === "Archive" ? true : false;
    }

    let { count, rows } = await Expenses2.findAndCountAll({
      include: [
        {
          model: Expenses1,
          required: true,
          where: expenseOneWhereClause,
        },
      ],
      where: expenseTwoWhereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    // handle expense type search for filter "All" if no results found
    if (
      count === 0 &&
      searchText &&
      searchText.trim() !== "" &&
      filterColumn === "All"
    ) {
      // conditionally add archive filter
      const archiveFilter =
        filterStatus !== "All"
          ? { isArchive: expenseTwoWhereClause.isArchive }
          : {};

      expenseOneWhereClause = {
        expenses_type_one: {
          [Op.like]: `%${searchText}%`,
        },
      };

      const result = await Expenses2.findAndCountAll({
        include: [
          {
            model: Expenses1,
            required: true,
            where: expenseOneWhereClause,
          },
        ],
        where: {
          ...archiveFilter,
        },
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
      });

      count = result.count;
      rows = result.rows;
    }

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

//used Module/s:
//Expenses 2
router.route("/filter").get(async (req, res) => {
  const { statuss } = req.query;
  let whereClause = {};
  if (statuss !== "All") {
    whereClause["$expenses2.isArchive$"] = statuss === "Active" ? false : true;
  }
  try {
    const isFetch = await Expenses2.findAll({
      where: whereClause,
      include: [
        {
          model: Expenses1,
          required: true,
        },
      ],
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//used Module/s:
//Expenses 2
router.route("/createExpenses2").post(async (req, res) => {
  try {
    const { type, subTypeName, description, userLoggedID } = req.body;

    const isExist = await Expenses2.findOne({
      where: {
        expenses_type: type,
        sub_type: subTypeName,
      },
    });

    if (isExist) {
      return res.status(201).json();
    } else {
      const isCreated = await Expenses2.create({
        expenses_type: type,
        sub_type: subTypeName,
        description: description,
      });

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Expenses Type 2: User created new expenses type named ${subTypeName}`,
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

//used Module/s:
//Expenses 2
router.route("/updateExpenses2").post(async (req, res) => {
  try {
    const { selectedTableId, type, subTypeName, description, userLoggedID } =
      req.body;

    const isExist = await Expenses2.findOne({
      where: {
        expenses_type: type,
        sub_type: subTypeName,
        id: { [Op.ne]: selectedTableId },
      },
    });

    if (isExist) {
      return res.status(201).json();
    } else {
      const getData = await Expenses2.findOne({
        include: [
          {
            model: Expenses1,
          },
        ],
        where: {
          id: selectedTableId,
        },
      });

      const findExpense = await Expenses1.findOne({
        where: {
          expenses_one_id: type,
        },
      });

      const isCreated = await Expenses2.update(
        {
          expenses_type: type,
          sub_type: subTypeName,
          description: description,
        },
        {
          where: {
            id: selectedTableId,
          },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Expenses Type 2: User updated the expenses type information: \n
        ${getData.sub_type} to ${subTypeName}, 
         ${getData.description} to ${description}, 
        ${getData.expenses_one.expenses_type_one} to ${findExpense.expenses_type_one}
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

//used Module/s:
//Expenses 2
router.route("/archive").post(async (req, res) => {
  const { selectedTableId, userLoggedID } = req.body;

  const getData = await Expenses2.findOne({
    where: {
      id: selectedTableId,
    },
  });

  const archive = await Expenses2.update(
    {
      isArchive: true,
    },
    {
      where: {
        id: selectedTableId,
      },
    }
  );

  await Activity_Log.create({
    masterlist_id: userLoggedID,
    action_taken: `Expenses Type 2: User archived the expenses type named ${getData.sub_type}`,
  });

  if (archive) {
    return res.status(200).json();
  }
});

router.route("/unarchiveExpense2").put(async (req, res) => {
  try {
    const { selectedTableId, userLoggedID } = req.body;

    const getData = await Expenses2.findOne({
      where: {
        id: selectedTableId,
      },
    });

    const updateResult = await Expenses2.update(
      {
        isArchive: false,
      },
      {
        where: {
          id: selectedTableId,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Expenses Type 2: User unarchived the expenses type named ${getData.sub_type}`,
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

module.exports = router;
