const router = require("express").Router();
const { where, Op, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Payable,
  Payable_Product,
  Warehouse,
  Vendors,
  Payable_Fees,
  ProductList,
  Product_Tag_Vendor,
  StockManagement,
  PayableBulk,
  Payable_Payment,
  Payable_Bulk_Transaction,
  Cutoff,
  Inventory_Report,
  Currency,
  Production_Raw_Used,
  Production,
  SalesInvoiceInventory,
  SalesInvoice,
  MasterList,
  StockTransferApproveProducts,
  StockTransfer,
  StockTransferProducts,
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
  ProfitLossReport,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//USED MODULE:
// Payable
router.route("/fetch").get(async (req, res) => {
  const { startDate, endDate, filterColumn, searchText } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    let searchFilterWhereClause = {
      purchaseDate: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };
    let warehouseWhereClause = {};
    let vendorWhereClause = {};
    const payableTableColumn = [
      "transaction_id",
      "MOP",
      "discount_value",
      "due_date",
      "purchaseDate",
      "container_number",
      "pier",
      "status",
    ];
    // Handle Date
    const parseDate = () => {
      try {
        if (searchText == "") {
          searchFilterWhereClause = {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          };
          return "Invalid Date";
        }

        if (searchText.toLowerCase() == "n/a") {
          return "Invalid Date";
        }

        if (!searchText.includes("/")) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          }; // return nothing
          return "Invalid Date";
        }

        // For raw date without specific time
        const rawStringToDate = new Date(searchText);
        const stringDate = new Date(
          rawStringToDate?.toISOString()?.split("T")[0] || ""
        );
        stringDate?.setDate(stringDate?.getDate() + 1);
        // // Validate date if less than start date and greater than end date
        // if (
        //   stringDate < new Date(startDate) ||
        //   stringDate > new Date(endDate)
        // ) {
        //   searchFilterWhereClause = {
        //     createdAt: new Date(0),
        //   }; // return nothing

        //   return "Invalid Date";
        // }

        // Validate date
        if (isNaN(rawStringToDate.getTime())) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (
          !isNaN(rawStringToDate.getTime()) &&
          !searchText.includes(",") &&
          !searchText.includes(":")
        ) {
          const rawStringToStartDate = new Date(rawStringToDate); // start of day of search text inputted by user
          const rawStringToEndDate = moment(rawStringToStartDate)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss"); // end of day

          searchFilterWhereClause = {
            [Op.and]: [
              {
                createdAt: {
                  [Op.and]: [
                    { [Op.gte]: rawStringToStartDate },
                    { [Op.lte]: rawStringToEndDate },
                  ],
                },
              },
              {
                purchaseDate: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
            ],
          };
          return "Valid Date"; // will return Valid if raw string is valid date
        }

        // For date that has specific time
        const splitString = searchText?.split(",");
        if (!splitString || splitString.length < 2) {
          return "Invalid Date";
        }
        const hoursMinutes = splitString[1]?.split(":");
        const hours = hoursMinutes[0]?.trim() || "11";
        const minutes = hoursMinutes[1]?.trim() || "59";
        const datePart = splitString[0].trim();
        const period = searchText?.toLowerCase()?.includes("am") ? "am" : "pm";
        const customizedStartDate = `${datePart}, ${hours}:${minutes} ${period}`;
        const customizedEndDate = `${datePart}, ${hours}:${
          parseInt(minutes) + 1
        } ${period}`;
        const convertToDate = new Date(customizedEndDate);

        // Validate date
        if (isNaN(convertToDate.getTime())) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (!isNaN(convertToDate.getTime())) {
          // const convertToStartDate = new Date(datePart); // start of day of search text inputted by user
          searchFilterWhereClause = {
            [Op.and]: [
              {
                createdAt: {
                  [Op.and]: [
                    { [Op.gt]: customizedStartDate },
                    { [Op.lt]: customizedEndDate },
                  ],
                },
              },
              {
                purchaseDate: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
            ],
          };
          return "Valid Date";
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_date":
          parseDate();
          break;
        case "transaction_id":
          searchFilterWhereClause["transaction_id"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "receiving_warehouse": //
          warehouseWhereClause["name"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "MOP":
          searchFilterWhereClause["MOP"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "company_name": //
          vendorWhereClause["company_name"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "discount_value":
          searchFilterWhereClause = {
            [Op.and]: [
              {
                purchaseDate: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              sequelize.where(literal(`CAST (discount_value AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        case "due_date":
          searchFilterWhereClause = {
            [Op.and]: [
              {
                purchaseDate: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              sequelize.where(literal(`CAST (due_date AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;
        case "purchaseDate":
          searchFilterWhereClause = {
            [Op.and]: [
              {
                purchaseDate: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              sequelize.where(literal(`CAST (purchaseDate AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        case "status":
          searchFilterWhereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          const validation = parseDate();

          const cast = (column) => {
            return sequelize.where(literal(`CAST (${column} AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            });
          };

          if (validation === "Invalid Date") {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  purchaseDate: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
                {
                  [Op.or]: payableTableColumn.map((col) => {
                    if (
                      ["due_date", "purchaseDate", "discount_value"].includes(
                        col
                      )
                    ) {
                      return cast(col);
                    } else if (
                      ["container_number", "pier"].includes(col) &&
                      searchText.toLowerCase() == "n/a"
                    ) {
                      return {
                        [col]: null,
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
          }
          break;
      }
    }

    let { count, rows: isFetch } = await Payable.findAndCountAll({
      include: [
        {
          model: Payable_Product,
          required: true,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
            },
          ],
        },
        {
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: PayableBulk,
              required: true,
            },
          ],
        },
        {
          model: Currency,
          attributes: ["currency_name"],
          required: true,
        },
        {
          model: Warehouse,
          required: true,
          where: warehouseWhereClause,
        },
        {
          model: Vendors,
          required: true,
          where: vendorWhereClause,
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      subQuery: false,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: { ...searchFilterWhereClause, isDeleted: false },
    });

    // const mappedFetch = await Promise.all(
    //   isFetch.map(async (item) => {
    //     const transactionNumber =
    //       item?.payable_bulk_transactions.length > 1
    //         ? item?.payable_bulk_transactions[
    //             item?.payable_bulk_transactions.length - 1
    //           ]?.payable_bulk?.transaction_number
    //         : item?.payable_bulk_transactions[0]?.payable_bulk
    //             ?.transaction_number;
    //     if (transactionNumber) {
    //       const [pendingBankTransactionPayment, pendingIssuedCheckPayment] =
    //         await Promise.all([
    //           bank_transaction.sum("amount", {
    //             where: {
    //               transaction_number: transactionNumber,
    //               status: "Pending",
    //             },
    //           }),
    //           issued_check.sum("amount", {
    //             where: {
    //               transaction_number: transactionNumber,
    //               status: "Pending",
    //             },
    //           }),
    //         ]);

    //       console.log(pendingBankTransactionPayment, "payment==========");
    //       console.log(pendingIssuedCheckPayment);
    //       return {
    //         ...item.toJSON(), // Ensure to convert Sequelize instance to plain object
    //         amountToPay:
    //           pendingBankTransactionPayment + pendingIssuedCheckPayment,
    //       };
    //     }

    //     return {
    //       ...item.toJSON(),
    //       amountToPay: 0,
    //     };
    //   })
    // );

    // console.log(mappedFetch, "mappedFetch==========");

    if (isFetch.length === 0 && filterColumn === "all") {
      const columns = ["warehouse", "vendor"];
      for (let index = 0; index < columns.length; index++) {
        searchFilterWhereClause = {
          purchaseDate: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };
        vendorWhereClause = {};
        warehouseWhereClause = {};

        if (columns[index] === "warehouse") {
          warehouseWhereClause["name"] = {
            [Op.like]: `%${searchText}%`,
          };
        } else {
          vendorWhereClause["company_name"] = {
            [Op.like]: `%${searchText}%`,
          };
        }

        let { count, rows: isFetch } = await Payable.findAndCountAll({
          include: [
            {
              model: Payable_Product,
              required: true,
              include: [
                {
                  model: Product_Tag_Vendor,
                  required: true,
                },
              ],
            },
            {
              model: Currency,
              attributes: ["currency_name"],
              required: true,
            },
            {
              model: Warehouse,
              required: true,
              where: warehouseWhereClause,
            },
            {
              model: Vendors,
              required: true,
              where: vendorWhereClause,
            },
            {
              model: Payable_Fees,
              required: false,
            },
          ],
          where: { ...searchFilterWhereClause, isDeleted: false },
          order: [["createdAt", "DESC"]],
        });

        if (isFetch.length > 0) {
          return res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: isFetch,
          });
        }
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//para sa pagfetch ng specific data kapag clinick ang notification
router.route("/fetchDataNotification").get(async (req, res) => {
  const { startDate, endDate, id } = req.query;
  try {
    const isFetch = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
            },
          ],
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      where: {
        due_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        id: id,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable Local
router.route("/fetch_local").get(async (req, res) => {
  try {
    const isFetch = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
            },
          ],
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      where: {
        domestic_type: "local",
        status: "Approved",
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetch_local_payable_bulk").get(async (req, res) => {
  const { startDate, endDate, filterColumn, searchText } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    let searchFilterWhereClause = {
      payable_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    // Handle Date
    const parseDate = (columnDate) => {
      try {
        if (searchText == "") {
          searchFilterWhereClause = {
            payable_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          };
          return "Invalid Date";
        }

        if (!searchText.includes("/")) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          }; // return nothing
          return "Invalid Date";
        }

        // For raw date without specific time
        const rawStringToDate = new Date(searchText);
        const stringDate = new Date(
          rawStringToDate?.toISOString()?.split("T")[0] || ""
        );
        stringDate?.setDate(stringDate?.getDate() + 1);
        // // Validate date if less than start date and greater than end date
        if (columnDate !== "createdAt") {
          if (
            stringDate < new Date(startDate) ||
            stringDate > new Date(endDate)
          ) {
            searchFilterWhereClause = {
              createdAt: new Date(0),
            }; // return nothing

            return "Invalid Date";
          }
        }
        const isValidDate = moment(
          stringDate.toISOString().split("T")[0],
          "YYYY-MM-DD",
          true
        ).isValid();

        // Validate date
        if (!isValidDate) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (
          isValidDate &&
          !searchText.includes(",") &&
          !searchText.includes(":")
        ) {
          const rawStringToStartDate = new Date(rawStringToDate); // start of day of search text inputted by user
          const rawStringToEndDate = moment(rawStringToStartDate)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss"); // end of day

          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: rawStringToStartDate },
                  { [Op.lte]: rawStringToEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gte]: rawStringToStartDate },
                      { [Op.lte]: rawStringToEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date"; // will return Valid if raw string is valid date
        }

        // Will not proceed to check for specific time for Transaction Date
        if (columnDate !== "createdAt") {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        }

        // For date that has specific time
        const splitString = searchText?.split(",");
        if (!splitString || splitString.length < 2) {
          return "Invalid Date";
        }
        const hoursMinutes = splitString[1]?.split(":");
        const hours = hoursMinutes[0]?.trim() || "11";
        const minutes = hoursMinutes[1]?.trim() || "59";
        const datePart = splitString[0].trim();
        const period = searchText?.toLowerCase()?.includes("am") ? "am" : "pm";
        const customizedStartDate = `${datePart}, ${hours}:${minutes} ${period}`;
        const customizedEndDate = `${datePart}, ${hours}:${
          parseInt(minutes) + 1
        } ${period}`;
        const convertToDate = new Date(customizedEndDate);

        // Validate date
        if (isNaN(convertToDate.getTime())) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (!isNaN(convertToDate.getTime())) {
          // const convertToStartDate = new Date(datePart); // start of day of search text inputted by user
          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: customizedStartDate },
                  { [Op.lte]: customizedEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gt]: customizedStartDate },
                      { [Op.lt]: customizedEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date";
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_no":
          searchFilterWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "date_created":
          parseDate("createdAt");
          break;
        case "transaction_date":
          parseDate("payable_date");
          break;

        case "total_amount":
          searchFilterWhereClause["total_amount"] = sequelize.where(
            literal(`CAST (total_amount AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;

        case "status":
          searchFilterWhereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          searchFilterWhereClause = {
            [Op.and]: [
              {
                payable_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: [
                  {
                    transaction_number: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                  {
                    total_amount: sequelize.where(
                      literal(`CAST (total_amount AS CHAR)`),
                      {
                        [Op.like]: `%${searchText}%`,
                      }
                    ),
                  },
                  {
                    status: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                ],
              },
            ],
          };
          break;
      }
    }

    let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
      // where: {
      //   domestic_type: "local",
      //   status: "Approved",
      // },
      include: [
        {
          model: Currency,
          attributes: ["currency_name"],
          required: true,
        },
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              required: true,
              where: {
                domestic_type: "local",
              },
            },
          ],
        },
      ],
      subQuery: false,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: { ...searchFilterWhereClause, isDeleted: false },
    });

    console.log(isFetch, "fetch============");

    if (isFetch.length === 0 && filterColumn === "all") {
      const columns = ["createdAt", "payable_date"];
      for (let index = 0; index < columns.length; index++) {
        searchFilterWhereClause = {
          payable_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };

        if (columns[index] === "createdAt") {
          parseDate("createdAt");
        } else {
          parseDate("payable_date");
        }

        let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
          // where: {
          //   domestic_type: "local",
          //   status: "Approved",
          // },
          include: [
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: Payable,
                  required: true,
                  where: {
                    domestic_type: "local",
                  },
                },
              ],
            },
          ],
          subQuery: false,
          order: [["createdAt", "DESC"]],
          limit: limit,
          offset: offset,
          where: { ...searchFilterWhereClause, isDeleted: false },
        });

        if (isFetch.length > 0) {
          return res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: isFetch,
          });
        }
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetch_overseas_payable_bulk").get(async (req, res) => {
  const { startDate, endDate, filterColumn, searchText } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    let searchFilterWhereClause = {
      payable_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    // Handle Date
    const parseDate = (columnDate) => {
      try {
        if (searchText == "") {
          searchFilterWhereClause = {
            payable_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          };
          return "Invalid Date";
        }

        if (!searchText.includes("/")) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          }; // return nothing
          return "Invalid Date";
        }

        // For raw date without specific time
        const rawStringToDate = new Date(searchText);
        const stringDate = new Date(
          rawStringToDate?.toISOString()?.split("T")[0] || ""
        );
        stringDate?.setDate(stringDate?.getDate() + 1);
        // // Validate date if less than start date and greater than end date
        if (columnDate !== "createdAt") {
          if (
            stringDate < new Date(startDate) ||
            stringDate > new Date(endDate)
          ) {
            searchFilterWhereClause = {
              createdAt: new Date(0),
            }; // return nothing

            return "Invalid Date";
          }
        }
        const isValidDate = moment(
          stringDate.toISOString().split("T")[0],
          "YYYY-MM-DD",
          true
        ).isValid();

        // Validate date
        if (!isValidDate) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (
          isValidDate &&
          !searchText.includes(",") &&
          !searchText.includes(":")
        ) {
          const rawStringToStartDate = new Date(rawStringToDate); // start of day of search text inputted by user
          const rawStringToEndDate = moment(rawStringToStartDate)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss"); // end of day

          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: rawStringToStartDate },
                  { [Op.lte]: rawStringToEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gte]: rawStringToStartDate },
                      { [Op.lte]: rawStringToEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date"; // will return Valid if raw string is valid date
        }

        // Will not proceed to check for specific time for Transaction Date
        if (columnDate !== "createdAt") {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        }

        // For date that has specific time
        const splitString = searchText?.split(",");
        if (!splitString || splitString.length < 2) {
          return "Invalid Date";
        }
        const hoursMinutes = splitString[1]?.split(":");
        const hours = hoursMinutes[0]?.trim() || "11";
        const minutes = hoursMinutes[1]?.trim() || "59";
        const datePart = splitString[0].trim();
        const period = searchText?.toLowerCase()?.includes("am") ? "am" : "pm";
        const customizedStartDate = `${datePart}, ${hours}:${minutes} ${period}`;
        const customizedEndDate = `${datePart}, ${hours}:${
          parseInt(minutes) + 1
        } ${period}`;
        const convertToDate = new Date(customizedEndDate);

        // Validate date
        if (isNaN(convertToDate.getTime())) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (!isNaN(convertToDate.getTime())) {
          // const convertToStartDate = new Date(datePart); // start of day of search text inputted by user
          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: customizedStartDate },
                  { [Op.lte]: customizedEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gt]: customizedStartDate },
                      { [Op.lt]: customizedEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date";
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_no":
          searchFilterWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "date_created":
          parseDate("createdAt");
          break;
        case "transaction_date":
          parseDate("payable_date");
          break;

        case "total_amount":
          searchFilterWhereClause["total_amount"] = sequelize.where(
            literal(`CAST (total_amount AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;

        case "status":
          searchFilterWhereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          searchFilterWhereClause = {
            [Op.and]: [
              {
                payable_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: [
                  {
                    transaction_number: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                  {
                    total_amount: sequelize.where(
                      literal(`CAST (total_amount AS CHAR)`),
                      {
                        [Op.like]: `%${searchText}%`,
                      }
                    ),
                  },
                  {
                    status: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                ],
              },
            ],
          };
          break;
      }
    }

    let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
      // where: {
      //   domestic_type: "local",
      //   status: "Approved",
      // },
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              required: true,
              where: {
                domestic_type: "overseas",
              },
            },
          ],
        },
      ],
      subQuery: false,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      where: { ...searchFilterWhereClause, isDeleted: false },
    });

    if (isFetch.length === 0 && filterColumn === "all") {
      const columns = ["createdAt", "payable_date"];
      for (let index = 0; index < columns.length; index++) {
        searchFilterWhereClause = {
          payable_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };

        if (columns[index] === "createdAt") {
          parseDate("createdAt");
        } else {
          parseDate("payable_date");
        }

        let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
          // where: {
          //   domestic_type: "local",
          //   status: "Approved",
          // },
          include: [
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: Payable,
                  required: true,
                  where: {
                    domestic_type: "overseas",
                  },
                },
              ],
            },
          ],
          subQuery: false,
          limit: limit,
          offset: offset,
          order: [["createdAt", "DESC"]],
          where: { ...searchFilterWhereClause, isDeleted: false },
        });

        if (isFetch.length > 0) {
          return res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: isFetch,
          });
        }
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable Overseas
router.route("/fetch_overseas").get(async (req, res) => {
  try {
    const isFetch = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
            },
          ],
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      where: {
        domestic_type: "overseas",
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/getProductData").get(async (req, res) => {
  try {
    const { vendorId, vendorID } = req.query;
    console.log(
      "***********************************************-*vendorID",
      vendorId
    );
    const data = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: ProductList,
          required: true,
          where: {
            status: { [Op.ne]: "Archive" },
          },
        },
      ],
      where: {
        vendor_id: vendorId,
        status: "Active",
      },
    });
    // console.log(data);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getPayableProduct").get(async (req, res) => {
  try {
    const { vendorId } = req.query;
    const data = await Payable_Product.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          where: {
            vendor_id: vendorId,
            status: "Active",
          },
        },
        {
          model: Payable,
          required: true,
          where: {
            [Op.or]: [{ status: "Approved" }, { status: "Paid" }],
          },
        },
      ],
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error");
  }
});

//USED MODULE:
// PayablePayment
router.route("/getInfo").get(async (req, res) => {
  try {
    const { id } = req.query;

    const isFetch = await Payable.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: Payable_Product,
          required: true,

          include: [
            {
              model: Product_Tag_Vendor,
              required: true,

              include: [
                {
                  model: ProductList,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "approved_masterlist",
          required: false,
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "created_masterlist",
          required: false,
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Currency,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: isFetch.purchaseDate },
          },
          {
            to: { [Op.gte]: isFetch.purchaseDate },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    const isFetchWithCutoffPosted = {
      ...isFetch.toJSON(),
      isCutoffPosted: isPosted,
    };

    res.json(isFetchWithCutoffPosted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getAvailableProductVendor").get(async (req, res) => {
  try {
    const { vendorId } = req.query;

    console.log("************************vendorID **--** : ", vendorId);

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const isFetch = await Product_Tag_Vendor.findAll({
      where: { vendor_id: vendorId },
      include: [
        {
          model: ProductList,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getInfobyVendor").get(async (req, res) => {
  try {
    const { id, module, searchText, filterColumn, payableList, currency } =
      req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Payable where clause
    let payableWhereClause = {
      isAdded: false,
      vendor_id: id,
      status: "Approved",
      domestic_type: module,
    };

    // Payable Table column names
    const payableTableColumn = [
      "transaction_id",
      "description",
      "purchaseDate",
      "due_date",
      "totalPrice",
      "discount_value",
    ];

    // Handle Search
    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_id":
        case "description":
          payableWhereClause[filterColumn] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        case "purchaseDate":
        case "due_date":
        case "totalPrice":
        case "discount_value":
          payableWhereClause = {
            [Op.and]: [
              {
                isAdded: false,
                vendor_id: id,
                status: "Approved",
                domestic_type: module,
              },
              sequelize.where(literal(`CAST(${filterColumn} AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        default:
          payableWhereClause = {
            [Op.and]: [
              {
                isAdded: false,
                vendor_id: id,
                status: "Approved",
                domestic_type: module,
              },
              {
                [Op.or]: payableTableColumn.map((col) => {
                  if (col === "transaction_id" || col === "description") {
                    return {
                      [col]: {
                        [Op.like]: `%${searchText}%`,
                      },
                    };
                  } else {
                    return sequelize.where(literal(`CAST (${col} AS CHAR)`), {
                      [Op.like]: `%${searchText}%`,
                    });
                  }
                }),
              },
            ],
          };
          break;
      }
    }

    // Exclude list of selected transaction from Order List
    if (payableList && payableList.length > 0) {
      payableWhereClause["id"] = {
        [Op.notIn]: payableList,
      };
    }

    // Fetch transaction with specific currency
    if (currency) {
      payableWhereClause["currencyId"] = currency;
    }

    const { count, rows: isFetch } = await Payable.findAndCountAll({
      include: [
        {
          model: Payable_Product,
          required: true,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
              include: [
                {
                  model: ProductList,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      where: { ...payableWhereClause, isDeleted: false },
      subQuery: false,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/approvedPayable/:param_id").put(async (req, res) => {
  const transaction = await sequelize.transaction(); // Initialize the transaction here

  try {
    const id = req.params.param_id;
    const {
      status,
      products,
      vendorId,
      purchaseDate,
      transaction_id,
      approved_by,
      warehouseID,
      currencyRate,
    } = req.body;

    // const warehouse_main_id = await Warehouse.findOne({
    //   where: { branch_type: "Main" },
    // });

    const data = await Payable.update(
      { status: status, approved_by: approved_by },
      { where: { id: id } } // Include the transaction
    );

    if (status === "Approved") {
      for (const product of products) {
        // console.log(`Processing product: ${product.product_id}`);

        // const existingStockRecord = await StockManagement.findOne({
        //   where: {
        //     product_id: product.product_id,
        //     warehouse_id: warehouse_main_id.warehouse_id,
        //   },
        //   transaction, // Include the transaction
        // });

        // const currentStock = existingStockRecord ? existingStockRecord.stock : 0;
        // const updatedStock = currentStock + product.netWeight;

        // Insert or update stock
        // if (existingStockRecord) {
        //   await StockManagement.update(
        //     { stock: updatedStock, price: product.costing, vendor_id: vendorId },
        //     {
        //       where: {
        //         product_id: product.product_id,
        //         warehouse_id: warehouse_main_id.warehouse_id,
        //       },
        //       transaction,
        //     }
        //   );
        // } else {
        await StockManagement.create(
          {
            product_id: product.product_id,
            warehouse_id: warehouseID,
            stock: product.netWeight,
            price: product.costing * currencyRate,
            vendor_id: vendorId,
            date_in: purchaseDate,
            in: product.netWeight,
            price_in: product.costing * currencyRate,
            transaction_number: transaction_id, // dito ako nahinto check sa reject
            module_in_from: "Payable",
          },
          { transaction }
        );
        // }

        // // Update or insert into Inventory_Report
        // const existingProduct = await Inventory_Report.findOne({
        //   where: { product_id: product.product_id },
        //   transaction,
        // });

        // if (existingProduct) {
        //   await Inventory_Report.increment(
        //     { product_in: product.netWeight },
        //     {
        //       where: { product_id: product.product_id },
        //       transaction,
        //     }
        //   );
        // } else {
        //   await Inventory_Report.create(
        //     {
        //       product_id: product.product_id,
        //       product_in: product.netWeight,
        //     },
        //     { transaction }
        //   );
        // }
      }

      // Commit the transaction after processing all products
      await transaction.commit();
    }

    const getData = await Payable.findOne({
      where: { id: id },
      attributes: ["transaction_id"],
    });

    const stats = status == "Approved" ? "approved" : "rejected";
    await Activity_Log.create({
      masterlist_id: approved_by,
      action_taken: `Payable: User ${stats} a payable with transaction ID ${getData.transaction_id}`,
    });
    res.status(200).json({ message: "Data updated successfully", data });
  } catch (error) {
    // Rollback transaction if an error occurs
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

//USED MODULE:
// Payable
router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    // const lastPayCode = await Payable.findOne({
    //   order: [["createdAt", "DESC"]],
    // });

    // let nextCode;
    // if (lastPayCode) {
    //   const lastCode = lastPayCode.transaction_id;
    //   const lastNumber = parseInt(lastCode.substring(1), 10);
    //   nextCode = "PO-" + (lastNumber + 1).toString().padStart(6, "0");
    // } else {
    //   nextCode = "T000001";
    // }

    // res.json(nextCode);
    // Fetch the latest transaction_id

    const lastPayCode = await Payable.findOne({
      where: {
        transaction_id: {
          [Op.like]: `PO-${currentMonth}%`,
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
        newRefCode = `PO-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `PO-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `PO-${currentMonth}-00001`;
    }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//USED MODULE:
// Payable
router.route("/create").post(async (req, res) => {
  const {
    transactionId,
    warehouseId,
    vendorId,
    modeOfPayment,
    customerType,
    trackingNumber,
    dueDate,
    weighingFee,
    items,
    otherFee,
    primary_discount,
    isPercent,
    calculatedAmount,
    purchaseDate,
    description,
    currencyId,
    createdBy,
    containerNumber,
    pier,
    currencyRate,
  } = req.body;
  const parsedOtherFee = JSON.parse(otherFee);

  // const isPosted = await Cutoff.findOne({
  //   where: {
  //     [Op.and]: [
  //       { from: { [Op.lte]: dueDate } },
  //       { to: { [Op.gte]: dueDate } },
  //     ],
  //     isPosted: true,
  //   },
  // });

  // if (isPosted) {
  //   return res.status(201).json({ message: "Cutoff already posted" });
  // }

  try {
    // items.forEach((element) => {
    //   console.log(element);
    // });
    // return;

    const formatWeighingFee = weighingFee?.replace(/,/g, "");

    const warehouse_main_id = await Warehouse.findOne({
      where: {
        branch_type: "Main",
      },
    });
    // Create Payable record
    const createdPayable = await Payable.create({
      transaction_id: transactionId,
      warehouse_id: warehouseId,
      vendor_id: vendorId,
      MOP: modeOfPayment,
      domestic_type: customerType,
      due_date: dueDate,
      tracking_number: trackingNumber === "" ? null : trackingNumber,
      weighing_fee: parseFloat(formatWeighingFee),
      isPercent_Discount: isPercent,
      discount_value: primary_discount || 0,
      status: "Pending",
      isAdded: false,
      totalPrice: calculatedAmount,
      purchaseDate: purchaseDate,
      description: description,
      currencyId: currencyId,
      created_by: createdBy,
      container_number: containerNumber,
      pier: pier,
      rate: currencyRate || 1,
    });

    if (!createdPayable) {
      return res
        .status(500)
        .json({ message: "Failed to create Payable record" });
    }

    const payable_id = createdPayable.id;

    // Create Payable_Product records
    await Promise.all(
      items.map(async (data) => {
        await Payable_Product.create({
          payable_id: payable_id,
          product_vendor_id: data.product_vendor_id,
          moisture: data.moisture,
          moisture_type: data.moistureType,
          weight: data.weight,
          unitPrice: data.unitPrice,
          net_weight: data.net_weight,
        });

        // Check if the stock management record exists
        // const existingStock = await StockManagement.findOne({
        //   where: {
        //     product_id: data.productId,
        //     warehouse_id: warehouse_main_id.warehouse_id,
        //   },
        // });

        // if (!existingStock) {
        // Create a new stock management record if it doesn't exist
        // await StockManagement.create({
        //   product_id: data.productId,
        //   warehouse_id: warehouse_main_id.warehouse_id,
        //   vendor_id: vendorId,
        //   price: data.unitPrice,
        // });
        // }

        return;
      })
    );

    await Promise.all(
      parsedOtherFee.map(async (data) => {
        return await Payable_Fees.create({
          payable_id: payable_id,
          fee_name: data.feeName,
          fee_amount: data.feeAmount,
        });
      })
    );
    await Activity_Log.create({
      masterlist_id: createdBy,
      action_taken: `Payable: User created a new payable with transaction ID ${transactionId}`,
    });
    // Return success response
    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getPayableBulk/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const data = await PayableBulk.findOne({
      where: {
        id: id,
      },
    });

    const dataTransaction = await Payable_Bulk_Transaction.findAll({
      where: {
        payable_bulk_id: id,
      },
      include: [
        {
          model: Payable,
          include: [
            {
              model: Payable_Product,
            },
          ],
        },
      ],
    });

    const dataPayment = await Payable_Payment.findAll({
      where: {
        payable_id: id,
      },
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_base_subject,
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
            from: { [Op.lte]: data.payable_date },
          },
          {
            to: { [Op.gte]: data.payable_date },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    res.json({ data, dataTransaction, dataPayment, isPosted });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/update").put(async (req, res) => {
  const {
    vendorID,
    warehouseID,
    due_date,
    purchaseDate,
    containerNumber,
    pier,
    currencyId,
    domestic_type,
    tracking_number,
    id,
    dataProduct,
    removeDataProductIds,
    floatDataProduct,
    userLoggedID,
    currencyRate,
    weighingFee,
  } = req.query;

  // const isPosted = await Cutoff.findOne({
  //   where: {
  //     [Op.and]: [
  //       { from: { [Op.lte]: due_date } },
  //       { to: { [Op.gte]: due_date } },
  //     ],
  //     isPosted: true,
  //   },
  // });

  // if (isPosted) {
  //   return res.status(201).json({ message: "Cutoff already posted" });
  // }

  try {
    const getData = await Payable.findOne({
      include: [
        {
          model: Warehouse,
          attributes: ["name"],
        },
        {
          model: Currency,
          attributes: ["currency_name"],
        },
      ],

      where: {
        id: id,
      },
    });

    const getProduct = await Payable_Product.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          include: [
            {
              model: ProductList,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      where: {
        payable_id: id,
      },
    });

    const isUpdated = await Payable.update(
      {
        vendor_id: vendorID,
        warehouse_id: warehouseID,
        due_date: due_date,
        purchaseDate: purchaseDate,
        container_number: containerNumber,
        pier: pier,
        currencyId: currencyId,
        domestic_type: domestic_type,
        tracking_number: tracking_number === undefined ? null : tracking_number,
        rate: currencyRate,
        weighing_fee: weighingFee || 0,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (Array.isArray(floatDataProduct)) {
      for (const data of floatDataProduct) {
        console.log(data);
        await Payable_Product.create({
          payable_id: id,
          product_vendor_id: data.productTagVendorId,
          moisture: data.moisture,
          moisture_type: data.moisture_type,
          weight: data.weight,
          unitPrice: data.unitPrice,
          net_weight: data.net_weight,
        });
      }
    }

    if (Array.isArray(dataProduct)) {
      for (const dataProducts of dataProduct) {
        await Payable_Product.update(
          {
            weight: dataProducts.weight,
            moisture: dataProducts.moisture || 0,
            net_weight: dataProducts.net_weight,
            unitPrice: dataProducts.unitPrice,
          },
          {
            where: {
              id: dataProducts.id,
            },
          }
        );
        // console.log(`Update transaction with payable_product: ${dataProducts}`);
      }
    }

    if (Array.isArray(removeDataProductIds)) {
      for (const removeId of removeDataProductIds) {
        await Payable_Product.destroy({
          where: {
            id: removeId,
          },
        });
        console.log(`Removed transaction with payable_product: ${removeId}`);
      }
    }

    const getWareHouse = await Warehouse.findOne({
      where: {
        warehouse_id: warehouseID,
      },
    });

    const getCurr = await Currency.findOne({
      where: {
        id: currencyId,
      },
    });

    const getUpdatedProduct = await Payable_Product.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          include: [
            {
              model: ProductList,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      where: {
        payable_id: id,
      },
    });
    const allProduct = getProduct
      .map((record) => record.product_tag_vendor?.product_list.product_name)
      .join(", ");

    const allUpdatedProduct = getUpdatedProduct
      .map((record) => record.product_tag_vendor?.product_list.product_name)
      .join(", ");

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Payable: User updated payable information with transaction ID ${getData.transaction_id} \n
      WareHouse: ${getData.warehouse.name} to ${getWareHouse.name}
      Currency: ${getData.currency.currency_name} to ${getCurr.currency_name}
      Due Date: ${getData.due_date} to ${due_date}
      Purchase Date: ${getData.purchaseDate} to ${purchaseDate}
      Container Number: ${getData.container_number} to ${containerNumber}
      Pier: ${getData.pier} to ${pier}
      Domestic Type: ${getData.domestic_type} to ${domestic_type}
      Products: [${allProduct}] to [${allUpdatedProduct}]
      `,
    });

    if (isUpdated) {
      res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/cancel_transaction").post(async (req, res) => {
  const { id } = req.query;
  try {
    const isCancel = await Payable.update(
      {
        status: "Cancelled",
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (isCancel) {
      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/markPaid_transaction").post(async (req, res) => {
  const { id } = req.query;
  try {
    const isCancel = await Payable.update(
      {
        status: "Paid",
        isPaid: true,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (isCancel) {
      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSubject3LocalPayable").get(async (req, res) => {
  const { subjectId } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      where: { account_list_base_sub_id: subjectId, isDeleted: false },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getSubject1LocalPayable").get(async (req, res) => {
  const { account_selected, selectedPayment } = req.query;
  try {
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

router.post("/validate-issued-date", async (req, res) => {
  const { issuedDate } = req.body;
  console.log("**************************************issuedDate: ", issuedDate);

  if (!issuedDate) {
    return res.status(400).json({ message: "Issued date is required" });
  }

  try {
    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: issuedDate } },
          { to: { [Op.gte]: issuedDate } },
        ],
        isPosted: true,
      },
    });

    if (isPosted) {
      return res
        .status(200)
        .json({ isPosted: true, message: "Cutoff already posted" });
    }
    return res
      .status(200)
      .json({ isPosted: false, message: "Issued date is valid" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.route("/addPayment").post(async (req, res) => {
  try {
    const {
      transactionNumber,
      payableDate,
      balance,
      selectedVendorId,
      floatPayment,
      payableList,
      currency,
      currentLocation,
      createdBy,
    } = req.body;

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: payableDate } },
          { to: { [Op.gte]: payableDate } },
        ],
        isPosted: true,
      },
    });

    if (isPosted) {
      return res.status(201).json({ message: "Cutoff already posted" });
    }

    const createPayableBulk = await PayableBulk.create({
      transaction_number: transactionNumber,
      status: "For-Approval",
      payable_date: payableDate,
      total_amount: balance,
      vendor_id: selectedVendorId,
      currency_id: currency,
      created_by: createdBy,
    });

    console.log(payableList, "payable=============");

    if (createPayableBulk) {
      for (const payableLists of payableList) {
        const createPayBulkTransaction = await Payable_Bulk_Transaction.create({
          payable_bulk_id: createPayableBulk.id,
          payable_id: payableLists.id,
        });

        await Payable.update(
          { isAdded: true },
          { where: { id: payableLists.id } }
        );
      }
    }

    if (floatPayment && floatPayment.length > 0) {
      for (const data of floatPayment) {
        await Payable_Payment.create({
          payable_id: createPayableBulk.id,
          accountList_id: data.subject3,
          payment_type: data.paymentMethod,
          check_number: data.checkNumber || null,
          online_name: data.remarks || null,
          ref_number: data.refNumber || null,
          date_issued: data.issuedDate,
          amount: data.amountInputted || 0,
          // is_completed: data.paymentMethod === "Cash" ? true : false,
        });
      }
    }

    await Activity_Log.create({
      masterlist_id: createdBy,
      action_taken: `${currentLocation} Purchase: User created a new ${currentLocation.toLowerCase()} purchase with transaction ID ${transactionNumber}`,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/updatePayment").post(async (req, res) => {
  try {
    let {
      id,
      transactionNumber,
      payableDate,
      balance,
      selectedVendorId,
      floatPayment,
      payableList,
      addedIds,
      removeIds,
      removePaymentListId,
      userLoggedID,
      currentLocation,
    } = req.body;

    console.log(removePaymentListId, "id==============");

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: payableDate } },
          { to: { [Op.gte]: payableDate } },
        ],
        isPosted: true,
      },
    });

    if (isPosted) {
      return res.status(201).json({ message: "Cutoff already posted" });
    }

    //For Act log
    const getData = await Payable_Bulk_Transaction.findAll({
      include: [
        {
          model: PayableBulk,
          attributes: ["transaction_number"],
        },
        {
          model: Payable,
          attributes: ["transaction_id"],
        },
      ],
      where: {
        payable_bulk_id: id,
      },
    });

    const getDataPayablePayment = await Payable_Payment.findAll({
      include: [
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        payable_id: id,
      },
    });

    const updatePayableBulk = await PayableBulk.update(
      {
        status: "For-Approval",
        payable_date: payableDate,
        // total_amount: balance,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (Array.isArray(removePaymentListId)) {
      for (const paymentListId of removePaymentListId) {
        await Payable_Payment.destroy({
          where: {
            id: paymentListId,
          },
        });
      }
    }

    if (Array.isArray(addedIds)) {
      for (const addedId of addedIds) {
        await Payable_Bulk_Transaction.create({
          payable_bulk_id: id,
          payable_id: addedId,
        });

        await Payable.update(
          {
            isAdded: true,
          },
          {
            where: {
              id: addedId,
            },
          }
        );
      }
    } else {
      console.log("No addedIds provided or addedIds is not an array.");
    }

    if (Array.isArray(removeIds)) {
      for (const removeId of removeIds) {
        await Payable.update(
          {
            isAdded: false,
          },
          {
            where: {
              id: removeId,
            },
          }
        );

        await Payable_Bulk_Transaction.destroy({
          where: {
            payable_bulk_id: id,
            payable_id: removeId,
          },
        });
      }
    }

    if (floatPayment && floatPayment.length > 0) {
      for (const data of floatPayment) {
        // await Payable_Payment.create({
        //   payable_id: id,
        //   accountList_id: data.subject3,
        //   payment_type: data.paymentMethod,
        //   check_number: data.checkNumber || null,
        //   online_name: data.remarks || null,
        //   ref_number: data.refNumber || null,
        //   date_issued: data.issuedDate,
        //   amount: data.amountInputted || 0,
        // });

        const validateId = await Payable_Payment.findOne({
          where: {
            id: data.id,
          },
        });

        if (validateId) {
          await Payable_Payment.update(
            {
              amount: data.amountInputted || 0,
            },
            {
              where: {
                id: data.id,
              },
            }
          );
        } else {
          await Payable_Payment.create({
            payable_id: id,
            accountList_id: data.subject3,
            payment_type: data.paymentMethod,
            check_number: data.checkNumber || null,
            online_name: data.remarks || null,
            ref_number: data.refNumber || null,
            date_issued: data.issuedDate,
            amount: data.amountInputted || 0,
          });
        }
      }
    }
    const getUpdatedData = await Payable_Bulk_Transaction.findAll({
      include: [
        {
          model: PayableBulk,
          attributes: ["transaction_number"],
        },
        {
          model: Payable,
          attributes: ["transaction_id"],
        },
      ],
      where: {
        payable_bulk_id: id,
      },
    });

    const getUpdatedDataPayablePayment = await Payable_Payment.findAll({
      include: [
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        payable_id: id,
      },
    });

    const getBulkTransaction = getUpdatedData[0].payable_bulk;
    const getOldBulkTransaction = getData[0].payable_bulk;

    const oldPayable = getData
      .map((record) => record.payable?.transaction_id)
      .join(", ");

    const updatedPayable = getUpdatedData
      .map((record) => record.payable?.transaction_id)
      .join(", ");

    const oldPaymentList = getDataPayablePayment
      .map((record) => record.account_list_sub3?.account_name)
      .join(", ");

    const updatedPaymentList = getUpdatedDataPayablePayment
      .map((record) => record.account_list_sub3?.account_name)
      .join(", ");

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${currentLocation} Purchase: User updated local collection information with transaction ID ${getBulkTransaction.transaction_number} \n 
        Order List: [${oldPayable}] to [${updatedPayable}]
        Payment List: [${oldPaymentList}] to [${updatedPaymentList}]
        `,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/updateStatus").post(async (req, res) => {
  try {
    const {
      id,
      payableDate,
      status,
      paymentList,
      floatPayment,
      payableList,
      transactionNumber,
      module,
      approvedBy,
    } = req.body;

    const moduleType =
      module === "local" ? "Local Payable" : "Overseas Payable";

    console.log("*****************************-*payableList : ", status);
    if (status == "Rejected") {
      payableList.forEach((element) => {
        Payable.update(
          {
            isAdded: false,
          },
          {
            where: {
              id: element.payable.id,
            },
          }
        );
      });
    }

    const approved = await PayableBulk.update(
      {
        status: status,
        payable_date: payableDate,
        approved_by: approvedBy,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (status == "Approved") {
      if (floatPayment && floatPayment.length > 0) {
        for (const data of floatPayment) {
          // Distribute data to Cash Flow
          if (data.paymentMethod == "Cash") {
            await CashFlow.create({
              // account_list_id_cash_from: parseInt(data.subject3),
              account_list_id_cash_from: String(data.subject3),
              transaction_date: data.issuedDate,
              transaction_number: transactionNumber,
              account_list_id_cash_to: null,
              module_from: moduleType, //
              description: "",
              amount: data.amountInputted,
              status: "Pending",
            });
            accountlist_sub3.decrement("amount", {
              by: parseFloat(data.amountInputted),
              where: { id: String(data.subject3) },
            });
            await accountlist_transaction_subject.create({
              account_list_sub3_id_transacted: String(data.subject3),
              payment_method: data.paymentMethod,
              amount: data.amountInputted,
              date: data.issuedDate,
              check_or_remarks: "",
              type: "Credit",
              module_from: moduleType,
              transaction_number: transactionNumber,
            });
          }

          // Distribute data to Bank Transaction
          if (data.paymentMethod == "Bank" && data.checkNumber == "") {
            await bank_transaction.create({
              account_list_id_bank_from: String(data.subject3),
              transaction_date: data.issuedDate,
              transaction_number: transactionNumber,
              account_list_id_bank_to: null,
              module_from: moduleType, //
              description: "",
              amount: data.amountInputted,
              status: "Pending",
            });
          }

          // Distribute data to Issued Check
          if (data.paymentMethod == "Bank" && data.checkNumber !== "") {
            await issued_check.create({
              account_list_id_issued_from: String(data.subject3),
              transaction_date: data.issuedDate,
              check_number: data.checkNumber,
              transaction_number: transactionNumber,
              module_from: moduleType,
              description: "To pay",
              amount: data.amountInputted,
              status: "Pending",
            });
          }

          await Payable_Payment.update(
            {
              status: true,
            },
            {
              where: {
                payable_id: data.id,
                accountList_id: String(data.subject3),
              },
            }
          );
        }
      }

      const isAllPaymentNotCash = floatPayment?.some((item) => {
        return item.paymentMethod !== "Cash";
      });

      if (payableList && payableList.length > 0) {
        for (const data of payableList) {
          await Payable.update(
            {
              status: `${isAllPaymentNotCash ? "Partially-Paid" : "Paid"}`,
            },
            {
              where: {
                id: data.payable.id,
                transaction_id: data.payable.transaction_id,
              },
            }
          );
        }
      }
    }

    // if (paymentList && paymentList.length > 0) {
    //   for (const data of paymentList) {
    //     await issued_check.create({
    //       account_list_id_issued_from: data.account_list_sub3.id,
    //       transaction_date: data.date_issued,
    //       check_number: data.check_number,
    //       transaction_number: "to confirm",
    //       module_from: "Payable",
    //       description: "To pay",
    //       amount: data.amount,
    //       status: "Pending",
    //     });
    //   }
    // }

    const getData = await PayableBulk.findOne({
      where: {
        id: id,
      },
    });
    const moduleType2 = module === "local" ? "Local " : "Overseas ";

    await Activity_Log.create({
      masterlist_id: approvedBy,
      action_taken: `${moduleType2} Purchase: User ${status.toLowerCase()} a ${moduleType2.toLocaleLowerCase()} purhcase with transaction ID ${
        getData.transaction_number
      }`,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getLatestCutoff").get(async (req, res) => {
  const date = new Date();

  const data = await Cutoff.findOne({
    where: {
      [Op.and]: [{ from: { [Op.lte]: date } }, { to: { [Op.gte]: date } }],
    },
  });

  res.json(data);
});

router.route("/fetchPreviousCutoffPayable").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const date = new Date();
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

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          { purchaseDate: { [Op.lt]: currentCutoff.from } },
          { isPaid: false },
          { isAdded: false },
          { status: "Approved" },
        ],
      },
    });

    const totalPreviousCutoffPrice = data.reduce((total, value) => {
      return total + value.totalPrice * value.rate;
    }, 0);

    res.json({ totalPrice: totalPreviousCutoffPrice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchCurrentCutoffPayable").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          // { isPaid: false },
          { status: "Approved" },
        ],
        isDeleted: false,
      },
    });

    const totalCurrentCutoffPrice = data.reduce((total, value) => {
      return total + value.totalPrice * value.rate;
    }, 0);

    res.json({ totalPrice: totalCurrentCutoffPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentTotalPayable").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const date = new Date();
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

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          // { isPaid: false },
          { status: { [Op.ne]: "Rejected" } },
          { status: { [Op.ne]: "Pending" } },
        ],
        isDeleted: false,
      },
    });

    const totalCurrentCutoffPrice = data.reduce((total, value) => {
      return total + value.totalPrice * value.rate;
    }, 0);

    res.json({ totalPrice: totalCurrentCutoffPrice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchTotalDiscount").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const date = new Date();
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

    // Calculate the total discount sum in php
    // const fetchTotalDiscount = await Payable.sum("discount_value", {
    //   where: {
    //     [Op.and]: [
    //       // { createdAt: { [Op.gt]: currentCutoff.from } },
    //       {
    //         due_date: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //       },
    //       { isPercent_Discount: 0 },
    //       { status: "Approved" },
    //     ],
    //   },
    // });

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          // { createdAt: { [Op.gt]: currentCutoff.from } },
          {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          { isPercent_Discount: 0 },
          { status: "Approved" },
        ],
        isDeleted: false,
      },
    });

    const fetchTotalDiscount = data.reduce((total, value) => {
      return total + value.discount_value * value.currency.currency_rate;
    }, 0);

    // Fetch all Discount in percent
    const fetchDiscountInPercent = await Payable_Product.findAll({
      include: [
        {
          model: Payable,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
          where: {
            isPercent_Discount: 1,
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
            status: "Approved",
          },
        },
      ],
    });

    // Calculate the total discount sum in percent
    const totalDiscountInPercent = fetchDiscountInPercent.reduce(
      (total, value) => {
        const totalWeight = value.unitPrice * value.weight;
        const totalMoisture =
          (value.moisture / 100) * value.unitPrice * value.weight;
        return (
          total +
          parseFloat(
            (totalWeight -
              totalMoisture -
              value.payable.weighing_fee -
              value.payable.totalPrice) *
              value.payable.currency.currency_rate
          )
        );
      },
      0
    );

    res.json({
      totalDiscount:
        parseFloat(fetchTotalDiscount) + parseFloat(totalDiscountInPercent),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchTotalIssued").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const data = await Payable_Bulk_Transaction.findAll({
      include: [
        {
          model: PayableBulk,
          required: true,
          where: {
            status: "Approved",
            payable_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
        },
        {
          model: Payable,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
          where: {
            isAdded: true,
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
        },
      ],
    });
    const totalIssued = data.reduce((total, value) => {
      console.log(
        "id",
        value.payable.transaction_id,
        "Vaaal",
        value.payable.totalPrice,
        "Rate",
        value.payable.currency.currency_rate,
        "equal",
        value.payable.totalPrice * value.payable.rate
      );
      return (
        total + value.payable.totalPrice * value.payable.currency.currency_rate
      );
    }, 0);

    console.log("------------------", totalIssued);
    res.json(totalIssued);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
});

router.route("/fetchTotalPayable").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate } = req.query;
    const data = await PayableBulk.findAll({
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              include: [
                {
                  model: Currency,
                },
              ],
              required: true,
              where: {
                domestic_type: domestic_type === "local" ? "local" : "overseas",
              },
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
        payable_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        status: "Approved",
      },
    });

    const totalPayable = data.reduce((total, payableBulk) => {
      const amount = payableBulk.payable_bulk_transactions.reduce(
        (subtotal, transaction) => {
          const payableRate = transaction.payable?.currency.currency_rate || 1;
          console.log("Rate", payableRate);

          const payablePrice = transaction.payable?.totalPrice;

          console.log("Amount", payablePrice);

          const transactionTotal = payableRate * payablePrice;

          return subtotal + transactionTotal;
        },
        0
      );

      return total + amount;
    }, 0);
    res.status(200).json(totalPayable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchTotalPaid").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate } = req.query;
    const payableBulk = await PayableBulk.findAll({
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              include: [
                {
                  model: Currency,
                },
              ],
              required: true,
              where: {
                domestic_type: domestic_type === "local" ? "local" : "overseas",
              },
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
        payable_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        status: "Approved",
      },
    });

    const payableBulkTransactionNumber = payableBulk.map((item) => {
      return item.transaction_number;
    });

    // const totalPaidBankTransactions = await bank_transaction.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Payable" : "Overseas Payable",
    //     status: "Confirmed",
    //     transaction_number: {
    //       [Op.in]: payableBulkTransactionNumber,
    //     },
    //   },
    // });

    const confirmedBankTransactions = await bank_transaction.findAll({
      where: {
        transaction_number: payableBulkTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Payable" : "Overseas Payable",
        status: "Confirmed",
      },
      attributes: ["transaction_number"],
    });

    const confirmedIssuedCheck = await issued_check.findAll({
      where: {
        transaction_number: payableBulkTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Payable" : "Overseas Payable",
        status: "Paid",
      },
      attributes: ["transaction_number"],
    });

    const totalPaidCashflow = await CashFlow.findAll({
      where: {
        transaction_number: payableBulkTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Payable" : "Overseas Payable",
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

    const totalPaidTransactions = payableBulk
      .filter((item) => item.status === "Approved")
      .reduce((total, value) => {
        const amount = value.payable_bulk_transactions.reduce(
          (subtotal, transaction) => {
            const id = transaction.payable?.transaction_id;
            const payableRate =
              transaction.payable?.currency.currency_rate || 1;
            const payableAmount = transaction.payable?.totalPrice;
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
              "Type of transactionNumber:",
              typeof transactionNumber,
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
              return subtotal + transactionTotal;
            }

            return subtotal;
          },
          0
        );

        return total + amount;
      }, 0);

    // const totalPaidIssuedCheck = await issued_check.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Payable" : "Overseas Payable",
    //     status: "Paid",
    //     transaction_number: {
    //       [Op.in]: payableBulkTransactionNumber,
    //     },
    //   },
    // });

    // const totalPaidCashflow = await CashFlow.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Payable" : "Overseas Payable",
    //     status: "Paid",
    //     transaction_number: {
    //       [Op.in]: payableBulkTransactionNumber,
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

router.route("/deletePayable").delete(async (req, res) => {
  try {
    const { primary_id, purchase_date, transaction_id, userLoggedID } =
      req.query;

    const getCutoff = await Cutoff.findOne({
      isDeleted: false,
      where: {
        [Op.and]: [
          {
            from: {
              [Op.lte]: purchase_date, // from date is less than or equal to purchase date
            },
          },
          {
            to: {
              [Op.gte]: purchase_date, // to date is greater than or equal to purchase date
            },
          },
        ],
      },
    });

    // const CutoffFrom = getCutoff.from;

    // const CutoffTo = getCutoff.to;
    const isPosted = getCutoff.isPosted;
    const CutoffName = getCutoff.name;

    if (isPosted) {
      return res.status(201).json({
        success: false,
        purchase_date: purchase_date,
        cutoff_name: CutoffName,
      });
    }

    //step ONE  check first in the Local and Overseas if there is a transaction
    const checkTransaction = await Payable_Bulk_Transaction.findOne({
      where: { payable_id: primary_id, isDeleted: false },
      include: [
        { model: Payable, required: true },
        {
          model: PayableBulk,
          required: true,
        },
      ],
    });

    if (checkTransaction) {
      const transactionNumber =
        checkTransaction.payable_bulk.transaction_number;
      const moduleType = checkTransaction.payable.domestic_type;
      return res.status(202).json({
        success: false,
        transactionNumber,
        moduleType,
      });
    }

    const getPayableProducts = await Payable_Product.findAll({
      where: {
        payable_id: primary_id,
      },
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
        },
      ],
    });

    if (getPayableProducts) {
      for (const data of getPayableProducts) {
        // console.log(data.product_tag_vendor.product_id);
        const product_id = data.product_tag_vendor.product_id;

        const fetchPayableStockManagement = await StockManagement.findAll({
          where: {
            product_id: product_id,
            transaction_number: transaction_id,
            isDeleted: false,
          },
        });

        for (const stock_data of fetchPayableStockManagement) {
          // console.log(stock_data.stock_management_id);

          const payableStockManagment_id = stock_data.stock_management_id;
          // -------------------   step TWO check in the Production if it is being used if not can be deleted
          const checkRawUsedProd = await Production_Raw_Used.findOne({
            where: {
              stock_management_id: payableStockManagment_id,
            },
            include: [
              {
                model: Production,
                where: {
                  isDeleted: false,
                },
                required: true,
              },
            ],
          });

          if (checkRawUsedProd) {
            return res.status(203).json({
              success: false,
              transactionNumber: checkRawUsedProd.production.production_id,
            });
          }

          // ------------------------- step THREE check in the Sales if it is being used if not can be deleted
          const checkSalesProducts = await SalesInvoiceInventory.findOne({
            where: {
              stock_management_id: payableStockManagment_id,
              isDeleted: false,
            },
            include: [
              {
                model: SalesInvoice,
                required: true,
              },
            ],
          });

          if (checkSalesProducts) {
            const transactionNumber =
              checkSalesProducts?.sales_invoice?.transaction_id;

            return res.status(207).json({
              success: false,
              transactionNumber: transactionNumber,
            });
          }

          // step Four check in the stock Transfer if it is being used if not can be deleted

          const checkStockTransfer = await StockTransferApproveProducts.findOne(
            {
              where: {
                stockmanagement_id: payableStockManagment_id,
              },
              include: [
                {
                  model: StockTransferProducts,
                  required: true,
                  include: [
                    {
                      model: StockTransfer,
                      required: true,
                    },
                  ],
                },
              ],
            }
          );

          if (checkStockTransfer) {
            const transactionNumber =
              checkStockTransfer.stock_transfer_product.stock_transfer_mother
                .transaction_id;

            return res
              .status(208)
              .json({ success: false, transactionNumber: transactionNumber });
          }
        }
      }
    }

    // await Payable.destroy({
    //   where: {
    //     id: primary_id,
    //   },
    // });

    await Payable.update(
      { isDeleted: true },
      {
        where: {
          id: primary_id,
        },
      }
    );

    // await StockManagement.destroy({
    //   where: {
    //     transaction_number: transaction_id,
    //   },
    // });
    await StockManagement.update(
      { isDeleted: true },
      {
        where: {
          transaction_number: transaction_id,
        },
      }
    );
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `User deleted a payable with transaction ID : ${transaction_id}`,
    });

    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

router.route("/localOverseasdeletePayable").delete(async (req, res) => {
  try {
    const { primary_id, purchase_date, transaction_id, userLoggedID } =
      req.query;

    const getCutoff = await Cutoff.findOne({
      where: {
        isDeleted: false,
        [Op.and]: [
          {
            from: {
              [Op.lte]: purchase_date, // from date is less than or equal to purchase date
            },
          },
          {
            to: {
              [Op.gte]: purchase_date, // to date is greater than or equal to purchase date
            },
          },
        ],
      },
    });

    // const CutoffFrom = getCutoff.from;

    // const CutoffTo = getCutoff.to;
    const isPosted = getCutoff.isPosted;
    const CutoffName = getCutoff.name;

    if (isPosted) {
      return res.status(201).json({
        success: false,
        purchase_date: purchase_date,
        cutoff_name: CutoffName,
      });
    }

    // const getData = await Payable_Payment.findAll({
    //   where: {
    //     payable_id: primary_id,
    //   },
    //   include: [
    //     {
    //       model: PayableBulk,
    //       required: true,
    //     },
    //   ],
    // });

    // if (getData) {
    //   for (const data of getData) {
    //     console.log(data.payable_bulk.transaction_number);
    //   }
    // }

    // Data to Delete
    // const profitLossReportData = await ProfitLossReport.findAll({
    //   include: [
    //     {
    //       model: issued_check,
    //     },
    //     {
    //       model: bank_transaction,
    //     },
    //   ],
    //   where: {
    //     [Op.or]: [
    //       { "$issued_check.transaction_number$": transaction_id },
    //       { "$bank_transaction.transaction_number$": transaction_id },
    //     ],
    //   },
    // });

    // for (const item of profitLossReportData) {
    //   // Delete Profit Loss Report
    //   await ProfitLossReport.destroy({
    //     where: {
    //       [Op.and]: [
    //         { issued_check_id: item.issued_check_id },
    //         { bank_transaction_id: item.bank_transaction_id },
    //       ],
    //     },
    //   });
    // }

    const getPaymentsBank = await bank_transaction.findAll({
      where: {
        transaction_number: transaction_id,
        isDeleted: false,
      },
    });

    if (getPaymentsBank) {
      for (const data of getPaymentsBank) {
        // console.log(data.status, data.id, data.account_list_id_bank_from);
        if (data.status === "Pending") {
          // await bank_transaction.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });
          await bank_transaction.update(
            { isDeleted: true },
            {
              where: {
                id: data.id,
              },
            }
          );
        } else if (data.status === "Confirmed") {
          await accountlist_sub3.increment(
            { amount: data.amount },
            {
              where: {
                id: data.account_list_id_bank_from,
              },
            }
          );

          // await bank_transaction.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });
          await bank_transaction.update(
            { isDeleted: true },
            {
              where: {
                id: data.id,
              },
            }
          );
        }
      }
    }

    const getPaymentsCheck = await issued_check.findAll({
      where: {
        transaction_number: transaction_id,
        isDeleted: false,
      },
    });

    if (getPaymentsCheck) {
      for (const data of getPaymentsCheck) {
        if (data.status === "Pending") {
          // await issued_check.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });

          await issued_check.update(
            { isDeleted: false },
            {
              where: {
                id: data.id,
              },
            }
          );
        } else if (data.status === "Paid") {
          await accountlist_sub3.increment(
            { amount: data.amount },
            {
              where: {
                id: data.account_list_id_issued_from,
              },
            }
          );

          // await issued_check.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });

          await issued_check.update(
            { isDeleted: false },
            {
              where: {
                id: data.id,
              },
            }
          );
        }
      }
    }

    const getPaymentsCAsh = await CashFlow.findAll({
      where: {
        transaction_number: transaction_id,
      },
    });

    if (getPaymentsCAsh) {
      for (const data of getPaymentsCAsh) {
        // console.log(data.amount);

        await accountlist_sub3.increment(
          { amount: data.amount },
          {
            where: {
              id: data.account_list_id_cash_from,
            },
          }
        );

        // await CashFlow.destroy({
        //   where: {
        //     id: data.id,
        //   },
        // });

        await CashFlow.update(
          { isDeleted: false },
          {
            where: {
              id: data.id,
            },
          }
        );
      }
    }

    const PayablesFetch = await Payable_Bulk_Transaction.findAll({
      where: {
        payable_bulk_id: primary_id,
      },
    });

    if (PayablesFetch) {
      for (const data of PayablesFetch) {
        await Payable.update(
          { isAdded: false, status: "Approved" },
          {
            where: {
              id: data.payable_id,
            },
          }
        );
      }
    }

    // await PayableBulk.destroy({
    //   where: {
    //     id: primary_id,
    //   },
    // });

    await PayableBulk.update(
      { isDeleted: true },
      {
        where: {
          id: primary_id,
        },
      }
    );

    // await accountlist_transaction_subject.destroy({
    //   where: {
    //     transaction_number: transaction_id,
    //   },
    // });
    await accountlist_transaction_subject.update(
      { isDeleted: true },
      {
        where: {
          transaction_number: transaction_id,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `User deleted a payable with transaction ID : ${transaction_id}`,
    });

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
