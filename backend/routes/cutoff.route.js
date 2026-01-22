const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const moment = require("moment-timezone");
const {
  Cutoff,
  Currency,
  ReturnEarningsCutoffs,
  ReturnEarnings,
  StockManagement,
  Inventory_Report,
  Activity_Log,
} = require("../db/models/associations");

const {
  accountlist_sub3,
  accountlist_transaction_subject,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const { combineTableNames } = require("sequelize/lib/utils");
const { consumers } = require("nodemailer/lib/xoauth2");

router.route("/createCutoff").post(async (req, res) => {
  const { init_from, init_to, cutoff_name, userLoggedID } = req.body;

  const from = moment(init_from).format("YYYY-MM-DD");
  const to = moment(init_to).format("YYYY-MM-DD");

  const transaction = await sequelize.transaction();

  try {
    const overlappingCutoff = await Cutoff.findOne({
      where: {
        isDeleted: false,
        [Op.or]: [
          {
            // New range starts within an existing range
            [Op.and]: {
              from: { [Op.lte]: from },
              to: { [Op.gte]: from },
            },
          },
          {
            // New range ends within an existing range
            [Op.and]: {
              from: { [Op.lte]: to },
              to: { [Op.gte]: to },
            },
          },
          {
            // New range completely contains an existing range
            [Op.and]: {
              from: { [Op.gte]: from },
              to: { [Op.lte]: to },
            },
          },
        ],
      },
    });

    if (overlappingCutoff) {
      return res.status(201).json({
        message: "Date range overlaps with existing cutoff period",
      });
    }

    const allCutoff = await Cutoff.findAll({
      where: {
        isDeleted: false,
      },
    });

    // This is only applicable if there's atleast 1 cutoff item
    if (allCutoff.length > 0) {
      const firstDayOfPreviousMonth = (dateString) => {
        const date = new Date(dateString);

        date.setMonth(date.getMonth() - 1);
        date.setDate(1);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = "01";

        return `${yyyy}-${mm}-${dd}`;
      };

      const lastDayOfPreviousMonth = new Date(
        firstDayOfPreviousMonth(from).split("-")[0],
        firstDayOfPreviousMonth(from).split("-")[1],
        0
      );

      const previousCutoff = await Cutoff.findOne({
        where: {
          from: {
            [Op.between]: [
              firstDayOfPreviousMonth(from),
              lastDayOfPreviousMonth,
            ],
          },
          isDeleted: {
            [Op.ne]: true,
          },
        },
      });

      const monthName = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const oldestCutoff = await Cutoff.findOne({
        order: [["from", "ASC"]],
        where: {
          isDeleted: false,
        },
      });

      if (!previousCutoff) {
        await transaction.rollback();
        return res.status(404).json({
          message:
            from < oldestCutoff.from
              ? `To create cutoff for ${cutoff_name}, you must first delete the ${oldestCutoff.name}`
              : `The cutoff for  ${
                  monthName[
                    Number(firstDayOfPreviousMonth(from).split("-")[1] - 1)
                  ]
                } ${
                  firstDayOfPreviousMonth(from).split("-")[0]
                } does not exist, Please create a cutoff for this month before proceeding.`,
        });
      }

      if (previousCutoff?.isPosted === false) {
        await transaction.rollback();
        return res.status(409).json({
          message: `The ${previousCutoff?.name} cutoff has not been posted yet. Please wait until it is available before creating a new cutoff.`,
        });
      }
    }

    const newCutoff = await Cutoff.create({
      from: from,
      to: to,
      name: cutoff_name,
    });

    if (newCutoff) {
      try {
        const stocks = await StockManagement.findAll({ transaction });

        const aggregatedStocks = new Map();

        for (const data of stocks) {
          const { product_id, stock, price } = data;

          if (aggregatedStocks.has(product_id)) {
            const { totalStock, totalPrice } = aggregatedStocks.get(product_id);
            aggregatedStocks.set(product_id, {
              totalStock: totalStock + stock,
              totalPrice: totalPrice + price * stock,
            });
          } else {
            aggregatedStocks.set(product_id, {
              totalStock: stock,
              totalPrice: price * stock,
            });
          }
        }

        for (const [
          product_id,
          { totalStock, totalPrice },
        ] of aggregatedStocks.entries()) {
          const averagePrice = totalStock > 0 ? totalPrice / totalStock : 0;

          const existingReport = await Inventory_Report.findOne({
            where: { product_id, cut_off_id: newCutoff.id },
            transaction,
          });

          if (existingReport) {
            existingReport.beginning_inventory_stock = totalStock;
            existingReport.average_price = averagePrice;
            await existingReport.save({ transaction });
          } else {
            await Inventory_Report.create(
              {
                cut_off_id: newCutoff.id,
                product_id,
                beginning_inventory_stock: totalStock,
                average_price: averagePrice,
                module_in_from: "Cutoff",
              },
              { transaction }
            );
          }
        }

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Monthly Cutoff: User created a new cut off named ${cutoff_name}`,
        });

        await transaction.commit();
        res.status(200).json({ message: "Cutoff created successfully" });
      } catch (error) {
        await transaction.rollback();
        console.error("Error during inventory report creation:", error);
        res
          .status(500)
          .json({ message: "Error during inventory report creation" });
      }
    } else {
      res
        .status(500)
        .json({ message: "An error occurred while creating cutoff" });
    }
  } catch (error) {
    console.error("Error creating cutoff:", error);
    await transaction.rollback();
    res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/updateCutoff").post(async (req, res) => {
  const { id, from, to, cutoff_name, userLoggedID } = req.body;

  try {
    const overlappingCutoff = await Cutoff.findOne({
      where: {
        id: { [Op.ne]: id },
        isDeleted: false,
        [Op.or]: [
          {
            // New range starts within an existing range
            [Op.and]: {
              from: { [Op.lte]: from },
              to: { [Op.gte]: from },
            },
          },
          {
            // New range ends within an existing range
            [Op.and]: {
              from: { [Op.lte]: to },
              to: { [Op.gte]: to },
            },
          },
          {
            // New range completely contains an existing range
            [Op.and]: {
              from: { [Op.gte]: from },
              to: { [Op.lte]: to },
            },
          },
        ],
      },
    });

    if (overlappingCutoff) {
      return res.status(201).json({
        message: "Date range overlaps with existing cutoff period",
      });
    }

    const getData = await Cutoff.findOne({
      where: {
        id: id,
      },
    });

    const updatedCutoff = await Cutoff.update(
      {
        from: from,
        to: to,
        name: cutoff_name,
      },
      {
        where: {
          id: id,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Monthly Cutoff: User updated the cutoff information: \n 
      Cutoff Name: ${getData.name} to ${cutoff_name}
      From: ${getData.from} to ${from}
      To: ${getData.to} to ${to}
      `,
    });

    if (updatedCutoff) {
      res.status(200).json({ message: "Cutoff updated successfully" });
    } else {
      res.status(500).json({ message: "An error occurred" });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});
//used Module:
// Return Earnings
//Cutoff
//report balance sheet
router.route("/getCutoffs").get(async (req, res) => {
  const cutoffs = await Cutoff.findAll({
    where: {
      isDeleted: false,
    },
    include: [
      {
        model: ReturnEarningsCutoffs,
        required: false,
      },
    ],
    order: [["from", "DESC"]],
  });

  if (cutoffs) {
    return res.status(200).json(cutoffs);
  } else {
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/getCutOffsForFilter").get(async (req, res) => {
  try {
    const { searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      isDeleted: false,
    };

    if (searchText && searchText.trim() !== "") {
      whereClause.name = {
        [Op.like]: `%${searchText}%`,
      };
    }

    const { count, rows: data } = await Cutoff.findAndCountAll({
      include: [
        {
          model: ReturnEarningsCutoffs,
          required: false,
          include: [
            {
              model: ReturnEarnings,
              required: false,
              where: {
                isDeleted: false,
              },
            },
          ],
        },
      ],
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["from", "DESC"]],
    });

    console.log("Cutoffs found:", count);

    if (data) {
      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: data,
      });
    }
  } catch (error) {
    console.error("Error in getCutOffsForFilter:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.route("/postCutoff").post(async (req, res) => {
  const { id, userLoggedID } = req.body.params;
  try {
    const postedCutoff = await Cutoff.update(
      { isPosted: true },
      { where: { id: id } }
    );

    const getData = await Cutoff.findOne({
      where: {
        id: id,
      },
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Monthly Cutoff: User posted a cutoff named ${getData.name}`,
    });

    if (postedCutoff) {
      res.status(200).json({ message: "Cutoff posted successfully" });
    } else {
      res.status(500).json({ message: "An error occurred" });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

router.route("/deleteCutoff").post(async (req, res) => {
  const { id, userLoggedID } = req.body.params;
  try {
    const isUsed = await ReturnEarningsCutoffs.findOne({
      where: { cutoff_id: id },
      include: [
        {
          model: ReturnEarnings,
          required: true,
          where: {
            isDeleted: false,
          },
        },
      ],
    });

    if (isUsed) {
      return res.status(201).json({ message: isUsed.return_earning.name });
    }
    const getData = await Cutoff.findOne({
      where: {
        id: id,
      },
    });

    // const deletedCutoff = await Cutoff.destroy({ where: { id: id } });

    const deletedCutoff = await Cutoff.update(
      { isDeleted: true },
      { where: { id: id } }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Monthly Cutoff: User deleted a cutoff named ${getData.name}`,
    });

    if (deletedCutoff) {
      console.log("success");
      res.status(200).json({ message: "Cutoff deleted successfully" });
    } else {
      console.log("error");
      res.status(500).json({ message: "An error occurred" });
    }
  } catch (error) {
    console.error("error1", error); // Log the actual error
    res.status(500).json({ message: "An error occurred", error });
  }
});

router.route("/fetchCutoffbyID").get(async (req, res) => {
  const { id } = req.query;

  const cutoff = await Cutoff.findOne({ where: { id: id, isDeleted: false } });

  if (cutoff) {
    res.status(200).json(cutoff);
  } else {
    res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/getTransaction").get(async (req, res) => {
  const { id } = req.query;

  try {
    const getCutoff = await Cutoff.findOne({ where: { id: id } });
    const from = getCutoff.from;
    const to = getCutoff.to;

    const transactions = await accountlist_transaction_subject.findAll({
      where: {
        date: { [Op.between]: [from, to] },
        check_or_remarks: {
          [Op.or]: [{ [Op.ne]: "Funding Capital" }, { [Op.is]: null }],
        },
        isTransferOnly: false,
        isDeleted: false,
      },
      order: [["date", "DESC"]],
      include: [
        {
          model: accountlist_sub3,
          as: "transacteds",
          required: true,
          include: [
            {
              model: Currency,
              required: true,
            },
          ],
        },
      ],
    });

    // Group transactions by date and currency_id
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const date = transaction.date;
      const currencyId = transaction.transacteds.currency_id;
      const currencyName = transaction.transacteds.currency.currency_name;
      const currencyRate = transaction.transacteds.currency.currency_rate;
      const type = transaction.type; // Assuming 'type' is a field in the transaction

      // Initialize the group if it doesn't exist
      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][currencyId]) {
        acc[date][currencyId] = {
          credit: 0,
          debit: 0,
          currencyName,
          currencyRate,
        }; // Store currencyName here
      }

      // Sum the amounts based on type
      if (type === "Credit") {
        acc[date][currencyId].credit += transaction.amount; // Assuming 'amount' is a field in the transaction
      } else if (type === "Debit") {
        acc[date][currencyId].debit += transaction.amount; // Assuming 'amount' is a field in the transaction
      }

      return acc;
    }, {});

    // Calculate net amounts
    const result = Object.entries(groupedTransactions)
      .map(([date, currencies]) => {
        return Object.entries(currencies).map(([currencyId, amounts]) => {
          return {
            date,
            currency_id: currencyId,
            currency_name: amounts.currencyName, // Use currencyName from amounts
            debit: amounts.debit,
            credit: amounts.credit,
            netAmount: amounts.debit - amounts.credit,
            currency_rate: amounts.currencyRate,
          };
        });
      })
      .flat();

    // console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching transactions" });
  }
});

router.route("/addOtherIncome").post(async (req, res) => {
  const { subject3, paymentMethod, amount, date, checkNo, type, id } = req.body;

  try {
    const increment = await accountlist_sub3.increment("amount", {
      by: parseFloat(amount),
      where: { id: subject3 },
    });

    if (increment) {
      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: subject3,
        payment_method: paymentMethod,
        amount: amount,
        date: date,
        check_or_remarks: checkNo,
        type: type,
      });
    }

    res.status(200).json({ message: "Transaction created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});

router.route("/getCurrentCutOff").get(async (req, res) => {
  const dateToday = new Date();
  try {
    const currentCutoff = await Cutoff.findOne({
      where: {
        from: { [Op.lte]: dateToday },
        to: { [Op.gte]: dateToday },
        isDeleted: false,
      },
    });

    if (currentCutoff) {
      res.status(200).json(currentCutoff);
    } else {
      res.status(404).json({ message: "No current cutoff found" });
    }
  } catch (error) {
    console.error("Error fetching current cutoff:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/dateValidation").get(async (req, res) => {
  const { date } = req.query;

  console.log(date);
  try {
    if (!date) {
      return res.status(404).json({ message: "Date not found" });
    }

    // Format Date in UTC+08:00 Time Zone (Philippines)
    const utcDate = new Date(date);
    const localDate = new Date(
      utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    // Check if the selected date falls within the range of any defined cutoff period
    const cutoff = await Cutoff.findOne({
      where: {
        isDeleted: false,
        from: { [Op.lte]: localDate },
        to: { [Op.gte]: localDate },
      },
    });

    const validation = !!cutoff;

    res.status(200).json(validation);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error");
  }
});

// Endpoint to determine if the cutoff is already posted
router.route("/validation/posted-cutoff").get(async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const cutoff = await Cutoff.findOne({
      attributes: ["isPosted"],
      where: {
        from: {
          [Op.lte]: date,
        },
        to: {
          [Op.gte]: date,
        },
        isDeleted: false,
      },
      raw: true,
    });

    res.status(200).json(Boolean(cutoff?.isPosted));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get the latest cutoff
router.route("/latest-cutoff").get(async (req, res) => {
  try {
    const latestCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        isDeleted: false,
      },
      order: [["to", "DESC"]],
      limit: 1,
    });

    res.status(200).json(latestCutoff);
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
