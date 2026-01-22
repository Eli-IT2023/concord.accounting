const router = require("express").Router();
const { where, Op, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  OtherIncome,
  AccountList,
  Other_Income_Payment,
  Activity_Log,
  Cutoff,
} = require("../db/models/associations");
const {
  accountlist_transaction_subject,
  accountlist_sub3,
  accountlist_base_subject,
} = require("../db/models/ModelsBySubject/associations_sub");
const moment = require("moment");
const session = require("express-session");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/fetch_data").get(async (req, res) => {
  const { type, startDate, endDate, accountsName, searchText, filterColumn } =
    req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    // Parse and format dates using moment.js
    // const fromDateTime = moment(fromDate)
    //   .startOf("day")
    //   .format("YYYY-MM-DD HH:mm:ss");
    // const toDateTime = moment(toDate)
    //   .endOf("day")
    //   .format("YYYY-MM-DD HH:mm:ss");

    // console.log(`Formatted dates - From: ${fromDateTime}, To: ${toDateTime}`);

    // const whereClause =
    //   type === "All"
    //     ? {
    //         createdAt: {
    //           [Op.between]: [startDate, endDate],
    //         },
    //       }
    //     : {
    //         foreign: type,
    //         createdAt: {
    //           [Op.between]: [startDate, endDate],
    //         },
    //       };

    const otherIncomePaymentWhereClause = {};
    if (accountsName) {
      otherIncomePaymentWhereClause["account_list_sub3_id"] = accountsName; // id of account_list_sub3; // Assign the value only if accountsName variable is not null
    }

    // Other Income Table Column
    const otherIncomeTableColumn = [
      "transaction_id",
      "desc",
      "totalAmount",
      "createdAt",
      "accounts",
    ];

    let searchFilterWhereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Handle Date
    const parseDate = () => {
      try {
        if (searchText == "") {
          searchFilterWhereClause = {
            createdAt: {
              [Op.between]: [startDate, endDate],
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
        // Validate date if less than start date and greater than end date
        if (
          stringDate < new Date(startDate) ||
          stringDate > new Date(endDate)
        ) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          }; // return nothing

          return "Invalid Date";
        }

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
            createdAt: {
              [Op.and]: [
                { [Op.gte]: rawStringToStartDate },
                { [Op.lte]: rawStringToEndDate },
              ],
            },
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
            createdAt: {
              [Op.and]: [
                { [Op.gt]: customizedStartDate },
                { [Op.lt]: customizedEndDate },
              ],
            },
          };
          return "Valid Date";
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (searchText && searchText !== "") {
      // Search Filter Options
      switch (filterColumn) {
        // Filter Transaction id
        case "transaction_no":
          searchFilterWhereClause = {
            transaction_id: {
              [Op.like]: `%${searchText}%`,
            },
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          };
          break;
        // Filter Description
        case "desc":
          searchFilterWhereClause = {
            desc: {
              [Op.like]: `%${searchText}%`,
            },
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          };

          break;
        // Filter Total Amount
        case "amount":
          if (searchText != "" && searchText !== null) {
            searchFilterWhereClause = {
              totalAmount: sequelize.where(
                literal(`CAST (totalAmount AS CHAR)`),
                {
                  [Op.like]: `%${searchText}%`,
                }
              ),
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
            };
          } else {
            searchFilterWhereClause = {};
          }
          break;
        // Filter Date
        case "date_requested":
          parseDate();
          break;
        // Filter Accounts
        case "accounts":
          searchFilterWhereClause = {
            ["$other_income_payments.account_list_sub3.account_name$"]: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;

        // For all Filter
        default:
          const validation = parseDate();

          // if (validation === "Invalid Date" && accountsData.length >= 1) {
          //   return res.json({
          //     totalItems: count,
          //     totalPages: Math.ceil(count / limit),
          //     currentPage: parseInt(page || 1),
          //     data: accountsData,
          //   });
          // }

          if (validation === "Invalid Date") {
            searchFilterWhereClause = {
              [Op.or]: otherIncomeTableColumn.map((column) => {
                if (column === "totalAmount") {
                  return {
                    [column]: sequelize.where(
                      literal(`CAST (totalAmount AS CHAR)`),
                      {
                        [Op.like]: `%${searchText}%`,
                      }
                    ),
                  };
                } else if (column === "accounts") {
                  return {
                    ["$other_income_payments.account_list_sub3.account_name$"]:
                      {
                        [Op.like]: `%${searchText}%`,
                      },
                  };
                } else {
                  return {
                    [column]: {
                      [Op.like]: `%${searchText}%`,
                    },
                  };
                }
              }),
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
            };
          }
          break;
      }
    }

    const { count, rows: isFetch } = await OtherIncome.findAndCountAll({
      order: [["createdAt", "DESC"]],
      subQuery: false,
      limit: limit,
      offset: offset,
      distinct: true,
      where: searchFilterWhereClause,
      include: [
        {
          model: Other_Income_Payment,
          required: true,
          where: otherIncomePaymentWhereClause,
          include: [
            {
              model: accountlist_sub3,
              required: true,
              where: {
                isDeleted: false,
              },
            },
          ],
        },
      ],
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await OtherIncome.findOne({
      where: {
        transaction_id: {
          [Op.like]: `OI-${currentMonth}%`,
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
        newRefCode = `OI-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `OI-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `OI-${currentMonth}-00001`;
    }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/createOtherIncome").post(async (req, res) => {
  try {
    const {
      unitPrice,
      totalAmount,
      desc,
      income_date,
      floatPayment,
      incomeType,
      transaction_id,
      foreign,
      balanceNow,
      userLoggedID,
    } = req.body;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: income_date },
          },
          {
            to: { [Op.gte]: income_date },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    // First, create the OtherIncome entry
    const isCreate = await OtherIncome.create({
      unit_price: unitPrice || null,
      desc: desc,
      income_date: income_date,
      incomeType: incomeType,
      totalAmount: totalAmount,
      transaction_id: transaction_id,
      foreign: foreign,
      status: "Pending",
      created_by: userLoggedID,
    });

    if (isCreate) {
      if (floatPayment && floatPayment.length > 0) {
        await Promise.all(
          floatPayment.map(async (data) => {
            return await Other_Income_Payment.create({
              other_income_id: isCreate.id,
              account_list_sub3_id: data.accountID || null,
              payment_type: data.type,
              check_number: data.checkNumber,
              online_name: data.online_name,
              online_ref_number: data.onlineRefNum,
              amount: data.amount || 0,
              date_issued: data.issuedDate,
            });
          })
        );
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Other Income: User created other income with transaction ID ${transaction_id}`,
      });

      return res.status(200).json();
    } else {
      return res.status(500).json({ message: "Failed to create OtherIncome" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getOtherIncome/:id").get(async (req, res) => {
  const { id } = req.params;

  try {
    const data = await OtherIncome.findOne({
      where: {
        id: id,
      },
    });

    const paymentData = await Other_Income_Payment.findAll({
      where: {
        other_income_id: id,
      },
      include: [
        {
          model: accountlist_sub3,
          include: [
            {
              model: accountlist_base_subject,
            },
          ],
        },
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: data.income_date },
          },
          {
            to: { [Op.gte]: data.income_date },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    return res.json({ data, paymentData, isPosted });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.route("/update").post(async (req, res) => {
  try {
    const {
      id,
      incomeType,
      description,
      incomeDate,
      floatPayment,
      removedPayments,
      totalAmount,
      userLoggedID,
      transaction_id,
    } = req.body;

    //For activity logs
    const getData = await Other_Income_Payment.findAll({
      include: [
        {
          model: OtherIncome,
        },
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        other_income_id: id,
      },
    });

    const updateOtherIncome = await OtherIncome.update(
      {
        incomeType: incomeType,
        income_date: incomeDate,
        desc: description,
        totalAmount: totalAmount,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (Array.isArray(floatPayment)) {
      for (const addedID of floatPayment) {
        await Other_Income_Payment.create({
          other_income_id: id,
          account_list_sub3_id: addedID.accountID,
          amount: addedID.amount,
          date_issued: addedID.issuedDate,
        });

        console.log(
          `Added transaction with other income payment id: ${addedID} for other income id: ${id}`
        );
      }
    }

    if (Array.isArray(removedPayments)) {
      for (const removedID of removedPayments) {
        await Other_Income_Payment.destroy({
          where: {
            other_income_id: id,
            account_list_sub3_id: removedID.account_list_sub3.id,
          },
        });

        console.log(
          `Removed transaction with other income payment id: ${removedID} for other income id: ${id}`
        );
      }
    }

    const newData = await Other_Income_Payment.findAll({
      include: [
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        other_income_id: id,
      },
    });

    const incomePaymentName = getData
      .map((item) => item.account_list_sub3.account_name)
      .join(", ");

    const newIncomePaymentName = newData
      .map((item) => item.account_list_sub3.account_name)
      .join(", ");

    const getDataOtherIncome = getData[0].other_income;

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Other Income: User updated information of other income with transaction ID ${transaction_id}:
        Income Type: ${getDataOtherIncome.incomeType} to ${incomeType},
        Total Amount: ${getDataOtherIncome.totalAmount} to ${totalAmount},
        Description: ${getDataOtherIncome.desc} to ${description},
        Income Date: ${getDataOtherIncome.income_date} to ${incomeDate}
        Payment: ${incomePaymentName} to ${newIncomePaymentName}
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
      status,
      paymentList,
      floatPayment,
      userLoggedID,
      transaction_id,
    } = req.body;

    console.log(
      "************************************---paymentList: ",
      paymentList
    );

    const updateOtherIncome = await OtherIncome.update(
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

    // Handle Payment List
    if (Array.isArray(paymentList)) {
      for (const data of paymentList) {
        if (
          data.account_list_sub3.account_list_base_sub.module_type ===
          "Liabilities Account"
        ) {
          // Decrement amount if the account is Liability account
          await accountlist_sub3.update(
            {
              amount: literal(`amount - ${data.amount}`),
            },
            {
              where: {
                id: data.account_list_sub3.id,
              },
            }
          );
        } else {
          // Increment amount if the account is not Liability account
          await accountlist_sub3.update(
            {
              amount: literal(`amount + ${data.amount}`),
            },
            {
              where: {
                id: data.account_list_sub3.id,
              },
            }
          );
        }

        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: data.account_list_sub3.id,
          payment_method: "Other Income",
          amount: data.amount,
          date: data.date_issued,
          check_or_remarks: "",
          type:
            data.account_list_sub3.account_list_base_sub.module_type ===
            "Liabilities Account"
              ? "Credit"
              : "Debit",
          isTransferOnly: true,
        });
      }
    }

    // Handle Float Payment
    if (Array.isArray(floatPayment) && floatPayment.length > 0) {
      for (const data of floatPayment) {
        if (data.module_type === "Liabilities Account") {
          // Decrement amount if the account is Liability account
          await accountlist_sub3.update(
            {
              amount: literal(`amount - ${data.amount}`),
            },
            {
              where: {
                id: data.accountID,
              },
            }
          );
        } else {
          // Increment amount if the account is not Liability account
          await accountlist_sub3.update(
            {
              amount: literal(`amount + ${data.amount}`),
            },
            {
              where: {
                id: data.accountID,
              },
            }
          );
        }

        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: data.accountID,
          payment_method: "Other Income",
          amount: data.amount,
          date: data.issuedDate,
          check_or_remarks: "",
          type: data.module_type === "Liabilities Account" ? "Credit" : "Debit",
          isTransferOnly: true,
        });
      }
    }

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Other Income: User ${status.toLowerCase()} the other income with transaction id ${transaction_id}`,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
