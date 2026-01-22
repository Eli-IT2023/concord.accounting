const express = require("express");
const { where, Op } = require("sequelize");
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
  CompanyProfile,
} = require("../../db/models/associations");
const sequelize = require("../../db/config/sequelize.config");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/saveCompanyProfile").post(async (req, res) => {
  try {
    const {
      userLoggedID,
      companyName,
      companyAddress,
      contactNumber,
      landline,
      email,
      tin,
      imagePreview, // This is a base64 string from frontend
    } = req.body;

    let logoBuffer = null;

    if (imagePreview && imagePreview.startsWith("data:image/")) {
      const base64Data = imagePreview.replace(/^data:image\/\w+;base64,/, "");
      logoBuffer = Buffer.from(base64Data, "base64");
    }

    const [companyProfile, created] = await CompanyProfile.upsert({
      id: "11111111-1111-1111-1111-111111111111", // Fixed ID used in fetch
      company_name: companyName,
      company_address: companyAddress,
      contact_number: contactNumber,
      landline: landline,
      email: email,
      tin: tin,
      logo: logoBuffer,
    });

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${companyName}'s company profile has been created`,
    });

    return res.status(200).json({
      success: true,
      message: created ? "Created" : "Updated",
    });
  } catch (error) {
    console.error("Error saving company profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.route("/updateCompanyProfile").post(async (req, res) => {
  try {
    const {
      userLoggedID,
      companyName,
      companyAddress,
      contactNumber,
      landline,
      email,
      tin,
      imagePreview, // This is a base64 string from frontend
    } = req.body;

    let logoBuffer = null;

    if (imagePreview && imagePreview.startsWith("data:image/")) {
      const base64Data = imagePreview.replace(/^data:image\/\w+;base64,/, "");
      logoBuffer = Buffer.from(base64Data, "base64");
    }

    const newCompanyProfile = await CompanyProfile.update(
      {
        company_name: companyName,
        company_address: companyAddress,
        contact_number: contactNumber,
        landline: landline,
        email: email,
        tin: tin,
        logo: logoBuffer,
      },
      {
        where: { id: "11111111-1111-1111-1111-111111111111" },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${companyName}'s company profile has been updated`,
    });

    return res.status(200).json({
      success: true,
      data: newCompanyProfile,
    });
  } catch (error) {
    console.error("Error saving company profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.route("/fetchData").get(async (req, res) => {
  try {
    const fetchCompanyProfile = await CompanyProfile.findOne({
      where: {
        id: "11111111-1111-1111-1111-111111111111",
        isDeleted: 0,
      },
    });

    if (!fetchCompanyProfile) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    let companyData = fetchCompanyProfile.toJSON();

    if (companyData.logo) {
      const base64Logo = companyData.logo.toString("base64");
      const mimeType = "image/png"; // Adjust based on your image format
      companyData.logo = `data:${mimeType};base64,${base64Logo}`;
    }

    return res.status(200).json({
      success: true,
      data: companyData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
