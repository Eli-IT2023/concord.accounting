const router = require("express").Router();
const { where, Op, fn, col, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const session = require("express-session");
const {
  createDateTimeSearchConditions,
} = require("../utils/dateTimeSearchConditions");
const {
  UserRole,
  MasterList,
  Expenses1,
  Expenses2,
  Notification,
  Currency,
  Activity_Log,
  Warehouse,
} = require("../db/models/associations");
const emailConfig = require("../db/config/mailer.config");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  accountlist_base_subject,
  accountlist_sub3,
} = require("../db/models/ModelsBySubject/associations_sub");
const frontendURL = require("../db/config/mailer.config").frontendURL;
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  }),
);

router.route("/login").post(async (req, res) => {
  const { email, username, password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Determine if login is by email or username
    let whereClause = {};

    if (email) {
      // If email is provided, use email
      whereClause = {
        email: email,
        status: true,
      };
    } else if (username) {
      // If username is provided, use username
      whereClause = {
        uname: username,
        status: true,
      };
    } else {
      return res.status(400).json({ message: "Email or username is required" });
    }

    const user = await MasterList.findOne({
      where: whereClause,
    });

    if (!user) {
      return res.status(204).json({ message: "User not found" });
    } else if (user.status !== true) {
      return res.status(203).json({ message: "User is inactive" });
    } else if (user && user.password === password) {
      const userData = {
        username: user.uname,
        id: user.id,
        Fname: user.fname,
        Lname: user.lname,
        email: user.email,
        userType: user.user_type,
      };
      const accessToken = jwt.sign(userData, process.env.ACCESS_SECRET_TOKEN);
      res.cookie("access-token", accessToken, {});
      return res.status(200).json({ accessToken, message: "Login successful" });
    } else {
      return res.status(201).json({ message: "Incorrect Credentials" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:

// MASTER LIST ROUTES
router.route("/getMasterListData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await MasterList.findAndCountAll({
      where: {
        id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
      },
      include: [
        {
          model: UserRole,
          required: true,
          where: {
            col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          },
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/searchUsers").get(async (req, res) => {
  try {
    const { filterColumn, searchText, status, page, limit } = req.query;
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const offset = (currentPage - 1) * itemsPerPage;

    // Default where clause
    const whereClause = {
      id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" }, // Exclude system user if needed
    };

    // Apply status filter if provided
    if (status && status !== "all") {
      whereClause.status = status === "active";
    }

    // Apply search filters if searchText is provided
    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (filterColumn && filterColumn !== "all") {
        switch (filterColumn) {
          case "employee-id":
            whereClause.emp_id = { [Op.like]: `%${text}%` };
            break;

          case "name":
            whereClause[Op.or] = [
              Sequelize.where(
                Sequelize.fn(
                  "CONCAT",
                  Sequelize.col("fname"),
                  " ",
                  Sequelize.literal(
                    'CASE WHEN mname = "" THEN "" ELSE CONCAT(mname, " ") END',
                  ),
                  Sequelize.col("lname"),
                ),
                { [Op.like]: `%${text}%` },
              ),
            ];
            break;

          case "role":
            whereClause["$userRole.col_rolename$"] = { [Op.like]: `%${text}%` };
            break;

          case "email":
            whereClause.email = { [Op.like]: `%${text}%` };
            break;

          case "city":
            whereClause.city = { [Op.like]: `%${text}%` };
            break;

          case "date":
            whereClause[Op.or] = [
              ...createDateTimeSearchConditions(
                "masterlist",
                searchText,
                "createdAt",
              ),
            ];
            break;
        }
      } else {
        // Global search across all table columns
        whereClause[Op.or] = [
          { emp_id: { [Op.like]: `%${text}%` } },
          { fname: { [Op.like]: `%${text}%` } },
          { mname: { [Op.like]: `%${text}%` } },
          { lname: { [Op.like]: `%${text}%` } },
          { email: { [Op.like]: `%${text}%` } },
          { city: { [Op.like]: `%${text}%` } },
          { "$userRole.col_rolename$": { [Op.like]: `%${text}%` } },
          Sequelize.where(
            Sequelize.fn(
              "CONCAT",
              Sequelize.col("fname"),
              " ",
              Sequelize.literal(
                'CASE WHEN mname = "" THEN "" ELSE CONCAT(mname, " ") END',
              ),
              Sequelize.col("lname"),
            ),
            { [Op.like]: `%${text}%` },
          ),
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("masterlist.createdAt"),
              "%M %d, %Y",
            ),
            { [Op.like]: `%${text}%` },
          ),
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("masterlist.createdAt"),
              "%Y-%m-%d",
            ),
            { [Op.like]: `%${text}%` },
          ),
          ...createDateTimeSearchConditions(
            "masterlist",
            searchText,
            "createdAt",
          ),
        ];
      }
    }

    const include = [
      {
        model: UserRole,
        as: "userRole",
        required: true,
        where: {
          col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
        },
      },
    ];

    const { count, rows } = await MasterList.findAndCountAll({
      where: whereClause,
      include: include,
      order: [["createdAt", "DESC"]],
      limit: itemsPerPage,
      offset: offset,
      distinct: true,
    });

    // Format the createdAt date to match your frontend display
    const formattedData = rows.map((item) => ({
      ...item.get({ plain: true }),
      createdAtFormatted: new Date(item.createdAt)
        .toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(/,([^,]*)$/, " -$1"),
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
      totalItems: count,
      totalPages: Math.ceil(count / itemsPerPage),
      currentPage: currentPage,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
// Masterlist
router.route("/fetchTable").get(async (req, res) => {
  try {
    const isFetch = await MasterList.findAll({
      where: {
        id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
      },
      include: [
        {
          model: UserRole,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchTableForFilter").get(async (req, res) => {
  try {
    const { selectedStatus, filterColumn, searchText } = req.query;

    let masterListWhereClause = {
      id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
    };

    let userRoleWhereClause = {
      col_id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
    };

    const masterListTableColumn = ["emp_id", "email", "city"];

    switch (filterColumn) {
      // Filter employee id
      case "employee-id":
        masterListWhereClause = {
          id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          emp_id: {
            [Op.like]: `%${searchText}%`,
          },
        };
        break;
      // Filter name
      case "name":
        masterListWhereClause = {
          [Op.and]: [
            {
              id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" }, // Exclude id 1
            },
            sequelize.where(
              fn("CONCAT", col("fname"), " ", col("mname"), " ", col("lname")),
              {
                [Op.like]: `%${searchText}%`, // Search for the full name
              },
            ),
          ],
        };
        break;
      // Filter role
      case "role":
        userRoleWhereClause["col_rolename"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      // Filter email
      case "email":
        masterListWhereClause = {
          id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          email: {
            [Op.like]: `%${searchText}%`,
          },
        };
        break;
      // Filter city
      case "city":
        masterListWhereClause = {
          id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
          city: {
            [Op.like]: `%${searchText}%`,
          },
        };
        break;
      // Filter for all
      default:
        masterListWhereClause = {
          [Op.and]: [
            { id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" } },
            {
              [Op.or]: [
                ...masterListTableColumn.map((col) => {
                  return {
                    [col]: {
                      [Op.like]: `%${searchText}%`,
                    },
                  };
                }),
                sequelize.where(
                  fn(
                    "CONCAT",
                    col("fname"),
                    " ",
                    col("mname"),
                    " ",
                    col("lname"),
                  ),
                  {
                    [Op.like]: `%${searchText}%`, // Search for the full name
                  },
                ),
              ],
            },
          ],
        };

        break;
    }

    if (selectedStatus !== "All") {
      masterListWhereClause["status"] =
        selectedStatus === "Active" ? true : false;
    }

    let isFetch = await MasterList.findAll({
      where: masterListWhereClause,
      include: [
        {
          model: UserRole,
          required: true,
          where: userRoleWhereClause,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // if isFetch is empty try to search for role
    if (isFetch.length === 0) {
      masterListWhereClause = {
        id: { [Op.ne]: "11111111-1111-1111-1111-111111111111" },
      };
      if (selectedStatus !== "All") {
        masterListWhereClause["status"] =
          selectedStatus === "Active" ? true : false;
      }
      userRoleWhereClause["col_rolename"] = {
        [Op.like]: `%${searchText}%`,
      };
      isFetch = await MasterList.findAll({
        where: masterListWhereClause,
        include: [
          {
            model: UserRole,
            required: true,
            where: userRoleWhereClause,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Masterlist
router.route("/filterStatus").get(async (req, res) => {
  try {
    const { statuss } = req.query;
    let whereClause = {};
    if (statuss !== "All") {
      whereClause["$masterlist.status$"] = statuss === "Active" ? true : false;
    }
    const isFetch = await MasterList.findAll({
      where: whereClause,
      include: [
        {
          model: UserRole,
          required: true,
          where: {
            col_id: {
              [Op.ne]: "11111111-1111-1111-1111-111111111111",
            },
          },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// Function to generate a random secure password
function generatePassword(length) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~";
  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => charset[x % charset.length])
    .join("");
}

//USED MODULE:
// Masterlist
router.route("/create").post(async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    address,
    city,
    province,
    zipCode,
    email,
    contactNumber,
    birthday,
    maritalStatus,
    gender,
    userAccessType,
    username,
    basicSalary,
    dailyRate,
    status,
    userType,
    userLoggedID,
  } = req.body;

  try {
    const lastECode = await MasterList.findOne({
      order: [["createdAt", "DESC"]],
    });

    let nextCode;
    if (lastECode) {
      const lastCode = lastECode.emp_id;
      const lastNumber = parseInt(lastCode.substring(1), 10);
      nextCode = (lastNumber + 1).toString().padStart(5, "0");
    } else {
      nextCode = "00001"; // Initial category code
    }

    const isExist = await MasterList.findOne({ where: { email: email } });

    if (isExist) {
      return res.status(201).json();
    } else {
      const generatedPassword = generatePassword(12); // Generates a 12-character password

      const isCreated = await MasterList.create({
        emp_id: nextCode,
        fname: firstName,
        mname: middleName,
        lname: lastName,
        address: address,
        city: city,
        province: province,
        number: contactNumber,
        birthdate: birthday,
        marital_status: maritalStatus,
        gender: gender,
        userrole_id: userAccessType,
        uname: username,
        salary: basicSalary === "" ? null : basicSalary,
        daily_rate: dailyRate === "" ? null : dailyRate,
        password: generatedPassword, // Store the generated password
        email: email,
        zip_code: zipCode,
        status: status === "on" ? true : false,
        user_type: userType,
      });

      const fullName = `${firstName} ${middleName} ${lastName}`;

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `User Management: User created a new user named ${fullName}`,
      });

      if (isCreated) {
        // Email configuration
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailConfig.email,
            pass: emailConfig.password,
          },
        });

        // Mail options - using HTML formatting
        const mailOptions = {
          from: emailConfig.email,
          to: email, // Send to the user's email
          subject: "Welcome to the platform! Please reset your password",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Hi <strong>${firstName}</strong>,</p>
                
                <p>Your account has been created. Below are your login details:</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                    <p><strong>User ID:</strong> ${nextCode}</p>
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Email Address:</strong> ${email}</p>
                    <p><strong>Password:</strong> ${generatedPassword}</p>
                </div>
                
                <p>Please change your password by clicking the link below:</p>
                
                <p style="margin: 25px 0;">
                    <a href="${frontendURL}/new-password" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Click here to reset your password
                    </a>
                </p>
                
                <p>Or copy and paste this URL into your browser:</p>
                <p style="color: #666; font-size: 14px; word-break: break-all;">${frontendURL}/new-password</p>
                
                <p>Thank you.</p>
            </div>
        `,
          // Fallback text version for email clients that don't support HTML
          text: `Hi ${firstName},\n\nYour account has been created. Below are your login details:\n\nUser ID: ${nextCode}\nUsername: ${username}\nEmail Address: ${email}\nPassword: ${generatedPassword}\n\nPlease change your password by visiting the following link: ${frontendURL}/new-password\n\nThank you.`,
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("Error sending email:", error);
            return res
              .status(500)
              .send({ message: "Failed to send email", error });
          } else {
            console.log("Email Sent:", info.response);
            return res.status(200).send({
              message: "User created successfully and email sent.",
              info,
            });
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Masterlist
router.route("/update").put(async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    address,
    city,
    province,
    zipCode,
    email,
    contactNumber,
    birthday,
    maritalStatus,
    gender,
    userAccessType,
    username,
    password,
    basicSalary,
    dailyRate,
    status,
    selectedTableId,
    userLoggedID,
  } = req.body;
  try {
    const isExist = await MasterList.findOne({
      where: {
        email: email,
        id: { [Op.ne]: selectedTableId },
      },
    });

    if (isExist) {
      return res.status(201).json();
    } else {
      const getData = await MasterList.findOne({
        where: {
          id: selectedTableId,
        },
        include: [
          {
            model: UserRole,
            attributes: ["col_rolename"],
          },
        ],
      });

      const isUpdated = await MasterList.update(
        {
          fname: firstName,
          mname: middleName,
          lname: lastName,
          address: address,
          city: city,
          province: province,
          number: contactNumber,
          birthdate: birthday,
          marital_status: maritalStatus,
          gender: gender,
          userrole_id: userAccessType,
          uname: username,
          salary: basicSalary === "" ? null : basicSalary,
          daily_rate: dailyRate === "" ? null : dailyRate,
          password: password,
          email: email,
          zip_code: zipCode,
          status: status === "on" ? true : false,
        },
        {
          where: {
            id: selectedTableId,
          },
        },
      );

      const roleName = await UserRole.findOne({
        where: {
          col_id: userAccessType,
        },
        attributes: ["col_rolename"],
      });

      const newRole = roleName.dataValues.col_rolename;
      const getDataRole = getData.userRole.dataValues.col_rolename;
      const getDataStatus = getData.status ? "Active" : "Inactive";
      const currStatus = status ? "Active" : "Inactive";

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `User Management: Update user information: \n
           '${getData.fname}' to '${firstName}',
          '${getData.mname}' to '${middleName}',
          '${getData.lname}' to '${lastName}',
          '${getData.address}' to '${address}',
          '${getData.city}' to '${city}',
          '${getData.province}' to '${province}',
          '${getData.zipcode}' to '${zipCode}',
          '${getData.email}' to '${email}',
          '${getData.number}' to '${contactNumber}',
          '${getData.gender}' to '${gender}',
          '${getData.uname}' to '${username}',
          '${getData.birthdate}' to '${birthday}',
          '${getDataStatus}' to '${currStatus}',
          '${getData.marital_status}' to '${maritalStatus}',
          '${getDataRole}' to '${newRole}'
          `,
      });

      if (isUpdated) {
        return res.status(200).json();
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/viewAuthorization/:id").get(async (req, res) => {
  try {
    const id = req.params.id;

    const user = await MasterList.findByPk(id, {
      include: {
        model: UserRole,
      },
    });

    if (user !== null) {
      return res.json(user);
    } else {
      return res.status(401);
    }
  } catch (err) {
    return res.status(500);
  }
});

router.route("/superadmin_add").post(async (req, res) => {
  try {
    //this is for checking of Superadmin role
    const existingRBAC = await UserRole.findOne({
      where: {
        col_rolename: "Superadmin_dev_",
      },
    });

    if (existingRBAC) {
      return res
        .status(200)
        .json({ message: "Superadmin_dev_ already exists" });
    }

    //if not exist create super admin
    const newRBAC = await UserRole.create({
      col_id: "11111111-1111-1111-1111-111111111111",
      col_rolename: "Superadmin_dev_",
      col_desc: "",
      role_type: "Management",
      col_authorization:
        "Dashboard-View, Invoices-View, Invoices-Add, Invoices-Edit, Invoices-Delete, Invoices-Approve, Invoices-Print, LocalCollections-View, LocalCollections-Add, LocalCollections-Edit, LocalCollections-Delete, LocalCollections-Approve, OverseasCollections-View, OverseasCollections-Add, OverseasCollections-Edit, OverseasCollections-Delete, OverseasCollections-Approve, Customers-View, Customers-Add, Customers-Edit, OtherIncome-View, OtherIncome-Add, OtherIncome-Edit, OtherIncome-Approve, Payable-View, Payable-Add, Payable-Edit, Payable-Delete, Payable-Approve, Payable-Print, LocalPurchase-View, LocalPurchase-Add, LocalPurchase-Edit, LocalPurchase-Delete, LocalPurchase-Approve, OverseasPurchase-View, OverseasPurchase-Add, OverseasPurchase-Edit, OverseasPurchase-Delete, OverseasPurchase-Approve, Vendors-View, Vendors-Add, Vendors-Edit, BankTransactions-View, BankTransactions-IE, OutstandingCheck-View, OutstandingCheck-Add, OutstandingCheck-Delete, OutstandingCheck-IE, IssuedCheck-View, AccountingList-View, AccountingList-Add, AccountingList-Edit, BankBudgeting-View, StockManagement-View, ProductList-View, ProductList-Add, ProductList-Edit, Productions-View, Productions-Add, Productions-Edit, Productions-Delete, StockTransfer-View, StockTransfer-Add, InventoryCounting-View, InventoryCounting-Add, InventoryCounting-Edit, InventoryCounting-IE, InventoryCounting-Approve, CashFlow-View, Expenses-View, Expenses-Add, Expenses-Edit, Expenses-Delete, Expenses-Approved, Expenses-Print, LocalExpenses-View, LocalExpenses-Add, LocalExpenses-Edit, LocalExpenses-Delete, LocalExpenses-Approve, OverseasExpenses-View, OverseasExpenses-Add, OverseasExpenses-Edit, OverseasExpenses-Delete, OverseasExpenses-Approve, FixedAssets-View, FixedAssets-Add, FixedAssets-Edit, FixedAssets-Delete, FixedAssets-Approve, Loan-View, Loan-Add, Loan-Edit, Loan-Delete, Loan-Approve, AssetAccount-View, AssetAccount-Add, AssetAccount-Edit, Liability-View, Liability-Add, Liability-Edit, Equity-View, Equity-Add, Equity-Edit, Monthly-View, Monthly-Add, Monthly-Edit, Monthly-Delete, Monthly-Approve, Retained-View, Retained-Add, Retained-Edit, Retained-Delete, Reporting-View, Reporting-IE, ExpensesType1-View, ExpensesType1-Add, ExpensesType1-Edit, ExpensesType1-Delete, ExpensesType2-View, ExpensesType2-Add, ExpensesType2-Edit, ExpensesType2-Delete, RBAC-View, RBAC-Add, RBAC-Edit, RBAC-Delete, Branches-View, Branches-Add, Branches-Edit, UserManagement-View, UserManagement-Add, UserManagement-Edit, Currency-View, Currency-Add, Currency-Edit, Notifications-View, AccountingList-Delete, AssetAccount-Delete, Liability-Delete, Equity-Delete, PurchaseRequest-View, PurchaseRequest-Add,PurchaseRequest-Edit, PurchaseRequest-Delete, PurchaseOrder-View, PurchaseOrder-Add, PurchaseOrder-Edit, PurchaseOrder-Delete,PurchaseOrder-IE, Receiving-View, Receiving-Add, Receiving-Edit, Receiving-Delete, Receiving-IE, PurchaseRequest-Approve, PurchaseRequest-Print, PurchaseOrder-Approve, PurchaseOrder-Print, Receiving-Approve, Receiving-Print, BatchEntry-View, BatchEntry-Add, BatchEntry-Edit, BatchEntry-Delete, BatchEntry-IE, BatchEntry-Print, BatchEntry-Approve, SampleProduct-View, SampleProduct-Add, SampleProduct-Edit, SampleProduct-Delete, SampleProduct-IE, SampleProduct-Print, SampleProduct-Approve, Schedule-View, Schedule-Add, Schedule-Edit, Schedule-Delete, Schedule-IE, Schedule-Print, Schedule-Approve, ReturnProducts-View, ReturnProducts-Add, ReturnProducts-Edit, ReturnProducts-Delete, ReturnProducts-IE, ReturnProducts-Print, ReturnProducts-Approve, TaxSettings-View, TaxSettings-Add, TaxSettings-Edit, TaxSettings-Delete, TaxSettings-IE, TaxSettings-Print, TaxSettings-Approve, TaxReport-View, TaxReport-Add, TaxReport-Edit, TaxReport-Delete, TaxReport-IE, TaxReport-Print, TaxReport-Approve, Paramaters-View, Paramaters-Add, Paramaters-Edit, Paramaters-Delete, Paramaters-IE, Paramaters-Print, Paramaters-Approve, UnitOfMeasure-View, UnitOfMeasure-Add, UnitOfMeasure-Edit, UnitOfMeasure-Delete, UnitOfMeasure-IE, UnitOfMeasure-Print, UnitOfMeasure-Approve, Mixer-View, Mixer-Add, Mixer-Edit, Mixer-Delete, Mixer-IE, Mixer-Print, Mixer-Approve, CompanyProfile-View, CompanyProfile-Add, CompanyProfile-Edit, CompanyProfile-Delete, CompanyProfile-IE, CompanyProfile-Print, CompanyProfile-Approve, ActivityLogs-View, ActivityLogs-Add, ActivityLogs-Edit, ActivityLogs-Delete, ActivityLogs-IE, ActivityLogs-Print, ActivityLogs-Approve, ReturnProduct-View, ReturnProduct-Add, ReturnProduct-Edit, ReturnProduct-Delete, ReturnProduct-IE, ReturnProduct-Print, ReturnProduct-Approve",
    });

    const rbacId = newRBAC.col_id;

    if (!newRBAC) {
      return res.status(401).json({ message: "No rbac id found" });
    }

    await MasterList.create({
      id: "11111111-1111-1111-1111-111111111111",
      emp_id: "00000",
      fname: "Superadmin_dev_",
      mname: "Superadmin_dev_",
      lname: "Superadmin_dev_",
      address: "Eli Address",
      city: "Valenzuela",
      province: "Metro Manila",
      number: "09898934234",
      birthdate: "2024-10-23",
      marital_status: "Single",
      gender: "Many",
      userrole_id: rbacId,
      uname: "Superadmin_dev_",
      salary: null,
      daily_rate: null,
      password: "admin", // Store the generated password
      email: "admin@gmail.com",
      zip_code: "0000",
      status: true,
      user_type: "Superadmin_dev_",
    });

    // const expenses_type_1 = await Expenses1.create({
    //   expenses_one_id: "11111111-1111-1111-1111-111111111111",
    //   expenses_type_one: "Asset Expenses",
    //   description: "",
    // });
    // await Expenses2.create({
    //   id: "11111111-1111-1111-1111-111111111111",
    //   expenses_type: expenses_type_1.expenses_one_id,
    //   sub_type: "Fixed Asset",
    //   description: "",
    // });

    await Warehouse.create({
      warehouse_id: "11111111-1111-1111-1111-111111111111",
      name: "Main Valenzuela",
      branch_type: "Main",
      address: "A1 Metro Sotanghon, Valenzuela, Metro Manila",
      province: "Metro Manila",
      city: "Valenzuela",
      zip_code: "1440",
      status: true,
    });

    await Notification.create({
      id: "11111111-1111-1111-1111-111111111111",
      setting_type: "Due Date Alert",
      days: 0,
      isChecked: false,
    });

    await Notification.create({
      id: "22222222-2222-2222-2222-222222222222",
      setting_type: "Customer Last Transaction",
      days: 0,
      isChecked: false,
    });

    await Currency.create({
      id: "11111111-1111-1111-1111-111111111111",
      based_currency: "PHP",
      currency_name: "PHP",
      currency_rate: "1",
      status: "Active",
      isArchive: false,
    });

    await Currency.create({
      id: "22222222-2222-2222-2222-222222222222",
      based_currency: "PHP",
      currency_name: "USD",
      currency_rate: "56",
      status: "Active",
      isArchive: false,
    });

    await accountlist_base_subject.create({
      id: "11111111-1111-1111-1111-111111111111",
      subject_name: "Capital",
      subject_type: "Cash",
      module_type: "Owner's Equity Account",
    });

    await accountlist_base_subject.create({
      id: "22222222-2222-2222-2222-222222222222",
      subject_name: "Prepaid Expenses",
      subject_type: "Cash",
      module_type: "Asset Account",
    });

    await accountlist_base_subject.create({
      id: "33333333-3333-3333-3333-333333333333",
      subject_name: "Prepaid Expenses",
      subject_type: "Cash",
      module_type: "Liabilities Account",
    });

    res.status(201).json();
  } catch (error) {
    console.error("Error: Problem on inserting", error);
    res.status(500).json({ message: "Error inserting" });
  }
});

router.route("/isAccountActive").get(async (req, res) => {
  try {
    const { id } = req.query;
    const account = await MasterList.findOne({
      where: {
        id: id,
      },
    });

    res.status(200).json(account);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
