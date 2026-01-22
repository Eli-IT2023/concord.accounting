const express = require("express");
const { Op, Sequelize, col, literal, where } = require("sequelize");
const router = express.Router();

const {
  Activity_Log,
  Mixer,
  SalesInvoice,
  Customer,
  SalesInvoiceTagProduct,
  ProductList,
  Packaging,
  Formulation,
  FormulationProductUsed,
  Vendors,
  Product_Tag_Vendor,
  StockManagement,
  BatchEntry,
  BatchEntryTaggedMixer,
  BatchEntryTaggedInvoice,
  BatchEntryFormulatedProduct,
  BatchEntryFormulatedMaterialUsed,
  BatchEntryFormulatedReplacedMaterial,
  BatchEntryCostList,
  MasterList,
  BatchEntryReprint,
  PostProduction,
  BatchEntryStockManagementHistory,
  ConcordNotification,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment");
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// fetch mixer
router.route("/fetchMixerData").get(async (req, res) => {
  try {
    const data = await Mixer.findAll({
      where: {
        status: "Active",
      },
      order: [["name", "ASC"]],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching mixer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch delivery receipt
// router.route("/fetchDeliveryReceiptData").get(async (req, res) => {
//   try {
//     // First get all sales_invoice_ids that already exist in BatchEntry
//     const usedInvoiceIds = await BatchEntryTaggedInvoice.findAll({
//       attributes: ["sales_invoice_id"],
//       where: {
//         sales_invoice_id: {
//           [Op.not]: null, // Only where sales_invoice_id is not null
//         },
//       },
//       raw: true,
//     });

//     // Extract just the IDs into an array
//     const excludedIds = usedInvoiceIds.map((item) => item.sales_invoice_id);

//     // Build the where clause
//     const whereClause = {
//       isDeleted: 0,
//       isAdded: 0,
//       sales_invoice_id: {
//         [Op.notIn]: excludedIds, // Exclude invoices already in BatchEntry
//       },
//     };

//     // // Add search filters if they exist in query params
//     // if (req.query.materialSearchText) {
//     //   whereClause[Op.or] = [
//     //     { name: { [Op.like]: `%${req.query.materialSearchText}%` } },
//     //     { code: { [Op.like]: `%${req.query.materialSearchText}%` } },
//     //   ];
//     // }

//     const data = await SalesInvoice.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Customer,
//           required: true,
//         },
//       ],
//     });

//     // console.log("this is the data", data);

//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("Error fetching filtered materials:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// });

router.route("/fetchDeliveryReceiptData").get(async (req, res) => {
  try {
    //  Fetch all BatchEntryFormulatedProducts with associated SalesInvoiceTagProduct
    const finishedProductsEntried = await BatchEntryFormulatedProduct.findAll({
      attributes: ["sales_product_tag_id"],
      include: [
        {
          model: SalesInvoiceTagProduct,
          attributes: ["sales_invoice_id"],
          as: "befp_sales_product_tag_id",
        },
      ],
    });

    // Build a count of used products per sales_invoice_id
    const usedCountMap = {};
    finishedProductsEntried.forEach((item) => {
      const tag = item.befp_sales_product_tag_id;
      if (tag && tag.sales_invoice_id) {
        const invoiceId = tag.sales_invoice_id;
        usedCountMap[invoiceId] = (usedCountMap[invoiceId] || 0) + 1;
      }
    });

    //  Get ALL sales_invoice_id -> total number of products
    const allTagProducts = await SalesInvoiceTagProduct.findAll({
      attributes: ["sales_invoice_id"],
      where: {
        isDeleted: 0,
      },
    });

    // Build total counts per invoice
    const totalCountMap = {};
    allTagProducts.forEach((item) => {
      const invoiceId = item.sales_invoice_id;
      totalCountMap[invoiceId] = (totalCountMap[invoiceId] || 0) + 1;
    });

    // Filter out invoices where ALL products are used
    const notFullyUsedInvoiceIds = Object.keys(totalCountMap).filter(
      (invoiceId) => {
        const total = totalCountMap[invoiceId];
        const used = usedCountMap[invoiceId] || 0;
        return used < total;
      }
    );

    // Fetch SalesInvoices that still have unused products
    const salesInvoices = await SalesInvoice.findAll({
      where: {
        isDeleted: 0,
        isAdded: 0,
        sales_invoice_id: {
          [Op.in]: notFullyUsedInvoiceIds,
        },
      },
      include: [
        {
          model: Customer,
          required: true,
        },
      ],
    });

    return res.status(200).json(salesInvoices);
  } catch (error) {
    console.error("Error fetching filtered sales invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// chain dropdown query for invoice fetch
router.route("/fetchProductFromDeliveryReceiptData").get(async (req, res) => {
  try {
    const { sales_invoice_ids } = req.query;

    if (!sales_invoice_ids) {
      return res.status(400).json({
        success: false,
        message: "sales_invoice_ids parameter is required",
      });
    }

    const usedFinishedProducts = await BatchEntryFormulatedProduct.findAll({
      attributes: ["sales_product_tag_id"],
    });

    console.log("Used Finished Products:", usedFinishedProducts);

    const usedIdsArray = usedFinishedProducts
      .map((p) => p.sales_product_tag_id)
      .filter(Boolean);

    console.log("Used IDs to exclude:", usedIdsArray);

    const invoiceIds = sales_invoice_ids.split(",");

    // First, get ALL products for the requested invoices
    const allProducts = await SalesInvoiceTagProduct.findAll({
      where: {
        sales_invoice_id: {
          [Op.in]: invoiceIds,
        },
      },
      include: [
        {
          model: ProductList,
          where: {
            product_category: "Finish Product",
          },
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
        {
          model: SalesInvoice,
        },
      ],
      order: [[{ model: SalesInvoice }, "delivery_number", "ASC"]],
    });

    console.log("All products count:", allProducts.length);

    // Group products by invoice to check which invoices have available products
    const productsByInvoice = {};
    allProducts.forEach((product) => {
      const invoiceId = product.sales_invoice_id;
      if (!productsByInvoice[invoiceId]) {
        productsByInvoice[invoiceId] = [];
      }
      productsByInvoice[invoiceId].push(product);
    });

    console.log(
      "Products grouped by invoice:",
      Object.keys(productsByInvoice).length
    );

    // Filter out invoices where ALL products are used
    const availableProducts = allProducts.filter((product) => {
      const invoiceProducts = productsByInvoice[product.sales_invoice_id];

      // Count how many products in this invoice are NOT used
      const availableCount = invoiceProducts.filter(
        (p) => !usedIdsArray.includes(p.id)
      ).length;

      console.log(
        `Invoice ${product.sales_invoice_id}: ${availableCount} available products out of ${invoiceProducts.length}`
      );

      // Only include products from invoices that have at least one available product
      return availableCount > 0;
    });

    // Then filter individual products to exclude used ones
    const finalProducts = availableProducts.filter(
      (product) => !usedIdsArray.includes(product.id)
    );

    console.log("Final filtered results count:", finalProducts.length);

    return res.status(200).json(finalProducts);
  } catch (error) {
    console.error("Error fetching products from delivery receipts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router
  .route("/fetchViewProductFromDeliveryReceiptData")
  .get(async (req, res) => {
    try {
      const { sales_invoice_ids, id } = req.query;

      if (!sales_invoice_ids) {
        return res.status(400).json({
          success: false,
          message: "sales_invoice_ids parameter is required",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id parameter (batch_entry_id) is required",
        });
      }

      // Get the used finished products for this specific batch entry
      const usedFinishedProductsInThisBatchEntry =
        await BatchEntryFormulatedProduct.findAll({
          where: {
            batch_entry_id: id,
          },
          attributes: ["sales_product_tag_id"],
        });

      console.log(
        JSON.stringify(usedFinishedProductsInThisBatchEntry, null, 2),
        "USED FINISH PRODUCTS IN THIS BATCH ENTRY"
      );

      // Extract the used sales_product_tag_ids for this batch
      const usedIdsArray = usedFinishedProductsInThisBatchEntry
        .map((p) => p.sales_product_tag_id)
        .filter(Boolean);

      const invoiceIds = sales_invoice_ids.split(",");

      const fetchSalesTagProduct = await SalesInvoiceTagProduct.findAll({
        where: {
          sales_invoice_id: {
            [Op.in]: invoiceIds,
          },
          id: {
            [Op.in]: usedIdsArray, // Only include products used in this batch
          },
        },
        include: [
          {
            model: ProductList,
            where: {
              product_category: "Finish Product",
            },
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
              },
            ],
          },
          {
            model: SalesInvoice,
          },
        ],
        order: [[{ model: SalesInvoice }, "delivery_number", "ASC"]],
      });

      // Add a flag to indicate which products are used in this batch
      const productsWithUsageFlag = fetchSalesTagProduct.map((product) => {
        const isUsedInThisBatch = usedIdsArray.includes(product.id);
        return {
          ...product.toJSON(),
          is_used_in_current_batch: isUsedInThisBatch,
        };
      });

      return res.status(200).json(productsWithUsageFlag);
    } catch (error) {
      console.error("Error fetching products from delivery receipts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

// invoice list for chain dropdown delivery receipt
router
  .route("/fetchSalesInvoiceFromDeliveryReceiptData")
  .get(async (req, res) => {
    try {
      const { sales_invoice_ids } = req.query;

      // console.log("this is the sales invoice ids", sales_invoice_ids);

      if (!sales_invoice_ids) {
        return res.status(400).json({
          success: false,
          message: "sales_invoice_ids parameter is required",
        });
      }

      const invoiceIds = sales_invoice_ids.split(","); // Remove parseInt here

      // console.log("this is the selected invoice_id", invoiceIds);
      //
      const fetchSalesInvoice = await SalesInvoice.findAll({
        where: {
          sales_invoice_id: {
            [Op.in]: invoiceIds,
          },
        },
        include: [
          {
            model: Customer,
          },
        ],
        order: [["transaction_id", "ASC"]],
      });

      // console.log("the output for sales invoice", fetchSalesInvoice);

      return res.status(200).json(fetchSalesInvoice);
    } catch (error) {
      console.error("Error fetching products from delivery receipts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

// invoice list for chain dropdown formulated/finished product
router.route("/fetchRawProductFromFormulatedProduct").get(async (req, res) => {
  try {
    const { product_ids, sales_product_tag_ids } = req.query;
    if (!product_ids || !sales_product_tag_ids) {
      return res.status(400).json({
        success: false,
        message: "Both product_ids and sales_product_tag_ids are required",
      });
    }
    const fetchFinishedProduct = await Formulation.findOne({
      where: {
        product_id: product_ids,
      },
    });

    // console.log("This is the fetchFinishedProduct", fetchFinishedProduct.id);

    const tableName = StockManagement.getTableName(); // get actual table name

    const fetchRawMaterialProduct = await FormulationProductUsed.findAll({
      where: {
        formulation_id: fetchFinishedProduct.id,
      },
      include: [
        {
          model: ProductList,
          as: "fpu_product_id",
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
          attributes: {
            include: [
              [
                Sequelize.literal(`(
              SELECT GREATEST(COALESCE(SUM(sm.stock), 0), 0)
              FROM ${tableName} sm
              WHERE sm.product_id = fpu_product_id.product_id
            )`),
                "total_stock",
              ],
            ],
          },
        },
        {
          model: Vendors,
          as: "fpu_vendor_id",
        },
        {
          model: Formulation,
          as: "fpu_formulation_id",
          include: [
            {
              model: ProductList,
              as: "f_product_id",
            },
          ],
        },
      ],
    });

    // console.log("this is the fetched used product", fetchRawMaterialProduct);
    return res.status(200).json(fetchRawMaterialProduct);
  } catch (error) {
    console.error("Error fetching products from delivery receipts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// additional material list modal
// vendor product fetch
router.route("/fetchVendorMaterial").get(async (req, res) => {
  try {
    const { formulatedProductId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!formulatedProductId) {
      return res.status(400).json({
        success: false,
        message: "formulatedProductId is required",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    // Initialize
    let formulationMaterials = [];
    let getFormulation = null;

    // console.log(
    //   "vendor this is the formulated product id",
    //   formulatedProductId
    // );

    if (formulatedProductId) {
      getFormulation = await Formulation.findOne({
        where: { product_id: formulatedProductId },
      });

      if (getFormulation) {
        formulationMaterials = await FormulationProductUsed.findAll({
          where: {
            formulation_id: getFormulation.id,
            category: "Vendor Product",
          },
          attributes: [
            "vendor_id",
            "product_id",
            "composition",
            "target_weight",
            "instruction",
            "category",
            "id",
            "instruction",
          ],
        });
      }
    }

    // Collect (vendor_id, product_id) pairs
    const usedPairs = formulationMaterials.map((m) => ({
      vendor_id: m.vendor_id,
      product_id: m.product_id,
    }));

    // console.log("this is the used pairs", usedPairs);

    // Step 2: Fetch vendor materials (Product_Tag_Vendor)
    const { count, rows } = await Product_Tag_Vendor.findAndCountAll({
      where: {
        status: "Active",
        ...(usedPairs.length > 0 && {
          [Op.and]: usedPairs.map((pair) => ({
            [Op.not]: {
              [Op.and]: [
                { vendor_id: pair.vendor_id },
                { product_id: pair.product_id },
              ],
            },
          })),
        }),
      },

      include: [
        {
          model: Vendors,
          attributes: ["id", "company_name"],
        },
        {
          model: ProductList,
          attributes: [
            "product_id",
            "product_name",
            "product_code",
            "client_code",
            "status",
            "product_category",
          ],
          where: {
            product_category: { [Op.in]: ["Raw Materials", "Consumables"] },
            status: "Active",
          },
          include: [
            {
              model: Packaging,
              required: false,
              attributes: ["id", "packaging_name", "unit", "unit_quantity"],
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [[ProductList, "product_code", "ASC"]],
      limit,
      offset,
    });

    // Step 3: Collect product_ids
    const productIds = rows
      .map((item) => item.product_list?.product_id)
      .filter((id) => id);

    // Step 4: Stock summary
    let stockSums = [];
    if (productIds.length > 0) {
      stockSums = await StockManagement.findAll({
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("stock")), "totalStock"],
        ],
        where: { product_id: { [Op.in]: productIds } },
        group: ["product_id"],
      });
    }

    const stockMap = {};
    stockSums.forEach((s) => {
      stockMap[s.product_id] = parseFloat(s.get("totalStock")) || 0;
    });

    // Step 5: Transform
    const transformedData = rows.map((item) => {
      const productData = item.product_list;
      const packagingData = productData?.prod_packaging;

      const formulationMaterial = formulationMaterials.find(
        (fm) =>
          fm.vendor_id === item.vendor_id &&
          fm.product_id === productData?.product_id
      );

      return {
        // productData
        product_id: productData?.product_id || "---",
        product_code: productData?.product_code || "---",
        client_code: productData?.client_code || "---",
        product_name: productData?.product_name || "---",

        // packagingData
        packaging_name: packagingData?.packaging_name || "---",
        packaging_unit: packagingData?.unit || "---",
        packaging_unit_quantity: packagingData?.unit_quantity || 0,

        // formulationMaterial
        composition: formulationMaterial?.composition || 0,
        targetWeight: formulationMaterial?.target_weight || 0,
        instruction: formulationMaterial?.instruction || "",
        formulationUsedId: formulationMaterial?.id || "---",
        category: formulationMaterial?.category || "Vendor Product",

        // ids
        id: item.id,
        productTagVendorId: item.id,
        vendor_id: item.vendor_id,

        company_name: item.vendor?.company_name || "---",
        status: "Active",
        materialCategory: "Vendor Product",
        isSelected: formulationMaterial ? true : false,

        // stock summary
        total_stock: stockMap[productData?.product_id] || 0,
      };
    });

    // console.log("this is the vendor material transformedData", transformedData);

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching products from delivery receipts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// raw product fetch
router.route("/fetchRawMaterial").get(async (req, res) => {
  try {
    const { formulatedProductId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!formulatedProductId) {
      return res.status(400).json({
        success: false,
        message: "formulatedProductId is required",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    // console.log("raw this is the formulated product id", formulatedProductId);

    // --- Step 1: Get formulation and materials ---
    let formulationMaterials = [];
    let getFormulation = null;

    if (formulatedProductId) {
      getFormulation = await Formulation.findOne({
        where: { product_id: formulatedProductId },
      });

      if (getFormulation) {
        formulationMaterials = await FormulationProductUsed.findAll({
          where: {
            formulation_id: getFormulation.id,
            category: "Raw Product",
          },
          attributes: [
            "product_id",
            "composition",
            "target_weight",
            "instruction",
            "category",
            "id",
            "instruction",
          ],
        });
      }
    }

    // --- Step 2: Extract product IDs used in formulation ---
    const usedMaterialIds = formulationMaterials.map((m) => m.product_id);

    // --- Step 3: Fetch product list ---
    const { count, rows } = await ProductList.findAndCountAll({
      where: {
        status: "Active",
        product_category: "Raw Materials",
        ...(usedMaterialIds.length > 0
          ? { product_id: { [Op.notIn]: usedMaterialIds } }
          : {}),
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: false,
          attributes: ["id", "packaging_name", "unit", "unit_quantity"],
        },
      ],
      order: [["product_code", "ASC"]],
      limit,
      offset,
    });

    // --- Step 4: Compute total stock per product ---
    const productIds = rows.map((item) => item.product_id);

    let stockData = [];
    if (productIds.length > 0) {
      stockData = await StockManagement.findAll({
        where: { product_id: { [Op.in]: productIds } },
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
        ],
        group: ["product_id"],
        raw: true,
      });
    }

    // Convert to lookup for faster mapping
    const stockMap = stockData.reduce((acc, s) => {
      acc[s.product_id] = parseFloat(s.total_stock) || 0;
      return acc;
    }, {});

    // --- Step 5: Transform data for frontend ---
    const transformedData = rows.map((item) => {
      const packagingData = item.prod_packaging;

      const formulationMaterial = formulationMaterials.find(
        (fm) => fm.product_id === item.product_id
      );

      return {
        // Product data
        id: item.product_id,
        product_id: item.product_id,
        product_code: item.product_code || "---",
        client_code: item.client_code || "---",
        product_name: item.product_name || "---",

        // Stock
        total_stock: stockMap[item.product_id] || 0,

        // Status & Category
        status: "Active",
        materialCategory: "Raw Product",
        isSelected: usedMaterialIds.includes(item.product_id),

        // Packaging data
        packaging_name: packagingData?.packaging_name || "---",
        packaging_unit: packagingData?.unit || "---",
        packaging_unit_quantity: packagingData?.unit_quantity || 0,

        // Formulation data
        composition: formulationMaterial?.composition || 0,
        targetWeight: formulationMaterial?.target_weight || 0,
        instruction: formulationMaterial?.instruction || "",
        formulationUsedId: formulationMaterial?.id || "---",
        category: formulationMaterial?.category || "Raw Product",

        // Vendor placeholders (not applicable for raw materials)
        company_name: "---",
        vendor_id: null,
        productTagVendorId: null,
      };
    });

    // console.log("this is the raw material transformedData", transformedData);

    // --- Step 6: Return JSON ---
    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// finished product fetch
router.route("/fetchFinishedMaterial").get(async (req, res) => {
  try {
    const { formulatedProductId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!formulatedProductId) {
      return res.status(400).json({
        success: false,
        message: "formulatedProductId is required",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    // console.log(
    //   "finished this is the formulated product id",
    //   formulatedProductId
    // );

    // --- Step 1: Get formulation + materials ---
    let formulationMaterials = [];
    let getFormulation = null;

    if (formulatedProductId) {
      getFormulation = await Formulation.findOne({
        where: { product_id: formulatedProductId },
      });

      if (getFormulation) {
        formulationMaterials = await FormulationProductUsed.findAll({
          where: {
            formulation_id: getFormulation.id,
            category: "Finished Product",
          },
          attributes: [
            "product_id",
            "composition",
            "target_weight",
            "instruction",
            "category",
            "id",
            "instruction",
          ],
        });
      }
    }

    const usedMaterialIds = formulationMaterials.map((m) => m.product_id);

    // --- Step 2: Fetch products ---
    // Create an array of IDs to exclude (both used materials AND the formulated product itself)
    const excludedIds = [...usedMaterialIds, formulatedProductId].filter(
      (id, index, self) => self.indexOf(id) === index
    ); // Remove duplicates

    let { count, rows } = await ProductList.findAndCountAll({
      where: {
        status: "Active",
        product_category: "Finish Product",
        ...(excludedIds.length > 0
          ? { product_id: { [Op.notIn]: excludedIds } } // <-- fetch NOT in excludedIds
          : {}),
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: false,
        },
      ],
      order: [["product_code", "ASC"]],
      limit,
      offset,
    });

    // --- Step 3: Compute total stock per finished product ---
    const productIds = rows.map((item) => item.product_id);

    let stockData = [];
    if (productIds.length > 0) {
      stockData = await StockManagement.findAll({
        where: { product_id: { [Op.in]: productIds } },
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
        ],
        group: ["product_id"],
        raw: true,
      });
    }

    const stockMap = stockData.reduce((acc, s) => {
      acc[s.product_id] = parseFloat(s.total_stock) || 0;
      return acc;
    }, {});

    // --- Step 4: Transform for frontend ---
    const transformedData = rows.map((item) => {
      const packagingData = item.prod_packaging;
      const formulationMaterial = formulationMaterials.find(
        (fm) => fm.product_id === item.product_id
      );

      return {
        id: item.product_id,
        product_id: item.product_id,

        product_code: item.product_code,
        client_code: item.client_code,
        product_name: item.product_name,

        // stock
        total_stock: stockMap[item.product_id] || 0,

        status: "Active",
        materialCategory: "Finished Product",
        isSelected: usedMaterialIds.includes(item.product_id),

        // packagingData
        packaging_name: packagingData?.packaging_name || "---",
        packaging_unit: packagingData?.unit || "---",
        packaging_unit_quantity: packagingData?.unit_quantity || 0,

        // formulationMaterial
        composition: formulationMaterial?.composition || 0,
        targetWeight: formulationMaterial?.target_weight || 0,
        instruction: formulationMaterial?.instruction || "",
        formulationUsedId: formulationMaterial?.id || "---",
        category: formulationMaterial?.category || "Finished Product",

        // no vendor data here
        company_name: "---",
        vendor_id: null,
        productTagVendorId: null,
      };
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching finished materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// change/replace material list modal
// vendor material
router.route("/fetchVendorMaterialReplace").get(async (req, res) => {
  try {
    const { productId, category, vendorId } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    // Fetch vendor materials
    let { count, rows } = await Product_Tag_Vendor.findAndCountAll({
      where: {
        status: "Active",
      },
      include: [
        {
          model: Vendors,
          attributes: ["id", "company_name"],
        },
        {
          model: ProductList,
          attributes: [
            "product_id",
            "product_name",
            "product_code",
            "client_code",
            "status",
            "product_category",
          ],
          where: {
            status: "Active",
          },
          include: [
            {
              model: Packaging,
              required: false,
              attributes: ["id", "packaging_name", "unit", "unit_quantity"],
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [[ProductList, "product_code", "ASC"]],
      limit,
      offset,
    });

    const productIds = rows
      .map((item) => item.product_list?.product_id)
      .filter((id) => id);

    // Stock summary
    let stockSums = [];
    if (productIds.length > 0) {
      stockSums = await StockManagement.findAll({
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("stock")), "totalStock"],
        ],
        where: { product_id: { [Op.in]: productIds } },
        group: ["product_id"],
      });
    }

    const stockMap = {};
    stockSums.forEach((s) => {
      stockMap[s.product_id] = parseFloat(s.get("totalStock")) || 0;
    });

    // Transform data
    const forReplaceData = rows.map((item) => {
      const productList = item.product_list;
      const packagingData = productList.prod_packaging;

      // Check if this is the current material
      const isCurrentMaterial =
        productId === productList?.product_id &&
        vendorId &&
        vendorId == item.vendor_id;

      return {
        id: item.id,
        client_code: item?.vendor_product_code,
        product_id: productList?.product_id,
        product_code: productList?.product_code,
        product_name: productList?.product_name,
        total_stock: stockMap[productList?.product_id] || 0,
        status: "Active",
        category: "Vendor Product",
        isCurrentMaterial: isCurrentMaterial,
        packaging_name: packagingData?.packaging_name || "---",
        packaging_unit: packagingData?.unit || "---",
        packaging_unit_quantity: packagingData?.unit_quantity || 0,
        company_name: item.vendor?.company_name || "---",
        vendor_id: item.vendor_id,
        productTagVendorId: item.id,
      };
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: forReplaceData,
    });
  } catch (error) {
    console.error("Error fetching vendor replacement materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// raw material
router.route("/fetchRawMaterialReplace").get(async (req, res) => {
  try {
    const { productId, category } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    // Fetch raw materials
    let { count, rows } = await ProductList.findAndCountAll({
      where: {
        status: "Active",
        product_category: "Raw Materials",
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: false,
        },
      ],
      order: [["product_code", "ASC"]],
      limit,
      offset,
    });

    // Compute total stock
    const productIds = rows.map((item) => item.product_id);

    let stockData = [];
    if (productIds.length > 0) {
      stockData = await StockManagement.findAll({
        where: { product_id: { [Op.in]: productIds } },
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
        ],
        group: ["product_id"],
        raw: true,
      });
    }

    const stockMap = stockData.reduce((acc, s) => {
      acc[s.product_id] = parseFloat(s.total_stock) || 0;
      return acc;
    }, {});

    // Transform data
    const forReplaceData = rows.map((item) => {
      const packagingData = item.prod_packaging;

      // Check if this is the current material
      const isCurrentMaterial = productId === item.product_id;

      return {
        id: item.product_id,
        product_id: item.product_id,
        product_code: item.product_code,
        client_code: item.client_code,
        product_name: item.product_name,
        total_stock: stockMap[item.product_id] || 0,
        status: "Active",
        category: "Raw Product",
        isCurrentMaterial: isCurrentMaterial,
        packaging_name: packagingData?.packaging_name || "---",
        packaging_unit: packagingData?.unit || "---",
        packaging_unit_quantity: packagingData?.unit_quantity || 0,
        company_name: "---",
        vendor_id: null,
        productTagVendorId: null,
      };
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: forReplaceData,
    });
  } catch (error) {
    console.error("Error fetching raw replacement materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// finished material
router.route("/fetchFinishedMaterialReplace").get(async (req, res) => {
  try {
    const { productId, category } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      });
    }

    // Fetch finished materials
    let { count, rows } = await ProductList.findAndCountAll({
      where: {
        status: "Active",
        product_category: "Finish Product",
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: false,
        },
      ],
      order: [["product_code", "ASC"]],
      limit,
      offset,
    });

    // Compute total stock
    const productIds = rows.map((item) => item.product_id);

    let stockData = [];
    if (productIds.length > 0) {
      stockData = await StockManagement.findAll({
        where: { product_id: { [Op.in]: productIds } },
        attributes: [
          "product_id",
          [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
        ],
        group: ["product_id"],
        raw: true,
      });
    }

    const stockMap = stockData.reduce((acc, s) => {
      acc[s.product_id] = parseFloat(s.total_stock) || 0;
      return acc;
    }, {});

    // Transform data
    const forReplaceData = rows.map((item) => {
      const packagingData = item.prod_packaging;

      // Check if this is the current material
      const isCurrentMaterial = productId === item.product_id;

      return {
        id: item.product_id,
        product_id: item.product_id,
        product_code: item.product_code,
        client_code: item.client_code,
        product_name: item.product_name,
        total_stock: stockMap[item.product_id] || 0,
        status: "Active",
        category: "Finished Product",
        isCurrentMaterial: isCurrentMaterial,
        packaging_name: packagingData?.packaging_name || "---",
        packaging_unit: packagingData?.unit || "---",
        packaging_unit_quantity: packagingData?.unit_quantity || 0,
        company_name: "---",
        vendor_id: null,
        productTagVendorId: null,
      };
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: forReplaceData,
    });
  } catch (error) {
    console.error("Error fetching finished replacement materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// create batch entry
router.route("/create").post(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const formData = req.body;

    // Generate unique batch_number
    const randomNum = Math.floor(100 + Math.random() * 900);
    const now = new Date();
    const batchNumber = `BATCH-${now
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14)}${randomNum}`;

    // --- CREATE MAIN BATCH ENTRY ---
    const newBatch = await BatchEntry.create(
      {
        transaction_id: batchNumber,
        batch_title: formData.batchTitle,
        remarks: formData.batchRemarks,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        createdBy: formData.createdBy,
        status: "For-Printing",
        team_leader: formData.teamLeader || null,
        members: formData.members || null,
      },
      { transaction: t }
    );

    // --- TAG MIXERS ---
    if (formData.mixers?.length > 0) {
      const mixerRows = formData.mixers.map((mixerId) => ({
        batch_entry_id: newBatch.id,
        mixer_id: mixerId,
      }));
      await BatchEntryTaggedMixer.bulkCreate(mixerRows, { transaction: t });
    }

    // --- TAG INVOICES ---
    if (formData.deliveryReceipts?.length > 0) {
      const invoiceRows = formData.deliveryReceipts.map((id) => ({
        batch_entry_id: newBatch.id,
        sales_invoice_id: id,
      }));
      await BatchEntryTaggedInvoice.bulkCreate(invoiceRows, { transaction: t });
    }

    // --- FORMULATED PRODUCTS ---
    let formulatedProductsMap = {};
    if (formData.formulatedProductsData?.length > 0) {
      const sipRows = await SalesInvoiceTagProduct.findAll({
        where: {
          id: formData.formulatedProductsData.map(
            (fp) => fp.sales_product_tag_id
          ),
        },
        attributes: ["id", "quantity"],
        transaction: t,
      });

      const sipMap = {};
      sipRows.forEach((r) => (sipMap[r.id] = r.quantity));

      const fpRows = formData.formulatedProductsData.map((fp) => ({
        batch_entry_id: newBatch.id,
        sales_product_tag_id: fp.sales_product_tag_id,
        product_id: fp.product_id,
        expiry_date: fp.expiry_date || null,
        weight: fp.total_weight || 0,
        packaging_name: fp.packaging_name || null,
        packaging_unit: fp.packaging_unit || null,
        packaging_unit_quantity: fp.packaging_unit_quantity || 0,
        merge_quantity: fp.occurrences || 1,
        invoice_ordered_quantity: sipMap[fp.sales_product_tag_id] || 0,
        lot: fp.lot_number || null,
      }));

      const createdFP = await BatchEntryFormulatedProduct.bulkCreate(fpRows, {
        transaction: t,
        returning: true,
      });

      createdFP.forEach((fp) => {
        formulatedProductsMap[fp.product_id] = fp.id;
      });
    }

    // --- MATERIALS USED ---
    if (formData.materials?.length > 0) {
      const materialRows = [];

      for (const mat of formData.materials) {
        const productData = await ProductList.findOne({
          where: { product_id: mat.product_id },
          include: [{ model: Packaging, as: "prod_packaging" }],
        });

        const unitQuantity = productData?.prod_packaging?.unit_quantity || 0;

        materialRows.push({
          batch_entry_id: newBatch.id,
          formulated_product_id:
            formulatedProductsMap[mat.formulated_product_id] || null,
          product_id: mat.product_id,
          vendor_id: mat.vendor_id || null,
          target_weight: mat.base_target_weight,
          based_target_weight: mat.merged_target_weight,
          unit_quantity: unitQuantity,
          merge_quantity: mat.occurrences || 1,
          category: mat.category,
          instruction: mat.instruction,
          status: mat.material_status,
          isReplaced: mat.is_replaced || false,
          isAdditional: mat.is_additional || false,
          isAdded: mat.isAdded || false,
        });
      }

      await BatchEntryFormulatedMaterialUsed.bulkCreate(materialRows, {
        transaction: t,
      });
    }

    // --- COST LIST ---
    if (formData.costs?.length > 0) {
      const costRows = formData.costs
        .filter((c) => c.name && parseFloat(c.amount) > 0)
        .map((c) => ({
          batch_entry_id: newBatch.id,
          name: c.name.trim(),
          amount: parseFloat(c.amount),
          remarks: c.remarks || "",
        }));
      await BatchEntryCostList.bulkCreate(costRows, { transaction: t });
    }

    // --- FIFO COSTING LOGIC + HISTORY CREATION ---
    const fetchMaterialUsed = await BatchEntryFormulatedMaterialUsed.findAll({
      where: { batch_entry_id: newBatch.id },
      include: [{ model: ProductList, as: "befmu_product_id" }],
      transaction: t,
    });

    for (const material of fetchMaterialUsed) {
      const basedTargetWeight = material.based_target_weight || 0;
      const packageUnitQuantity = material.unit_quantity || 1;
      let quantityToDeduct = basedTargetWeight / packageUnitQuantity;

      let totalCostForQuantity = 0;
      let totalDeductedQty = 0;

      if (material.category === "Raw Product") {
        const stockEntries = await StockManagement.findAll({
          where: { product_id: material.product_id },
          order: [["expiry_date", "ASC"]],
          transaction: t,
        });

        for (const stockEntry of stockEntries) {
          if (quantityToDeduct <= 0) break;

          const available = parseFloat(stockEntry.stock) || 0;
          if (available <= 0) continue;

          const deduction = Math.min(available, quantityToDeduct);
          const stockPrice = parseFloat(stockEntry.price) || 0;
          const cost = deduction * stockPrice;

          totalCostForQuantity += cost;
          totalDeductedQty += deduction;

          // ❌ Do NOT update stock here yet
          // await StockManagement.update(...);

          // ✅ Create BatchEntryStockManagementHistory
          await BatchEntryStockManagementHistory.create(
            {
              stock_management_id: stockEntry.stock_management_id,
              batch_entry_id: newBatch.id,
              be_material_used_id: material.id,
              deducted_stock: deduction,
              cost_amount: cost,
              lot: stockEntry.lot || null,
              expiry_date: stockEntry.expiry_date || null,
              isDeleted: 0,
            },
            { transaction: t }
          );

          quantityToDeduct -= deduction;
        }
      }

      const avgPricePerUnit =
        totalDeductedQty > 0 ? totalCostForQuantity / totalDeductedQty : 0;

      await material.update(
        {
          price_per_unit: avgPricePerUnit,
          cost_amount: totalCostForQuantity,
        },
        { transaction: t }
      );
    }

    // --- CREATE POST PRODUCTION ENTRY ---
    await PostProduction.create(
      { batch_entry_id: newBatch.id, status: "In Progress" },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Batch created successfully with costing and history",
      batch_number: batchNumber,
      batch_id: newBatch.id,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error creating batch:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Batch Entry widget counts
router.get("/getBatchEntryWidgetCounts", async (req, res) => {
  try {
    const [totalForPrinting, totalPrinted, totalBatchTicket] =
      await Promise.all([
        BatchEntry.count({
          where: { status: "For-Printing" },
        }),
        BatchEntry.sum("print_count"),
        BatchEntry.count(), // all records
      ]);

    return res.status(200).json({
      success: true,
      totalForPrinting,
      totalPrinted,
      totalBatchTicket,
    });
  } catch (error) {
    console.error("Error fetching widget counts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// fetch for data table the batch entry details
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await BatchEntry.findAndCountAll({
      where: {
        isDeleted: 0,
      },
      include: [
        {
          model: MasterList,
          as: "be_created_by",
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("fname"),
                " ",
                sequelize.col("lname")
              ),
              "full_name",
            ],
          ],
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    // console.log("Fetched Batch Entry:", formattedData);

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, searchField } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: {
        [Op.ne]: "Cancelled",
      },
    };

    // if (searchField) {
    //   whereClause.status = searchField;
    // }

    const include = [
      {
        model: MasterList,
        as: "be_created_by",
        required: true,
        attributes: [
          [
            sequelize.fn(
              "CONCAT",
              sequelize.col("fname"),
              " ",
              sequelize.col("lname")
            ),
            "full_name",
          ],
        ],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();
      console.log(searchField, "SEARCH");

      if (searchField) {
        switch (searchField) {
          case "batch_no":
            whereClause.transaction_id = { [Op.like]: `%${text}%` };
            break;
          case "batch_title":
            whereClause.batch_title = { [Op.like]: `%${text}%` };
            break;
          case "created_by":
            whereClause[Op.and] = [
              Sequelize.where(
                Sequelize.literal(
                  "CONCAT(`be_created_by`.fname, ' ', `be_created_by`.lname)"
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ];
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          { transaction_id: { [Op.like]: `%${text}%` } },
          { batch_title: { [Op.like]: `%${text}%` } },
          ...createDateTimeSearchConditions("batch_entry", text, "start_date"),
          ...createDateTimeSearchConditions("batch_entry", text, "end_date"),
          ...createDateTimeSearchConditions("batch_entry", text, "createdAt"),
          Sequelize.where(
            Sequelize.literal(
              "CONCAT(`be_created_by`.fname, ' ', `be_created_by`.lname)"
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          { status: { [Op.like]: `%${text}%` } },
        ];
      }
    }
    const { count, rows } = await BatchEntry.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const include = [
      {
        model: MasterList,
        as: "be_created_by",
        required: true,
        attributes: [
          [
            sequelize.fn(
              "CONCAT",
              sequelize.col("fname"),
              " ",
              sequelize.col("lname")
            ),
            "full_name",
          ],
        ],
      },
    ];

    let whereClause = {};
    if (startDate || endDate) {
      whereClause.start_date = {};

      if (startDate) {
        // Convert to start of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.start_date[Op.gte] = start;
      }

      if (endDate) {
        // Convert to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.start_date[Op.lte] = end;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await BatchEntry.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Filter error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// fetch specific batch entry details
router.route("/fetchDetails/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }
    const batchDetails = await BatchEntry.findOne({
      where: { id: id },
      include: [
        {
          model: MasterList,
          as: "be_created_by",
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("fname"),
                " ",
                sequelize.col("lname")
              ),
              "full_name",
            ],
          ],
          required: true,
        },
      ],
    });
    if (!batchDetails) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: batchDetails,
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch mixer list for view batch entry
router.route("/batchViewFetchMixerData/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    // Get mixers already tagged to this batch
    const batchMixers = await BatchEntryTaggedMixer.findAll({
      where: { batch_entry_id: id },
      include: [
        {
          model: Mixer,
          as: "betm_mixer_id",
        },
      ],
    });

    // Get all active mixers
    const allMixers = await Mixer.findAll({
      where: {
        status: "Active",
      },
      order: [["name", "ASC"]],
    });

    // Return both all mixers and tagged mixers
    return res.status(200).json({
      success: true,
      data: {
        allMixers: allMixers,
        taggedMixers: batchMixers.map((bm) => bm.betm_mixer_id),
      },
    });
  } catch (error) {
    console.error("Error fetching mixer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch delivery receipt for view batch entry
router.route("/batchViewFetchDeliveryReceiptData/:id").get(async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    // Get tagged invoice already tagged to this batch
    const batchInvoice = await BatchEntryTaggedInvoice.findAll({
      where: { batch_entry_id: id },
      include: [
        {
          model: SalesInvoice,
          as: "beti_sales_invoice_id",
        },
      ],
    });

    const allInvoices = await SalesInvoice.findAll({
      where: {
        isDeleted: 0,
      },
      order: [["delivery_number", "ASC"]],
    });

    // Return both all mixers and tagged mixers
    // console.log("All Invoice:", JSON.stringify(allInvoices, null, 2));
    // console.log("Tagged Invoice:", JSON.stringify(batchInvoice, null, 2));

    // Return both all mixers and tagged mixers
    return res.status(200).json({
      success: true,
      data: {
        allInvoices: allInvoices,
        taggedInvoice: batchInvoice.map((bm) => bm.beti_sales_invoice_id),
      },
    });
  } catch (error) {
    console.error("Error fetching mixer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch formulated dr products for view batch entry
router
  .route("/batchViewFetchProductFromDeliveryReceiptData/:id")
  .get(async (req, res) => {
    try {
      const id = req.params.id;
      const { sales_invoice_ids } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Batch ID is required",
        });
      }

      if (!sales_invoice_ids) {
        return res.status(400).json({
          success: false,
          message: "sales_invoice_ids parameter is required",
        });
      }

      const invoiceIds = sales_invoice_ids.split(","); // Remove parseInt here

      // Get tagged invoice already tagged to this batch
      const batchFormulatedProducts = await BatchEntryFormulatedProduct.findAll(
        {
          where: { batch_entry_id: id },
          include: [
            {
              model: SalesInvoiceTagProduct,
              as: "befp_sales_product_tag_id",
            },
          ],
        }
      );

      const allSalesTagProduct = await SalesInvoiceTagProduct.findAll({
        where: {
          sales_invoice_id: {
            [Op.in]: invoiceIds,
          },
        },
        include: [
          {
            model: ProductList,
            where: {
              product_category: "Finish Product",
            },
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
              },
            ],
          },
          {
            model: SalesInvoice,
          },
        ],
        order: [[{ model: SalesInvoice }, "delivery_number", "ASC"]],
      });

      // // Return both all mixers and tagged mixers
      // console.log(
      //   "All Sales Tag Products:",
      //   JSON.stringify(allSalesTagProduct, null, 2)
      // );
      // console.log(
      //   "Tagged Formulated Products:",
      //   JSON.stringify(batchFormulatedProducts, null, 2)
      // );

      // Return both all mixers and tagged mixers
      return res.status(200).json({
        success: true,
        data: {
          allSalesTagProduct: allSalesTagProduct,
          taggedFormulatedProducts: batchFormulatedProducts.map(
            (bm) => bm.befp_sales_product_tag_id
          ),
        },
      });
    } catch (error) {
      console.error("Error fetching mixer:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

// invoice list for batch entry view
router.route("/getInvoiceListData/:id").get(async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    const batchInvoice = await BatchEntryTaggedInvoice.findAll({
      where: { batch_entry_id: id, isDeleted: 0 },
      include: [
        {
          model: SalesInvoice,
          as: "beti_sales_invoice_id",
          include: [
            {
              model: Customer,
            },
          ],
        },
      ],
      order: [
        [
          { model: SalesInvoice, as: "beti_sales_invoice_id" },
          "invoice_date",
          "ASC",
        ],
      ],
    });

    // console.log("Tagged Invoice:", JSON.stringify(batchInvoice, null, 2));

    return res.status(200).json({
      success: true,
      data: batchInvoice,
    });
  } catch (error) {
    console.error("Error fetching invoice list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch formulated products for view batch entry
router.route("/batchViewFetchFormulatedProduct/:id").get(async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    const batchFormulatedProducts = await BatchEntryFormulatedProduct.findAll({
      where: { batch_entry_id: id },
      include: [
        {
          model: ProductList,
          as: "befp_product_id",
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [
        [{ model: ProductList, as: "befp_product_id" }, "product_name", "ASC"],
      ],
    });

    // Transform the data to include lot from batch_entry_formulated_products
    const formattedData = batchFormulatedProducts.map((item) => ({
      id: item.id,
      batch_entry_id: item.batch_entry_id,
      product_id: item.product_id,
      sales_product_tag_id: item.sales_product_tag_id,
      lot: item.lot, // LOT from batch_entry_formulated_products
      expiry_date: item.expiry_date,
      weight: item.weight,
      merge_quantity: item.merge_quantity,
      created_by: item.created_by,
      updated_at: item.updated_at,
      befp_product_id: item.befp_product_id,
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching invoice list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
// when clicking the formulated product to view the materials used in the view batch entry
router
  .route(
    "/batchViewFetchMaterialUsedFromFormulatedProduct/:batchEntryId/:formulatedProductId"
  )
  .get(async (req, res) => {
    try {
      const { batchEntryId, formulatedProductId } = req.params;

      if (!batchEntryId && !formulatedProductId) {
        return res.status(400).json({
          success: false,
          message: "Batch ID and Formulated Product ID are required",
        });
      }

      console.log("this is the params", req.params);

      const tableName = StockManagement.getTableName(); // get actual table name

      const fetchData = await BatchEntryFormulatedMaterialUsed.findAll({
        where: {
          batch_entry_id: batchEntryId,
          formulated_product_id: formulatedProductId,
          isDeleted: 0,
        },
        include: [
          {
            model: ProductList,
            as: "befmu_product_id",
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
                attributes: {
                  include: [
                    [
                      Sequelize.literal(`(
                        SELECT GREATEST(COALESCE(SUM(sm.stock), 0), 0)
                        FROM ${tableName} sm
                        WHERE sm.product_id = befmu_product_id.product_id
                      )`),
                      "total_stock",
                    ],
                  ],
                },
              },
            ],
          },
        ],
        order: [
          [
            { model: ProductList, as: "befmu_product_id" },
            "product_name",
            "ASC",
          ],
        ],
      });

      console.log(
        "this is the batch formulated material used",
        JSON.stringify(fetchData, null, 2)
      );

      return res.status(200).json({
        success: true,
        data: fetchData,
      });
    } catch (error) {
      console.error("Error fetching invoice list:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

// for material used for formulated product replaced history
router
  .route(
    "/batchViewFetchReplacedMaterialFromFormulatedProduct/:batchEntryId/:materialUsedId"
  )
  .get(async (req, res) => {
    try {
      const { batchEntryId, materialUsedId } = req.params;

      if (!batchEntryId && !materialUsedId) {
        return res.status(400).json({
          success: false,
          message: "Batch ID and Formulated Product ID are required",
        });
      }

      console.log("this is the params", req.params);

      const fetchData = await BatchEntryFormulatedReplacedMaterial.findAll({
        where: {
          batch_entry_id: batchEntryId,
          replaced_product_id: materialUsedId,
        },
        include: [
          {
            model: ProductList,
            as: "befrm_product_id",
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
              },
            ],
          },
        ],
        order: [
          [
            { model: ProductList, as: "befrm_product_id" },
            "product_name",
            "ASC",
          ],
        ],
      });

      console.log(
        "this is the batch formulated material used",
        JSON.stringify(fetchData, null, 2)
      );

      return res.status(200).json({
        success: true,
        data: fetchData,
      });
    } catch (error) {
      console.error("Error fetching invoice list:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

// costing entries for view batch entry
router.route("/batchViewCostingData/:id").get(async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    const getData = await BatchEntryCostList.findAll({
      where: { batch_entry_id: id, isDeleted: 0 },
      order: [["amount", "DESC"]],
    });

    console.log("Cost List:", JSON.stringify(getData, null, 2));

    return res.status(200).json({
      success: true,
      data: getData,
    });
  } catch (error) {
    console.error("Error fetching invoice list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// update batch entry
router.route("/update/:id").put(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const formData = req.body;

    // --- UPDATE MAIN BATCH INFO ---
    await BatchEntry.update(
      {
        batch_title: formData.batch_title,
        team_leader: formData.team_leader,
        members: formData.members,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        remarks: formData.remarks,
      },
      { where: { id }, transaction: t }
    );

    // --- EXPIRY DATES UPDATE ---
    if (formData.expiry_dates?.length) {
      await Promise.all(
        formData.expiry_dates.map((ed) =>
          BatchEntryFormulatedProduct.update(
            { expiry_date: ed.expiryDate || null },
            { where: { id: ed.batchEntryFormulatedProductId }, transaction: t }
          )
        )
      );
    }

    // --- LOT NUMBERS UPDATE ---
    if (formData.lot_numbers?.length) {
      await Promise.all(
        formData.lot_numbers.map((lot) =>
          BatchEntryFormulatedProduct.update(
            { lot: lot.lot || null },
            { where: { id: lot.batchEntryFormulatedProductId }, transaction: t }
          )
        )
      );
    }

    // --- MIXERS ---
    await BatchEntryTaggedMixer.destroy({
      where: { batch_entry_id: id },
      transaction: t,
    });
    if (formData.mixers?.length) {
      const mixerRows = formData.mixers.map((mixer) => ({
        batch_entry_id: id,
        mixer_id: mixer.id,
      }));
      await BatchEntryTaggedMixer.bulkCreate(mixerRows, { transaction: t });
    }

    // --- COST LIST ---
    await BatchEntryCostList.destroy({
      where: { batch_entry_id: id },
      transaction: t,
    });
    if (formData.cost_items?.length) {
      const costRows = formData.cost_items
        .filter((c) => c.name && c.amount !== null && c.amount !== "")
        .map((c) => {
          let parsedAmount = 0;
          if (typeof c.amount === "string") {
            parsedAmount = parseFloat(c.amount.replace(/[^\d.]/g, "")) || 0;
          } else if (typeof c.amount === "number") parsedAmount = c.amount;
          return {
            batch_entry_id: id,
            name: c.name,
            remarks: c.remarks || "",
            amount: Math.max(0, parsedAmount),
          };
        });

      if (costRows.length)
        await BatchEntryCostList.bulkCreate(costRows, { transaction: t });
    }

    // --- ONLY PROCESS IF ACCOMPLISHED ---
    if (formData.status === "Accomplished") {
      // --- FETCH MATERIALS USED ---
      const fetchMaterialUsed = await BatchEntryFormulatedMaterialUsed.findAll({
        where: { batch_entry_id: id },
        include: [
          { model: BatchEntry, as: "befmu_batch_entry_id" },
          {
            model: BatchEntryFormulatedProduct,
            as: "befmu_formulated_product_id",
          },
          { model: ProductList, as: "befmu_product_id" },
        ],
        transaction: t,
      });

      for (const material of fetchMaterialUsed) {
        const basedTargetWeight = material.based_target_weight || 0;
        const packageUnitQuantity = material.unit_quantity || 1;
        const quantityToDeduct = basedTargetWeight / packageUnitQuantity;

        let totalCostForQuantity = 0;
        let totalDeductedQty = 0;

        console.log(
          "this is the material that have been used material",
          material.befmu_product_id?.product_name
        );

        // === FIFO DEDUCTION FOR RAW PRODUCTS ===
        if (material.category === "Raw Product") {
          let remainingQty = quantityToDeduct;

          const stockEntries = await StockManagement.findAll({
            where: { product_id: material.product_id },
            order: [["expiry_date", "ASC"]],
            transaction: t,
          });

          for (const stockEntry of stockEntries) {
            if (remainingQty <= 0) break;

            const available = parseFloat(stockEntry.stock) || 0;
            if (available <= 0) continue;

            const deduction = Math.min(available, remainingQty);
            const newStock = available - deduction;
            const stockPrice = parseFloat(stockEntry.price) || 0;
            const cost = deduction * stockPrice;

            totalCostForQuantity += cost;
            totalDeductedQty += deduction;

            await StockManagement.update(
              { stock: newStock },
              {
                where: { stock_management_id: stockEntry.stock_management_id },
                transaction: t,
              }
            );

            remainingQty -= deduction;
          }

          // Handle negative stock if leftover
          if (remainingQty > 0) {
            const negatives = await StockManagement.findAll({
              where: {
                product_id: material.product_id,
                stock: { [Op.lte]: 0 },
              },
              order: [["expiry_date", "ASC"]],
              transaction: t,
            });

            if (negatives.length) {
              const spread = remainingQty / negatives.length;
              for (const batch of negatives) {
                const stockPrice = parseFloat(batch.price) || 0;
                const newStock = (parseFloat(batch.stock) || 0) - spread;
                const cost = spread * stockPrice;

                await StockManagement.update(
                  { stock: newStock },
                  {
                    where: { stock_management_id: batch.stock_management_id },
                    transaction: t,
                  }
                );

                totalCostForQuantity += cost;
                totalDeductedQty += spread;
              }
            }
          }

          const avgPricePerUnit =
            totalDeductedQty > 0 ? totalCostForQuantity / totalDeductedQty : 0;

          await material.update(
            {
              price_per_unit: avgPricePerUnit,
              cost_amount: totalCostForQuantity,
            },
            { transaction: t }
          );
        }

        // === SIMPLE DEDUCTION FOR OTHER CATEGORIES ===
        else {
          const getStock = await StockManagement.findOne({
            where: { product_id: material.product_id },
            transaction: t,
          });

          if (getStock) {
            const currentStock = parseFloat(getStock.stock) || 0;
            const deductionAmount = quantityToDeduct;
            const stockPrice = parseFloat(getStock.price) || 0;

            await StockManagement.update(
              { stock: currentStock - deductionAmount },
              {
                where: { stock_management_id: getStock.stock_management_id },
                transaction: t,
              }
            );

            await material.update(
              {
                price_per_unit: stockPrice,
                cost_amount: deductionAmount * stockPrice,
              },
              { transaction: t }
            );
          }
        }

        // === CREATE CONCORD NOTIFICATION IF STOCK BELOW THRESHOLD ===
        if (material.befmu_product_id?.threshold !== null) {
          const unitQuantity = packageUnitQuantity;

          const currentStockAfterDeduction = await StockManagement.sum(
            "stock",
            {
              where: { product_id: material.befmu_product_id?.product_id },
              transaction: t,
            }
          );

          const computedCurrentStock =
            currentStockAfterDeduction * unitQuantity;

          if (computedCurrentStock <= material.befmu_product_id.threshold) {
            const moduleUrl =
              material.category === "Raw Product"
                ? `/inventory/update-product/${material.befmu_product_id.product_id}`
                : `/inventory/create-update-formulation/${material.befmu_product_id.product_id}`;
            const moduleTo =
              material.category === "Raw Product"
                ? "Product List"
                : "Formulation";
            const formattedThreshold = Number(
              material.befmu_product_id.threshold
            ).toLocaleString("en-US", { maximumFractionDigits: 2 });
            const message = `Product ${material.befmu_product_id.product_code} ${material.befmu_product_id.product_name} has hit the threshold due of ${formattedThreshold} kg(s), please restock.`;

            await ConcordNotification.create(
              {
                module_id: material.befmu_product_id.product_id,
                module_from: "Batch Entry",
                module_url: moduleUrl,
                module_to: moduleTo,
                type: "Threshold Alert",
                message,
                isRead: false,
                createdBy: formData.userLoggedID,
              },
              { transaction: t }
            );
          }
        }
      }

      // --- ADD FINISHED GOODS TO STOCK ---
      const fetchFormulatedProducts = await BatchEntryFormulatedProduct.findAll(
        {
          where: { batch_entry_id: id },
          include: [
            {
              model: SalesInvoiceTagProduct,
              as: "befp_sales_product_tag_id",
              include: [{ model: SalesInvoice }],
            },
          ],
          transaction: t,
        }
      );

      for (const material of fetchFormulatedProducts) {
        if (material.product_id && material.invoice_ordered_quantity) {
          await StockManagement.create(
            {
              product_id: material.product_id,
              warehouse_id: "11111111-1111-1111-1111-111111111111",
              stock: material.invoice_ordered_quantity,
              in: material.invoice_ordered_quantity,
              price: material.befp_sales_product_tag_id?.unit_price || 0,
              price_in: material.befp_sales_product_tag_id?.unit_price || 0,
              vendor_id: null,
              date_in: new Date(),
              transaction_number:
                material.befp_sales_product_tag_id?.sales_invoice
                  ?.transaction_id || null,
              module_in_form: "Sales Invoice",
              isDeleted: 0,
              expiry_date: material.expiry_date || null,
              lot: material.lot || null,
            },
            { transaction: t }
          );
        }
      }

      // --- CREATE POST PRODUCTION ENTRY ---
      await PostProduction.create(
        { batch_entry_id: id, status: "In Progress" },
        { transaction: t }
      );
    }

    await t.commit();
    return res.status(200).json({ success: true, batch_entry_id: id });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error updating batch:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/getBatchTicketsData").get(async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "No IDs provided",
      });
    }

    const selectedIds = ids.split(",").map((id) => id.trim());

    // FORMULATED PRODUCTS
    const formulatedProducts = await BatchEntryFormulatedProduct.findAll({
      where: {
        batch_entry_id: selectedIds,
      },
      include: [
        {
          model: BatchEntryFormulatedMaterialUsed,
          as: "befmu_formulated_product_id",
          required: false,
          order: [["createdAt", "ASC"]],
          include: [
            {
              model: ProductList,
              as: "befmu_product_id",
              required: false,
              attributes: ["product_code", "product_name"],
              order: [["product_name", "ASC"]],
            },
            {
              // 🆕 Include FIFO history entries
              model: BatchEntryStockManagementHistory,
              as: "bestm_be_material_used_id",
              required: false,
              attributes: [
                "id",
                "stock_management_id",
                "deducted_stock",
                "cost_amount",
                "lot",
                "expiry_date",
                "createdAt",
              ],
            },
          ],
        },
        {
          model: BatchEntry,
          as: "befp_batch_entry_id",
          required: false,
          include: [
            {
              model: BatchEntryTaggedMixer,
              as: "betm_batch_entry_id",
              required: false,
              include: [
                {
                  model: Mixer,
                  as: "betm_mixer_id",
                  required: false,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
        {
          model: ProductList,
          as: "befp_product_id",
          required: false,
          attributes: ["product_name"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: formulatedProducts,
      message: "Batch ticket data retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getBatchTicketData:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/printBatchTickets").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({
      success: false,
      message: "No IDs provided",
    });
  }

  const selectedIds = ids.split(",").map((id) => id.trim());

  try {
    const batchEntries = await BatchEntry.findAll({
      where: {
        id: selectedIds,
      },
      attributes: ["id", "reprint_count", "print_count"],
      transaction,
      lock: true,
    });

    for (const entry of batchEntries) {
      const newPrintCount =
        entry.reprint_count > 0 ? entry.print_count + 1 : entry.print_count;

      await BatchEntry.update(
        {
          status: "Printed",
          print_count: newPrintCount,
        },
        {
          where: { id: entry.id },
          transaction,
        }
      );
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: "Batch tickets printed successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in printBatchTickets:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/request-reprint").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  const { ids, userLoggedID, remarks } = req.body;

  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid IDs array",
      });
    }

    for (const id of ids) {
      const reprintRequest = await BatchEntryReprint.create(
        {
          batch_entry_id: id,
          requestor: userLoggedID,
          approver: null,
          date_requested: new Date(),
          date_approved: null,
          remarks: remarks,
          status: "For-Approval",
        },
        transaction
      );

      await BatchEntry.update(
        {
          status: "Pending Reprint",
        },
        {
          where: { id: id },
          transaction,
        }
      );
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: "Reprint request(s) submitted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in request-reprint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/fetchReprintData").get(async (req, res) => {
  try {
    const reprintData = await BatchEntryReprint.findAll({
      include: [
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "batch_requested_by",
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "batch_approved_by",
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "batch_declined_by",
        },
        {
          model: BatchEntry,
          as: "batch_reprints",
          attributes: ["id", "transaction_id", "batch_title"],
        },
      ],
      order: [["date_requested", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: reprintData,
      message: "Reprint data retrieved successfully",
    });
  } catch (error) {
    console.error("Error in fetchReprintData:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/fetchSearchReprintData").get(async (req, res) => {
  try {
    const { searchText, searchField } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: {
        [Op.ne]: "Cancelled",
      },
    };

    // if (searchField) {
    //   whereClause.status = searchField;
    // }

    const include = [
      {
        model: MasterList,
        attributes: ["fname", "mname", "lname"],
        as: "batch_requested_by",
      },
      {
        model: MasterList,
        attributes: ["fname", "mname", "lname"],
        as: "batch_approved_by",
      },
      {
        model: MasterList,
        attributes: ["fname", "mname", "lname"],
        as: "batch_declined_by",
      },
      {
        model: BatchEntry,
        as: "batch_reprints",
        attributes: ["id", "transaction_id", "batch_title"],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();
      console.log(searchField, "SEARCH");

      if (searchField) {
        switch (searchField) {
          case "batch_no":
            whereClause["$batch_reprints.transaction_id$"] = {
              [Op.like]: `%${text}%`,
            };
            break;
          case "batch_title":
            whereClause["$batch_reprints.batch_title$"] = {
              [Op.like]: `%${text}%`,
            };
            break;
          case "requestor":
            whereClause[Op.and] = [
              Sequelize.where(
                Sequelize.literal(
                  "CONCAT(`batch_requested_by`.fname, ' ', `batch_requested_by`.lname)"
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ];
            break;
          case "approver":
            whereClause[Op.and] = [
              Sequelize.where(
                Sequelize.literal(
                  "CONCAT(`batch_approved_by`.fname, ' ', `batch_approved_by`.lname)"
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ];
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          {
            "$batch_reprints.transaction_id$": {
              [Op.like]: `%${text}%`,
            },
          },
          {
            "$batch_reprints.batch_title$": {
              [Op.like]: `%${text}%`,
            },
          },
          ...createDateTimeSearchConditions(
            "batch_entry_reprint",
            text,
            "date_requested"
          ),
          ...createDateTimeSearchConditions(
            "batch_entry_reprint",
            text,
            "date_approved"
          ),
          Sequelize.where(
            Sequelize.literal(
              "CONCAT(`batch_requested_by`.fname, ' ', `batch_requested_by`.lname)"
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              "CONCAT(`batch_declined_by`.fname, ' ', `batch_declined_by`.lname)"
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              "CONCAT(`batch_approved_by`.fname, ' ', `batch_approved_by`.lname)"
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          { remarks: { [Op.like]: `%${text}%` } },
          { status: { [Op.like]: `%${text}%` } },
        ];
      }
    }
    const { count, rows } = await BatchEntryReprint.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});
router.route("/fetchFilteredReprintData").get(async (req, res) => {
  try {
    const { requestDate, approveDate, status } = req.query; // Add agentId
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {};
    // Handle date range logic across start_date and end_date
    if (requestDate && approveDate) {
      console.log("start and end date are both filled");
      whereClause[Op.and] = [
        {
          date_requested: { [Op.gte]: new Date(requestDate + " 00:00:00") },
        },
        {
          date_approved: { [Op.lte]: new Date(approveDate + " 23:59:59") },
        },
      ];
    }
    if (requestDate && !approveDate) {
      console.log("only fromDate is filled — exact match on start_date");
      whereClause.date_requested = {
        [Op.gte]: new Date(requestDate + " 00:00:00"),
        [Op.lte]: new Date(requestDate + " 23:59:59"),
      };
    }

    if (approveDate && !requestDate) {
      console.log("only toDate is filled — exact match on end_date");
      whereClause.date_approved = {
        [Op.gte]: new Date(approveDate + " 00:00:00"),
        [Op.lte]: new Date(approveDate + " 23:59:59"),
      };
    }

    if (status) {
      whereClause.status = {
        [Op.like]: `%${status}%`,
      };
    }

    const { count, rows } = await BatchEntryReprint.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "batch_requested_by",
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "batch_approved_by",
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "batch_declined_by",
        },
        {
          model: BatchEntry,
          as: "batch_reprints",
          attributes: ["id", "transaction_id", "batch_title"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Filter error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/approve-or-decline-batch").post(async (req, res) => {
  try {
    const transaction = await sequelize.transaction();
    const { batch_ids, status, action, userLoggedID, remarks } = req.body;

    // Validation remains the same
    if (!batch_ids || !Array.isArray(batch_ids) || batch_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "batch_ids is required and must be a non-empty array",
      });
    }

    if (!status || !["Approved", "Declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "status is required and must be either 'Approved' or 'Declined'",
      });
    }

    if (!action || !["approve", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action is required and must be either 'approve' or 'decline'",
      });
    }

    // Check existing batches
    const existingBatches = await BatchEntryReprint.findAll({
      where: {
        id: batch_ids,
      },
      attributes: ["id", "batch_entry_id", "status"],
      transaction,
    });

    if (existingBatches.length !== batch_ids.length) {
      const foundIds = existingBatches.map((batch) => batch.id);
      const missingIds = batch_ids.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        success: false,
        message: `Some batch entries were not found`,
        missing_ids: missingIds,
      });
    }

    const invalidStatusBatches = existingBatches.filter(
      (batch) => batch.status !== "For-Approval"
    );
    if (invalidStatusBatches.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Some selected batches are not in 'For-Approval' status and cannot be processed",
        invalid_batches: invalidStatusBatches.map((batch) => ({
          id: batch.id,
          current_status: batch.status,
        })),
      });
    }

    // Prepare update data based on status
    const updateData = {
      status: status,
    };

    if (status === "Approved") {
      updateData.approved_remarks = remarks;
      updateData.approver = userLoggedID;
      updateData.date_approved = new Date();
    } else if (status === "Declined") {
      updateData.declinedRemarks = remarks;
      updateData.declinedBy = userLoggedID;
      updateData.declinedAt = new Date();
    }

    const updateResult = await BatchEntryReprint.update(updateData, {
      where: {
        id: batch_ids,
      },
      transaction,
    });

    const [affectedRowsCount] = updateResult;
    if (affectedRowsCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No records were updated",
      });
    }

    const updatedBatches = await BatchEntryReprint.findAll({
      where: {
        id: batch_ids,
      },
      attributes: [
        "id",
        "batch_entry_id",
        "status",
        "date_approved",
        "declinedAt",
      ],
      transaction,
    });

    await BatchEntry.update(
      {
        status: status === "Approved" ? "For-Reprinting" : "Printed",
        reprint_count: sequelize.literal(
          status === "Approved" ? "reprint_count + 1" : "reprint_count"
        ),
      },
      {
        where: {
          id: updatedBatches.map((b) => b.batch_entry_id),
        },
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      success: true,
      message: `Successfully ${action}d ${affectedRowsCount} batch ${
        affectedRowsCount === 1 ? "entry" : "entries"
      }`,
      data: {
        action: action,
        status: status,
        affected_count: affectedRowsCount,
        updated_batches: updatedBatches,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error approve or decline batch:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    if (error.name === "SequelizeDatabaseError") {
      return res.status(500).json({
        success: false,
        message: "Database error occurred",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// lot validation if duplicate
// Minimal version - adapt to your actual models
// Update your validateLot route to check both tables
router.get("/validateLot", async (req, res) => {
  try {
    const { lot, whatModule, productId, excludeBatchEntryId, batchId } =
      req.query;

    if (!lot) {
      return res.json({
        exists: false,
        message: "",
      });
    }

    // const lot = lot.trim();
    let exists = false;
    let message = "";

    // Check in StockManagement first (for already accomplished batches)
    let stockRecord = await StockManagement.findOne({
      where: { lot: lot },
    });

    if (stockRecord) {
      exists = true;
      message = `LOT number "${lot}" already exists.`;
    }

    // if is not update, check in batch_entry_formulated_products
    if (whatModule === "Create") {
      const batchEntryRecord = await BatchEntryFormulatedProduct.findOne({
        where: { lot: lot },
      });
      if (batchEntryRecord) {
        exists = true;
        message = `LOT number "${lot}" already exists.`;
      }
    }

    res.json({
      exists: exists,
      message: message,
    });
  } catch (error) {
    console.error("LOT validation error:", error);
    res.status(500).json({
      error: error.message,
      exists: false,
      message: "Error validating LOT. Please try again.",
    });
  }
});

// Add a new route specifically for batch LOT validation
router.get("/validateLotForBatch", async (req, res) => {
  try {
    const { lot, batchId, excludeBatchEntryFormulatedProductId } = req.query;

    let excludeBatchEntryFormulatedProductId2 =
      "67d24266-569f-4840-b6de-031c56eee411";

    console.log(
      "this is the excludeBatchEntryFormulatedProductId",
      excludeBatchEntryFormulatedProductId
    );

    console.log("this is the batchId", batchId);

    if (!lot) {
      return res.json({
        exists: false,
        message: "",
      });
    }

    // const trimmedLot = lot.trim();
    let exists = false;
    let message = "";

    // Build query conditions
    const conditions = {
      lot: lot,
    };

    // If batchId is provided, only check within this batch
    if (batchId) {
      conditions.batch_entry_id = batchId;
    }

    // Exclude current record if provided
    if (excludeBatchEntryFormulatedProductId) {
      conditions.id = { [Op.ne]: excludeBatchEntryFormulatedProductId };
    }

    // Check in batch_entry_formulated_products
    const batchEntryRecord = await BatchEntryFormulatedProduct.findOne({
      where: conditions,
    });

    if (batchEntryRecord) {
      exists = true;
      message = `LOT number "${lot}" already exists.`;
    }

    res.json({
      exists: exists,
      message: message,
    });
  } catch (error) {
    console.error("Batch LOT validation error:", error);
    res.status(500).json({
      error: error.message,
      exists: false,
      message: "Error validating LOT. Please try again.",
    });
  }
});

module.exports = router;
