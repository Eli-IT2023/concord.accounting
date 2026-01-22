const express = require("express");
const { where, Op } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Vendors,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: data } = await Product_Tag_Vendor.findAndCountAll({
      include: [
        {
          model: Vendors,
          required: true,
          where: {
            isArchive: false,
            status: "Active",
          },
        },
      ],
      where: {
        product_id: req.query.id,
        status: "Active",
      },
      limit,
      offset,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// Fetch all vendor for validation of duplicate vendor in frontend
router.route("/all-vendor/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const vendors = await Product_Tag_Vendor.findAll({
      attributes: ["vendor_id"],
      include: [
        {
          model: Vendors,
          required: true,
          attributes: ["id"],
          where: {
            isArchive: false,
            status: "Active",
          },
        },
      ],
      where: {
        product_id: id,
        status: "Active",
      },
      raw: true,
    });

    res.status(200).json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
