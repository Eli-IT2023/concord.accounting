const router = require("express").Router();
const { where, Op, Sequelize } = require("sequelize");
const sequelize = require("../../db/config/sequelize.config");
const moment = require("moment-timezone");

const session = require("express-session");

const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  issued_check,
  currency_sub,
  bank_transaction,
  CashFlow,
} = require("../../db/models/ModelsBySubject/associations_sub");
const Activity_Log = require("../../db/models/activity_log.model");
const Currency = require("../../db/models/currency.model");
const AccountListSub3 = require("../../db/models/ModelsBySubject/accountlist_sub3.model");
const TransactionSubject = require("../../db/models/ModelsBySubject/accountlist_transaction_subject.model");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//used in account-list1.jsx
//used in account-list2.jsx
//used in bank-budgeting.jsx
//used in collection.jsx
//used in ReturnEarnings.jsx
router.route("/getSubject").get(async (req, res) => {
  const { account_selected } = req.query;
  try {
    const subjects = await accountlist_base_subject.findAll({
      where: { module_type: account_selected, isDeleted: false },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: false,
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.route("/getSubjectWithSpecificCurrency").get(async (req, res) => {
  const { account_selected, currency_id } = req.query;
  try {
    const accountListSub3WhereClause = {};
    if (currency_id) {
      accountListSub3WhereClause["currency_id"] = currency_id;
    }
    const subjects = await accountlist_base_subject.findAll({
      where: { module_type: account_selected, isDeleted: false },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: true,
          where: accountListSub3WhereClause,
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

//used in account-list1.jsx
router.route("/addSubject").post(async (req, res) => {
  const { subject, subject_type, module_type, userLoggedID } = req.body;
  try {
    const subjectExists = await accountlist_base_subject.findOne({
      where: {
        subject_name: subject,
        module_type: module_type,
        isDeleted: false,
      },
    });
    if (subjectExists) {
      return res.status(201).json();
    }

    const moduleFrom =
      module_type == "Account List"
        ? "Accounting List"
        : module_type == "Liabilities Account"
        ? "Liabilities"
        : module_type == "Owner's Equity Account"
        ? "Owners Equity"
        : module_type;

    const newSubject = await accountlist_base_subject.create({
      subject_name: subject,
      subject_type: subject_type,
      module_type: module_type,
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${moduleFrom}: User created new subject 2 named ${subject}`,
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

router.route("/updateSubject/:param_id").put(async (req, res) => {
  try {
    const id = req.params.param_id;
    let { subject2name, subject2type, userLoggedID, module_type } = req.body;

    console.log("********************************---------" + subject2type);

    const existingData = await accountlist_base_subject.findOne({
      where: {
        subject_name: subject2name,
        id: { [Op.ne]: id },
      },
    });

    if (existingData) {
      return res.status(202).send("Exist");
    }

    const getData = await accountlist_base_subject.findOne({
      where: { id: id },
    });

    const data = await accountlist_base_subject.update(
      {
        subject_name: subject2name,
        subject_type: subject2type,
      },
      {
        where: { id: id },
      }
    );

    const moduleFrom =
      module_type == "Account List"
        ? "Accounting List"
        : module_type == "Liabilities Account"
        ? "Liabilities"
        : module_type == "Owner's Equity Account"
        ? "Owners Equity"
        : module_type;

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${moduleFrom}: Updated new subject 2 information: \n
       Subject Name: ${getData.subject_name} to ${subject2name}, 
       Type: ${getData.subject_type} to ${subject2type}
      `,
    });
    res.status(200).json({ message: "Data updated successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

//used in account-list1.jsx
router.route("/addSubject3").post(async (req, res) => {
  const { subject3List, module_type, userLoggedID } = req.body;

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
        return await accountlist_sub3.findOne({
          where: {
            account_name: subject3.account,
            account_list_base_sub_id: subject3.subjectId,
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

    const moduleFrom =
      module_type == "Account List"
        ? "Accounting List"
        : module_type == "Liabilities Account"
        ? "Liabilities"
        : module_type == "Owner's Equity Account"
        ? "Owners Equity"
        : module_type;

    // Insert only the new subjects
    const createdSubjects = await Promise.all(
      newSubjects.map(async (subject3) => {
        const createdSubject = await accountlist_sub3.create({
          account_list_base_sub_id: subject3.subjectId,
          account_name: subject3.account,
          amount: subject3.amount,
          currency_id: subject3.basedCurrency,
          investment_amount: subject3.amount,
          created_by: userLoggedID,
        });

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `${moduleFrom}: User created a new subject 3 named ${subject3.account}`,
        });

        if (module_type === "Owner's Equity Account") {
          await accountlist_transaction_subject.create({
            account_list_sub3_id_transacted: createdSubject.id,
            payment_method: "--",
            date: new Date(),
            check_or_remarks: "Funding Capital",
            amount: subject3.amount,
            type: "Debit",
            transferred_by: userLoggedID,
          });
        }
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

//used in account-list1.jsx
//used in owners-equity.jsx
router.route("/editSubject3").post(async (req, res) => {
  const { subject3List, module_type, userLoggedID } = req.body;

  try {
    // Filter only the new subjects (isNew: true)
    // const newSubjects = subject3List.filter(
    //   (subject3) => subject3.isNew === false
    // );

    // if (newSubjects.length === 0) {
    //   return res.status(200).json({ message: "No new subjects to add" });
    // }

    // Check if any of the new subjects already exist
    const existingSubjects = await Promise.all(
      subject3List.map(async (subject3) => {
        return await accountlist_sub3.findOne({
          where: {
            id: { [Op.ne]: subject3.subject3Id },
            account_name: subject3.account,
            account_list_base_sub_id: subject3.subjectId,
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

    const moduleFrom =
      module_type == "Account List"
        ? "Accounting List"
        : module_type == "Liabilities Account"
        ? "Liabilities"
        : module_type == "Owner's Equity Account"
        ? "Owners Equity"
        : module_type;

    // Insert only the new subjects
    const createdSubjects = await Promise.all(
      subject3List.map(async (subject3) => {
        const getData = await accountlist_sub3.findOne({
          include: [
            {
              model: Currency,
              attributes: ["currency_name"],
            },
          ],
          where: { id: subject3.subject3Id },
        });

        await accountlist_sub3.update(
          {
            account_list_base_sub_id: subject3.subjectId,
            account_name: subject3.account,
            amount: subject3.amount,
            currency_id: subject3.basedCurrency,
            investment_amount: subject3.amount,
          },
          {
            where: { id: subject3.subject3Id },
          }
        );

        const findCurr = await Currency.findOne({
          where: {
            id: subject3.basedCurrency,
          },
          attributes: ["currency_name"],
        });

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `${moduleFrom}: Updated subject 3 information \n
          Name: ${getData.account_name} to ${subject3.account},
          Currency: ${getData.currency.currency_name} to ${findCurr.currency_name},
          Investment Amount: ${getData.investment_amount} to ${subject3.amount}
          `,
        });

        if (module_type === "Owner's Equity Account") {
          await accountlist_transaction_subject.update(
            {
              amount: subject3.amount,
            },
            {
              where: { account_list_sub3_id_transacted: subject3.subject3Id },
            }
          );
        }
      })
    );

    if (createdSubjects.length === subject3List.length) {
      return res
        .status(200)
        .json({ message: "All subjects updated successfully" });
    } else {
      return res
        .status(500)
        .json({ message: "An error occurred while updating subjects" });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "Subject already exists") {
      return res.status(201).json({ message: "Subject already exists" });
    } else {
      return res.status(500).json({ message: "An error occurred" });
    }
  }
});

//used in account-list1.jsx
router.route("/getSubject3").get(async (req, res) => {
  const { subjectId } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      include: [
        {
          model: currency_sub,
          attributes: ["currency_name", "currency_rate"],
          required: true,
        },
        {
          model: accountlist_transaction_subject,
          as: "transacteds",
          required: false,
          attributes: ["check_or_remarks", "isTransferOnly"],
        },
      ],
      where: { account_list_base_sub_id: subjectId, isDeleted: false },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.route("/getSubject3ForFilter").get(async (req, res) => {
  const { subjectId, searchText } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    let { count, rows: subject3List } = await accountlist_sub3.findAndCountAll({
      include: [
        {
          model: currency_sub,
          attributes: ["currency_name", "currency_rate"],
          required: true,
        },
        {
          model: accountlist_transaction_subject,
          as: "transacteds",
          required: false,
          attributes: ["check_or_remarks", "isTransferOnly"],
        },
      ],
      // subQuery: false,
      order: [["createdAt", "DESC"]],
      distinct: true,
      limit: limit,
      offset: offset,
      where: {
        account_list_base_sub_id: subjectId,
        isDeleted: false,
        account_name: {
          [Op.like]: `%${searchText}%`,
        },
      },
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: subject3List,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.route("/getSubject3OwnerEquity").get(async (req, res) => {
  try {
    const { searchText } = req.query;
    const subject3List = await accountlist_sub3.findAll({
      include: [
        {
          model: currency_sub,
          attributes: ["currency_name", "currency_rate"],
          required: true,
        },
        {
          model: accountlist_transaction_subject,
          as: "transacteds",
          required: false,
          attributes: ["check_or_remarks", "isTransferOnly"],
        },
        {
          model: accountlist_base_subject,
          required: true,
          where: { module_type: "Owner's Equity Account" },
        },
      ],
      where: {
        isDeleted: false,
        account_name: {
          [Op.like]: `%${searchText}%`,
        },
      },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

//used in account-list2.jsx
router.route("/accountName").get(async (req, res) => {
  const { id } = req.query;
  try {
    const accountName = await accountlist_sub3.findOne({
      where: { id: id },
      include: [
        {
          model: accountlist_base_subject,
          attributes: ["subject_name", "subject_type", "module_type"],
        },
        {
          model: currency_sub,
          required: true,
        },
      ],
    });
    res.status(200).json(accountName);
  } catch (error) {
    res.status(500).json();
  }
});

//used in account-list2.jsx
router.route("/getSubject3ChainDropdown").get(async (req, res) => {
  const { subjectId, id } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      include: [
        {
          model: currency_sub,
          required: true,
        },
      ],
      where: { account_list_base_sub_id: subjectId, id: { [Op.ne]: id } },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getSubject3ChainDropdownWithCurrency").get(async (req, res) => {
  const { subjectId, id, selectedCurrency } = req.query;

  console.log("SELEEECTEEDE", selectedCurrency);

  try {
    const subject3List = await accountlist_sub3.findAll({
      include: [
        {
          model: currency_sub,
          required: true,
        },
      ],
      where: {
        account_list_base_sub_id: subjectId,
        id: { [Op.ne]: id },
        currency_id: selectedCurrency,
      },
    });

    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});
router.route("/createTransactionToOtherCurrency").post(async (req, res) => {
  const {
    subject1,
    subject3,
    paymentMethod,
    amountToDeduct,
    amount,
    date,
    checkNo,
    id,
    type,
    module_from,
    userLoggedID,
    currentLocation,
    currentCurrencyAmount,
    originalRate,
    currencyRate,
  } = req.body;
  try {
    const currentDate = moment().tz("Asia/Manila").toDate();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${year}-${month}`;

    const lastPayCode = await accountlist_transaction_subject.findOne({
      where: {
        transaction_number: {
          [Op.like]: `TRANSFER-${currentMonth}%`,
        },
        isTransferOnly: true,
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_number) {
      // console.log(`Last Pay Code: ${lastPayCode.transaction_id}`);
      const latestRefCode = lastPayCode.transaction_number;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `TRANSFER-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `TRANSFER-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `TRANSFER-${currentMonth}-00001`;
    }

    const transaction = await accountlist_transaction_subject.create({
      account_list_sub3_id_transacted: subject3,
      // account_list_sub3_from: type === "Credit" ? id : subject3, // kung kanino kukunin (in) o e add ang pera(out)
      payment_method: paymentMethod,
      amount: amount,
      date: date,
      check_or_remarks: checkNo,
      // account_list_sub3_to: type === "Credit" ? subject3 : id, // account na nag transact
      type: "Debit", // para mag refelct sa transaction as "IN/Debit" sa pinag outan ng "id"
      isTransferOnly: true,
      module_from: module_from,
      transaction_number: "--",
      transferred_by: userLoggedID,
      sub_3_to: id,
    });

    if (paymentMethod === "Cash") {
      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: id,
        payment_method: paymentMethod,
        amount: amountToDeduct,
        date: date,
        check_or_remarks: checkNo,
        type: "Credit",
        isTransferOnly: true,
        module_from: module_from,
        transaction_number: "--",
        transferred_by: userLoggedID,
        sub_3_to: subject3,
      });
    }

    if (!transaction) {
      return res.status(500).json({ message: "Failed to create transaction" });
    }

    const updatePromises = [];

    if (paymentMethod === "Bank" && checkNo !== "") {
      updatePromises.push(
        issued_check.create({
          account_list_id_issued_from: type === "Credit" ? id : subject3,
          account_list_id_issued_to: type === "Credit" ? subject3 : id,
          amount: currentCurrencyAmount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          check_number: checkNo,
          description: "Transfer",
          status: "Pending",
          amount_to_deduct: amountToDeduct,
          rate: currencyRate,
          orig_rate: originalRate,
        }),

        bank_transaction.create({
          account_list_id_bank_from: type === "Credit" ? subject3 : id,
          amount: amount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Confirmed",
        })
      );
    } else if (paymentMethod === "Bank" && checkNo === "") {
      updatePromises.push(
        bank_transaction.create({
          account_list_id_bank_from: type === "Credit" ? id : subject3,
          account_list_id_bank_to: type === "Credit" ? subject3 : id,
          amount: currentCurrencyAmount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Pending",
          amount_to_deduct: amountToDeduct,
          rate: currencyRate,
          orig_rate: originalRate,
        }),

        bank_transaction.create({
          account_list_id_bank_from: type === "Credit" ? subject3 : id,
          amount: amount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Confirmed",
        })
      );
    } else if (paymentMethod === "Cash") {
      updatePromises.push(
        CashFlow.create({
          account_list_id_cash_from: type === "Credit" ? id : subject3,
          account_list_id_cash_to: type === "Credit" ? subject3 : id,
          amount: amount,
          check_number: checkNo,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Transfered",
        }),

        CashFlow.create({
          account_list_id_cash_from: type === "Credit" ? subject3 : id,
          amount: amount,
          check_number: checkNo,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Transfered",
        })
      );
    } else {
      return res.status(500).json({ message: "Payment method not supported" });
    }

    const updateId = type === "Credit" ? subject3 : id;
    updatePromises.push(
      accountlist_sub3.increment("amount", {
        by: parseFloat(amount),
        where: { id: updateId },
      })
    );

    //Old Code
    // const updateId2 = type === "Credit" ? id : subject3;
    // updatePromises.push(
    //   accountlist_sub3.decrement("amount", {
    //     by: parseFloat(amountToDeduct),
    //     where: { id: updateId2 },
    //   })
    // );

    if (paymentMethod === "Cash") {
      const updateId2 = type === "Credit" ? id : subject3;
      updatePromises.push(
        accountlist_sub3.decrement("amount", {
          by: parseFloat(amountToDeduct),
          where: { id: updateId2 },
        })
      );
    }

    await Promise.all(updatePromises);

    const getData = await AccountListSub3.findOne({
      attributes: ["account_name"],
      where: {
        id: id,
      },
    });
    const getDataTo = await AccountListSub3.findOne({
      attributes: ["account_name"],
      where: {
        id: subject3,
      },
    });

    const withCheckNo = paymentMethod === "Bank" && checkNo !== "";

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${currentLocation}: User transferred a money with an amount of ${amount} through ${paymentMethod} ${
        withCheckNo ? `with a check number of ${checkNo}` : ``
      }from ${getData.account_name} to ${getDataTo.account_name}`,
    });

    res.status(200).json({ message: "Transaction created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});

router.route("/createTransaction").post(async (req, res) => {
  const {
    subject1,
    subject3,
    paymentMethod,
    amount,
    date,
    checkNo,
    id,
    type,
    module_from,
    userLoggedID,
    currentLocation,
  } = req.body;
  try {
    const currentDate = moment().tz("Asia/Manila").toDate();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${year}-${month}`;

    const lastPayCode = await accountlist_transaction_subject.findOne({
      where: {
        transaction_number: {
          [Op.like]: `TRANSFER-${currentMonth}%`,
        },
        isTransferOnly: true,
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_number) {
      // console.log(`Last Pay Code: ${lastPayCode.transaction_id}`);
      const latestRefCode = lastPayCode.transaction_number;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `TRANSFER-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `TRANSFER-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `TRANSFER-${currentMonth}-00001`;
    }

    if (type === "Debit") {
      const transaction = await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: id,
        // account_list_sub3_from: type === "Credit" ? id : subject3, // kung kanino kukunin (in) o e add ang pera(out)
        payment_method: paymentMethod,
        amount: amount,
        date: date,
        check_or_remarks: checkNo,
        // account_list_sub3_to: type === "Credit" ? subject3 : id, // account na nag transact
        type: type,
        module_from: module_from,
        transaction_number: "--",
        transferred_by: userLoggedID,
      });

      if (paymentMethod === "Cash") {
        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: subject3,
          payment_method: paymentMethod,
          amount: amount,
          date: date,
          check_or_remarks: checkNo,
          type: "Credit",
          module_from: module_from,
          transaction_number: "--",
          transferred_by: userLoggedID,
          sub_3_to: subject1,
        });
      }

      if (!transaction) {
        return res
          .status(500)
          .json({ message: "Failed to create transaction" });
      }
    } else {
      const transaction = await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: subject3,
        // account_list_sub3_from: type === "Credit" ? id : subject3, // kung kanino kukunin (in) o e add ang pera(out)
        payment_method: paymentMethod,
        amount: amount,
        date: date,
        check_or_remarks: checkNo,
        // account_list_sub3_to: type === "Credit" ? subject3 : id, // account na nag transact
        type: "Debit", // para mag refelct sa transaction as "IN/Debit" sa pinag outan ng "id"
        isTransferOnly: true,
        module_from: module_from,
        transaction_number: newRefCode,
        transferred_by: userLoggedID,
        sub_3_to: id,
      });

      if (paymentMethod === "Cash") {
        await accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: id,
          payment_method: paymentMethod,
          amount: amount,
          date: date,
          check_or_remarks: checkNo,
          type: "Credit",
          isTransferOnly: true,
          module_from: module_from,
          transaction_number: newRefCode,
          transferred_by: userLoggedID,
          sub_3_to: subject3,
        });
      }

      if (!transaction) {
        return res
          .status(500)
          .json({ message: "Failed to create transaction" });
      }
    }

    const updatePromises = [];

    if (paymentMethod === "Bank" && checkNo !== "") {
      updatePromises.push(
        issued_check.create({
          account_list_id_issued_from: type === "Credit" ? id : subject3,
          account_list_id_issued_to: type === "Credit" ? subject3 : id,
          amount: amount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          check_number: checkNo,
          description: "Transfer",
          status: "Pending",
        }),

        bank_transaction.create({
          account_list_id_bank_from: type === "Credit" ? subject3 : id,
          amount: amount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Confirmed",
        })
      );
    } else if (paymentMethod === "Bank" && checkNo === "") {
      updatePromises.push(
        bank_transaction.create({
          account_list_id_bank_from: type === "Credit" ? id : subject3,
          account_list_id_bank_to: type === "Credit" ? subject3 : id,
          amount: amount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Pending",
        }),

        bank_transaction.create({
          account_list_id_bank_from: type === "Credit" ? subject3 : id,
          amount: amount,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Confirmed",
        })
      );
    } else if (paymentMethod === "Cash") {
      updatePromises.push(
        CashFlow.create({
          account_list_id_cash_from: type === "Credit" ? id : subject3,
          account_list_id_cash_to: type === "Credit" ? subject3 : id,
          amount: amount,
          check_number: checkNo,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Transfered",
        }),

        CashFlow.create({
          account_list_id_cash_from: type === "Credit" ? subject3 : id,
          amount: amount,
          check_number: checkNo,
          transaction_number: newRefCode,
          module_from: module_from,
          transaction_date: date,
          description: "Transfer",
          status: "Transfered",
        })
      );
    } else {
      return res.status(500).json({ message: "Payment method not supported" });
    }

    const updateId = type === "Credit" ? subject3 : id;
    updatePromises.push(
      accountlist_sub3.increment("amount", {
        by: parseFloat(amount),
        where: { id: updateId },
      })
    );

    if (paymentMethod === "Cash") {
      const updateId2 = type === "Credit" ? id : subject3;
      updatePromises.push(
        accountlist_sub3.decrement("amount", {
          by: parseFloat(amount),
          where: { id: updateId2 },
        })
      );
    }

    await Promise.all(updatePromises);

    const getData = await AccountListSub3.findOne({
      attributes: ["account_name"],
      where: {
        id: id,
      },
    });
    const getDataTo = await AccountListSub3.findOne({
      attributes: ["account_name"],
      where: {
        id: subject3,
      },
    });

    const withCheckNo = paymentMethod === "Bank" && checkNo !== "";

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${currentLocation}: User transferred a money with an amount of ${amount} through ${paymentMethod} ${
        withCheckNo ? `with a check number of ${checkNo}` : ``
      }from ${getData.account_name} to ${getDataTo.account_name}`,
    });

    res.status(200).json({ message: "Transaction created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});

router.route("/getTransaction").get(async (req, res) => {
  const { id } = req.query;
  try {
    const transactions = await accountlist_transaction_subject.findAll({
      where: { account_list_sub3_id_transacted: id, isDeleted: false },
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: accountlist_sub3,
          required: false,
          as: "sub3_tos",
          foreignKey: "sub_3_to",
        },
      ],
    });

    const formattedTransactions = [];
    let currentDate = null;
    let currentRow = null;

    transactions.forEach((transaction) => {
      if (transaction.date !== currentDate) {
        // New date, start a new row
        if (currentRow) formattedTransactions.push(currentRow);
        currentDate = transaction.date;
        currentRow = { date: currentDate, debit: null, credit: null };
      }

      if (transaction.type === "Debit") {
        if (currentRow.debit === null) {
          currentRow.debit = transaction;
        } else {
          // Debit slot is filled, push current row and start a new one
          formattedTransactions.push(currentRow);
          currentRow = { date: currentDate, debit: transaction, credit: null };
        }
      } else {
        // Credit
        if (currentRow.credit === null) {
          currentRow.credit = transaction;
        } else {
          // Credit slot is filled, push current row and start a new one
          formattedTransactions.push(currentRow);
          currentRow = { date: currentDate, debit: null, credit: transaction };
        }
      }
    });

    // Push the last row if it's not empty
    if (currentRow && (currentRow.debit || currentRow.credit)) {
      formattedTransactions.push(currentRow);
    }

    // Re arrange transaction
    const newTransaction = [];
    for (const item of formattedTransactions) {
      if (item.credit && item.debit) {
        const credit = {
          credit: item.credit,
          date: item.date,
          debit: null,
        };

        const debit = {
          credit: null,
          date: item.date,
          debit: item.debit,
        };

        const separateCreditDebit = [credit, debit];

        newTransaction.push(...separateCreditDebit);
      } else {
        newTransaction.push(item);
      }
    }

    const sortedTransaction = newTransaction.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    // Calculate Balance
    for (let index = sortedTransaction.length - 1; index >= 0; index--) {
      const currentIndex = sortedTransaction[index];
      const previousIndex = sortedTransaction[index + 1];
      if (index === sortedTransaction.length - 1) {
        // Set initial value for balance
        currentIndex.balance =
          currentIndex.credit !== null
            ? currentIndex.credit.amount
            : currentIndex.debit.amount;
      } else {
        // Set new Balance:
        // if the current transaction is credit subtract the amount from previous balance
        // if the current transaction is debit add the amount from previous balance
        currentIndex.balance =
          currentIndex.credit !== null
            ? previousIndex.balance - currentIndex.credit.amount
            : previousIndex.balance + currentIndex.debit.amount;
      }
    }

    res.status(200).json(newTransaction);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching transactions" });
  }
});

router.route("/getBalance").get(async (req, res) => {
  const { id } = req.query;
  try {
    const data = await accountlist_transaction_subject.findAll({
      where: [
        {
          account_list_sub3_id_transacted: id,
        },
      ],
    });

    // Calculate the overall sum amount
    const totalAmount = data.reduce((sum, transaction) => {
      return (
        sum +
        (transaction.type === "Debit"
          ? transaction.amount
          : -transaction.amount)
      );
    }, 0);

    if (data) {
      return res.json({
        data,
        totalAmount,
      });
    } else {
      res.status(400);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/addOtherIncome").post(async (req, res) => {
  const { dateOtherIncome, descriptionOtherIncome, amountOtherIncome, id } =
    req.body;

  try {
    const addIncome = accountlist_sub3.increment("amount", {
      by: parseFloat(amountOtherIncome),
      where: { id: id },
    });

    if (addIncome) {
      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: id,
        payment_method: "--",
        date: dateOtherIncome,
        check_or_remarks: descriptionOtherIncome,
        amount: amountOtherIncome,
        type: "Debit",
      });

      res.status(200).json({ message: "Other income added successfully" });
    } else {
      res.status(500).json({ message: "Failed to add other income" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.route("/getSubjectToPay").get(async (req, res) => {
  const { account_selected, currency_id, selectedPayment } = req.query;
  try {
    const accountListSub3WhereClause = {};
    if (currency_id) {
      accountListSub3WhereClause["currency_id"] = currency_id;
    }
    const subjects = await accountlist_base_subject.findAll({
      where: { module_type: account_selected, subject_type: selectedPayment },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: true,
          where: accountListSub3WhereClause,
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
});

router.route("/createTransactionLiability").post(async (req, res) => {
  const {
    subject1,
    subject3,
    paymentMethod,
    amount,
    date,
    checkNo,
    id,
    module_from,
    userLoggedID,
    currentLocation,
  } = req.body;
  try {
    // const transaction = await accountlist_transaction_subject.create({
    //   account_list_sub3_id_transacted: subject3,
    //   // account_list_sub3_from: type === "Credit" ? id : subject3, // kung kanino kukunin (in) o e add ang pera(out)
    //   payment_method: paymentMethod,
    //   amount: amount,
    //   date: date,
    //   check_or_remarks: checkNo,
    //   // account_list_sub3_to: type === "Credit" ? subject3 : id, // account na nag transact
    //   type: "--", // para mag refelct sa transaction as "IN/Debit" sa pinag outan ng "id"
    //   isTransferOnly: true,
    //   module_from: module_from,
    //   transaction_number: "--",
    //   transferred_by: userLoggedID,
    //   sub_3_to: id,
    // });

    if (paymentMethod === "Cash") {
      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: id,
        payment_method: paymentMethod,
        amount: amount,
        date: date,
        check_or_remarks: checkNo,
        type: "--",
        isTransferOnly: true,
        module_from: module_from,
        transaction_number: "--",
        transferred_by: userLoggedID,
        sub_3_to: subject3,
      });

      await accountlist_transaction_subject.create({
        account_list_sub3_id_transacted: subject3,
        payment_method: paymentMethod,
        amount: amount,
        date: date,
        check_or_remarks: checkNo,
        type: "--",
        isTransferOnly: true,
        module_from: module_from,
        transaction_number: "--",
        transferred_by: userLoggedID,
        sub_3_to: id,
      });
    }

    // if (!transaction) {
    //   return res.status(500).json({ message: "Failed to create transaction" });
    // }
    const updatePromises = [];

    if (paymentMethod === "Bank" && checkNo !== "") {
      updatePromises.push(
        issued_check.create({
          account_list_id_issued_from: subject3,
          account_list_id_issued_to: id,
          amount: amount,
          transaction_number: "--",
          module_from: module_from,
          transaction_date: date,
          check_number: checkNo,
          description: "Pay",
          status: "Pending",
        })
      );
    } else if (paymentMethod === "Bank" && checkNo === "") {
      updatePromises.push(
        bank_transaction.create({
          account_list_id_bank_from: subject3,
          account_list_id_bank_to: id,
          amount: amount,
          transaction_number: "--",
          module_from: module_from,
          transaction_date: date,
          description: "Pay",
          status: "Pending",
        })
      );
    } else if (paymentMethod === "Cash") {
      updatePromises.push(
        CashFlow.create({
          account_list_id_cash_from: subject3,
          account_list_id_cash_to: id,
          amount: amount,
          check_number: checkNo,
          transaction_number: "--",
          module_from: module_from,
          transaction_date: date,
          description: "--",
          status: "Paid",
        })
      );
    } else {
      return res.status(500).json({ message: "Payment method not supported" });
    }

    const updateId = subject3;
    // updatePromises.push(
    //   accountlist_sub3.decrement("amount", {
    //     by: parseFloat(amount),
    //     where: { id: updateId },
    //   })
    // );

    if (paymentMethod === "Cash") {
      const updateId2 = id;
      updatePromises.push(
        accountlist_sub3.decrement("amount", {
          by: parseFloat(amount),
          where: { id: updateId2 },
        })
      );
    }

    await Promise.all(updatePromises);

    const getData = await AccountListSub3.findOne({
      attributes: ["account_name"],
      where: {
        id: id,
      },
    });
    const getDataTo = await AccountListSub3.findOne({
      attributes: ["account_name"],
      where: {
        id: subject3,
      },
    });

    const withCheckNo = paymentMethod === "Bank" && checkNo !== "";

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${currentLocation}: User transferred a money with an amount of ${amount} through ${paymentMethod} ${
        withCheckNo ? `with a check number of ${checkNo}` : ``
      }from ${getData.account_name} to ${getDataTo.account_name}`,
    });

    res.status(200).json({ message: "Transaction created successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});

router.route("/deleteSubject2/:id").delete(async (req, res) => {
  const { userLoggedID } = req.body;
  const { id } = req.params;
  try {
    const exists = await accountlist_sub3.findOne({
      where: {
        account_list_base_sub_id: id,
        isDeleted: false,
      },
    });

    if (exists) {
      console.log("Exists");
      return res.status(202).send({});
    }

    const findSub2 = await accountlist_base_subject.findOne({
      where: {
        id: id,
      },
    });

    await findSub2.update({
      isDeleted: true,
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Accounting List: User deleted a subject 2 named ${findSub2.subject_name}`,
    });

    res.status(200).send({});
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});

router.route("/deleteSubject3/:id").delete(async (req, res) => {
  const { userLoggedID } = req.body;
  const { id } = req.params;

  try {
    const exists = await TransactionSubject.findOne({
      where: {
        [Op.or]: [{ account_list_sub3_id_transacted: id }, { sub_3_to: id }],
      },
    });

    if (exists) {
      return res.status(202).send({});
    }

    const findSub3 = await accountlist_sub3.findOne({
      where: {
        id: id,
      },
    });

    await findSub3.update({
      isDeleted: true,
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Accounting List: User deleted a subject 3 named ${findSub3.account_name}`,
    });

    res.status(200).send({});
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "An error occurred while processing the transaction" });
  }
});
module.exports = router;
