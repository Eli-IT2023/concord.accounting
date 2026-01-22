const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Currency,
  AccountList,
  MasterList,
  Account_Transaction,
  Balance_History,
} = require("../db/models/associations");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/createAccountList").post(async (req, res) => {
  const {
    accountType,
    accountName,
    accountNumber,
    bankName,
    accountHolder,
    currency,
    bankAmount,
    balanceMaintain,
    remarks,
  } = req.body;
  try {
    const isExist = await AccountList.findOne({
      where: {
        account_name: accountName,
        account_number: accountNumber,
      },
    });
    if (isExist) {
      return res.status(201).json();
    } else {
      const isCreated = await AccountList.create({
        account_type: accountType,
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
        masterlist_id: accountHolder || null,
        currency_id: currency,
        bank_amount: bankAmount || 0,
        remarks: remarks,
        maintain_balance: balanceMaintain,
      });

      const Idaccount = isCreated.account_list_id;

      if (isCreated) {
        await Balance_History.create({
          account_list_id: Idaccount,
          old_balance: bankAmount,
          new_balance: bankAmount,
        });
        return res.status(200).json();
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchAccountEdit").get(async (req, res) => {
  try {
    const data = await AccountList.findAll({
      where: {
        account_list_id: req.query.id,
      },
      include: [
        {
          model: MasterList,
          required: false,
        },
        {
          model: Currency,
          required: true,
        },
      ],
    });

    if (!data) {
      return res.status(404).json();
    }
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//fetching of account lists
//used Modules:
//Accountlist
// Other income
router.route("/getAccountListData").get(async (req, res) => {
  try {
    const data = await AccountList.findAll({
      include: [
        {
          model: MasterList,
          required: false,
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

//create of transaction account
router.route("/createTransaction").post(async (req, res) => {
  try {
    const {
      id,
      modalTitle,
      CurrencyId,
      totalAmount,
      Remarks,
      UsedFor,
      Reference,
      DateTransaction,
      TransactionOption,
    } = req.body;

    const createTransaction = await Account_Transaction.create({
      reference: Reference,
      account_list_id: id,
      receiver: id,
      currency_id: CurrencyId,
      withdrawal_option: TransactionOption,
      transaction_date: DateTransaction,
      used_for: UsedFor,
      remarks: Remarks,
      total_amount: totalAmount,
      type: modalTitle,
    });

    if (createTransaction) {
      const Account = await AccountList.findOne({
        where: {
          account_list_id: id,
        },
      });

      const existBankAmount = Account.bank_amount;
      let newBankAmount;

      if (modalTitle === "Withdraw") {
        newBankAmount = existBankAmount - parseFloat(totalAmount);
        await Account.update({
          bank_amount: newBankAmount,
        });

        await Balance_History.create({
          account_list_id: id,
          old_balance: existBankAmount,
          new_balance: newBankAmount,
        });
      } else {
        newBankAmount = existBankAmount + parseFloat(totalAmount);
        await Account.update({
          bank_amount: newBankAmount,
        });

        await Balance_History.create({
          account_list_id: id,
          old_balance: existBankAmount,
          new_balance: newBankAmount,
        });
      }

      res.status(200).json(createTransaction);
    } else {
      res.status(201).send("Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

//bank transfer route
router.route("/bankTransfer").post(async (req, res) => {
  try {
    const {
      id,
      selectedBankAccount,
      modalTitle,
      CurrencyId,
      totalAmount,
      Remarks,
      UsedFor,
      Reference,
      DateTransaction,
      TransactionOption,
    } = req.body;

    const createTransaction = await Account_Transaction.create({
      reference: Reference,
      account_list_id: id,
      currency_id: CurrencyId,
      withdrawal_option: TransactionOption,
      transaction_date: DateTransaction,
      used_for: UsedFor,
      remarks: Remarks,
      total_amount: totalAmount,
      type: modalTitle,
      receiver: selectedBankAccount,
    });

    if (createTransaction) {
      const receiverAccount = await AccountList.findOne({
        where: {
          account_list_id: selectedBankAccount,
        },
      });

      const existBankAmount = receiverAccount.bank_amount;
      const newReceiverBankAmount =
        receiverAccount.bank_amount + parseFloat(totalAmount);

      await receiverAccount.update({
        bank_amount: newReceiverBankAmount,
      });

      const transferorAccount = await AccountList.findOne({
        where: {
          account_list_id: id,
        },
      });

      const newTransferorBankAmount =
        transferorAccount.bank_amount - parseFloat(totalAmount);
      await transferorAccount.update({
        bank_amount: newTransferorBankAmount,
      });

      await Balance_History.create({
        account_list_id: id,
        old_balance: existBankAmount,
        new_balance: newTransferorBankAmount,
      });

      res.status(200).json(createTransaction);
    } else {
      res.status(201).send("Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

//fetching of account transaction
router.route("/getAccountTransaction").get(async (req, res) => {
  try {
    const data = await Account_Transaction.findAll({
      where: {
        account_list_id: req.query.id,
      },
      include: [
        {
          model: AccountList,
          as: "transferor", // alias for the transferor
          attributes: ["account_name"],
          foreignKey: "account_list_id",
        },
        {
          model: AccountList,
          as: "to_receiver", // alias for the receiver
          attributes: ["account_name"],
          foreignKey: "receiver",
        },
        {
          model: Currency,
          required: true,
        },
      ],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getAccountBalance").get(async (req, res) => {
  try {
    const data = await Balance_History.findAll({
      where: {
        account_list_id: req.query.id,
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('new_balance')), 'total_balance'],
        [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
      ],
      group: [sequelize.fn('MONTH', sequelize.col('createdAt'))],
      order: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']],
    });

    // Create an array of all 12 months
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total_balance: 0 }));

    // Fill in the data with fetched results
    data.forEach(row => {
      monthlyData[row.dataValues.month - 1].total_balance = row.dataValues.total_balance;
    });

    res.json(monthlyData);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});


//fetching of the account lists that not equal to clicked row
router.route("/fetchAccountLists").get(async (req, res) => {
  try {
    const accountListId = req.query.id;

    const data = await AccountList.findAll({
      where: {
        account_list_id: {
          [Op.ne]: accountListId,
        },
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
    });

    if (data.length > 0) {
      return res.json(data);
    } else {
      return res.status(404).json({ message: "No data found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
