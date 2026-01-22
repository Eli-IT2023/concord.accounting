const router = require("express").Router();
const { where, Op, sequelize } = require("sequelize");
// const sequelize = require("../db/config/sequelize.config");
const {
  AccountList,
  MasterList,
  Currency,
  Payable_Payment,
  BankTransaction,
  CashFlow,
  IssuedCheck,
} = require("../db/models/associations");

const {
  accountlist_sub3,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//used module
// PAyable update
// Expenses ADD

router.route("/getAccountListData").get(async (req, res) => {
  try {
    const { payment } = req.query;

    const data = await AccountList.findAll({
      where: {
        account_type:
          payment === "Cash"
            ? "Petty Cash"
            : payment === "Bank"
            ? "Bank"
            : null,
      },
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: Currency,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getAccountList").get(async (req, res) => {
  try {
    const { payment } = req.query;

    console.log(`**********************----------, `, payment);
    const data = await accountlist_sub3.findAll({
      // include: [
      //   {
      //     model: MasterList,
      //     required: true,
      //   },
      //   {
      //     model: Currency,
      //     required: true,
      //   },
      // ],
      // order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getPaidInfo").get(async (req, res) => {
  try {
    const { id } = req.query;

    const data = await Payable_Payment.findAll({
      where: {
        payable_id: id,
      },
      include: [
        {
          model: AccountList,
          required: false,

          include: [
            {
              model: MasterList,
              required: true,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data1 = await Payable_Payment.sum("amount", {
      where: {
        id: {
          [Op.ne]: Payable_Payment.sequelize.literal(
            "(SELECT MAX(id) FROM payable_payments)"
          ),
        },
        payable_id: id,
      },
    });

    const data2 = await Payable_Payment.sum("amount", {
      where: {
        payable_id: id,
      },
    });
    res.json({
      payment_info: data,
      paymentBalanceBefore: data1,
      paymentBalanceNow: data2,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/addPayment").post(async (req, res) => {
  try {
    const {
      id,
      payment_type,
      accountlisID,
      amount,
      checkNumber,
      refNumber,
      date,
      bankAmount,
      transactionID,
      balance_now,
    } = req.query;
    const isCreate = await Payable_Payment.create({
      payable_id: id,
      accountList_id: accountlisID || null,
      payment_type: payment_type,
      check_number: checkNumber === "" ? null : checkNumber,
      ref_number: refNumber === "" ? null : refNumber,
      amount: amount,
      date_issued: date,
    });

    const remainingBalance = bankAmount - amount;

    if (payment_type === "Bank") {
      await BankTransaction.create({
        account_list_id: accountlisID || null,
        transaction_id: transactionID,
        transaction_date: date,
        withdraw: amount,
        balanace: remainingBalance,
        type: "PURCHASED",
      });
    }

    if (checkNumber && checkNumber !== "") {
      await IssuedCheck.create({
        transaction_id: transactionID,
        account_list_id: accountlisID || null,
        transaction_date: date,
        description: "",
        withdraw: amount,
        check_number: checkNumber,
        balance: remainingBalance,
        type: "ISSUED CHECK",
      });
    }

    if (payment_type === "Cash") {
      await CashFlow.create({
        account_list_id: accountlisID || null,
        transaction_id: transactionID,
        transaction_date: date,
        cash_out: amount,
        balanace: remainingBalance,
        type: "PURCHASED",
      });
    }

    if (isCreate) {
      const isDeduct_account = await AccountList.update(
        {
          bank_amount: bankAmount - amount,
        },
        {
          where: {
            account_list_id: accountlisID || null,
          },
        }
      );

      if (isDeduct_account) {
        return res.status(200).json();
      }
    } else {
      return res.status(500).json("Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
