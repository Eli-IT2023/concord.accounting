const express = require("express");
const { where, Op } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Vendors,
  ProductTagCustomer,
  Customer,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/fetchProductVendor").get(async (req, res) => {
  try {
    console.log(req.query.id);
    const data = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: Vendors,
          required: true,
        },
      ],
      where: {
        product_id: req.query.id,
        status: "Active",
      },
    });

    if (data) {
      return res.json(data);
    } else {
      res.status(400);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/fetchProductCustomer").get(async (req, res) => {
  try {
    console.log(req.query.id);
    const data = await ProductTagCustomer.findAll({
      include: [
        {
          model: Customer,
          as: "ptc_customer_id",
          required: true,
        },
      ],
      where: {
        product_id: req.query.id,
        status: "Active",
      },
    });

    if (data) {
      return res.json(data);
    } else {
      res.status(400);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
