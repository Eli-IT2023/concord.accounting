const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  Loan,
  MasterList,
  AccountList,
  LoanPayment,
  Liability,
  Loan_label_mother,
  Label,
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

router.route("/createLoan").post(async (req, res) => {
  const {
    loanReference,
    loanType,
    loanUser,
    accountID,
    paymentOptions,
    loanAmount,
    interestPercent,
    interestAmount,
    loanTerms,
    remarks,
    label_id,
  } = req.body;
  try {
    const loanAmountNum = parseFloat(loanAmount) || 0;
    const interestAmountNum = parseFloat(interestAmount) || 0;

    let mother_id;

    const isSubjectAccountExist = await Loan_label_mother.findOne({
      where: {
        label_id: label_id,
        account_list_id: accountID,
      },
    });

    if (isSubjectAccountExist) {
      //if meron exist
      mother_id = isSubjectAccountExist.id;
    } else {
      // dpa exist

      const createNew = await Loan_label_mother.create({
        label_id: label_id,
        account_list_id: accountID,
      });
      mother_id = createNew.id;
    }

    const createLoan = await Loan.create({
      reference: loanReference,
      type: loanType,
      masterlist_id: loanUser,
      // account_list_id: accountName,
      loan_label_mother_id: mother_id,
      payment_options: paymentOptions,
      loan_amount: loanAmountNum,
      interest_percent: interestPercent || 0,
      interest_amount: interestAmountNum,
      terms: loanTerms,
      remarks: remarks,
      total: loanAmountNum + interestAmountNum,
      status: "Unpaid",
    });

    if (createLoan) {
      const findAccount = await AccountList.findOne({
        where: {
          account_list_id: accountID,
        },
      });

      const ExistBalance = findAccount.bank_amount;
      const newBalance = parseFloat(ExistBalance) - loanAmountNum;

      await findAccount.update({
        bank_amount: newBalance,
      });

      // for (const forecast of paymentForecast) {
      //   const remaining = parseFloat(forecast.total.toFixed(2));
      //   const payment = await LoanPayment.create({
      //     loan_id: createLoan.loan_id,
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

router.route("/savePayment").post(async (req, res) => {
  const { id, paymentLoan } = req.body;
  try {
    if (paymentLoan && paymentLoan.length > 0) {
      for (const payment of paymentLoan) {
        const {
          transaction_date,
          amount_pay,
          payment_method,
          account_list,
          check_reference,
          remarks,
          type,
        } = payment;

        const getLoan = await Loan.findOne({
          where: {
            loan_id: id,
          },
        });

        const loanOwe = getLoan.loan_amount;

        if (type === "new") {
          const insertPayment = await LoanPayment.create({
            loan_id: id,
            transaction_date: transaction_date || null,
            amount_pay: amount_pay || 0,
            payment_method: payment_method,
            check_reference: check_reference || null,
            account_list_id: account_list || null,
            remarks: remarks,
          });

          if (insertPayment) {
            const totalPaid = await LoanPayment.sum("amount_pay", {
              where: { loan_id: id },
            });

            const getBalance = await AccountList.findOne({
              where: {
                account_list_id: account_list,
              },
            });

            const existingBalance = getBalance.bank_amount;
            const newBalance =
              parseFloat(amount_pay) + parseFloat(existingBalance);

            await getBalance.update(
              {
                bank_amount: newBalance,
              },
              {
                where: {
                  account_list_id: account_list,
                },
              }
            );

            if (loanOwe === totalPaid) {
              await getLoan.update({
                status: "Paid",
              });
            } else if (loanOwe > totalPaid) {
              await getLoan.update({
                status: "Incomplete",
              });
            }
          }
        }
      }
    }

    res.status(200).json({ message: "Payments updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchLoan").get(async (req, res) => {
  try {
    // const data = await Loan.findOne({
    //   include: [
    //     {
    //       model: MasterList,
    //       required: true,
    //     },
    //     {
    //       model: AccountList,
    //       required: true,
    //     },
    //     {
    //       model: Liability,
    //       required: true,
    //     },
    //   ],
    //   where: {
    //     loan_id: req.query.id,
    //   },
    // });

    const data = await Loan.findOne({
      where: {
        loan_id: req.query.id,
      },
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: Loan_label_mother,
          required: true,

          include: [
            {
              model: AccountList,
              required: true,
            },
            {
              model: Label,
              required: true,
            },
          ],
        },
      ],
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

router.route("/fetchLoanPayment").get(async (req, res) => {
  try {
    const data = await LoanPayment.findAll({
      include: [
        {
          model: Loan,
          required: true,
        },
        {
          model: AccountList,
          required: true,
        },
      ],
      where: {
        loan_id: req.query.id,
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

router.route("/LoanData").get(async (req, res) => {
  try {
    // const isFetch = await Loan.findAll({
    //   include: [
    //     {
    //       model: MasterList,
    //       required: true,
    //     },
    //     {
    //       model: AccountList,
    //       required: true,
    //     },
    //     {
    //       model: LoanPayment,
    //       required: false,
    //     },
    //   ],
    // });

    // if (isFetch) {
    //   const fetchArray = [];

    //   console.log(isFetch);
    //   isFetch.forEach((data) => {
    //     let totalAmountPay = 0;
    //     const to_pay = data.total;
    //     data.loan_payments.forEach((data1) => {
    //       totalAmountPay += data1.amount_pay;
    //     });

    //     // Push the summary data for this production to the array
    //     // fetchArray.push({
    //     //   production_id: data.production_id,
    //     //   desc: data.desc,
    //     //   createdAt: data.createdAt,
    //     //   weight_in: productionTotalWeightIn,
    //     //   net_weight: productionTotalNetWeight,
    //     //   weight_loss: productionWeightLoss,
    //     //   percent_loss: productionPercentLoss,
    //     // });
    //   });
    // }

    // res.json(isFetch);

    const isMotherFetch = await Loan_label_mother.findAll({
      include: [
        {
          model: Label,
          required: true,
        },
        {
          model: AccountList,
          required: true,
        },
      ],
    });

    if (isMotherFetch) {
      return res.json(isMotherFetch);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/LoanDataInformation").get(async (req, res) => {
  try {
    const { id } = req.query;
    const isFetch = await Loan.findAll({
      include: [
        {
          model: MasterList,
          required: true,
        },
        {
          model: LoanPayment,
          required: false,
        },
        {
          model: Loan_label_mother,
          required: true,
          include: [
            {
              model: Label,
              required: true,
            },
            {
              model: AccountList,
              required: true,
            },
          ],
        },
      ],

      where: {
        loan_label_mother_id: id,
      },
    });

    if (isFetch) {
      const fetchArray = [];

      // console.log(isFetch);
      isFetch.forEach((data) => {
        let totalAmountPay = 0;
        const to_pay = data.total;
        data.loan_payments.forEach((data1) => {
          totalAmountPay += data1.amount_pay;
        });

        // Push the summary data for this production to the array
        // fetchArray.push({
        //   production_id: data.production_id,
        //   desc: data.desc,
        //   createdAt: data.createdAt,
        //   weight_in: productionTotalWeightIn,
        //   net_weight: productionTotalNetWeight,
        //   weight_loss: productionWeightLoss,
        //   percent_loss: productionPercentLoss,
        // });
      });
    }

    res.json(isFetch);
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
    const lastPayCode = await Loan.findOne({
      where: {
        reference: {
          [Op.like]: `LO-${currentMonth}%`,
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
        newRefCode = `LO-${currentMonth}-${newSequence}`;
      } else {
        newRefCode = `LO-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `LO-${currentMonth}-00001`;
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

router.route("/getLiabilityAccount").get(async (req, res) => {
  try {
    const data = await Liability.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});
module.exports = router;
