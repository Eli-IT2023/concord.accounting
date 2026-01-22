const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  Payable,
  Payable_Product,
  Warehouse,
  Vendors,
  Payable_Fees,
  ProductList,
  Product_Tag_Vendor,
  MasterList,
} = require("../db/models/associations");
const emailConfig = require("../db/config/mailer.config");
const nodemailer = require("nodemailer");

router.post("/verifyEmail", async (req, res) => {
  try {
    const { email } = req.body;
    const isVerify = await MasterList.findOne({
      where: {
        email: email,
      },
    });
    if (isVerify) {
      return res.status(200).json();
    } else {
      return res.status(201).json();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/sentOtp", async (req, res) => {
  try {
    const { code, toSendEmail } = req.body;

    console.log(req.body);

    const email = emailConfig.email;
    const password = emailConfig.password;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });

    const mailOptions = {
      from: email,
      to: toSendEmail,
      subject: "Verification Code",
      text: `Your OTP code is ${code}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        res.status(500).send({ message: "Failed to send email", error });
      } else {
        console.log("Email Sent:", info.response);
        res.status(200).send({ message: "Email sent successfully", info });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/changePassword").post(async (req, res) => {
  const { password, email } = req.body;

  const isUpdate = await MasterList.update(
    {
      password: password,
    },
    {
      where: {
        email: email,
      },
    }
  );

  if (isUpdate) {
    return res.status(200).json();
  } else {
    return res.status(500).json();
  }
});

module.exports = router;
