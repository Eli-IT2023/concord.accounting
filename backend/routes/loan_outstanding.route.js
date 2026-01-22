const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  AccountList,
  MasterList,
  Currency,
  BulkCollection,
  BulkCollectionTransaction,
  BulkCollectionPayment,
  SalesInvoice,
  Customer,
  Loan_mother,
  Activity_Log,
  Cutoff,
  ProfitLossReport,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  issued_check,
  currency_sub,
  bank_transaction,
  CashFlow,
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
router.route("/getTransactionNumber").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await Loan_mother.findOne({
      where: {
        transaction_number: {
          [Op.like]: `LOAN-${currentMonth}%`,
        },
      },
      order: [["transaction_number", "DESC"]],
    });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_number) {
      // console.log(`Last Pay Code: ${lastPayCode.transaction_code}`);
      const latestRefCode = lastPayCode.transaction_number;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `LOAN-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `LOAN-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `LOAN-${currentMonth}-00001`;
    }
    // console.log(newRefCode);
    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/addLoan").post(async (req, res) => {
  const {
    transactionNumber,
    transactionDate,
    subject1,
    subject2,
    subject3,
    checkNumber,
    amount,
    remarks,
    issuedDate,
    currency_id,
    subject3_name,
    subject2_name,
    loan_name,
    created_by,
  } = req.body;

  try {
    await Loan_mother.create({
      transaction_number: transactionNumber,
      bulk_payment_id: null,
      transaction_date: transactionDate,
      currency_id: currency_id,
      remarks: remarks,
      amount: amount,
      static_amount: amount,
      loan_name: loan_name,
      subject1: subject1,
      subject2_id: subject2,
      subject3_id: subject3,
      check_number: checkNumber,
      date_issued: issuedDate,
      created_by: created_by,
    });

    await Activity_Log.create({
      masterlist_id: created_by,
      action_taken: `Collection Check: User created loan with transaction number ${transactionNumber}`,
    });

    return res.status(200).json({ message: "Loan Added Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
//old with sub1 to sub3 options
// router.route("/claimLoan").post(async (req, res) => {
//   const {
//     bulkPaymentId,
//     amount,
//     checkNumber,
//     remarks,
//     transactionNumber,
//     currency_id,
//     subject2_name,
//     subject3_name,
//     subject3,
//     date_issued,
//   } = req.body;

//   try {
//     let checkLiabilityLoan_id;
//     const checkLiability = await accountlist_base_subject.findOne({
//       where: {
//         subject_name: "LOAN",
//         subject_type: "Bank",
//         module_type: "Liabilities Account",
//       },
//     });
//     if (checkLiability) {
//       checkLiabilityLoan_id = checkLiability.id;
//     } else {
//       const createLiability = await accountlist_base_subject.create({
//         subject_name: "LOAN",
//         subject_type: "Bank",
//         module_type: "Liabilities Account",
//       });
//       checkLiabilityLoan_id = createLiability.id;
//     }

//     const isLiabilityExistSub3 = await accountlist_sub3.findOne({
//       where: {
//         account_list_base_sub_id: checkLiabilityLoan_id,
//         account_name: `${subject2_name} - ${subject3_name}`,
//         currency_id: currency_id,
//       },
//     });

//     if (!isLiabilityExistSub3) {
//       const createLiabilitySub3 = await accountlist_sub3.create({
//         account_list_base_sub_id: checkLiabilityLoan_id,
//         account_name: `${subject2_name} - ${subject3_name}`,
//         amount: amount,
//         currency_id: currency_id,
//       });

//       await accountlist_transaction_subject.create({
//         account_list_sub3_id_transacted: createLiabilitySub3.id,
//         date: date_issued,
//         amount: amount,
//         payment_method: "--",
//         type: "Debit",
//         check_or_remarks: `Check No: ${checkNumber}\n\nRemarks: ${remarks}\n\nTransaction No.: ${transactionNumber}`,
//         isTransferOnly: true,
//       });
//     } else {
//       await accountlist_sub3.increment("amount", {
//         by: parseFloat(amount),
//         where: { id: isLiabilityExistSub3.id },
//       });

//       await accountlist_transaction_subject.create({
//         account_list_sub3_id_transacted: isLiabilityExistSub3.id,
//         date: date_issued,
//         amount: amount,
//         payment_method: "--",
//         type: "Debit",
//         check_or_remarks: `Check No: ${checkNumber}\n\nRemarks: ${remarks}\n\nTransaction No.: ${transactionNumber}`,
//         isTransferOnly: true,
//       });
//     }

//     await accountlist_sub3.increment("amount", {
//       by: parseFloat(amount),
//       where: { id: subject3 },
//     });

//     await accountlist_transaction_subject.create({
//       account_list_sub3_id_transacted: subject3,
//       date: date_issued,
//       amount: amount,
//       payment_method: "--",
//       check_or_remarks: `Check No: ${checkNumber}\n\nRemarks: ${remarks}\n\nTransaction No.: ${transactionNumber}`,
//       type: "Debit",
//       isTransferOnly: true,
//     });

//     await BulkCollectionPayment.update(
//       {
//         status: "Claimed",
//       },
//       { where: { id: bulkPaymentId } }
//     );

//     return res.status(200).json({ message: "Loan Claimed Successfully" });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// new -- NOO sub1 to sub3 options
router.route("/claimLoan").post(async (req, res) => {
  const {
    bulkPaymentId,
    amount,
    checkNumber,
    remarks,
    transactionNumber,
    currency_id,
    // subject2_name,
    // subject3_name,
    subject3,
    date_issued,
    loan_name,
    userLoggedID,
    currency_name,
    currencyRate,
    rowData,
  } = req.body;

  try {
    // let checkLiabilityLoan_id;
    // const checkLiability = await accountlist_base_subject.findOne({
    //   where: {
    //     subject_name: "LOAN",
    //     subject_type: "Bank",
    //     module_type: "Liabilities Account",
    //   },
    // });
    // if (checkLiability) {
    //   checkLiabilityLoan_id = checkLiability.id;
    // } else {
    //   const createLiability = await accountlist_base_subject.create({
    //     subject_name: "LOAN",
    //     subject_type: "Bank",
    //     module_type: "Liabilities Account",
    //   });
    //   checkLiabilityLoan_id = createLiability.id;
    // }

    // const liability_accountname = `(${transactionNumber}) ${loan_name}`;

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date_issued },
          },
          {
            to: { [Op.gte]: date_issued },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    if (rowData && currencyRate) {
      await ProfitLossReport.create({
        collection_check_id: rowData.id,
        currency_id: currency_id,
        currency_rate: currencyRate,
        transaction_date: rowData.loan_mothers[0]?.transaction_date,
      });
    }

    const createLiabilitySub3 = await accountlist_sub3.increment(
      {
        amount: amount,
      },
      {
        where: {
          id: subject3,
        },
      }
    );

    if (createLiabilitySub3) {
      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: subject3,
        date: date_issued,
        amount: amount,
        payment_method: "--",
        check_or_remarks: `${checkNumber}`,
        type: "Debit",
        isTransferOnly: false,
        module_from: "Collection Check (Loan)",
        transaction_number: transactionNumber,
      });

      await BulkCollectionPayment.update(
        {
          status: "Claimed",
          collected_by: userLoggedID,
        },
        { where: { id: bulkPaymentId } }
      );

      return res.status(200).json();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json();
  }
});

router.route("/fetchLoan").get(async (req, res) => {
  try {
    const fetchLoan = await Loan_mother.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: accountlist_sub3,
          required: true,
        },
      ],
    });

    return res.status(200).json(fetchLoan);
  } catch (error) {
    console.log(error);
    return res.status(500).json();
  }
});

router.route("/updateLoan").post(async (req, res) => {
  const {
    transactionNumber,
    transactionDate,
    subject1,
    subject2,
    subject3,
    checkNumber,
    amount,
    remarks,
    issuedDate,
    currency_id,
    subject3_name,
    subject2_name,
    loan_name,
    created_by,
  } = req.body;
  const loanId = req.body.loanId;
  try {
    await Loan_mother.update(
      {
        transaction_date: transactionDate,
        currency_id: currency_id,
        remarks: remarks,
        amount: amount,
        static_amount: amount,
        loan_name: loan_name,
        subject1: subject1,
        subject2_id: subject2,
        subject3_id: subject3,
        check_number: checkNumber,
        date_issued: issuedDate,
      },
      {
        where: {
          id: loanId,
        },
      }
    );

    return res.status(200).json({ message: "Loan Added Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json();
  }
});

router.route("/approveLoan").post(async (req, res) => {
  try {
    const {
      transactionNumber,
      transactionDate,
      subject1,
      subject2,
      subject3,
      checkNumber,
      amount,
      remarks,
      issuedDate,
      currency_id,
      subject3_name,
      subject2_name,
      loan_name,
      created_by,
      userLoggedID,
      loanId,
    } = req.body;

    const createBulkPayment = await BulkCollectionPayment.create({
      account_list_sub3_id: subject3,
      payment_type: "Bank",
      check_number: checkNumber,
      account_list_sub3_id: subject3,
      amount: amount,
      date_issued: issuedDate,
      check_or_online: "Check",
      status: "Approved",
      isFromLoan: true,
    });

    if (createBulkPayment) {
      await Loan_mother.update(
        {
          bulk_payment_id: createBulkPayment.id,
          status: "Approved",
          approved_by: userLoggedID,
        },
        {
          where: {
            id: loanId,
          },
        }
      );

      return res.status(200).json();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json;
  }
});

module.exports = router;
