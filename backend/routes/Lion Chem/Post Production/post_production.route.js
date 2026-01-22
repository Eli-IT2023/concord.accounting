const express = require("express");
const { Op, Sequelize, col, literal } = require("sequelize");
const router = express.Router();
const {
  SalesInvoice,
  Customer,
  SalesInvoiceTagProduct,
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
  Mixer,
  ProductList,
  PostProduction,
  PostProductionProduct,
  PostProductionFormulatedProducts,
  PostProductionRawMaterials,
  BatchEntryStockManagementHistory,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");
const moment = require("moment");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// table fetch sa post production
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await BatchEntry.findAndCountAll({
      where: {
        status: "Accomplished",
      },
      include: [
        {
          model: MasterList,
          as: "be_created_by",
        },
        {
          model: PostProduction,
          as: "pp_batch_entry_id",
        },
        {
          model: BatchEntryTaggedMixer,
          as: "betm_batch_entry_id",
          include: [
            {
              model: Mixer,
              as: "betm_mixer_id",
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    // console.log("this is table", formattedData);
    // return;

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

// filters
router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterStatus, fromFilter, toFilter } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const fromDate = fromFilter?.trim();
    const toDate = toFilter?.trim();

    const whereClause = {
      status: "Accomplished",
    };

    const include = [
      {
        model: MasterList,
        as: "be_created_by",
      },
      {
        model: PostProduction,
        as: "pp_batch_entry_id",
        // Add where condition to the include instead of main where clause
        ...(filterStatus &&
          filterStatus !== "All" && {
            where: {
              status: {
                [Op.like]: `%${filterStatus}%`,
              },
            },
          }),
      },
      {
        model: BatchEntryTaggedMixer,
        as: "betm_batch_entry_id",
        include: [
          {
            model: Mixer,
            as: "betm_mixer_id",
          },
        ],
      },
    ];

    // Handle date range logic across start_date and end_date
    if (fromDate && toDate) {
      console.log("start and end date are both filled");
      whereClause[Op.and] = [
        {
          start_date: { [Op.gte]: new Date(fromDate + " 00:00:00") },
        },
        {
          end_date: { [Op.lte]: new Date(toDate + " 23:59:59") },
        },
      ];
    } else if (fromDate) {
      console.log("only fromDate is filled — exact match on start_date");
      whereClause.start_date = {
        [Op.gte]: new Date(fromDate + " 00:00:00"),
        [Op.lte]: new Date(fromDate + " 23:59:59"),
      };
    } else if (toDate) {
      console.log("only toDate is filled — exact match on end_date");
      whereClause.end_date = {
        [Op.gte]: new Date(toDate + " 00:00:00"),
        [Op.lte]: new Date(toDate + " 23:59:59"),
      };
    }

    const { count, rows } = await BatchEntry.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "ASC"]],
      limit,
      offset,
      // Important: This ensures the include conditions work properly
      subQuery: false,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? { message: error.message, sql: error.sql }
          : undefined,
    });
  }
});

router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: "Accomplished",
    };

    const include = [
      {
        model: MasterList,
        as: "be_created_by",
      },
      {
        model: PostProduction,
        as: "pp_batch_entry_id",
      },
      {
        model: BatchEntryTaggedMixer,
        as: "betm_batch_entry_id",
        include: [
          {
            model: Mixer,
            as: "betm_mixer_id",
          },
        ],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();
      if (filterColumn !== "all") {
        switch (filterColumn) {
          case "batch_no":
            whereClause[Op.and] = [
              {
                transaction_id: {
                  [Op.like]: `%${text}%`,
                },
              },
            ];
            break;
          case "batch_title":
            whereClause[Op.and] = [
              {
                batch_title: {
                  [Op.like]: `%${text}%`,
                },
              },
            ];
            break;
            // case "schedule_start":
            whereClause[Op.and] = [
              ...createDateTimeSearchConditions(
                "batch_entry_main",
                searchText,
                "start_date"
              ),
            ];
          case "status":
            whereClause[Op.and] = [
              {
                "$pp_batch_entry_id.status$": {
                  [Op.like]: `%${text}%`,
                },
              },
            ];
            break;
        }
      } else {
        const searchConditions = [
          // Search by batch transaction number
          {
            transaction_id: {
              [Op.like]: `%${text}%`,
            },
          },
          {
            batch_title: {
              [Op.like]: `%${text}%`,
            },
          },
          // Search by status in PostProduction
          {
            "$pp_batch_entry_id.status$": {
              [Op.like]: `%${text}%`,
            },
          },
          // date formats
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("start_date"),
              "%M %d, %Y"
            ),
            { [Op.like]: `%${text}%` }
          ),
          Sequelize.where(
            Sequelize.fn("DATE_FORMAT", Sequelize.col("end_date"), "%M %d, %Y"),
            { [Op.like]: `%${text}%` }
          ),
          // time conditions
          ...createDateTimeSearchConditions(
            "batch_entry",
            searchText,
            "start_date"
          ),
          ...createDateTimeSearchConditions(
            "batch_entry",
            searchText,
            "end_date"
          ),
          ...createDateTimeSearchConditions(
            "batch_entry",
            searchText,
            "createdAt"
          ),
        ];

        whereClause[Op.or] = searchConditions;
      }
    }

    const { count, rows } = await BatchEntry.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "ASC"]],
      limit,
      offset,
      subQuery: false,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? { message: error.message, sql: error.sql }
          : undefined,
    });
  }
});

// fetch the batch entry
router.route("/fetchBatchEntry/:id").get(async (req, res) => {
  try {
    const fetchBatchEntry = await BatchEntry.findOne({
      where: { id: req.params.id },
    });

    if (!fetchBatchEntry) {
      return res
        .status(404)
        .json({ success: false, message: "Batch not found" });
    }

    return res.status(200).json({
      success: true,
      data: fetchBatchEntry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Overview of the post productions
router.route("/fetchOverviewCounts").get(async (req, res) => {
  try {
    console.log("Fetching counts...");

    const counts = {
      inProgress: await PostProduction.count({
        where: { status: "In Progress" },
      }),
      postProduction: await PostProduction.count({
        where: { status: "Post-Production" },
      }),
      reProduction: await PostProduction.count({
        where: { status: "Re-Production" },
      }),
    };

    console.log("Counts result:", counts);

    return res.status(200).json({
      success: true,
      counts: counts,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// pdf form
// router.route("/generateQcForms").post(async (req, res) => {
//   try {
//     const { batchIds } = req.body;

//     // 1. First verify the raw data exists
//     const verificationQuery = await sequelize.query(
//       `SELECT COUNT(*) as count FROM batch_entry_tag_invoices
//        WHERE batch_entry_id IN (:batchIds)`,
//       {
//         replacements: { batchIds },
//         type: sequelize.QueryTypes.SELECT,
//       }
//     );
//     console.log("Invoice count:", verificationQuery[0].count);

//     // 2. Get the complete data
//     const query = `
//       SELECT
//         be.id as batch_id,
//         be.batch_name,
//         pl.product_id,
//         pl.product_code,
//         pl.product_name,
//         sitp.quantity
//       FROM batch_entry_mains be
//       JOIN batch_entry_tag_invoices bei ON be.id = bei.batch_entry_id
//       JOIN sales_invoices si ON bei.sales_invoice_id = si.sales_invoice_id
//       JOIN sales_invoice_tag_products sitp ON si.sales_invoice_id = sitp.sales_invoice_id
//       JOIN product_lists pl ON sitp.product_id = pl.product_id
//       WHERE be.id IN (:batchIds)
//     `;

//     const products = await sequelize.query(query, {
//       replacements: { batchIds },
//       type: sequelize.QueryTypes.SELECT,
//     });

//     console.log("Raw products data:", products);

//     // 3. If no products found, try an alternative query
//     if (products.length === 0) {
//       console.warn("No products found with JOINs, trying alternative query");
//       const altProducts = await sequelize.query(
//         `SELECT
//           be.id as batch_id,
//           be.batch_name
//          FROM batch_entry_mains be
//          WHERE be.id IN (:batchIds)`,
//         {
//           replacements: { batchIds },
//           type: sequelize.QueryTypes.SELECT,
//         }
//       );
//       console.log("Alternative query results:", altProducts);
//     }

//     // 4. Format the response
//     const batchMap = {};
//     products.forEach((product) => {
//       if (!batchMap[product.batch_id]) {
//         batchMap[product.batch_id] = {
//           batch_id: product.batch_id,
//           batch_name: product.batch_name,
//           products: [],
//         };
//       }
//       batchMap[product.batch_id].products.push({
//         product_id: product.product_id,
//         product_code: product.product_code,
//         product_name: product.product_name,
//         quantity: product.quantity,
//       });
//     });

//     const result = Object.values(batchMap);
//     console.log("Final formatted data:", JSON.stringify(result, null, 2));

//     res.status(200).json(
//       result.length > 0
//         ? result
//         : [
//             {
//               batch_id: batchIds[0],
//               batch_name: "No products found",
//               products: [],
//             },
//           ]
//     );
//   } catch (error) {
//     console.error("Full error:", error);
//     res.status(500).json({
//       message: "Error generating QC forms",
//       error: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// });

// pdf form

router.route("/generateQcForms").get(async (req, res) => {
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
          attributes: ["product_name", "product_code"], // Added product_code
        },
      ],
    });

    // Transform data into the format expected by the frontend
    const batchData =
      transformFormulatedProductsToBatchData(formulatedProducts);

    // Instead of returning the data, you might want to generate the PDF server-side
    // or return the structured data for frontend PDF generation
    res.status(200).json({
      success: true,
      data: batchData,
      message: "QC Form data retrieved successfully",
    });
  } catch (error) {
    console.error("Error in generateQcForms:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

const transformFormulatedProductsToBatchData = (formulatedProducts) => {
  const batchesMap = new Map();

  formulatedProducts.forEach((fp) => {
    const batchEntry = fp.befp_batch_entry_id;
    if (!batchEntry) return;

    const batchId = batchEntry.id;
    const batchKey = batchId;

    if (!batchesMap.has(batchKey)) {
      batchesMap.set(batchKey, {
        batch_id: batchId,
        batch_name: batchEntry.batch_title || `Batch ${batchId}`,
        team_leader: batchEntry.team_leader || "---",
        members: batchEntry.members.split(",") || [],
        products: [],
      });
    }

    const batch = batchesMap.get(batchKey);
    const product = {
      product_code: fp.befp_product_id?.product_code || "N/A",
      product_name: fp.befp_product_id?.product_name || "Unknown Product",
      weight: fp.weight || 0,
      // Add other product properties as needed
    };

    batch.products.push(product);
  });

  return Array.from(batchesMap.values());
};

router.route("/getPostProductionInBatchEntry/:id").get(async (req, res) => {
  try {
    const fetchBatchEntry = await BatchEntry.findAll({
      where: { id: req.params.id },
      include: [
        {
          model: PostProduction,
          as: "pp_batch_entry_id",
        },
      ],
    });
    return res.status(200).json(fetchBatchEntry);
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({
      message: "Error generating QC forms",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.route("/beforeProductionFetch/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // const getInvoice = await BatchEntryInvoice.findOne({
    //   where: {
    //     batch_entry_id: id,
    //   },
    // });

    const { count, rows } = await BatchEntryFormulatedProduct.findAndCountAll({
      where: {
        batch_entry_id: id,
      },
      include: [
        {
          model: SalesInvoiceTagProduct,
          as: "befp_sales_product_tag_id",
          attributes: ["unit_price"],
        },
        {
          model: ProductList,
          as: "befp_product_id",
          attributes: ["product_id", "product_code", "product_name"],
          include: [
            {
              model: PostProductionProduct,
              as: "ppp_product_id",
            },
          ],
        },
      ],
      order: [
        [{ model: ProductList, as: "befp_product_id" }, "product_code", "ASC"],
      ],

      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    // ✅ Console log the full data structure
    console.log(
      "Fetched Before Production Data:",
      JSON.stringify(formattedData, null, 2)
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ message: "Error fetching", error: error.message });
  }
});

// before production
// router.route("/beforeProductionFetch/:id").get(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // const getInvoice = await BatchEntryInvoice.findOne({
//     //   where: {
//     //     batch_entry_id: id,
//     //   },
//     // });

//     const { count, rows } = await SalesInvoiceTagProduct.findAndCountAll({
//       where: {
//         sales_invoice_id: getInvoice.sales_invoice_id,
//       },
//       include: [
//         {
//           model: SalesInvoice,
//           include: [
//             {
//               model: BatchEntryInvoice,

//               required: true,
//             },
//           ],
//         },
//         {
//           model: ProductList,
//           include: [
//             {
//               model: PostProductionProduct,
//               as: "ppp_product_id",
//             },
//           ],
//         },
//       ],
//       order: [[{ model: ProductList }, "product_code", "ASC"]],
//       limit: limit,
//       offset: offset,
//     });

//     const formattedData = rows.map((row) => row.get({ plain: true }));

//     // ✅ Console log the full data structure
//     console.log(
//       "Fetched Before Production Data:",
//       JSON.stringify(formattedData, null, 2)
//     );

//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error("Full error:", error);
//     res.status(500).json({ message: "Error fetching", error: error.message });
//   }
// });

router.route("/actualProductionFetch/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // const getInvoice = await BatchEntryInvoice.findOne({
    //   where: {
    //     batch_entry_id: id,
    //   },
    // });

    const { count, rows } = await BatchEntryFormulatedProduct.findAndCountAll({
      where: {
        batch_entry_id: id,
      },
      include: [
        {
          model: SalesInvoiceTagProduct,
          as: "befp_sales_product_tag_id",
          attributes: ["unit_price"],
        },
        {
          model: PostProductionFormulatedProducts,
          as: "befmu_pp_formulated_product_id",
          attributes: ["actual_weight"],
        },
        {
          model: ProductList,
          as: "befp_product_id",
          attributes: ["product_id", "product_code", "product_name"],
          include: [
            {
              model: PostProductionProduct,
              as: "ppp_product_id",
            },
          ],
        },
      ],
      order: [
        [{ model: ProductList, as: "befp_product_id" }, "product_code", "ASC"],
      ],

      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    // ✅ Console log the full data structure
    console.log(
      "Fetched Before Production Data:",
      JSON.stringify(formattedData, null, 2)
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({ message: "Error fetching", error: error.message });
  }
});

// actual production
// router.route("/actualProductionFetch/:id").get(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const getInvoice = await BatchEntryInvoice.findOne({
//       where: {
//         batch_entry_id: id,
//       },
//     });

//     const { count, rows } = await SalesInvoiceTagProduct.findAndCountAll({
//       where: {
//         sales_invoice_id: getInvoice.sales_invoice_id,
//       },
//       include: [
//         {
//           model: SalesInvoice,
//           include: [
//             {
//               model: BatchEntryInvoice,
//               required: true,
//             },
//           ],
//         },
//         {
//           model: ProductList,
//           include: [
//             {
//               model: PostProductionProduct,
//               as: "ppp_product_id",
//             },
//           ],
//         },
//       ],
//       order: [[{ model: ProductList }, "product_code", "ASC"]],
//       limit: limit,
//       offset: offset,
//     });

//     const formattedData = rows.map((row) => row.get({ plain: true }));

//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error("Full error:", error);
//     res.status(500).json({ message: "Error fetching", error: error.message });
//   }
// });

router.route("/rawMaterialFetch/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } =
      await BatchEntryFormulatedMaterialUsed.findAndCountAll({
        where: { batch_entry_id: id },
        include: [
          {
            model: PostProductionRawMaterials,
            as: "befmu_pp_raw_material",
            attributes: ["actual_weight"],
          },
          {
            model: ProductList,
            as: "befmu_product_id",
            attributes: ["product_id", "product_code", "product_name"],
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
                attributes: ["id", "packaging_name", "unit", "unit_quantity"],
              },
            ],
          },
          {
            model: BatchEntryStockManagementHistory,
            as: "bestm_be_material_used_id",
            attributes: ["cost_amount"],
          },
        ],
        // order: [[{ model: ProductList }, "product_code", "ASC"]],
        limit,
        offset,
      });

    const formattedData = rows.map((row, index) => {
      const raw = row.get({ plain: true });

      let productTag;
      let selectedAlias;

      if (
        raw.original_product_tag_vendor_id &&
        !raw.replacement_product_tag_vendor_id
      ) {
        productTag = raw.original_material;
        selectedAlias = "this is original_material";
      } else if (
        raw.original_product_tag_vendor_id &&
        raw.replacement_product_tag_vendor_id
      ) {
        productTag = raw.replacement_material;
        selectedAlias = "this is replacement_material";
      } else {
        productTag = null;
        selectedAlias = "none";
      }

      console.log(
        `\n[${index + 1}] quantity_required: ${raw.quantity_required}`
      );
      console.log(`Selected alias: ${selectedAlias}`);
      console.log("ProductTag Info:", productTag);

      return {
        ...raw,
        resolved_product_tag: productTag,
      };
    });

    console.log("this is raw mat used", formattedData);
    console.log("this is the raw data", rows);

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({
      message: "Error generating QC forms",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// raw mat used
// router.route("/rawMaterialFetch/:id").get(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const { count, rows } = await BatchEntryRawMaterials.findAndCountAll({
//       where: { batch_entry_id: id },
//       include: [
//         {
//           model: Product_Tag_Vendor,
//           as: "original_material",
//           include: [
//             {
//               model: ProductList,
//               include: [
//                 {
//                   model: Packaging,
//                   as: "prod_packaging",
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: Product_Tag_Vendor,
//           as: "replacement_material",
//           include: [
//             {
//               model: ProductList,
//               include: [
//                 {
//                   model: Packaging,
//                   as: "prod_packaging",
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//       order: [
//         [
//           { model: Product_Tag_Vendor, as: "original_material" },
//           { model: ProductList },
//           "product_code",
//           "ASC",
//         ],
//       ],
//       limit,
//       offset,
//     });

//     const formattedData = rows.map((row, index) => {
//       const raw = row.get({ plain: true });

//       let productTag;
//       let selectedAlias;

//       if (
//         raw.original_product_tag_vendor_id &&
//         !raw.replacement_product_tag_vendor_id
//       ) {
//         productTag = raw.original_material;
//         selectedAlias = "this is original_material";
//       } else if (
//         raw.original_product_tag_vendor_id &&
//         raw.replacement_product_tag_vendor_id
//       ) {
//         productTag = raw.replacement_material;
//         selectedAlias = "this is replacement_material";
//       } else {
//         productTag = null;
//         selectedAlias = "none";
//       }

//       console.log(
//         `\n[${index + 1}] quantity_required: ${raw.quantity_required}`
//       );
//       console.log(`Selected alias: ${selectedAlias}`);
//       console.log("ProductTag Info:", productTag);

//       return {
//         ...raw,
//         resolved_product_tag: productTag,
//       };
//     });

//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error("Full error:", error);
//     res.status(500).json({
//       message: "Error generating QC forms",
//       error: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// });

// totals ordered quantity
router.route("/totalQuantityOrdered/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const getInvoice = await BatchEntryInvoice.findOne({
      where: {
        batch_entry_id: id,
      },
    });

    if (!getInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const total = await SalesInvoiceTagProduct.findOne({
      where: {
        sales_invoice_id: getInvoice.sales_invoice_id,
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      ],
      raw: true,
    });

    return res.status(200).json({
      total_quantity: parseFloat(total.total_quantity || 0),
    });
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({
      message: "Error summing quantity",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// total weight in
// router.route("/totalWeightIn/:id").get(async (req, res) => {
//   try {
//     const { id } = req.params;

//     const getInvoice = await BatchEntryInvoice.findOne({
//       where: {
//         batch_entry_id: id,
//       },
//     });

//     const products = await SalesInvoiceTagProduct.findAll({
//       where: {
//         sales_invoice_id: getInvoice.sales_invoice_id,
//       },
//       include: [
//         {
//           model: ProductList,
//           include: [
//             {
//               model: PostProductionProduct,
//               as: "ppp_product_id",
//             },
//           ],
//         },
//       ],
//     });

//     let totalWeight = 0;

//     for (const product of products) {
//       const weight = product.product_list?.ppp_product_id?.weight || 0;
//       totalWeight += weight;
//     }

//     return res.status(200).json({ total_weight: totalWeight });
//   } catch (error) {
//     console.error("Full error:", error);
//     res.status(500).json({
//       message: "Error fetching total weight",
//       error: error.message,
//     });
//   }
// });

// total weight in
router.route("/totalWeightIn/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const totalWeightIn = await BatchEntryFormulatedProduct.sum("weight", {
      where: {
        batch_entry_id: id,
      },
    });

    return res.status(200).json({
      total_weight_in: totalWeightIn || 0,
    });
  } catch (error) {
    console.error("Error fetching total quantity required:", error);
    res.status(500).json({
      message: "Error fetching total quantity required",
      error: error.message,
    });
  }
});

// totalRawTargetWeight
router.route("/totalRawTargetWeight/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const totalRawTargetWeight = await BatchEntryFormulatedMaterialUsed.sum(
      "target_weight",
      {
        where: {
          batch_entry_id: id,
        },
      }
    );

    return res.status(200).json({
      total_target_weight_raw: totalRawTargetWeight || 0,
    });
  } catch (error) {
    console.error("Error fetching total quantity required:", error);
    res.status(500).json({
      message: "Error fetching total quantity required",
      error: error.message,
    });
  }
});

// update product loss
router.route("/updateProductionLoss").post(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { batch_id, actual_production, raw_materials, summary } = req.body;

    console.log("=== SERVER RECEIVED DATA ===");
    console.log("Batch ID:", batch_id);
    console.log("--- Actual Production Data ---", actual_production);
    console.log("--- Raw Materials Data ---", raw_materials);
    console.log("--- Summary Data ---", summary);

    if (!batch_id || !Array.isArray(actual_production)) {
      throw new Error("Invalid or missing batch_id or actual_production array");
    }

    const postProduction = await PostProduction.findOne({
      where: { batch_entry_id: batch_id },
      transaction,
    });

    if (!postProduction) {
      throw new Error("PostProduction record not found");
    }

    // check if there are existing records
    const [formulatedCount, rawMaterialsCount] = await Promise.all([
      PostProductionFormulatedProducts.count({
        where: { post_production_id: postProduction.id },
        transaction,
      }),
      PostProductionRawMaterials.count({
        where: { post_production_id: postProduction.id },
        transaction,
      }),
    ]);

    // Process actual production (formulated products)
    for (const production of actual_production) {
      const {
        product_id,
        batch_entry_product_id,
        batch_entry_id,
        actual_weight,
        target_weight,
      } = production;

      if (formulatedCount === 0) {
        // Create new record
        await PostProductionFormulatedProducts.create(
          {
            post_production_id: postProduction.id,
            batch_entry_id,
            batch_entry_product_id,
            product_id,
            actual_weight,
            target_weight,
          },
          { transaction }
        );
      } else {
        // Update existing record
        await PostProductionFormulatedProducts.update(
          {
            actual_weight,
            target_weight,
          },
          {
            where: {
              post_production_id: postProduction.id,
              batch_entry_product_id,
              product_id,
            },
            transaction,
          }
        );
      }
    }

    // Process raw materials
    for (const material of raw_materials) {
      const {
        product_id,
        batch_entry_raw_id,
        batch_entry_id,
        actual_weight,
        target_weight,
      } = material;

      if (rawMaterialsCount === 0) {
        // Create new record
        await PostProductionRawMaterials.create(
          {
            post_production_id: postProduction.id,
            batch_entry_raw_id,
            batch_entry_id,
            product_id,
            actual_weight,
            target_weight,
          },
          { transaction }
        );
      } else {
        // Update existing record
        await PostProductionRawMaterials.update(
          {
            actual_weight,
            target_weight,
          },
          {
            where: {
              post_production_id: postProduction.id,
              batch_entry_raw_id,
              product_id,
            },
            transaction,
          }
        );
      }
    }

    // Update Summary in PostProduction
    if (summary) {
      await PostProduction.update(
        {
          total_weight_in: summary.weight_in,
          total_weight_out: summary.weight_out,
          total_quantity_required: summary.quantity_required,
          total_quantity_used: summary.quantity_used,
          total_quantity_ordered: summary.quantity_ordered,
          total_quantity_produced: summary.quantity_produced,
          total_loss: summary.loss,
          total_production_loss: summary.loss_percentage,
        },
        {
          where: { batch_entry_id: batch_id },
          transaction,
        }
      );
    }

    await transaction.commit();
    res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error("Error update:", error);
    res.status(500).json({
      message: "Error update",
      error: error.message,
    });
  }
});

// update product loss
// router.route("/updateProductionLoss").post(async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const { batch_id, actual_production, raw_materials, summary } = req.body;

//     console.log("=== SERVER RECEIVED DATA ===");
//     console.log("Batch ID:", batch_id);
//     console.log("--- Actual Production Data ---", actual_production);
//     console.log("--- Raw Materials Data ---", raw_materials);
//     console.log("--- Summary Data ---", summary);

//     if (!batch_id || !Array.isArray(actual_production)) {
//       throw new Error("Invalid or missing batch_id or actual_production array");
//     }

//     // Update SalesInvoiceTagProduct.actual_quantity and PostProductionProduct.actual_weight
//     for (const production of actual_production) {
//       const {
//         id,
//         quantity_produced,
//         actual_weight,
//         product_code,
//         product_name,
//       } = production;

//       // Find the corresponding SalesInvoiceTagProduct by ID
//       const invoiceTag = await SalesInvoiceTagProduct.findOne({
//         where: { id },
//         transaction,
//       });

//       if (!invoiceTag) {
//         console.warn(`SalesInvoiceTagProduct not found for ID: ${id}`);
//         continue;
//       }

//       // Update actual_quantity in SalesInvoiceTagProduct
//       await SalesInvoiceTagProduct.update(
//         { actual_quantity: quantity_produced },
//         {
//           where: { id },
//           transaction,
//         }
//       );

//       // Update actual_weight in PostProductionProduct using product_id and batch_entry_id
//       await PostProductionProduct.update(
//         { actual_weight: actual_weight },
//         {
//           where: {
//             product_id: invoiceTag.product_id,
//             batch_entry_id: batch_id,
//           },
//           transaction,
//         }
//       );
//     }

//     // update raw materials in batch entry raw materials
//     for (const material of raw_materials) {
//       const { id, product_code, product_name, quantity_used, unit_cost } =
//         material;
//       await BatchEntryRawMaterials.update(
//         { quantity_used },
//         {
//           where: { id },
//           transaction,
//         }
//       );
//     }

//     //  Update Summary in PostProduction
//     if (summary) {
//       await PostProduction.update(
//         {
//           total_weight_in: summary.weight_in,
//           total_weight_out: summary.weight_out,
//           total_quantity_required: summary.quantity_required,
//           total_quantity_used: summary.quantity_used,
//           total_quantity_ordered: summary.quantity_ordered,
//           total_quantity_produced: summary.quantity_produced,
//           total_loss: summary.loss,
//           total_production_loss: summary.loss_percentage,
//         },
//         {
//           where: { batch_entry_id: batch_id },
//           transaction,
//         }
//       );
//     }

//     await transaction.commit();
//     res.status(200).json({ success: true });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error update:", error);
//     res.status(500).json({
//       message: "Error update",
//       error: error.message,
//     });
//   }
// });

router.route("/get-status/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const postProduction = await PostProduction.findOne({
      where: {
        batch_entry_id: id,
      },
      attributes: ["status"],
    });

    return res.status(200).json({
      success: true,
      status: postProduction.status || "",
    });
  } catch (error) {
    console.error("Error fetching post production status:", error);
    res.status(500).json({
      message: "Error fetching post production status",
      error: error.message,
    });
  }
});

router.route("/update-status").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { newStatus, batch_id } = req.body;

    await PostProduction.update(
      {
        status: newStatus,
      },
      {
        where: { batch_entry_id: batch_id },
        transaction,
      }
    );

    await transaction.commit();
    res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error("Error update:", error);
    res.status(500).json({
      message: "Error update",
      error: error.message,
    });
  }
});

// for cost list
router.route("/fetchCostList/:id").get(async (req, res) => {
  try {
    const fetchCostList = await BatchEntryCostList.findAll({
      where: { batch_entry_id: req.params.id },
    });

    if (!fetchCostList) {
      return res
        .status(404)
        .json({ success: false, message: "Batch not found" });
    }

    console.log("THIS IS THE COST LIST", fetchCostList);

    return res.status(200).json({
      success: true,
      data: fetchCostList,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// for export
router.get("/getSavedProductionData/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Use existing fetch functions to get data
    const [beforeResponse, actualResponse, rawResponse, postProduction] =
      await Promise.all([
        // Before production
        BatchEntryFormulatedProduct.findAll({
          where: { batch_entry_id: id },
          include: [
            {
              model: SalesInvoiceTagProduct,
              as: "befp_sales_product_tag_id",
              attributes: ["unit_price"],
            },
            {
              model: ProductList,
              as: "befp_product_id",
              attributes: ["product_id", "product_code", "product_name"],
            },
          ],
          attributes: ["id", "weight"],
        }),

        // Actual production (saved data from PostProductionFormulatedProducts)
        // FIXED: Using correct alias based on your error message
        PostProductionFormulatedProducts.findAll({
          where: { batch_entry_id: id },
          include: [
            {
              model: BatchEntryFormulatedProduct,
              as: "befmu_pp_formulated_product_id", // CORRECTED ALIAS
              include: [
                {
                  model: SalesInvoiceTagProduct,
                  as: "befp_sales_product_tag_id",
                  attributes: ["unit_price"],
                },
                {
                  model: ProductList,
                  as: "befp_product_id",
                  attributes: ["product_id", "product_code", "product_name"],
                },
              ],
            },
          ],
          attributes: ["id", "actual_weight"],
        }),

        // Raw materials (saved data from PostProductionRawMaterials)
        PostProductionRawMaterials.findAll({
          where: { batch_entry_id: id },
          include: [
            {
              model: BatchEntryFormulatedMaterialUsed,
              as: "befmu_pp_raw_material", // Using the alias from your rawMaterialFetch route
              include: [
                {
                  model: ProductList,
                  as: "befmu_product_id",
                  attributes: ["product_id", "product_code", "product_name"],
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      attributes: [
                        "id",
                        "packaging_name",
                        "unit",
                        "unit_quantity",
                      ],
                    },
                  ],
                },
                {
                  model: BatchEntryStockManagementHistory,
                  as: "bestm_be_material_used_id",
                  attributes: ["cost_amount"],
                },
              ],
            },
          ],
          attributes: ["id", "actual_weight", "target_weight"],
        }),

        // Post production totals
        PostProduction.findOne({
          where: { batch_entry_id: id },
          attributes: [
            "total_weight_in",
            "total_weight_out",
            "total_quantity_required",
            "total_quantity_used",
            "total_quantity_ordered",
            "total_quantity_produced",
            "total_loss",
            "total_production_loss",
          ],
        }),
      ]);

    // Format before production data
    const beforeProduction = beforeResponse.map((item) => ({
      id: item.id,
      product_code: item.befp_product_id?.product_code || "-",
      product_name: item.befp_product_id?.product_name || "-",
      weight: item.weight || 0,
      unit_price: item.befp_sales_product_tag_id?.unit_price || 0,
    }));

    // Format actual production data - use saved data if available
    let actualProduction = [];
    if (actualResponse && actualResponse.length > 0) {
      actualProduction = actualResponse.map((item) => ({
        id: item.id,
        product_code:
          item.befmu_pp_formulated_product_id?.befp_product_id?.product_code ||
          "-",
        product_name:
          item.befmu_pp_formulated_product_id?.befp_product_id?.product_name ||
          "-",
        actual_weight: item.actual_weight || 0,
        unit_price:
          item.befmu_pp_formulated_product_id?.befp_sales_product_tag_id
            ?.unit_price || 0,
      }));
    } else {
      // If no saved actual production data, use before production data with 0 actual_weight
      actualProduction = beforeResponse.map((item) => ({
        id: item.id,
        product_code: item.befp_product_id?.product_code || "-",
        product_name: item.befp_product_id?.product_name || "-",
        actual_weight: 0,
        unit_price: item.befp_sales_product_tag_id?.unit_price || 0,
      }));
    }

    // Format raw materials data
    let rawMaterials = [];
    if (rawResponse && rawResponse.length > 0) {
      rawMaterials = rawResponse.map((item) => {
        const product = item.befmu_pp_raw_material?.befmu_product_id;
        const packaging = product?.prod_packaging;
        const uomString = packaging
          ? `${packaging.packaging_name} - (${packaging.unit_quantity}${packaging.unit})`
          : "-";

        const costAmount =
          item.befmu_pp_raw_material?.bestm_be_material_used_id?.cost_amount ||
          0;

        return {
          id: item.id,
          product_code: product?.product_code || "-",
          product_name: product?.product_name || "-",
          uom_string: uomString,
          target_weight: item.target_weight || 0,
          actual_weight: item.actual_weight || 0,
          cost_amount: costAmount,
        };
      });
    } else {
      // If no saved raw materials data, fetch from BatchEntryFormulatedMaterialUsed
      const rawMaterialsUsed = await BatchEntryFormulatedMaterialUsed.findAll({
        where: { batch_entry_id: id },
        include: [
          {
            model: ProductList,
            as: "befmu_product_id",
            attributes: ["product_id", "product_code", "product_name"],
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
                attributes: ["id", "packaging_name", "unit", "unit_quantity"],
              },
            ],
          },
          {
            model: BatchEntryStockManagementHistory,
            as: "bestm_be_material_used_id",
            attributes: ["cost_amount"],
          },
        ],
        attributes: ["id", "target_weight"],
      });

      rawMaterials = rawMaterialsUsed.map((item) => {
        const product = item.befmu_product_id;
        const packaging = product?.prod_packaging;
        const uomString = packaging
          ? `${packaging.packaging_name} - (${packaging.unit_quantity}${packaging.unit})`
          : "-";

        const costAmount = item.bestm_be_material_used_id?.cost_amount || 0;

        return {
          id: item.id,
          product_code: product?.product_code || "-",
          product_name: product?.product_name || "-",
          uom_string: uomString,
          target_weight: item.target_weight || 0,
          actual_weight: 0, // Default to 0 if not saved
          cost_amount: costAmount,
        };
      });
    }

    // Calculate total material cost
    const totalMaterialCost = rawMaterials.reduce((sum, item) => {
      return sum + (parseFloat(item.cost_amount) || 0);
    }, 0);

    // Prepare totals
    const totals = {
      weight_in: postProduction?.total_weight_in || 0,
      weight_out: postProduction?.total_weight_out || 0,
      quantity_required: postProduction?.total_quantity_required || 0,
      quantity_used: postProduction?.total_quantity_used || 0,
      quantity_ordered: postProduction?.total_quantity_ordered || 0,
      quantity_produced: postProduction?.total_quantity_produced || 0,
      loss: postProduction?.total_loss || 0,
      loss_percentage: postProduction?.total_production_loss || 0,
      material_cost: totalMaterialCost,
    };

    res.json({
      success: true,
      beforeProduction,
      actualProduction,
      rawMaterials,
      totals,
    });
  } catch (error) {
    console.error("Error fetching saved production data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch saved production data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
