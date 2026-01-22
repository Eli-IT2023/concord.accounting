const express = require("express");
const { Op, Sequelize, col, literal, where } = require("sequelize");
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");
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
  CompanyProfile,
  BatchEntryInvoice,
  SalesInvoice,
  Customer,
  BatchEntryMain,
  PostProduction,
  SalesInvoiceTagProduct,
  ScheduleModel,
  ScheduleInvoiceList,
  ScheduleProductList,
  ScheduleDeliver,
  ScheduleDeductionHistory,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment-timezone");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// fetch dr
// router.route("/fetchInvoiceDR").get(async (req, res) => {
//   try {
//     // Step 1: Get all ScheduleInvoiceList with ScheduleModel
//     const existingScheduleDR = await ScheduleInvoiceList.findAll({
//       include: [
//         {
//           model: ScheduleModel,
//           as: "sil_schedule_id",
//           where: {
//             status: { [Op.ne]: "Declined" },
//           },
//         },
//       ],
//     });

//     // Step 2: Build a Set of disallowed combinations
//     const excludedMap = new Set(
//       existingScheduleDR.map(
//         (entry) => `${entry.batch_entry_id}_${entry.sales_invoice_id}`
//       )
//     );

//     // Step 3: Fetch the data
//     const data = await BatchEntryInvoice.findAll({
//       include: [
//         {
//           model: SalesInvoice,
//           include: [
//             { model: Customer },
//             {
//               model: SalesInvoiceTagProduct,
//               attributes: [],
//               required: false,
//             },
//           ],
//           attributes: {
//             include: [
//               [
//                 sequelize.fn(
//                   "SUM",
//                   sequelize.col(
//                     "sales_invoice->sales_invoice_tag_products.quantity"
//                   )
//                 ),
//                 "total_ordered",
//               ],
//             ],
//           },
//           required: true,
//         },
//         {
//           model: BatchEntryMain,
//           include: [
//             {
//               model: PostProduction,
//               as: "pp_batch_entry_id",
//               where: {
//                 status: { [Op.ne]: "In Progress" },
//               },
//               required: true,
//             },
//           ],
//         },
//       ],
//       group: [
//         "batch_entry_tag_invoice.id",
//         "sales_invoice.sales_invoice_id",
//         "sales_invoice->customer.customer_id",
//         "batch_entry_main.id",
//         "batch_entry_main->pp_batch_entry_id.id",
//       ],
//       subQuery: false,
//     });

//     const newData = await SalesInvoice.findAll({
//       include: [
//         {
//           model: SalesInvoiceTagProduct,
//         },
//         {
//           model: Customer,
//         },
//       ],
//     });

//     // Step 4: Filter out entries that are already in an active (not rejected) schedule
//     // const filtered = newData.filter((entry) => {
//     //   const key = `${entry.batch_entry_id}_${entry.sales_invoice_id}`;
//     //   return !excludedMap.has(key); // keep only if NOT in excluded set
//     // });

//     res.json(newData);
//   } catch (error) {
//     console.error("Detailed error:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });

router.route("/fetchInvoiceDR").get(async (req, res) => {
  try {
    const existingScheduleDR = await ScheduleInvoiceList.findAll({
      include: [
        {
          model: ScheduleModel,
          as: "sil_schedule_id",
          where: {
            status: { [Op.ne]: "Declined" },
          },
        },
      ],
    });

    // Step 2: Build a Set of disallowed combinations
    const excludedMap = new Set(
      existingScheduleDR.map(
        (entry) => `${entry.batch_entry_id}_${entry.sales_invoice_id}`
      )
    );

    // Step 1: Get all ScheduleInvoiceList with ScheduleModel
    const newData = await SalesInvoice.findAll({
      include: [
        {
          model: SalesInvoiceTagProduct,
        },
        {
          model: Customer,
        },
      ],
    });

    //Step 4: Filter out entries that are already in an active (not rejected) schedule
    const filtered = newData.filter((entry) => {
      const key = `${entry.batch_entry_id}_${entry.sales_invoice_id}`;
      return !excludedMap.has(key); // keep only if NOT in excluded set
    });

    return res.status(200).json({
      data: filtered,
      success: true,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// product list in the invoice
router.route("/fetchInvoiceDRProductList").get(async (req, res) => {
  try {
    const { sales_invoice_id } = req.query;

    if (!sales_invoice_id) {
      return res.status(400).json({
        message: "sales_invoice_id parameter is required",
      });
    }

    const data = await SalesInvoiceTagProduct.findAll({
      where: {
        sales_invoice_id: sales_invoice_id,
      },
      include: [
        {
          model: ProductList,
          attributes: ["product_name", "product_code", "product_id"],
        },
      ],
      attributes: ["quantity", "packaging_unit_quantity"],
    });

    // Transform the data for easier frontend consumption
    const transformedData = data.map((item) => ({
      id: item.id,
      product_name: item.product_list.product_name,
      product_code: item.product_list.product_code,
      quantity: item.quantity,
      product_id: item.product_list.product_id,
      packaging_unit_quantity: item.packaging_unit_quantity,
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// create schedule
router.route("/create").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      scheduleID,
      scheduleTitle,
      deliveryDate,
      totalWeight,
      driver,
      porters,
      remarks,
      plateNo,
      createdBy,
      invoices,
    } = req.body;

    if (!scheduleID || !deliveryDate || !invoices || invoices.length === 0) {
      throw new Error(
        "Missing required fields: scheduleID, deliveryDate, or invoices"
      );
    }

    const createdAt = require("moment")()
      .tz("Asia/Manila")
      .format("YYYY-MM-DD HH:mm:ss");

    const schedule = await ScheduleModel.create(
      {
        schedule_code: scheduleID,
        title: scheduleTitle,
        delivery_date: deliveryDate,
        total_weight: totalWeight,
        non_modify_weight: totalWeight,
        driver,
        porters,
        remarks,
        plate_no: plateNo,
        // status: "On-Schedule",
        status: "For-Approval",
        createdBy,
        createdAt,
      },
      { transaction }
    );

    for (const [index, invoice] of invoices.entries()) {
      // const getBatchEntry = await BatchEntryInvoice.findOne({
      //   where: {
      //     sales_invoice_id: invoice.invoiceId,
      //   },
      // });

      // if (!getBatchEntry) {
      //   throw new Error(
      //     `No BatchEntryInvoice found for invoice ID: ${invoice.invoiceId}`
      //   );

      // Determine status for the invoice invoice
      const itemStatus =
        parseFloat(invoice.weightToDeliver) >=
        parseFloat(invoice.totalWeightOrdered)
          ? "Delivered"
          : "Partial-Deliver";

      // Create the ScheduleInvoiceList record
      const scheduleInvoice = await ScheduleInvoiceList.create(
        {
          schedule_id: schedule.id,
          // batch_entry_id: getBatchEntry.batch_entry_id,
          sales_invoice_id: invoice.invoiceId,
          weight_to_deliver: invoice.weightToDeliver,
          ordered_weight: invoice.totalWeightOrdered,
          non_modify_weight: invoice.totalWeightOrdered,
          status: itemStatus,
        },
        { transaction }
      );

      // Create ScheduleProductList records for each product in the invoice
      if (invoice.products && invoice.products.length > 0) {
        for (const product of invoice.products) {
          // Determine status for the product
          const productStatus =
            parseFloat(product.weightToDeliver) >= parseFloat(product.quantity)
              ? "Delivered"
              : "Partial-Deliver";

          const originalQuantity = (
            product.quantity / product.packagingUnitQuantity
          ).toFixed(2);

          await ScheduleProductList.create(
            {
              schedule_id: schedule.id,
              schedule_invoice_id: scheduleInvoice.sales_invoice_id, // Link to the parent invoice
              product_id: product.productId,
              original_weight: product.quantity, // product.weight talaga to
              original_quantity: originalQuantity,
              weight_to_delivered: product.weightToDeliver,
              non_modify_weight: product.quantity, // weight talaga to
              packaging_unit_quantity: product.packagingUnitQuantity,
              status: productStatus,
            },
            { transaction }
          );
        }
      }
    }

    await ScheduleDeliver.create(
      {
        schedule_id: schedule.id,
        title: "Created",
        delivered_date: new Date(),
        remarks: remarks,
        createdBy: createdBy,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Schedule created successfully",
      scheduleID: scheduleID,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error creating schedule:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create schedule",
      error: error.message,
    });
  }
});

// fetch schedule data
router.route("/fetchData").get(async (req, res) => {
  try {
    const data = await ScheduleModel.findAll({
      where: {
        isDeleted: 0,
      },
      include: [
        {
          model: ScheduleInvoiceList,
          as: "sil_schedule_id",
          include: [
            {
              model: SalesInvoice,
              as: "sil_sales_invoice_id",
              include: [
                {
                  model: Customer,
                },
              ],
            },
          ],
        },
        {
          model: MasterList,
          as: "sm_created_by",
        },
        {
          model: MasterList,
          as: "sm_approved_by",
        },
        {
          model: MasterList,
          as: "sm_rejected_by",
        },
      ],
      order: [["delivery_date", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// fetch schedule list with pagination
router.route("/fetchScheduleList").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ScheduleModel.findAndCountAll({
      where: {
        isDeleted: 0,
      },
      include: [
        {
          model: ScheduleInvoiceList,
          as: "sil_schedule_id",
          include: [
            {
              model: SalesInvoice,
              as: "sil_sales_invoice_id",
              include: [
                {
                  model: Customer,
                },
              ],
            },
          ],
        },

        {
          model: MasterList,
          as: "sm_created_by",
        },
        {
          model: MasterList,
          as: "sm_approved_by",
        },
        {
          model: MasterList,
          as: "sm_rejected_by",
        },
      ],
      order: [["delivery_date", "ASC"]],
      limit: limit,
      offset: offset,
    });

    const data = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// router.get("/fetchFilteredScheduleList", async (req, res) => {
//   const {
//     filterStatus,
//     filterDateRequested,
//     filterDeliveryDate,
//     filterColumn,
//   } = req.query;

//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;

//   let whereClause = { isDeleted: 0 };

//   // if (filterColumn) {
//   //   switch (filterColumn) {
//   //     case "scheduleCode":
//   //       whereClause["company_name"] = {
//   //         [Op.like]: `%${searchText}%`,
//   //       };
//   //       break;
//   //     case "company_nature":
//   //       whereClause["company_nature"] = {
//   //         [Op.like]: `%${searchText}%`,
//   //       };
//   //       break;
//   //     case "company_email":
//   //       whereClause["company_email"] = {
//   //         [Op.like]: `%${searchText}%`,
//   //       };
//   //       break;
//   //     case "company_designation":
//   //       whereClause["company_designation"] = {
//   //         [Op.like]: `%${searchText}%`,
//   //       };
//   //       break;
//   //     case "contact_person":
//   //       whereClause = sequelize.where(
//   //         fn("CONCAT", col("fname"), " ", col("lname")),
//   //         {
//   //           [Op.like]: `%${searchText}%`,
//   //         }
//   //       );
//   //       break;
//   //     case "contact":
//   //       whereClause["contact"] = {
//   //         [Op.like]: `%${searchText}%`,
//   //       };
//   //       break;
//   //     case "currency":
//   //       whereClause["$currency.currency_name$"] = {
//   //         [Op.like]: `%${searchText}%`,
//   //       };
//   //       break;
//   //     default:
//   //       whereClause = {
//   //         [Op.or]: [
//   //           ...vendorTableColumn.map((col) => {
//   //             return {
//   //               [col]: {
//   //                 [Op.like]: `%${searchText}%`,
//   //               },
//   //             };
//   //           }),
//   //           sequelize.where(fn("CONCAT", col("fname"), " ", col("lname")), {
//   //             [Op.like]: `%${searchText}%`,
//   //           }),
//   //           {
//   //             "$currency.currency_name$": {
//   //               [Op.like]: `%${searchText}%`,
//   //             },
//   //           },
//   //         ],
//   //       };
//   //       break;
//   //   }
//   // }

//   if (filterStatus !== "All" && filterStatus) {
//     whereClause.status = filterStatus;
//   }

//   if (filterDateRequested) {
//     // Set the filter date to midnight (start of the day)
//     const filterDate = new Date(filterDateRequested);
//     filterDate.setHours(0, 0, 0, 0); // Set to 00:00:00

//     // Create the end of the day date (23:59:59.999)
//     const endOfDay = new Date(filterDate);
//     endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59.999

//     whereClause.createdAt = {
//       [Op.between]: [filterDate, endOfDay],
//     };
//   }

//   if (filterDeliveryDate) {
//     whereClause.delivery_date = new Date(filterDeliveryDate);
//   }

//   const { count, rows } = await ScheduleModel.findAndCountAll({
//     where: whereClause,
//     include: [
//       {
//         model: ScheduleInvoiceList,
//         as: "sil_schedule_id",
//         include: [
//           // {
//           //   model: BatchEntryMain,
//           //   as: "sil_batch_entry_id",
//           // },
//           {
//             model: SalesInvoice,
//             as: "sil_sales_invoice_id",
//             include: [
//               {
//                 model: Customer,
//               },
//             ],
//           },
//         ],
//       },
//       {
//         model: MasterList,
//         as: "sm_created_by",
//       },
//       {
//         model: MasterList,
//         as: "sm_approved_by",
//       },
//       {
//         model: MasterList,
//         as: "sm_rejected_by",
//       },
//     ],
//     order: [["delivery_date", "ASC"]],
//     limit: limit,
//     offset: offset,
//   });

//   const data = rows.map((row) => row.get({ plain: true }));

//   return res.status(200).json({
//     totalItems: count,
//     totalPages: Math.ceil(count / limit),
//     currentPage: page,
//     success: true,
//     data: data,
//   });
// });

// router.get("/fetchSearchScheduleList", async (req, res) => {
//   try {
//     const { searchText, filterColumn, filterStatus } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const whereClause = {};

//     if (filterStatus && filterStatus !== "All") {
//       whereClause.status = filterStatus;
//     }

//     if (filterColumn !== "all") {
//       if (searchText && searchText.trim() !== "") {
//         const text = searchText.trim();
//         switch (filterColumn) {
//           case "scheduleCode":
//             whereClause.schedule_code = { [Op.like]: `%${text}%` };
//             break;
//           case "scheduleName":
//             whereClause.title = { [Op.like]: `%${text}%` };
//             break;
//           case "batchNo":
//             whereClause[Op.and] = Sequelize.where(
//               Sequelize.col(
//                 "sil_schedule_id.sil_batch_entry_id.batch_transaction_number"
//               ),
//               { [Op.like]: `%${text}%` }
//             );
//             break;
//           case "status":
//             whereClause.status = { [Op.like]: `%${text}%` };
//             break;
//         }
//       }
//     } else {
//       if (searchText && searchText.trim() !== "") {
//         const text = !isNaN(searchText.trim()[0])
//           ? searchText.trim().replace(/,/g, "")
//           : searchText.trim();

//         whereClause[Op.or] = [
//           { schedule_code: { [Op.like]: `%${text}%` } },
//           { title: { [Op.like]: `%${text}%` } },
//           // batch no
//           Sequelize.where(
//             Sequelize.col(
//               "sil_schedule_id.sil_batch_entry_id.batch_transaction_number"
//             ),
//             { [Op.like]: `%${text}%` }
//           ),
//           Sequelize.where(
//             Sequelize.literal(
//               `CONCAT(\`sm_approved_by\`.fname, ' ', \`sm_approved_by\`.lname)`
//             ),
//             { [Op.like]: `%${text}%` }
//           ),
//           Sequelize.where(Sequelize.col("sil_schedule_id.ordered_weight"), {
//             [Op.like]: `%${text}%`,
//           }),
//           Sequelize.where(Sequelize.col("sil_schedule_id.delivered_quantity"), {
//             [Op.like]: `%${text}%`,
//           }),
//           // delivered data
//           ...createDateTimeSearchConditions("schedule", text, "delivery_date"),
//           // date requested
//           ...createDateTimeSearchConditions("schedule", text, "createdAt"),
//           { status: { [Op.like]: `%${text}%` } },
//         ];
//       }
//     }
//     const { count, rows } = await ScheduleModel.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: ScheduleInvoiceList,
//           as: "sil_schedule_id",
//           include: [
//             // {
//             //   model: BatchEntryMain,
//             //   as: "sil_batch_entry_id",
//             // },
//             {
//               model: SalesInvoice,
//               as: "sil_sales_invoice_id",
//               include: [
//                 {
//                   model: Customer,
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: MasterList,
//           as: "sm_created_by",
//         },
//         {
//           model: MasterList,
//           as: "sm_approved_by",
//         },
//         {
//           model: MasterList,
//           as: "sm_rejected_by",
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       limit,
//       offset,
//       distinct: true,
//       subQuery: false,
//     });

//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       data: rows,
//     });
//   } catch (error) {
//     console.error("Search error:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });

router.get("/fetchFilteredScheduleList", async (req, res) => {
  const { filterStatus, filterDateRequested, filterDeliveryDate } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = { isDeleted: 0 };

  if (filterStatus !== "All" && filterStatus) {
    whereClause.status = filterStatus;
  }

  if (filterDateRequested) {
    // Set the filter date to midnight (start of the day)
    const filterDate = new Date(filterDateRequested);
    filterDate.setHours(0, 0, 0, 0); // Set to 00:00:00

    // Create the end of the day date (23:59:59.999)
    const endOfDay = new Date(filterDate);
    endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59.999

    whereClause.createdAt = {
      [Op.between]: [filterDate, endOfDay],
    };
  }

  if (filterDeliveryDate) {
    whereClause.delivery_date = new Date(filterDeliveryDate);
  }

  const { count, rows } = await ScheduleModel.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: ScheduleInvoiceList,
        as: "sil_schedule_id",
        include: [
          {
            model: SalesInvoice,
            as: "sil_sales_invoice_id",
            include: [
              {
                model: Customer,
              },
            ],
          },
        ],
      },
      {
        model: MasterList,
        as: "sm_created_by",
      },
      {
        model: MasterList,
        as: "sm_approved_by",
      },
      {
        model: MasterList,
        as: "sm_rejected_by",
      },
    ],
    order: [["delivery_date", "ASC"]],
    limit: limit,
    offset: offset,
  });

  const data = rows.map((row) => row.get({ plain: true }));

  return res.status(200).json({
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    success: true,
    data: data,
  });
});

router.get("/fetchSearchScheduleList", async (req, res) => {
  try {
    const { searchText, searchField } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      isDeleted: 0,
    };

    const include = [
      {
        model: ScheduleInvoiceList,
        as: "sil_schedule_id",
        include: [
          {
            model: SalesInvoice,
            as: "sil_sales_invoice_id",
            include: [
              {
                model: Customer,
              },
            ],
          },
        ],
      },
      {
        model: MasterList,
        as: "sm_created_by",
      },
      {
        model: MasterList,
        as: "sm_approved_by",
      },
      {
        model: MasterList,
        as: "sm_rejected_by",
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (!searchField) {
        whereClause[Op.or] = [
          { schedule_code: { [Op.like]: `%${text}%` } },
          { title: { [Op.like]: `%${text}%` } },
          { status: { [Op.like]: `%${text}%` } },
          ...createDateTimeSearchConditions("schedule", text, "delivery_date"),
          ...createDateTimeSearchConditions("schedule", text, "createdAt"),

          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sm_approved_by\`.fname, ' ', \`sm_approved_by\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),

          // CORRECTED: ordered_weight is in ScheduleInvoiceList, not SalesInvoice
          {
            [Op.or]: [
              (() => {
                const cleanText = text.replace(/,/g, "");
                const searchNumber = parseFloat(cleanText);

                if (!isNaN(searchNumber)) {
                  if (text.endsWith(",")) {
                    return Sequelize.where(
                      Sequelize.col("sil_schedule_id.ordered_weight"),
                      {
                        [Op.between]: [searchNumber, searchNumber + 1],
                      }
                    );
                  }

                  return Sequelize.where(
                    Sequelize.col("sil_schedule_id.ordered_weight"),
                    {
                      [Op.between]: [
                        searchNumber - 0.0001,
                        searchNumber + 0.0001,
                      ],
                    }
                  );
                }

                return null;
              })(),

              Sequelize.where(
                Sequelize.fn(
                  "REPLACE",
                  Sequelize.fn(
                    "FORMAT",
                    Sequelize.col("sil_schedule_id.ordered_weight"),
                    0
                  ),
                  ",",
                  ""
                ),
                {
                  [Op.like]: `%${text.replace(/,/g, "")}%`,
                }
              ),

              Sequelize.where(
                Sequelize.cast(
                  Sequelize.col("sil_schedule_id.ordered_weight"),
                  "CHAR"
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ].filter((condition) => condition !== null),
          },
          // Delivered Weight (this is in Schedule model)
          {
            [Op.or]: [
              (() => {
                const cleanText = text.replace(/,/g, "");
                const searchNumber = parseFloat(cleanText);
                if (!isNaN(searchNumber)) {
                  if (text.endsWith(",")) {
                    return {
                      delivered_weight: {
                        [Op.between]: [searchNumber, searchNumber + 1],
                      },
                    };
                  }
                  return {
                    delivered_weight: {
                      [Op.between]: [
                        searchNumber - 0.0001,
                        searchNumber + 0.0001,
                      ],
                    },
                  };
                }
                return null;
              })(),
              Sequelize.where(
                Sequelize.fn(
                  "REPLACE",
                  Sequelize.fn("FORMAT", Sequelize.col("delivered_weight"), 0),
                  ",",
                  ""
                ),
                {
                  [Op.like]: `%${text.replace(/,/g, "")}%`,
                }
              ),
              Sequelize.where(
                Sequelize.literal(`CAST(delivered_weight AS CHAR)`),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ].filter((condition) => condition !== null),
          },
        ];
      } else {
        switch (searchField) {
          case "schedule_code":
            whereClause.schedule_code = { [Op.like]: `%${text}%` };
            break;
          case "title":
            whereClause.title = { [Op.like]: `%${text}%` };
            break;
          case "status":
            whereClause.status = { [Op.like]: `%${text}%` };
            break;
        }
      }
    }

    const { count, rows } = await ScheduleModel.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    const data = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: data,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// schedule invoice list sa modal with pagination
router.get("/getDetails/:id", async (req, res) => {
  try {
    const schedule = await ScheduleModel.findOne({
      where: { id: req.params.id, isDeleted: 0 },
      include: [
        {
          model: ScheduleInvoiceList,
          as: "sil_schedule_id",
          include: [
            {
              model: SalesInvoice,
              as: "sil_sales_invoice_id",
              include: [{ model: Customer }],
            },
          ],
        },
        {
          model: MasterList,
          as: "sm_created_by",
        },
        {
          model: MasterList,
          as: "sm_approved_by",
        },
        {
          model: MasterList,
          as: "sm_rejected_by",
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.route("/getScheduleInvoiceList/:schedule_id").get(async (req, res) => {
  if (!req.params.schedule_id) {
    console.error("Error: schedule_id is missing");
    return res.status(400).json({ message: "schedule_id is required" });
  }

  try {
    console.log("\nBuilding query with parameters:");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log({
      page,
      limit,
      offset,
      schedule_id: req.params.schedule_id,
    });

    console.log("\nExecuting database query...");
    const { count, rows } = await ScheduleInvoiceList.findAndCountAll({
      where: {
        schedule_id: req.params.schedule_id,
        isDeleted: 0,
      },
      include: [
        {
          model: SalesInvoice,
          as: "sil_sales_invoice_id",
          include: [
            {
              model: Customer,
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
    });

    // console.log("\nQuery results:");
    // console.log("Total count:", count);
    // console.log("Rows found:", rows.length);

    const data = rows.map((row) => {
      const plainData = row.get({ plain: true });
      console.log("Processing row:", plainData.id);
      return plainData;
    });

    // console.log(
    //   "\nFinal response data sample:",
    //   data.length > 0 ? data[0] : "No data"
    // );

    const response = {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      success: true,
      data: data,
    };

    // console.log("\nSending response with status 200");
    return res.status(200).json(response);
  } catch (error) {
    console.error("\nERROR DETAILS:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);

    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Route to get products for a specific schedule invoice
router
  .route("/getScheduleProducts/:schedule_invoice_id")
  .get(async (req, res) => {
    try {
      const { schedule_invoice_id } = req.params;
      const { schedule_id } = req.query; // Get from query params

      console.log("Schedule Invoice ID:", schedule_invoice_id);
      console.log("Schedule ID:", schedule_id);

      if (!schedule_id) {
        return res.status(400).json({
          success: false,
          message: "Schedule ID is required",
        });
      }

      const products = await ScheduleProductList.findAll({
        where: {
          schedule_invoice_id,
          schedule_id, // Add to where clause
        },
        include: [
          {
            model: ProductList,
            as: "schedule_product_list_product_id",
            attributes: ["product_name", "product_code", "product_id"],
          },
        ],
      });

      const transformedData = products.map((product) => ({
        id: product.id,
        product_id: product.product_id,
        product_code: product.schedule_product_list_product_id.product_code,
        product_name: product.schedule_product_list_product_id.product_name,
        original_quantity: product.original_quantity,
        original_weight: product.original_weight,
        returned_weight: product.returned_weight,
        delivered_quantity: product.delivered_quantity,
        weight_to_delivered: product.weight_to_delivered,
        quantity_to_deliver: product.quantity_to_deliver,
        status: product.status,
      }));

      res.json({
        success: true,
        data: transformedData,
      });
    } catch (error) {
      console.error("Error fetching schedule products:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch schedule products",
        error: error.message,
      });
    }
  });

// schedule list update some fields
router.route("/updateSchedule").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      scheduleId,
      scheduleName,
      invoices,
      totalWeight, // renamed from totalQuantity
      deliveryDate,
      remarks,
      userLogged,
      originalDeliveryDate,
      driver,
      porters,
    } = req.body;

    if (!scheduleId) {
      throw new Error("Schedule ID is required");
    }

    // Get the current schedule to check if delivery date is being changed
    const currentSchedule = await ScheduleModel.findOne({
      where: { id: scheduleId },
      transaction,
    });

    if (!currentSchedule) {
      throw new Error("Schedule not found");
    }

    const isDeliveryDateChanged =
      currentSchedule.delivery_date !== deliveryDate;

    // Update schedule main data with weight fields
    await ScheduleModel.update(
      {
        title: scheduleName,
        total_weight: totalWeight, // <-- updated field
        delivery_date: deliveryDate,
        driver,
        porters,
        remarks: remarks,
        updatedAt: new Date(),
      },
      {
        where: { id: scheduleId },
        transaction,
      }
    );

    // Create Re-schedule entry if delivery date was changed
    if (isDeliveryDateChanged && userLogged) {
      const reScheduleRemarks = `Delivery date changed from ${moment(
        currentSchedule.delivery_date
      ).format("MMM DD, YYYY")} to ${moment(deliveryDate).format(
        "MMM DD, YYYY"
      )}${remarks ? ` - ${remarks}` : ""}`;

      await ScheduleDeliver.create(
        {
          schedule_id: scheduleId,
          title: "Re-schedule (Changed Delivery Date)",
          delivered_date: new Date(),
          remarks: reScheduleRemarks,
          createdBy: userLogged,
        },
        { transaction }
      );

      await ScheduleModel.update(
        {
          status: "Re-schedule",
        },
        {
          where: { id: scheduleId },
          transaction,
        }
      );
    }

    for (const invoice of invoices) {
      const currentInvoice = await ScheduleInvoiceList.findOne({
        where: { id: invoice.id },
        transaction,
      });

      if (!currentInvoice) {
        throw new Error(`Invoice not found: ${invoice.id}`);
      }

      // total delivered weight (new weight + existing delivered_weight)
      const totalDeliveredWeight =
        Number(invoice.weight_to_deliver) +
        Number(currentInvoice.delivered_quantity || 0);

      // Invoice status based on weight delivered vs ordered_weight
      const newInvoiceStatus =
        totalDeliveredWeight >= Number(currentInvoice.ordered_weight)
          ? "Delivered"
          : "Partial-Deliver";

      await ScheduleInvoiceList.update(
        {
          weight_to_deliver: invoice.weight_to_deliver, // updated field
          status: newInvoiceStatus,
        },
        {
          where: { id: invoice.id },
          transaction,
        }
      );

      // Update products in the invoice by weight
      for (const product of invoice.products) {
        const currentProduct = await ScheduleProductList.findOne({
          where: { id: product.id },
          transaction,
        });

        if (!currentProduct) {
          throw new Error(`Product not found: ${product.id}`);
        }

        const totalDeliveredWeightProduct =
          Number(product.weight_to_delivered) +
          Number(currentProduct.delivered_quantity || 0);

        const newProductStatus =
          totalDeliveredWeightProduct >= Number(currentProduct.original_weight)
            ? "Delivered"
            : "Partial-Deliver";

        await ScheduleProductList.update(
          {
            weight_to_delivered: product.weight_to_delivered, // updated field
            status: newProductStatus,
          },
          {
            where: { id: product.id },
            transaction,
          }
        );
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      deliveryDateChanged: isDeliveryDateChanged,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Update failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update schedule",
      error: error.message,
    });
  }
});

// update status with remarks
router.route("/updateScheduleStatus").post(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, status, remarks, userLogged, actionDate } = req.body;

    if (!id || !status) {
      throw new Error("Missing required fields: schedule ID or status");
    }

    const now = new Date();
    const updateData = {
      updatedAt: now,
    };

    // STATUS: APPROVED
    if (status === "Approved") {
      updateData.status = "On-Schedule";
      updateData.approvedRemarks = remarks;
      updateData.approvedBy = userLogged;
      updateData.approvedAt = actionDate || now;

      const approvedDate = new Date(now.getTime());
      const onScheduleDate = new Date(now.getTime() + 1000); // Ensure order

      await ScheduleDeliver.create(
        {
          schedule_id: id,
          title: "Approved",
          delivered_date: approvedDate,
          remarks: "Approved by",
          createdBy: userLogged,
        },
        { transaction }
      );

      await ScheduleDeliver.create(
        {
          schedule_id: id,
          title: "On-Schedule",
          delivered_date: onScheduleDate,
          remarks: remarks,
          createdBy: userLogged,
        },
        { transaction }
      );
    }

    // STATUS: DECLINED
    else if (status === "Declined") {
      updateData.status = "Declined";
      updateData.rejectedRemarks = remarks;
      updateData.rejectedBy = userLogged;
      updateData.rejectedAt = actionDate || now;

      await ScheduleDeliver.create(
        {
          schedule_id: id,
          title: "Declined",
          delivered_date: now,
          remarks: remarks,
          createdBy: userLogged,
        },
        { transaction }
      );
    }

    // STATUS: DELIVERED
    else if (status === "Delivered") {
      updateData.status = "Delivered";
      updateData.deliveredRemarks = remarks;
      updateData.deliveredBy = userLogged;
      updateData.deliveredAt = actionDate || now;

      // // deduction for delivered product
      //  // not: already deducted na sya sa sales invoice, no need to deduct again
      // const deductScheduleProductList = await ScheduleProductList.findAll({
      //   where: {
      //     schedule_id: id,
      //   },
      //   include: [
      //     {
      //       model: SalesInvoice,
      //       as: "spl_schedule_invoice_id",
      //     },
      //     {
      //       model: ProductList,
      //       as: "schedule_product_list_product_id",
      //     },
      //   ],
      //   transaction,
      // });

      // for (const deductItem of deductScheduleProductList) {
      //   // get the delivered quantity
      //   const weightToDeliver = deductItem.weight_to_delivered || 0;
      //   const packageUnitQuantity = deductItem.packaging_unit_quantity || 1;
      //   const deliveredQuantity = weightToDeliver / packageUnitQuantity;

      //   console.log("this is the deliveredQuantity", deliveredQuantity);

      //   // check the product category
      //   if (
      //     deductItem.schedule_product_list_product_id.product_category ===
      //     "Raw Materials"
      //   ) {
      //     // FIFO deduction for Raw Materials (based on expiry date)
      //     let remainingQty = deliveredQuantity;
      //     let totalCostForQuantity = 0;
      //     let totalDeductedQty = 0;

      //     // Get stock entries sorted by expiry date (FIFO)
      //     const stockEntries = await StockManagement.findAll({
      //       where: { product_id: deductItem.product_id },
      //       order: [["expiry_date", "ASC"]], // Oldest first (FIFO)
      //       transaction,
      //     });

      //     // Deduct from oldest stock first
      //     for (const stockEntry of stockEntries) {
      //       if (remainingQty <= 0) break;

      //       const available = parseFloat(stockEntry.stock) || 0;
      //       if (available <= 0) continue;

      //       const deduction = Math.min(available, remainingQty);
      //       const newStock = available - deduction;
      //       const stockPrice = parseFloat(stockEntry.price) || 0;
      //       const cost = deduction * stockPrice;

      //       totalCostForQuantity += cost;
      //       totalDeductedQty += deduction;

      //       await StockManagement.update(
      //         { stock: newStock },
      //         {
      //           where: { stock_management_id: stockEntry.stock_management_id },
      //           transaction,
      //         }
      //       );

      //       // Create schedule deduction history record
      //       await ScheduleDeductionHistory.create(
      //         {
      //           stock_management_id: stockEntry.stock_management_id,
      //           schedule_id: id,
      //           sales_invoice_id:
      //             deductItem.spl_schedule_invoice_id.sales_invoice_id,
      //           deducted_quantity: deduction,
      //           lot: stockEntry.lot || null,
      //           expiry_date: stockEntry.expiry_date || null,
      //           createdBy: userLogged,
      //           isDeleted: 0,
      //         },
      //         { transaction }
      //       );

      //       remainingQty -= deduction;
      //     }

      //     // Handle leftover quantities (if not enough stock in positive entries)
      //     if (remainingQty > 0) {
      //       // Get negative stock entries (if any)
      //       const negatives = await StockManagement.findAll({
      //         where: {
      //           product_id: deductItem.product_id,
      //           stock: { [Sequelize.Op.lte]: 0 },
      //         },
      //         order: [["expiry_date", "ASC"]], // Oldest first
      //         transaction,
      //       });

      //       if (negatives.length > 0) {
      //         const spread = remainingQty / negatives.length;
      //         for (const batch of negatives) {
      //           const stockPrice = parseFloat(batch.price) || 0;
      //           const cost = spread * stockPrice;
      //           const newStock = (parseFloat(batch.stock) || 0) - spread;

      //           await StockManagement.update(
      //             { stock: newStock },
      //             {
      //               where: { stock_management_id: batch.stock_management_id },
      //               transaction,
      //             }
      //           );

      //           // Create schedule deduction history record for negative stock
      //           await ScheduleDeductionHistory.create(
      //             {
      //               stock_management_id: batch.stock_management_id,
      //               schedule_id: id,
      //               sales_invoice_id:
      //                 deductItem.spl_schedule_invoice_id.sales_invoice_id,
      //               deducted_quantity: spread,
      //               lot: batch.lot || null,
      //               expiry_date: batch.expiry_date || null,
      //               createdBy: userLogged,
      //               isDeleted: 0,
      //             },
      //             { transaction }
      //           );

      //           totalCostForQuantity += cost;
      //           totalDeductedQty += spread;
      //         }
      //       }
      //     }
      //   } else {
      //     // For finished products - deduct from specific transaction
      //     await StockManagement.update(
      //       {
      //         stock: Sequelize.literal(
      //           `GREATEST(stock - ${deliveredQuantity}, 0)`
      //         ),
      //       },
      //       {
      //         where: {
      //           product_id: deductItem.product_id,
      //           transaction_number:
      //             deductItem.spl_schedule_invoice_id.transaction_id,
      //         },
      //         transaction,
      //       }
      //     );

      //     const stockEntries = await StockManagement.findAll({
      //       where: {
      //         product_id: deductItem.product_id,
      //         transaction_number:
      //           deductItem.spl_schedule_invoice_id.transaction_id,
      //       },
      //       transaction,
      //     });

      //     // Deduct from oldest stock first
      //     if (stockEntries.length > 0) {
      //       await ScheduleDeductionHistory.create(
      //         {
      //           stock_management_id: stockEntries[0].stock_management_id,
      //           schedule_id: id,
      //           sales_invoice_id:
      //             deductItem.spl_schedule_invoice_id.sales_invoice_id,
      //           deducted_quantity: deliveredQuantity,
      //           lot: stockEntries[0].lot || null,
      //           expiry_date: stockEntries[0].expiry_date || null,
      //           createdBy: userLogged,
      //           isDeleted: 0,
      //         },
      //         { transaction }
      //       );
      //     }
      //   }
      // }

      // Fetch associated records
      const [productList, invoiceList, schedule] = await Promise.all([
        ScheduleProductList.findAll({
          where: { schedule_id: id },
          transaction,
        }),
        ScheduleInvoiceList.findAll({
          where: { schedule_id: id },
          transaction,
        }),
        ScheduleModel.findOne({ where: { id }, transaction }),
      ]);

      if (!schedule) throw new Error("Schedule not found");

      // Update product records (weight-based)
      for (const product of productList) {
        const newDeliveredWeight =
          (product.delivered_quantity || 0) +
          (product.weight_to_delivered || 0);

        const newStatus =
          newDeliveredWeight >= product.original_weight
            ? "Delivered"
            : "Partial-Deliver";

        await ScheduleProductList.update(
          {
            delivered_quantity: newDeliveredWeight,
            weight_to_delivered: 0,
            status: newStatus,
            updatedAt: now,
          },
          {
            where: { id: product.id },
            transaction,
          }
        );
      }

      // Update invoice records (weight-based)
      for (const invoice of invoiceList) {
        const newDeliveredWeight =
          (invoice.delivered_quantity || 0) + (invoice.weight_to_deliver || 0);

        const newStatus =
          newDeliveredWeight >= invoice.ordered_weight
            ? "Delivered"
            : "Partial-Deliver";

        await ScheduleInvoiceList.update(
          {
            delivered_quantity: newDeliveredWeight,
            weight_to_deliver: 0,
            status: newStatus,
            updatedAt: now,
          },
          {
            where: { id: invoice.id },
            transaction,
          }
        );

        // Update local reference
        invoice.delivered_quantity = newDeliveredWeight;
      }

      // Check if all invoices are completed
      const allInvoicesCompleted = invoiceList.every(
        (inv) =>
          (inv.delivered_quantity || 0) >=
          inv.ordered_weight + inv.returned_weight
      );

      // Adjust schedule status if not fully delivered
      if (!allInvoicesCompleted) {
        updateData.status = "Partial-Deliver";
      }

      const scheduleDeliverTitle =
        updateData.status === "Partial-Deliver"
          ? "Delivered (Partial-Deliver)"
          : "Delivered";

      await ScheduleDeliver.create(
        {
          schedule_id: id,
          title: scheduleDeliverTitle,
          delivered_date: now,
          remarks: remarks,
          createdBy: userLogged,
        },
        { transaction }
      );
    }

    // Recalculate and update delivered weight in schedule
    const deliveredWeightSum = await ScheduleInvoiceList.sum(
      "delivered_quantity",
      {
        where: { schedule_id: id },
        transaction,
      }
    );

    updateData.delivered_weight = deliveredWeightSum || 0;
    // updateData.total_weight = 0; // Set to zero if you're resetting after delivery

    const updatedSchedule = await ScheduleModel.update(updateData, {
      where: { id },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Schedule ${status.toLowerCase()} successfully`,
      data: updatedSchedule,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Status update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update schedule status",
      error: error.message,
    });
  }
});

// NEW
// router.route("/updateScheduleStatus").post(async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const { id, status, remarks, userLogged, actionDate } = req.body;

//     if (!id || !status) {
//       throw new Error("Missing required fields: schedule ID or status");
//     }

//     const now = new Date();
//     const updateData = {
//       updatedAt: now,
//     };

//     // STATUS: APPROVED
//     if (status === "Approved") {
//       updateData.status = "On-Schedule";
//       updateData.approvedRemarks = remarks;
//       updateData.approvedBy = userLogged;
//       updateData.approvedAt = actionDate || now;

//       const approvedDate = new Date(now.getTime());
//       const onScheduleDate = new Date(now.getTime() + 1000); // Ensure order

//       await ScheduleDeliver.create(
//         {
//           schedule_id: id,
//           title: "Approved",
//           delivered_date: approvedDate,
//           remarks: "Approved by",
//           createdBy: userLogged,
//         },
//         { transaction }
//       );

//       await ScheduleDeliver.create(
//         {
//           schedule_id: id,
//           title: "On-Schedule",
//           delivered_date: onScheduleDate,
//           remarks: remarks,
//           createdBy: userLogged,
//         },
//         { transaction }
//       );
//     }

//     // STATUS: DECLINED
//     else if (status === "Declined") {
//       updateData.status = "Declined";
//       updateData.rejectedRemarks = remarks;
//       updateData.rejectedBy = userLogged;
//       updateData.rejectedAt = actionDate || now;

//       await ScheduleDeliver.create(
//         {
//           schedule_id: id,
//           title: "Declined",
//           delivered_date: now,
//           remarks: remarks,
//           createdBy: userLogged,
//         },
//         { transaction }
//       );
//     }

//     // STATUS: DELIVERED - UPDATED WITH RETURNED_WEIGHT CONDITION
//     else if (status === "Delivered") {
//       updateData.status = "Delivered";
//       updateData.deliveredRemarks = remarks;
//       updateData.deliveredBy = userLogged;
//       updateData.deliveredAt = actionDate || now;

//       // Fetch associated records
//       const [productList, invoiceList, schedule] = await Promise.all([
//         ScheduleProductList.findAll({
//           where: { schedule_id: id },
//           transaction,
//         }),
//         ScheduleInvoiceList.findAll({
//           where: { schedule_id: id },
//           transaction,
//         }),
//         ScheduleModel.findOne({ where: { id }, transaction }),
//       ]);

//       if (!schedule) throw new Error("Schedule not found");

//       // Update product records (weight-based) - UPDATED CONDITION
//       for (const product of productList) {
//         const newDeliveredWeight =
//           (product.delivered_quantity || 0) +
//           (product.weight_to_delivered || 0);

//         // NEW CONDITION: Calculate remaining weight with returned_weight
//         const remainingWeight =
//           product.original_weight -
//           (product.delivered_quantity || 0) +
//           (product.returned_weight || 0);

//         const newStatus =
//           newDeliveredWeight >= remainingWeight
//             ? "Delivered"
//             : "Partial-Deliver";

//         await ScheduleProductList.update(
//           {
//             delivered_quantity: newDeliveredWeight,
//             weight_to_delivered: 0,
//             status: newStatus,
//             updatedAt: now,
//           },
//           {
//             where: { id: product.id },
//             transaction,
//           }
//         );
//       }

//       // Update invoice records (weight-based) - UPDATED CONDITION
//       for (const invoice of invoiceList) {
//         const newDeliveredWeight =
//           (invoice.delivered_quantity || 0) + (invoice.weight_to_deliver || 0);

//         // NEW CONDITION: Calculate remaining weight with returned_weight
//         const remainingWeight =
//           invoice.ordered_weight -
//           (invoice.delivered_quantity || 0) +
//           (invoice.returned_weight || 0);

//         const newStatus =
//           newDeliveredWeight >= remainingWeight
//             ? "Delivered"
//             : "Partial-Deliver";

//         await ScheduleInvoiceList.update(
//           {
//             delivered_quantity: newDeliveredWeight,
//             weight_to_deliver: 0,
//             status: newStatus,
//             updatedAt: now,
//           },
//           {
//             where: { id: invoice.id },
//             transaction,
//           }
//         );

//         // Update local reference
//         invoice.delivered_quantity = newDeliveredWeight;
//         invoice.remainingWeight = remainingWeight; // For the check below
//       }

//       // Check if all invoices are completed - UPDATED CONDITION
//       const allInvoicesCompleted = invoiceList.every((inv) => {
//         const remainingWeight =
//           inv.ordered_weight -
//           (inv.delivered_quantity || 0) +
//           (inv.returned_weight || 0);
//         return (inv.delivered_quantity || 0) >= remainingWeight;
//       });

//       // Adjust schedule status if not fully delivered
//       if (!allInvoicesCompleted) {
//         updateData.status = "Partial-Deliver";
//       }

//       const scheduleDeliverTitle =
//         updateData.status === "Partial-Deliver"
//           ? "Delivered (Partial-Deliver)"
//           : "Delivered";

//       await ScheduleDeliver.create(
//         {
//           schedule_id: id,
//           title: scheduleDeliverTitle,
//           delivered_date: now,
//           remarks: remarks,
//           createdBy: userLogged,
//         },
//         { transaction }
//       );
//     }

//     // Recalculate and update delivered weight in schedule
//     const deliveredWeightSum = await ScheduleInvoiceList.sum(
//       "delivered_quantity",
//       {
//         where: { schedule_id: id },
//         transaction,
//       }
//     );

//     updateData.delivered_weight = deliveredWeightSum || 0;
//     updateData.total_weight = 0; // Set to zero if you're resetting after delivery

//     const updatedSchedule = await ScheduleModel.update(updateData, {
//       where: { id },
//       transaction,
//     });

//     await transaction.commit();

//     return res.status(200).json({
//       success: true,
//       message: `Schedule ${status.toLowerCase()} successfully`,
//       data: updatedSchedule,
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Status update failed:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update schedule status",
//       error: error.message,
//     });
//   }
// });

// for timeline fetching
router.get("/getScheduleTimeline/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Schedule ID is required." });
    }

    const timeline = await ScheduleDeliver.findAll({
      where: { schedule_id: id },
      order: [["delivered_date", "ASC"]],
      attributes: ["id", "title", "remarks", "delivered_date"],
      include: [
        {
          model: MasterList,
          as: "sd_created_by", // ensure this alias matches your association
          attributes: ["fname", "lname"],
        },
      ],
    });

    res.status(200).json(timeline);
  } catch (error) {
    console.error("Failed to fetch schedule timeline:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
