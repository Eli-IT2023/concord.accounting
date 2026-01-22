const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  Equity,
  EquitySub3,
  EquityTransaction
} = require("../../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//************************ROUTE FOR ENHANCEMENT OF EQUITY ACCOUNTS*******************************\\
//route section para sa owners equity 1 \\


//route section para sa owners equity 2 \\
router.route("/addEquitySubject").post(async (req, res) => {
  const { subject } = req.body;
  try {
    const subjectExists = await Equity.findOne({
      where: { subject_name: subject },
    });
    if (subjectExists) {
      return res.status(201).json();
    }

    const newSubject = await Equity.create({
      subject_name: subject,
    });

    if (newSubject) {
      res.status(200).json();
    } else {
      res.status(500).json();
    }
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/addEquitySubject3").post(async (req, res) => {
  const { subject3List } = req.body;
  try {
    // Filter only the new subjects (isNew: true)
    const newSubjects = subject3List.filter(
      (subject3) => subject3.isNew === true
    );

    if (newSubjects.length === 0) {
      return res.status(200).json({ message: "No new subjects to add" });
    }

    // Check if any of the new subjects already exist
    const existingSubjects = await Promise.all(
      newSubjects.map(async (subject3) => {
        return await EquitySub3.findOne({
          where: {
            account_name: subject3.account,
            equity_id: subject3.subjectId,
          },
        });
      })
    );

    // If any new subject already exists, return an error
    if (existingSubjects.some((subject) => subject !== null)) {
      return res
        .status(201)
        .json({ message: "One or more new subjects already exist" });
    }

    // Insert only the new subjects
    const createdSubjects = await Promise.all(
      newSubjects.map(async (subject3) => {
        return await EquitySub3.create({
          equity_id: subject3.subjectId,
          account_name: subject3.account,
          amount: subject3.amount,
          currency: subject3.basedCurrency,
        });
      })
    );

    if (createdSubjects.length === newSubjects.length) {
      res.status(200).json({ message: "All new subjects added successfully" });
    } else {
      res
        .status(500)
        .json({ message: "An error occurred while adding new subjects" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "Subject already exists") {
      res.status(201).json({ message: "Subject already exists" });
    } else {
      res.status(500).json({ message: "An error occurred" });
    }
  }
});

router.route("/getEquitySubject").get(async (req, res) => {
  try {
    const subjects = await Equity.findAll();
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getEquitySubject3").get(async (req, res) => {
  const { subjectId } = req.query;
  try {
    const subject3List = await EquitySub3.findAll({
      where: { equity_id: subjectId },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});
//route section para sa owners equity 1 \\

//route section para sa owners equity 2 \\
router.route("/equityCreateTransaction").post(async (req, res) => {
  const { subject1, subject3, paymentMethod, amount, date, checkNo, id, type } =
    req.body;
  try {
    const status = (paymentMethod === "Bank" && checkNo === "")
    ? "Completed"
    : (paymentMethod === "Bank" && checkNo !== "")
    ? "Pending"
    : "Completed"; // Default or other status if conditions don't match
  
  const transaction = await EquityTransaction.create({
    equity_sub3_from: subject3, 
    payment_method: paymentMethod,
    amount: amount,
    date: date,
    check_or_remarks: checkNo || "",
    equity_sub3_to: id,
    type: type,
    status: status,
    module_from: "Owner's Equity"
  });

    if (!transaction) {
      return res.status(500).json({ message: "Failed to create transaction" });
    }

    const updatePromises = [];

    const updateId = type === "Credit" ? id : subject3;
    updatePromises.push(
      EquitySub3.increment("amount", {
        by: parseFloat(amount),
        where: { id: updateId },
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({ message: "Transaction created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});

router.route("/debitEquityTransaction").get(async (req, res) => {
  const { id } = req.query;
  try {
    const DebitData = await EquityTransaction.findOne({
      where: { 
        equity_sub3_to: id,
        status: "Debit" 
      },
      // include: [
      //   {
      //     model: Equity,
      //     as: "equity_sub3_money_to",
      //     attributes: ["subject_name"],
      //     foreignKey: "equity_sub3_to",
      //   },
      // ],
    });
    res.status(200).json(DebitData);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/creditEquityTransaction").get(async (req, res) => {
  const { id } = req.query;
  try {
    const DebitData = await EquityTransaction.findOne({
      where: { 
        equity_sub3_to: id, 
        status: "Credit" 
       },
      // include: [
      //   {
      //     model: Equity,
      //     as: "equity_sub3_money_to",
      //     attributes: ["subject_name"],
      //     foreignKey: "equity_sub3_to",
      //   },
      // ],
    });
    res.status(200).json(DebitData);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/equityAccountName").get(async (req, res) => {
  const { id } = req.query;
  try {
    const accountName = await EquitySub3.findOne({
      where: { id: id },
      include: [
        {
          model: Equity,
          attributes: ["subject_name"],
        },
      ],
    });
    res.status(200).json(accountName);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getEquitySubject3ChainDropdown").get(async (req, res) => {
  const { subjectId, id } = req.query;
  console.log("SUBJECT ID", subjectId)
  console.log("ID", id)
  try {
    const subject3List = await EquitySub3.findAll({
      where: { equity_id: subjectId, id: { [Op.ne]: id } },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

//route section para sa owners equity 2 \\

//************************ROUTE FOR ENHANCEMENT OF EQUITY ACCOUNTS*******************************\\





router.route("/savePayment").post(async (req, res) => {
  const { payments } = req.body;
  try {
    for (const payment of payments) {
      const { id, amount } = payment;
      const actualPayment = amount || 0;
      const paymentRecord = await EquityPayment.findOne({
        where: {
          id: id,
        },
      });

      const currentRemaining = paymentRecord.remaining || 0;
      const newRemaining = (currentRemaining - actualPayment).toFixed(2);
      const remainingNotformat = currentRemaining - actualPayment;

      const currentActualPay = paymentRecord.actual_paid || 0;
      const newActualPaid =
        parseFloat(currentActualPay) + parseFloat(actualPayment);
      if (remainingNotformat === 0) {
        await paymentRecord.update({
          remaining: newRemaining,
          status: "Paid",
          actual_paid: newActualPaid,
        });
      } else {
        await paymentRecord.update({
          remaining: newRemaining,
          actual_paid: newActualPaid,
        });
      }
    }
    res.status(200).json({ message: "Payments updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/EquityData").get(async (req, res) => {
  try {
    const data = await Equity.findAll({
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
          model: EquityPayment,
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

router.route("/fetchEquity").get(async (req, res) => {
  try {
    const data = await Equity.findOne({
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: AccountList,
          required: true,
        },
      ],
      where: {
        equity_id: req.query.id,
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

router.route("/fetchEquityPayment").get(async (req, res) => {
  try {
    const data = await EquityPayment.findAll({
      include: [
        {
          model: Equity,
          required: true,
        },
        {
          model: AccountList,
          required: false,
        },
      ],
      where: {
        equity_id: req.query.id,
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

router.route("/equityRefCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await Equity.findOne({
      where: {
        reference: {
          [Op.like]: `OE-${currentMonth}%`,
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
        newRefCode = `OE-${currentMonth}-${newSequence}`;
      } else {
        newRefCode = `OE-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `OE-${currentMonth}-00001`;
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
// equity and loan
router.route("/getAccountListData").get(async (req, res) => {
  try {
    const { paymentMethod } = req.query;
    const data = await AccountList.findAll({
      where: {
        account_type: paymentMethod === "CASH" ? "Petty Cash" : paymentMethod,
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/saveEquity").post(async (req, res) => {
  const { id, paymentEquity } = req.query;

  // console.log(paymentEquity);

  if (paymentEquity && paymentEquity.length > 0) {
    paymentEquity.forEach(async (data) => {
      if (data.type === "new") {
        await EquityPayment.create({
          payment_method: data.paymentMethod,
          equity_id: id,
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

module.exports = router;