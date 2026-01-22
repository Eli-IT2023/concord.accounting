const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  BulkCollection,
  BulkCollectionPayment,
} = require("../db/models/associations");
const {
  accountlist_sub3,
  currency_sub,
  issued_check,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/filterCollection").get(async (req, res) => {
  try {
    const { selectedOptionsS3, dateFrom, dateTo } = req.query;
    let totalAmount = 0;

    console.log(req.query);
    for (const option of selectedOptionsS3) {
      const data = await BulkCollectionPayment.findAll({
        attributes: ["amount"], // Only select the amount
        where: {
          payment_type: "Bank",
          check_number: { [Op.ne]: "" },
          account_list_sub3_id: option.value, //selected na sub3 id
        },
        include: [
          {
            model: BulkCollection,
            required: true,
            where: {
              collection_date: { [Op.between]: [dateFrom, dateTo] },
              status: "Pending",
            },
          },
          {
            model: accountlist_sub3,
            required: true,
            include: [
              {
                model: currency_sub,
                required: true,
              },
            ],
          },
        ],
      });

      // Calculate the total amount using array reduce
      totalAmount += data.reduce(
        (sum, payment) =>
          sum +
          parseFloat(
            payment.amount * payment.account_list_sub3.currency.currency_rate
          ),
        0
      );

      //   console.log(data.account_list_sub3.amount);

      for (const datas of data) {
        console.log(datas.account_list_sub3.currency.currency_rate);
      }
    }

    res.status(200).json(totalAmount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/filterPayable").get(async (req, res) => {
  try {
    const { selectedOptionsS3, dateFrom, dateTo } = req.query;

    // Parse selectedOptionsS3 if it's a string
    const parsedOptions =
      typeof selectedOptionsS3 === "string"
        ? JSON.parse(selectedOptionsS3)
        : selectedOptionsS3;

    const fetch_issued_check = await issued_check.findAll({
      where: {
        transaction_date: { [Op.between]: [dateFrom, dateTo] },
        account_list_id_issued_from: {
          [Op.in]: parsedOptions.map((option) => option.value),
        },
      },
      attributes: ["account_list_id_issued_from", "amount"],
    });

    // Calculate disbursement for each selected account
    const disbursements = parsedOptions.map((option) => {
      const totalDisbursement = fetch_issued_check
        .filter(
          (check) =>
            check.account_list_id_issued_from.toString() === option.value
        )
        .reduce((sum, check) => sum + check.amount, 0);

      return {
        ...option,
        disbursement: totalDisbursement,
      };
    });
    // console.log(disbursements);
    res.status(200).json(disbursements);

    console.log(disbursements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});
// used in bank-budgeting.jsx
router.route("/getSubject3").get(async (req, res) => {
  try {
    const { subjectIdArray } = req.query;

    const subject3List = [];
    for (const subjectId of subjectIdArray) {
      const subject3 = await accountlist_sub3.findAll({
        include: [
          {
            model: currency_sub,
            attributes: ["currency_name", "currency_rate"],
            required: true,
          },
        ],
        where: { account_list_base_sub_id: subjectId.value, isDeleted: false },
      });
      subject3List.push(...subject3); // Flatten the array
    }
    res.status(200).json(subject3List);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
