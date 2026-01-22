const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  Liability,
  MasterList,
  AccountList,
  Label,
  Label_Tag,
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

router.route("/createLiability").post(async (req, res) => {
  const {
    loanReference,
    loanType,
    loanUser,
    accountName,
    paymentOptions,
    loanAmount,
    interestPercent,
    interestAmount,
    loanTerms,
    remarks,
    liabilityLabel,
  } = req.body;
  try {
    const loanAmountNum = parseFloat(loanAmount) || 0;
    const interestAmountNum = parseFloat(interestAmount) || 0;

    const createLoan = await Liability.create({
      reference: loanReference,
      type: loanType,
      masterlist_id: loanUser,
      account_list_id: accountName,
      label_id: liabilityLabel,
      payment_options: paymentOptions,
      loan_amount: loanAmountNum,
      interest_percent: interestPercent || 0,
      interest_amount: interestAmountNum,
      terms: loanTerms,
      remarks: remarks,
      total: loanAmountNum + interestAmountNum,
    });

    if (createLoan) {
      const findAccount = await AccountList.findOne({
        where: {
          account_list_id: accountName,
        },
      });

      const ExistBalance = findAccount.bank_amount;
      const newBalance = parseFloat(ExistBalance) - loanAmountNum;

      await findAccount.update({
        bank_amount: newBalance,
      });

      return res.status(200).json();
    } else {
      return res.status(201).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/LiabilityData").get(async (req, res) => {
  try {
    const data = await Liability.findAll({
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
          model: Label,
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

router.route("/loanRefCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await Liability.findOne({
      where: {
        reference: {
          [Op.like]: `LIA-${currentMonth}%`,
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
        newRefCode = `LIA-${currentMonth}-${newSequence}`;
      } else {
        newRefCode = `LIA-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `LIA-${currentMonth}-00001`;
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

router.route("/getAssetLabel").get(async (req, res) => {
  try {
    const data = await Label.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Label_Tag,
          required: true,
          where: {
            tag: "liabilities",
          },
        },
      ],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});
module.exports = router;
