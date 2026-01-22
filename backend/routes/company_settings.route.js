const express = require("express");
const { Op, Sequelize, col, literal } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Vendors,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Activity_Log,
  PurchaseRequest,
  PurchaseRequestOrderItem,
  TaxSettings,
  PurchaseOrder,
  PurchaseOrderVendorProduct,
  Receiving,
  Packaging,
  ReceivingHistory,
  ReceivingProductOrder,
  CompanySettings,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");
const moment = require("moment");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// fetch setting
router.route("/getSettings").get(async (req, res) => {
  try {
    const getCompanySettings = await CompanySettings.findOne({
      where: {
        id: "11111111-1111-1111-1111-111111111111",
        isDeleted: 0,
        status: "Active",
      },
    });

    if (!getCompanySettings) {
      return res.status(404).json({
        success: false,
        message: "Company settings not found",
      });
    }

    // Convert logo BLOB to base64 if it exists
    let settingsData = getCompanySettings.toJSON();

    if (settingsData.company_logo) {
      const base64Logo = settingsData.company_logo.toString("base64");
      const mimeType = "image/png"; // Adjust based on your image format
      settingsData.company_logo = `data:${mimeType};base64,${base64Logo}`;
    }

    return res.status(200).json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
