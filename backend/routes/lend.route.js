const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  Lending,
  MasterList,
  AccountList,
  LendPayment,
  AssetAccount,
} = require("../db/models/associations");

const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/createLend").post(async (req, res) => {
  const {
    loanReference,
    loanUser,
    accountName,
    paymentOptions,
    releaseDate,
    loanAmount,
    interestPercent,
    interestAmount,
    loanTerms,
    remarks,
    assetAccount,
  } = req.body;
  try {
    const loanAmountNum = parseFloat(loanAmount) || 0;
    const interestAmountNum = parseFloat(interestAmount) || 0;

    const createLend = await Lending.create({
      reference: loanReference,
      masterlist_id: loanUser,
      account_list_id: accountName,
      asset_account_id: assetAccount,
      payment_options: paymentOptions,
      release_date: releaseDate,
      loan_amount: loanAmountNum,
      interest_percent: interestPercent || 0,
      interest_amount: interestAmountNum,
      terms: loanTerms,
      remarks: remarks,
      total: loanAmountNum + interestAmountNum,
      status: "Unpaid",
    });

    if (createLend) {
      const findAccount = await AccountList.findOne({
        where: {
          account_list_id: accountName,
        },
      });

      const ExistBalance = findAccount.bank_amount;
      const newBalance = parseFloat(ExistBalance) + loanAmountNum;

      await findAccount.update({
        bank_amount: newBalance,
      });
      // for (const forecast of paymentForecast) {
      //   const remaining = parseFloat(forecast.total.toFixed(2));
      //   const payment = await LendPayment.create({
      //     lend_id: createLoan.lend_id,
      //     month: forecast.month,
      //     due_date: forecast.dueDate,
      //     principal: forecast.principal,
      //     interest: forecast.interest,
      //     actual_paid: 0,
      //     remaining: remaining,
      //     amortization: forecast.total,
      //     status: "Unpaid",
      //   });
      // }
      return res.status(200).json();
    } else {
      return res.status(201).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/LendData").get(async (req, res) => {
  try {
    const data = await Lending.findAll({
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: AccountList,
          required: true,
        },
        {
          model: LendPayment,
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

router.route("/fetchLend").get(async (req, res) => {
  try {
    const data = await Lending.findOne({
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: AccountList,
          required: true,
        },
        {
          model: AssetAccount,
          required: true,
        },
      ],
      where: {
        lend_id: req.query.id,
      },
    });

    if (!data) {
      return res.status(204).json();
    }
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/fetchLendPayment").get(async (req, res) => {
  try {
    const data = await LendPayment.findAll({
      include: [
        {
          model: Lending,
          required: true,
        },
        {
          model: AccountList,
          required: false,
        },
      ],
      where: {
        lend_id: req.query.id,
      },
    });
    if (!data) {
      return res.status(204).json();
    }

    // console.log(data);
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/lendRefCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await Lending.findOne({
      where: {
        reference: {
          [Op.like]: `LE-${currentMonth}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });
    let newRefCode;
    if (lastPayCode && lastPayCode.reference) {
      const latestRefCode = lastPayCode.reference;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `LE-${currentMonth}-${newSequence}`;
      } else {
        newRefCode = `LE-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `LE-${currentMonth}-00001`;
    }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last reference:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/fetchUserList").get(async (req, res) => {
  try {
    const isFetch = await MasterList.findAll({
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

//used MOdule:
// lend and loan
router.route("/getAccountListData").get(async (req, res) => {
  try {
    const data = await AccountList.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/saveLend").post(async (req, res) => {
  const { id, paymentLend } = req.query;

  // console.log(paymentLend);

  if (paymentLend && paymentLend.length > 0) {
    paymentLend.forEach(async (data) => {
      if (data.type === "new") {
        await LendPayment.create({
          payment_method: data.paymentMethod,
          lend_id: id,
          payment_date: data.paymentDate,
          account_id: data.accountID,
          amount: data.amount,
          check_number: data.checkNumber,
          remarks: data.remarks,
        });
      }
    });
  }

  return res.status(200).json();
});

router.route("/getAssetAccount").get(async (req, res) => {
  try {
    const data = await AssetAccount.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});
module.exports = router;
