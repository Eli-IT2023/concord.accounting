const express = require("express");
const { where, Op } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Vendors,
  Activity_Log,
  PurchaseRequest,
  PurchaseRequestOrderItem,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

module.exports = router;
