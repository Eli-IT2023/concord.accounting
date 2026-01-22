const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Payable,
  Payable_Product,
  Warehouse,
  Vendors,
  Payable_Fees,
  ProductList,
  Product_Tag_Vendor,
  StockManagement,
  PayableBulk,
  Payable_Payment,

  Cutoff,
  Inventory_Report,
  Currency,
  Payable_Bulk_Transaction,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  currency_sub,
  bank_transaction,
  CashFlow,
  issued_check,
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

//USED MODULE:
// Payable
// console.log("HEHE");
router.route("/fetch").get(async (req, res) => {
  const { id } = req.query;
  // console.log("Starting fetch request with ID:", id);
  try {
    const isFetch = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
            },
          ],
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Payable_Fees,
          required: false,
        },
        {
          model: Currency,
          required: false,
        },
      ],
      where: {
        id: id,
      },
      order: [["createdAt", "DESC"]],
      logging: true,
    });

    // New variable to hold discount type
    let payableDiscountType;

    // Check if isPercent_Discount is true
    if (isFetch.length > 0 && isFetch[0].isPercent_Discount) {
      payableDiscountType = "percent"; // or any other value you want to assign
    }

    console.log("Query completed");
    console.log("Number of records found:", isFetch.length);
    console.log("Raw Payable Data:", JSON.stringify(isFetch, null, 2));

    res.json({ isFetch, payableDiscountType }); // Include the new variable in the response
  } catch (error) {
    console.error("Error in fetch route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/payableProduct").get(async (req, res) => {
  const { id } = req.query;
  // console.log("Fetching payable products for ID:", id);
  try {
    const payableProducts = await Payable_Product.findAll({
      where: {
        payable_id: id,
      },
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          include: [
            {
              model: ProductList,
              required: true,
            },
          ],
        },
      ],
      // logging: console.log,
      order: [
        ["createdAt", "ASC"],
        ["order_index", "ASC"],
      ],
    });

    // Add weighted calculation to each product
    const productsWithWeighted = payableProducts.map((product) => {
      const plainProduct = product.get({ plain: true });
      plainProduct.weighted =
        plainProduct.weight * (plainProduct.unitPrice || 0) || 0;
      return plainProduct;
    });

    // console.log(
    //   "Query results:",
    //   JSON.stringify(productsWithWeighted, null, 2)
    // );
    res.json(productsWithWeighted);
  } catch (error) {
    console.error("Error fetching payable products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/payableFees").get(async (req, res) => {
  const { id } = req.query;
  console.log("Fetching payable fees for ID:", id);
  try {
    const payableFees = await Payable_Fees.findAll({
      where: {
        payable_id: id,
      },
    });

    // Log the query results
    console.log(
      "Query results for payable fees:",
      JSON.stringify(payableFees, null, 2)
    );

    res.json(payableFees);
  } catch (error) {
    console.error("Error fetching payable fees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
