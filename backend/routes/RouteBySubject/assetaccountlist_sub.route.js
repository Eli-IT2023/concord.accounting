const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../../db/config/sequelize.config");

const session = require("express-session");

const {
  assetaccountlist_base_subject,
  assetaccountlist_sub3,
  assetaccountlist_transaction_subject,
  issued_check,
} = require("../../db/models/ModelsBySubject/associations_sub");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//used in assetaccount-list1.jsx
//used in assetaccount-list2.jsx
router.route("/getSubject").get(async (req, res) => {
  try {
    const subjects = await assetaccountlist_base_subject.findAll();
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json();
  }
});
router.route("/getSubject").get(async (req, res) => {
  try {
    const subjects = await assetaccountlist_base_subject.findAll();
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json();
  }
});

//used in assetaccount-list1.jsx
router.route("/addSubject").post(async (req, res) => {
  const { subject } = req.body;
  try {
    console.log("*********add****************" + subject);
    const subjectExists = await assetaccountlist_base_subject.findOne({
      where: { subject_name: subject },
    });
    if (subjectExists) {
      return res.status(201).json();
    }

    const newSubject = await assetaccountlist_base_subject.create({
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

router.route("/updateSubject/:param_id").put(async (req, res) => {
  try {
    const id = req.params.param_id;
    let { subject2name, subjectType } = req.body;

    const existingData = await assetaccountlist_base_subject.findOne({
      where: {
        subject_name: subject2name,
        id: { [Op.ne]: id },
      },
    });

    if (existingData) {
      return res.status(202).send("Exist");
    }

    const data = await assetaccountlist_base_subject.update(
      {
        subject_name: subject2name,
      },
      {
        where: { id: id },
      }
    );
    res.status(200).json({ message: "Data updated successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

//used in assetaccount-list1.jsx
router.route("/addSubject3").post(async (req, res) => {
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
        return await assetaccountlist_sub3.findOne({
          where: {
            account_name: subject3.account,
            assetaccount_list_base_sub_id: subject3.subjectId,
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
        return await assetaccountlist_sub3.create({
          assetaccount_list_base_sub_id: subject3.subjectId,
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

//used in assetaccount-lis1.jsx
router.route("/getSubject3").get(async (req, res) => {
  const { subjectId } = req.query;
  try {
    const subject3List = await assetaccountlist_sub3.findAll({
      where: { assetaccount_list_base_sub_id: subjectId },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});
//used in assetaccount-list2.jsx
router.route("/accountName").get(async (req, res) => {
  const { id } = req.query;
  try {
    const accountName = await assetaccountlist_sub3.findOne({
      where: { id: id },
      include: [
        {
          model: assetaccountlist_base_subject,
          attributes: ["subject_name"],
        },
      ],
    });
    res.status(200).json(accountName);
  } catch (error) {
    res.status(500).json();
  }
});

//used in assetaccount-list2.jsx
router.route("/getSubject3ChainDropdown").get(async (req, res) => {
  const { subjectId, id } = req.query;
  try {
    const subject3List = await assetaccountlist_sub3.findAll({
      where: { assetaccount_list_base_sub_id: subjectId, id: { [Op.ne]: id } },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/createTransaction").post(async (req, res) => {
  const { subject1, subject3, paymentMethod, amount, date, checkNo, id, type } =
    req.body;
  try {
    const transaction = await assetaccountlist_transaction_subject.create({
      assetaccount_list_sub3_from: subject3, // kung kanino kukunin (in) o e add ang pera(out)
      payment_method: paymentMethod,
      amount: amount,
      date: date,
      check_or_remarks: checkNo,
      assetaccount_list_sub3_to: id, // account na nag transact
      type: type,
    });

    if (!transaction) {
      return res.status(500).json({ message: "Failed to create transaction" });
    }

    const updatePromises = [];

    if (paymentMethod === "Bank" && checkNo !== "") {
      updatePromises.push(
        issued_check.create({
          assetaccount_list_id_issued_from: subject3, // kung kanino kukunin (in) o e add ang pera(out)
          assetaccount_list_id_issued_to: id, // account na nag transact
          amount: amount,
          transaction_number: "to confirm if meron parin",
          module_from: "Asset Account List",
          transaction_date: date,
          check_number: checkNo,
          description: "Transfer",
          status: "Pending",
        })
      );
    }

    const updateId = type === "Credit" ? id : subject3;
    updatePromises.push(
      assetaccountlist_sub3.increment("amount", {
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

module.exports = router;
