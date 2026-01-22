const router = require("express").Router();
const { where, Op } = require("sequelize");
const {
  UserRole,
  MasterList,
  Activity_Log,
} = require("../db/models/associations");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/getUserRoleData").get(async (req, res) => {
  try {
    const { filterColumn, searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Default value of where clause
    let userRoleWhereClause = {
      col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
    };
    // Table column of User Role
    const userRoleColumn = ["col_rolename", "col_authorization", "col_desc"];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Filter for role name
        case "role-name":
          userRoleWhereClause = {
            col_rolename: {
              [Op.like]: `%${searchText}%`,
            },
            col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          };
          break;
        // Filter for role authorization
        case "role-authorization":
          userRoleWhereClause = {
            col_authorization: {
              [Op.like]: `%${searchText}%`,
            },
            col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          };
          break;
        // Filter for description
        case "description":
          userRoleWhereClause = {
            col_desc: {
              [Op.like]: `%${searchText}%`,
            },
            col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          };
          break;
        // Filter for all
        default:
          userRoleWhereClause = {
            [Op.or]: userRoleColumn.map((col) => {
              return {
                [col]: {
                  [Op.like]: `%${searchText}%`,
                },
                col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
              };
            }),
          };
          break;
      }
    }

    const { count, rows: data } = await UserRole.findAndCountAll({
      where: userRoleWhereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
});

router.route("/fetchUserRole").get(async (req, res) => {
  try {
    const data = await UserRole.findAll({
      where: {
        col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
      },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
});

router.route("/createRbac").post(async (req, res) => {
  const { roleName, roleDescription, checkedItems, userLoggedID } = req.body;

  try {
    const isExit = await UserRole.findOne({
      where: { col_rolename: roleName },
    });

    if (isExit) {
      return res.status(202).send("Exist");
    } else {
      // Concatenate the authorization values with commas
      const concatenatedAuthorization = checkedItems
        .map((item) => item.id)
        .join(", ");

      const createdRole = await UserRole.create({
        col_rolename: roleName,
        col_desc: roleDescription,
        col_authorization: concatenatedAuthorization,
      });

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Access Control: User created a new role named ${roleName}`,
      });
      return res.status(200).json({ message: "Data inserted successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.route("/updateRbac").post(async (req, res) => {
  const { id, roleName, roleDescription, checkedItems, userLoggedID } =
    req.query;

  try {
    const isExit = await UserRole.findOne({
      where: {
        col_rolename: roleName,
        col_id: {
          [Op.ne]: id,
        },
      },
    });

    if (isExit) {
      return res.status(202).send("Exist");
    } else {
      const getData = await UserRole.findOne({
        where: {
          col_id: id,
        },
      });
      // Ensure checkedItems is an array, even if it's empty
      let checkedItemsArray = [];
      if (checkedItems) {
        try {
          checkedItemsArray = JSON.parse(checkedItems);
        } catch (e) {
          console.error("Error parsing checkedItems:", e);
        }
      }

      // Concatenate the authorization values with commas, or use an empty string if there are no items
      const concatenatedAuthorization =
        Array.isArray(checkedItemsArray) && checkedItemsArray.length > 0
          ? checkedItemsArray.map((item) => item.id).join(", ")
          : "";

      const updatedRole = await UserRole.update(
        {
          col_rolename: roleName,
          col_desc: roleDescription,
          col_authorization: concatenatedAuthorization,
        },
        {
          where: {
            col_id: id,
          },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Access Control: User updated the user role information: \n
Access name '${getData.col_rolename}' to '${roleName}' and 
Description '${getData.col_desc}' to '${roleDescription}'
`,
      });

      return res.status(200).json({ message: "Data updated successfully" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.route("/deleteRbac/:userRoleId").delete(async (req, res) => {
  try {
    const id = req.params.userRoleId;

    const { masterlist_id } = req.body;

    const findRole = await MasterList.findAll({
      where: {
        userrole_id: id,
      },
    });

    if (findRole && findRole.length > 0) {
      res.status(202).json({ success: true });
    } else {
      const role = await UserRole.findOne({
        where: { col_id: id },
      });

      await Activity_Log.create({
        masterlist_id: masterlist_id,
        action_taken: `Access Control: User deleted a role named ${role.col_rolename}`,
      });
      const deletionResult = await UserRole.destroy({
        where: {
          col_id: id,
        },
      });

      if (deletionResult) {
        res.json({ success: true });
      } else {
        res.status(203).json({ success: false });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

router.route("/fetchUserRoleDataToEdit").get(async (req, res) => {
  const { id } = req.query;

  try {
    const data = await UserRole.findByPk(id);

    if (!data) {
      return res.status(404).json({ message: "User role not found" });
    }
    // console.log(data);
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
