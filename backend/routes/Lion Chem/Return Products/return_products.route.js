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
  ReturnProduct,
  ReturnProductList,
  ReturnProductHistory,
  SalesInvoiceStockManagementHistory,
  ReturnStockHistory,
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

router.get("/fetchFiltered", async (req, res) => {
  const { filterStatus, filterColumn } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = { isDeleted: 0 };

  // if (filterColumn) {
  //   switch (filterColumn) {
  //     case "scheduleCode":
  //       whereClause["company_name"] = {
  //         [Op.like]: `%${searchText}%`,
  //       };
  //       break;
  //     case "company_nature":
  //       whereClause["company_nature"] = {
  //         [Op.like]: `%${searchText}%`,
  //       };
  //       break;
  //     case "company_email":
  //       whereClause["company_email"] = {
  //         [Op.like]: `%${searchText}%`,
  //       };
  //       break;
  //     case "company_designation":
  //       whereClause["company_designation"] = {
  //         [Op.like]: `%${searchText}%`,
  //       };
  //       break;
  //     case "contact_person":
  //       whereClause = sequelize.where(
  //         fn("CONCAT", col("fname"), " ", col("lname")),
  //         {
  //           [Op.like]: `%${searchText}%`,
  //         }
  //       );
  //       break;
  //     case "contact":
  //       whereClause["contact"] = {
  //         [Op.like]: `%${searchText}%`,
  //       };
  //       break;
  //     case "currency":
  //       whereClause["$currency.currency_name$"] = {
  //         [Op.like]: `%${searchText}%`,
  //       };
  //       break;
  //     default:
  //       whereClause = {
  //         [Op.or]: [
  //           ...vendorTableColumn.map((col) => {
  //             return {
  //               [col]: {
  //                 [Op.like]: `%${searchText}%`,
  //               },
  //             };
  //           }),
  //           sequelize.where(fn("CONCAT", col("fname"), " ", col("lname")), {
  //             [Op.like]: `%${searchText}%`,
  //           }),
  //           {
  //             "$currency.currency_name$": {
  //               [Op.like]: `%${searchText}%`,
  //             },
  //           },
  //         ],
  //       };
  //       break;
  //   }
  // }

  // if (filterDateRequested) {
  //   // Set the filter date to midnight (start of the day)
  //   const filterDate = new Date(filterDateRequested);
  //   filterDate.setHours(0, 0, 0, 0); // Set to 00:00:00

  //   // Create the end of the day date (23:59:59.999)
  //   const endOfDay = new Date(filterDate);
  //   endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59.999

  //   whereClause.createdAt = {
  //     [Op.between]: [filterDate, endOfDay],
  //   };
  // }

  // if (filterDeliveryDate) {
  //   whereClause.delivery_date = new Date(filterDeliveryDate);
  // }

  if (filterStatus !== "" && filterStatus) {
    whereClause.status = filterStatus;
  }

  const { count, rows } = await ReturnProduct.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: MasterList,
        as: "rp_created_by",
      },
      {
        model: MasterList,
        as: "rp_approved_by",
      },
      {
        model: MasterList,
        as: "rp_rejected_by",
      },
      {
        model: MasterList,
        as: "rp_closed_by",
      },
    ],
    order: [["title", "ASC"]],
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

// router.get("/fetchSearch", async (req, res) => {
//   try {
//     const { searchText, searchField } = req.query;
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
//           case "return_product_code":
//             whereClause.return_product_code = { [Op.like]: `%${text}%` };
//             break;
//           case "title":
//             whereClause.title = { [Op.like]: `%${text}%` };
//             break;
//           case "createdAt":
//             whereClause[Op.or] = [
//               ...createDateTimeSearchConditions(
//                 "return_product",
//                 searchText,
//                 "createdAt"
//               ),
//             ];
//             break;
//           case "requestedBy":
//             whereClause[Op.and] = Sequelize.where(
//               Sequelize.literal(
//                 `CONCAT(\`rp_created_by\`.fname, ' ', \`rp_created_by\`.lname)`
//               ),
//               { [Op.like]: `%${text}%` }
//             );
//             break;
//           case "approvedBy":
//             whereClause[Op.and] = Sequelize.where(
//               Sequelize.literal(
//                 `CONCAT(\`rp_approved_by\`.fname, ' ', \`rp_approved_by\`.lname)`
//               ),
//               { [Op.like]: `%${text}%` }
//             );
//             break;
//         }
//       }
//     } else {
//       if (searchText && searchText.trim() !== "") {
//         // determine if searchtext is a number
//         const text = !isNaN(searchText.trim()[0])
//           ? searchText.trim().replace(/,/g, "")
//           : searchText.trim();

//         whereClause[Op.or] = [
//           { return_product_code: { [Op.like]: `%${text}%` } },
//           { title: { [Op.like]: `%${text}%` } },

//           // QUANTITY TO BE RETURNED
//           Sequelize.where(Sequelize.col("total_quantity"), {
//             [Op.like]: `%${text}%`,
//           }),
//           // DATE CREATED
//           ...createDateTimeSearchConditions(
//             "return_product",
//             text,
//             "createdAt"
//           ),
//           //REQUESTOR
//           Sequelize.where(
//             Sequelize.literal(
//               `CONCAT(\`rp_created_by\`.fname, ' ', \`rp_created_by\`.lname)`
//             ),
//             { [Op.like]: `%${text}%` }
//           ),
//           //approved
//           Sequelize.where(
//             Sequelize.literal(
//               `CONCAT(\`rp_approved_by\`.fname, ' ', \`rp_approved_by\`.lname)`
//             ),
//             { [Op.like]: `%${text}%` }
//           ),
//           { status: { [Op.like]: `%${text}%` } },
//         ];
//       }
//     }

//     const { count, rows } = await ReturnProduct.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: MasterList,
//           as: "rp_created_by",
//         },
//         {
//           model: MasterList,
//           as: "rp_approved_by",
//         },
//         {
//           model: MasterList,
//           as: "rp_rejected_by",
//         },
//         {
//           model: MasterList,
//           as: "rp_closed_by",
//         },
//       ],
//       order: [["title", "ASC"]],
//       limit: limit,
//       offset: offset,
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

// fetchData

router.get("/fetchSearch", async (req, res) => {
  try {
    const { searchText, searchField } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    const include = [
      {
        model: MasterList,
        as: "rp_created_by",
      },
      {
        model: MasterList,
        as: "rp_approved_by",
      },
      {
        model: MasterList,
        as: "rp_rejected_by",
      },
      {
        model: MasterList,
        as: "rp_closed_by",
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (!searchField) {
        whereClause[Op.or] = [
          { return_product_code: { [Op.like]: `%${text}%` } },
          { title: { [Op.like]: `%${text}%` } },
          // WEIGHT TO BE RETURNED
          {
            [Op.or]: [
              (() => {
                const cleanText = text.replace(/,/g, "");
                const searchNumber = parseFloat(cleanText);
                if (!isNaN(searchNumber)) {
                  if (text.endsWith(",")) {
                    return {
                      total_weight: {
                        [Op.between]: [searchNumber, searchNumber + 1],
                      },
                    };
                  }
                  return {
                    total_weight: {
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
                  Sequelize.fn("FORMAT", Sequelize.col("total_weight"), 0),
                  ",",
                  ""
                ),
                {
                  [Op.like]: `%${text.replace(/,/g, "")}%`,
                }
              ),
              Sequelize.where(Sequelize.literal(`CAST(total_weight AS CHAR)`), {
                [Op.like]: `%${text}%`,
              }),
            ].filter((condition) => condition !== null),
          },
          // DATE CREATED
          ...createDateTimeSearchConditions(
            "return_product",
            text,
            "createdAt"
          ),
          //REQUESTOR
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`rp_created_by\`.fname, ' ', \`rp_created_by\`.lname)`
            ),
            { [Op.like]: `%${text}%` }
          ),
          //approved
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`rp_approved_by\`.fname, ' ', \`rp_approved_by\`.lname)`
            ),
            { [Op.like]: `%${text}%` }
          ),
          { status: { [Op.like]: `%${text}%` } },
        ];
      } else {
        switch (searchField) {
          case "return_product_code":
            whereClause.return_product_code = { [Op.like]: `%${text}%` };
            break;
          case "title":
            whereClause.title = { [Op.like]: `%${text}%` };
            break;
          case "date_created":
            whereClause[Op.or] = [
              ...createDateTimeSearchConditions(
                "return_product",
                searchText,
                "createdAt"
              ),
            ];
            break;
          case "requestor":
            whereClause[Op.and] = [
              Sequelize.where(
                Sequelize.literal(
                  "CONCAT(`rp_created_by`.fname, ' ', `rp_created_by`.lname)"
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
                  "CONCAT(`rp_approved_by`.fname, ' ', `rp_approved_by`.lname)"
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ];
            break;
          // case "gross_amount":
          //   const cleanText = text.replace(/,/g, "");
          //   const searchNumber = parseFloat(cleanText);

          //   whereClause[Op.or] = [
          //     // Exact numeric match (for complete numbers)
          //     ...(!isNaN(searchNumber)
          //       ? [
          //           {
          //             total_gross: {
          //               [Op.between]: [
          //                 searchNumber - 0.0001,
          //                 searchNumber + 0.0001,
          //               ],
          //             },
          //           },
          //         ]
          //       : []),

          //     // Partial numeric matching (like "11" matching 110.00)
          //     Sequelize.where(
          //       Sequelize.fn(
          //         "REPLACE",
          //         Sequelize.fn("FORMAT", Sequelize.col("total_gross"), 0),
          //         ",",
          //         ""
          //       ),
          //       {
          //         [Op.like]: `%${cleanText}%`,
          //       }
          //     ),

          //     // Formatted string matching (handles comma-separated numbers)
          //     Sequelize.where(
          //       Sequelize.fn("FORMAT", Sequelize.col("total_gross"), 0),
          //       {
          //         [Op.like]: `%${text}%`,
          //       }
          //     ),

          //     // Raw string matching
          //     Sequelize.where(Sequelize.literal(`CAST(total_gross AS CHAR)`), {
          //       [Op.like]: `%${text}%`,
          //     }),
          //   ].filter(
          //     (condition) =>
          //       condition !== null && Object.keys(condition).length > 0
          //   );
          //   break;
        }
      }
    }

    const { count, rows } = await ReturnProduct.findAndCountAll({
      where: whereClause,
      include,
      order: [["title", "ASC"]],
      limit: limit,
      offset: offset,
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

router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ReturnProduct.findAndCountAll({
      include: [
        {
          model: MasterList,
          as: "rp_created_by",
        },
        {
          model: MasterList,
          as: "rp_approved_by",
        },
        {
          model: MasterList,
          as: "rp_rejected_by",
        },
        {
          model: MasterList,
          as: "rp_closed_by",
        },
      ],
      order: [["title", "ASC"]],
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

// fetch specific return product
router.route("/fetchReturnProduct/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    console.log("this is the return id", id); // move above the return

    const getReturnProduct = await ReturnProduct.findOne({
      where: {
        id,
        isDeleted: 0,
      },
      include: [
        { model: MasterList, as: "rp_created_by" },
        { model: MasterList, as: "rp_approved_by" },
        { model: MasterList, as: "rp_rejected_by" },
      ],
    });

    if (!getReturnProduct) {
      return res.status(404).json({
        success: false,
        message: "Return product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: getReturnProduct.get({ plain: true }),
    });
  } catch (error) {
    console.error("Detailed error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// fetch specific return product table
router.route("/fetchReturnProductTable/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ReturnProductList.findAndCountAll({
      where: {
        return_product_id: id,
      },
      include: [
        {
          model: ScheduleProductList,
          as: "rpl_schedule_product_list_id",
          include: [
            {
              model: ScheduleModel,
              as: "spl_schedule_id",
            },
            {
              model: ProductList,
              as: "schedule_product_list_product_id",
            },
            {
              model: SalesInvoice,
              as: "spl_schedule_invoice_id",
              include: [
                {
                  model: Customer,
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
      limit,
      offset,
    });

    const data = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      success: true,
      data,
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

    const { count, rows } = await ScheduleProductList.findAndCountAll({
      include: [
        {
          model: ProductList,
          as: "schedule_product_list_product_id", // make sure this alias is also correct
        },
        {
          model: SalesInvoice,
          as: "spl_schedule_invoice_id",
          include: [
            {
              model: Customer,
            },
          ],
        },
        {
          model: ScheduleModel,
          as: "spl_schedule_id",
          where: {
            status: {
              [Op.in]: ["Delivered", "Partial-Deliver"], // only include schedules with valid status
            },
          },
          required: true, // ensures inner join (excludes null schedules)
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
      logging: console.log, // optional: helps you debug the SQL
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

// Add this new route to your backend
router.route("/fetchSelectedSchedules").get(async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];

    if (ids.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const schedules = await ScheduleProductList.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
      include: [
        {
          model: ProductList,
          as: "schedule_product_list_product_id",
        },
        {
          model: SalesInvoice,
          as: "spl_schedule_invoice_id",
          include: [
            {
              model: Customer,
            },
          ],
        },
        {
          model: ScheduleModel,
          as: "spl_schedule_id",
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const data = schedules.map((schedule) => schedule.get({ plain: true }));

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching selected schedules:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// const createReturnProduct = await ReturnProduct.create(
//   {
//     return_product_code: returnId,
//     title: returnName,
//     move_to: moveTo,
//     total_quantity: totalQuantity,
//     remarks: remarks,
//   },
//   { transaction }
// );

// create return
// router.route("/create").post(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     console.log("Received return data:", req.body);
//     const {
//       returnId,
//       returnName,
//       moveTo,
//       totalQuantity,
//       remarks,
//       userLogged,
//       items,
//     } = req.body;

//     const groupedKeys = new Set();
//     const scheduleIds = new Set();

//     // 1. Update ScheduleProductList
//     for (const item of items) {
//       const { scheduleProductListId, returnQuantity } = item;

//       const scheduleProduct = await ScheduleProductList.findOne({
//         where: { id: scheduleProductListId },
//         transaction,
//       });

//       if (!scheduleProduct) {
//         throw new Error(
//           `ScheduleProductList with id ${scheduleProductListId} not found`
//         );
//       }

//       const newOriginalQty =
//         (scheduleProduct.original_quantity || 0) - returnQuantity;

//       await ScheduleProductList.update(
//         {
//           original_quantity: newOriginalQty,
//           quantity_to_return: returnQuantity,
//         },
//         {
//           where: { id: scheduleProductListId },
//           transaction,
//         }
//       );

//       // Combine full UUIDs using a custom delimiter
//       const key = `${scheduleProduct.schedule_id}|${scheduleProduct.schedule_invoice_id}`;
//       groupedKeys.add(key);
//       scheduleIds.add(scheduleProduct.schedule_id);
//     }

//     console.log("Grouped Keys:", [...groupedKeys]);

//     // 2. Update ScheduleInvoiceList based on updated ScheduleProductList aggregates
//     for (const key of groupedKeys) {
//       const [schedule_id, sales_invoice_id] = key.split("|");

//       console.log("Processing aggregate for:", {
//         schedule_id,
//         sales_invoice_id,
//       });

//       const aggregates = await ScheduleProductList.findAll({
//         where: {
//           schedule_id,
//           schedule_invoice_id: sales_invoice_id,
//         },
//         attributes: [
//           [
//             sequelize.fn("SUM", sequelize.col("original_quantity")),
//             "totalOriginalQty",
//           ],
//           [
//             sequelize.fn("SUM", sequelize.col("quantity_to_return")),
//             "totalReturnQty",
//           ],
//         ],
//         raw: true,
//         transaction,
//       });

//       const totalOriginalQty = parseInt(aggregates[0].totalOriginalQty) || 0;
//       const totalReturnQty = parseInt(aggregates[0].totalReturnQty) || 0;

//       console.log("Aggregate result:", aggregates[0]);

//       await ScheduleInvoiceList.update(
//         {
//           oredered_quantity: totalOriginalQty,
//           quantity_to_return: totalReturnQty,
//         },
//         {
//           where: {
//             schedule_id,
//             sales_invoice_id,
//           },
//           transaction,
//         }
//       );
//     }

//     // 3. Update ScheduleModel.quantity_to_return from ScheduleInvoiceList aggregates
//     for (const scheduleId of scheduleIds) {
//       const totalReturnQtyAggregate = await ScheduleInvoiceList.findAll({
//         where: { schedule_id: scheduleId },
//         attributes: [
//           [
//             sequelize.fn("SUM", sequelize.col("quantity_to_return")),
//             "totalReturnQty",
//           ],
//         ],
//         raw: true,
//         transaction,
//       });

//       const totalReturnQty =
//         parseInt(totalReturnQtyAggregate[0].totalReturnQty) || 0;

//       await ScheduleModel.update(
//         {
//           quantity_to_return: totalReturnQty,
//         },
//         {
//           where: { id: scheduleId },
//           transaction,
//         }
//       );
//     }

//     // 4. Create ReturnProduct record
//     const addReturnProduct = await ReturnProduct.create(
//       {
//         return_product_code: returnId,
//         title: returnName,
//         move_to: moveTo,
//         total_quantity: totalQuantity,
//         status: "To Review",
//         remarks,
//         createdBy: userLogged,
//       },
//       { transaction }
//     );

//     // 5. Create ReturnProductList records
//     for (const item of items) {
//       const { scheduleProductListId, returnQuantity } = item;

//       const fetchScheduleProductList = await ScheduleProductList.findOne({
//         where: { id: scheduleProductListId },
//         transaction,
//       });

//       await ReturnProductList.create(
//         {
//           return_product_id: addReturnProduct.id,
//           schedule_product_list_id: scheduleProductListId,
//           original_quantity: fetchScheduleProductList.original_quantity,
//           return_quantity: returnQuantity,
//         },
//         { transaction }
//       );
//     }

//     await transaction.commit();

//     res.status(200).json({
//       success: true,
//       message: "Return product created successfully",
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error creating return product:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create return product",
//       error: error.message,
//     });
//   }
// });

// create OLD
// router.route("/create").post(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     console.log("Received return data:", req.body);
//     const {
//       returnId,
//       returnName,
//       moveTo,
//       totalWeightQuantity,
//       remarks,
//       userLogged,
//       items,
//     } = req.body;

//     const addReturnProduct = await ReturnProduct.create(
//       {
//         return_product_code: returnId,
//         title: returnName,
//         move_to: moveTo,
//         total_weight: totalWeightQuantity,
//         status: "To Review",
//         remarks,
//         createdBy: userLogged,
//       },
//       { transaction }
//     );

//     const uniqueScheduleCombos = new Set();

//     for (const item of items) {
//       const { scheduleProductListId, returnWeight } = item;

//       const fetchScheduleProductList = await ScheduleProductList.findOne({
//         where: { id: scheduleProductListId },
//         attributes: [
//           "schedule_id",
//           "schedule_invoice_id",
//           "non_modify_weight",
//           "original_quantity",
//           "original_weight",
//           "delivered_weight",
//         ],
//         transaction,
//       });

//       // await ReturnProductList.create(
//       //   {
//       //     return_product_id: addReturnProduct.id,
//       //     schedule_product_list_id: scheduleProductListId,
//       //     original_quantity: fetchScheduleProductList.original_quantity,
//       //     return_quantity: returnQuantity,
//       //   },
//       //   { transaction }
//       // );

//       await ReturnProductList.create(
//         {
//           return_product_id: addReturnProduct.id,
//           schedule_product_list_id: scheduleProductListId,
//           delivered_weight: fetchScheduleProductList.delivered_weight,
//           original_weight: fetchScheduleProductList.original_weight,
//           return_weight: returnWeight,
//         },
//         { transaction }
//       );

//       const newOriginalWeight =
//         fetchScheduleProductList.original_weight - returnWeight;

//       // await ScheduleProductList.update(
//       //   { original_quantity: newOriginalQty },
//       //   { where: { id: scheduleProductListId }, transaction }
//       // );

//       await ScheduleProductList.update(
//         { original_weight: newOriginalWeight },
//         { where: { id: scheduleProductListId }, transaction }
//       );

//       const comboKey = `${fetchScheduleProductList.schedule_id}|${fetchScheduleProductList.schedule_invoice_id}`;
//       uniqueScheduleCombos.add(comboKey);
//     }

//     // 👉 Sum updated original_quantity per unique combo and update ScheduleInvoiceList
//     for (const combo of uniqueScheduleCombos) {
//       const [schedule_id, sales_invoice_id] = combo.split("|");

//       const sumResult = await ScheduleProductList.findOne({
//         where: {
//           schedule_id,
//           schedule_invoice_id: sales_invoice_id,
//         },
//         attributes: [
//           [sequelize.fn("SUM", sequelize.col("original_weight")), "weight"],
//         ],
//         raw: true,
//         transaction,
//       });

//       const totalWeight = parseInt(sumResult.weight) || 0;

//       console.log(
//         `Updating ScheduleInvoiceList for combo ${combo} with weight: ${totalWeight}`
//       );

//       await ScheduleInvoiceList.update(
//         {
//           ordered_weight: totalWeight,
//         },
//         {
//           where: {
//             schedule_id,
//             sales_invoice_id,
//           },
//           transaction,
//         }
//       );
//     }

//     await transaction.commit();

//     res.status(200).json({
//       success: true,
//       message: "Return product created and quantities updated successfully",
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error creating return product:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create return product",
//       error: error.message,
//     });
//   }
// });

// update status OLD
// router.route("/updateStatus/:id").put(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { id } = req.params;
//     const { status, remarks, userLogged } = req.body;

//     const updateData = {
//       updatedAt: new Date(),
//     };

//     if (status === "Approved") {
//       updateData.status = "Approved";
//       updateData.approvedRemarks = remarks;
//       updateData.approvedBy = userLogged;
//       updateData.approvedAt = new Date();
//     } else if (status === "Declined") {
//       updateData.status = "Declined";
//       updateData.rejectedRemarks = remarks;
//       updateData.rejectedBy = userLogged;
//       updateData.rejectedAt = new Date();

//       // 1. Fetch all return product items
//       const returnProducts = await ReturnProductList.findAll({
//         where: {
//           isDeleted: 0,
//           return_product_id: id,
//         },
//         include: [
//           {
//             model: ScheduleProductList,
//             as: "rpl_schedule_product_list_id",
//             attributes: [
//               "id",
//               "original_quantity",
//               "original_weight",
//               "schedule_id",
//               "schedule_invoice_id",
//             ],
//           },
//         ],
//         transaction,
//       });

//       // 2. Calculate updates and track totals in memory
//       const scheduleUpdates = [];
//       const totalsMap = new Map(); // Tracks totals by schedule/invoice combo

//       for (const rp of returnProducts) {
//         const spl = rp.rpl_schedule_product_list_id;
//         const newWeight = spl.original_weight + rp.return_weight;

//         // Track the update
//         scheduleUpdates.push({
//           id: spl.id,
//           newWeight,
//         });

//         // Update our in-memory totals
//         const key = `${spl.schedule_id}|${spl.schedule_invoice_id}`;
//         const current = totalsMap.get(key) || {
//           schedule_id: spl.schedule_id,
//           schedule_invoice_id: spl.schedule_invoice_id,
//           total: 0,
//         };
//         current.total += rp.return_weight;
//         totalsMap.set(key, current);
//       }

//       // 3. Perform all ScheduleProductList updates
//       for (const update of scheduleUpdates) {
//         await ScheduleProductList.update(
//           { original_weight: update.newWeight },
//           { where: { id: update.id }, transaction }
//         );
//       }

//       // 4. Update ScheduleInvoiceList using our in-memory totals
//       for (const [_, total] of totalsMap) {
//         console.log(
//           `Updating invoice ${total.schedule_invoice_id} with new total ${total.total}`
//         );

//         await ScheduleInvoiceList.update(
//           {
//             ordered_weight: sequelize.literal(
//               `ordered_weight + ${total.total}`
//             ),
//           },
//           {
//             where: {
//               schedule_id: total.schedule_id,
//               sales_invoice_id: total.schedule_invoice_id,
//             },
//             transaction,
//           }
//         );
//       }
//     } else if (status === "Closed") {
//       updateData.status = "Closed";
//       updateData.closedRemarks = remarks;
//       updateData.closedBy = userLogged;
//       updateData.closedAt = new Date();
//     }

//     // 5. Update the main return product record
//     await ReturnProduct.update(updateData, {
//       where: { id },
//       transaction,
//     });

//     await transaction.commit();

//     res.status(200).json({
//       success: true,
//       message: `Return product ${status.toLowerCase()} successfully`,
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error updating status:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update return product status",
//       error: error.message,
//     });
//   }
// });

router.route("/create").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Received return data:", req.body);
    const {
      returnId,
      returnName,
      moveTo,
      totalWeightQuantity,
      remarks,
      userLogged,
      items,
    } = req.body;

    // Create the main return product record
    const addReturnProduct = await ReturnProduct.create(
      {
        return_product_code: returnId,
        title: returnName,
        move_to: moveTo,
        total_weight: totalWeightQuantity,
        status: "To Review",
        remarks,
        createdBy: userLogged,
      },
      { transaction }
    );

    // Create return product list items without modifying any schedule tables
    for (const item of items) {
      const { scheduleProductListId, returnWeight } = item;

      const fetchScheduleProductList = await ScheduleProductList.findOne({
        where: { id: scheduleProductListId },
        attributes: [
          "schedule_id",
          "schedule_invoice_id",
          "non_modify_weight",
          "original_quantity",
          "original_weight",
          "delivered_quantity",
        ],
        transaction,
      });

      await ReturnProductList.create(
        {
          return_product_id: addReturnProduct.id,
          schedule_product_list_id: scheduleProductListId,
          delivered_weight: fetchScheduleProductList.delivered_quantity,
          original_weight: fetchScheduleProductList.original_weight,
          return_weight: returnWeight,
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Return product created successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating return product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create return product",
      error: error.message,
    });
  }
});

router.route("/updateStatus/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, remarks, userLogged } = req.body;

    const updateData = {
      updatedAt: new Date(),
    };

    if (status === "Delivered") {
      updateData.status = "Delivered";
      updateData.deliveredRemarks = remarks;
      updateData.deliveredBy = userLogged;
      updateData.deliveredAt = new Date();
    } else if (status === "Declined") {
      updateData.status = "Declined";
      updateData.rejectedRemarks = remarks;
      updateData.rejectedBy = userLogged;
      updateData.rejectedAt = new Date();
    } else if (status === "Closed") {
      updateData.status = "Closed";
      updateData.closedRemarks = remarks;
      updateData.closedBy = userLogged;
      updateData.closedAt = new Date();
    } else if (status === "Approved") {
      updateData.status = "Approved";
      updateData.approvedRemarks = remarks;
      updateData.approvedBy = userLogged;
      updateData.approvedAt = new Date();

      // 1/7/26 - gerard
      // return the product to stock management
      const getReturnProducts = await ReturnProduct.findOne({
        where: {
          id,
        },
        transaction,
      });

      if (getReturnProducts) {
        // fetch return product
        const getReturnProductList = await ReturnProductList.findAll({
          where: {
            return_product_id: id,
            isDeleted: 0,
          },
          include: [
            {
              model: ScheduleProductList,
              as: "rpl_schedule_product_list_id",
              include: [
                {
                  model: ProductList,
                  as: "schedule_product_list_product_id",
                },
                {
                  model: SalesInvoice,
                  as: "spl_schedule_invoice_id",
                },
              ],
            },
          ],
          transaction,
        });

        // check if to dispose or to return to stock
        if (getReturnProducts.move_to === "Inventory") {
          // loop to each return product list
          for (const rpl of getReturnProductList) {
            // quantity to add to inventory
            const returnWeight = rpl.return_weight || 0;
            const packagingUnitQuantity =
              rpl.rpl_schedule_product_list_id.packaging_unit_quantity || 1;
            let remainingQuantity = returnWeight / packagingUnitQuantity;

            //distinguish if the product is raw or finished product
            if (
              rpl.rpl_schedule_product_list_id.schedule_product_list_product_id
                .product_category === "Raw Materials"
            ) {
              // raw product - REVERSE FIFO (newest expiry date first)
              const getStockManagement = await StockManagement.findAll({
                where: {
                  product_id:
                    rpl.rpl_schedule_product_list_id
                      .schedule_product_list_product_id.product_id,
                },
                order: [["expiry_date", "DESC"]], // Newest first for returns
                transaction,
              });

              if (getStockManagement.length > 0) {
                console.log(`\n=== Processing Raw Material Return ===`);
                console.log(
                  `Product: ${rpl.rpl_schedule_product_list_id.schedule_product_list_product_id.product_name}`
                );
                console.log(`Total to return: ${remainingQuantity}`);
                console.log(`Starting with newest expiry date first...\n`);

                // Process stock entries from newest to oldest expiry date
                for (const stockEntry of getStockManagement) {
                  if (remainingQuantity <= 0) break;

                  const stockEntryId = stockEntry.stock_management_id;

                  // Get the sales invoice stock management deduction history for this stock entry
                  const getSalesInvoiceHistory =
                    await SalesInvoiceStockManagementHistory.findAll({
                      where: {
                        stock_management_id: stockEntryId,
                        sales_invoice_id:
                          rpl.rpl_schedule_product_list_id
                            .spl_schedule_invoice_id.sales_invoice_id,
                      },
                      transaction,
                    });

                  if (getSalesInvoiceHistory.length > 0) {
                    // Sum all deductions from this sales invoice for this stock entry
                    const totalDeductedFromThisEntry =
                      getSalesInvoiceHistory.reduce(
                        (sum, history) => sum + (history.deducted_stock || 0),
                        0
                      );

                    // Get current stock in this entry
                    const currentStock = parseFloat(stockEntry.stock) || 0;

                    // Calculate how much can be returned to this entry
                    // Maximum is up to the original deducted amount (minus any already returned)
                    const maxReturnable = totalDeductedFromThisEntry;
                    const capacityAvailable = maxReturnable;

                    // Return up to capacity or remaining quantity, whichever is smaller
                    const quantityToReturnToThisEntry = Math.min(
                      remainingQuantity,
                      capacityAvailable > 0 ? capacityAvailable : 0
                    );

                    if (quantityToReturnToThisEntry > 0) {
                      console.log(`Stock Entry ID: ${stockEntryId}`);
                      console.log(
                        `  Product Name: ${rpl.rpl_schedule_product_list_id.schedule_product_list_product_id.product_name}`
                      );
                      console.log(`  Expiry Date: ${stockEntry.expiry_date}`);
                      console.log(`  Current Stock: ${currentStock}`);
                      console.log(
                        `  Originally Deducted: ${totalDeductedFromThisEntry}`
                      );
                      console.log(`  Capacity Available: ${capacityAvailable}`);
                      console.log(
                        `  Returning to this entry: ${quantityToReturnToThisEntry}`
                      );

                      // Update stock management - ADD back the quantity
                      const newStock =
                        currentStock + quantityToReturnToThisEntry;
                      console.log(`  New Stock: ${newStock}`);

                      await StockManagement.update(
                        {
                          stock: newStock,
                          updatedAt: new Date(),
                        },
                        {
                          where: { stock_management_id: stockEntryId },
                          transaction,
                        }
                      );

                      // Create return history record
                      await ReturnStockHistory.create(
                        {
                          return_product_list_id: rpl.id,
                          stock_management_id: stockEntryId,
                          sales_invoice_id:
                            rpl.rpl_schedule_product_list_id
                              .spl_schedule_invoice_id.sales_invoice_id,
                          return_quantity: quantityToReturnToThisEntry,
                          lot: stockEntry.lot || null,
                          expiry_date: stockEntry.expiry_date || null,
                          isDeleted: 0,
                          notes: `Returned to stock (Reverse FIFO - newest expiry first)`,
                          createdBy: userLogged,
                        },
                        { transaction }
                      );

                      remainingQuantity -= quantityToReturnToThisEntry;
                      console.log(
                        `  Remaining to distribute: ${remainingQuantity}\n`
                      );
                    }
                  }
                }

                // // If there's still remaining quantity after filling all available capacities -- probably rare and it should not happen
                // if (remainingQuantity > 0) {
                //   console.log(
                //     `Still have ${remainingQuantity} remaining after filling all available capacities.`
                //   );
                //   console.log(
                //     `Creating new stock entry for the remaining quantity...`
                //   );

                //   // Create a new stock entry for the remaining quantity
                //   const newStockEntry = await StockManagement.create(
                //     {
                //       product_id:
                //         rpl.rpl_schedule_product_list_id
                //           .schedule_product_list_product_id.product_id,
                //       product_code:
                //         rpl.rpl_schedule_product_list_id
                //           .schedule_product_list_product_id.product_code,
                //       stock: remainingQuantity,
                //       price: 0, // You might want to set this from product data
                //       lot: null,
                //       expiry_date: null, // No expiry date for newly created returns
                //       createdBy: userLogged,
                //       transaction,
                //     },
                //     { transaction }
                //   );

                //   // Create return history for the new stock entry
                //   await ReturnHistory.create(
                //     {
                //       stock_management_id: newStockEntry.stock_management_id,
                //       schedule_id: rpl.rpl_schedule_product_list_id.schedule_id,
                //       sales_invoice_id:
                //         rpl.rpl_schedule_product_list_id.spl_schedule_invoice_id
                //           .sales_invoice_id,
                //       return_quantity: remainingQuantity,
                //       lot: null,
                //       expiry_date: null,
                //       createdBy: userLogged,
                //       isDeleted: 0,
                //       return_product_list_id: rpl.id,
                //       notes: `New stock entry created for excess returned quantity`,
                //     },
                //     { transaction }
                //   );

                //   console.log(
                //     `Created new stock entry ID: ${newStockEntry.stock_management_id} for ${remainingQuantity} units\n`
                //   );
                // }
              }
            } else {
              // For finished products - ADD to specific transaction inventory
              await StockManagement.update(
                {
                  stock: Sequelize.literal(
                    `stock + ${remainingQuantity}` // Changed from minus to plus
                  ),
                  updatedAt: new Date(),
                },
                {
                  where: {
                    product_id: rpl.product_id,
                    transaction_number:
                      rpl.spl_schedule_invoice_id.transaction_id,
                  },
                  transaction,
                }
              );

              const stockEntries = await StockManagement.findAll({
                where: {
                  product_id: rpl.product_id,
                  transaction_number:
                    rpl.spl_schedule_invoice_id.transaction_id,
                },
                transaction,
              });

              // Find or create history record for addition
              if (stockEntries.length > 0) {
                await ReturnStockHistory.create(
                  {
                    return_product_list_id: rpl.id,
                    stock_management_id: stockEntries[0].stock_management_id,
                    sales_invoice_id:
                      rpl.rpl_schedule_product_list_id.spl_schedule_invoice_id
                        .sales_invoice_id,
                    return_quantity: remainingQuantity,
                    lot: stockEntries[0].lot || null,
                    expiry_date: stockEntries[0].expiry_date || null,
                    createdBy: userLogged,
                    isDeleted: 0,
                  },
                  { transaction }
                );
              }
            }
          }
        }
      }

      // Fetch all return product items
      const returnProducts = await ReturnProductList.findAll({
        where: {
          isDeleted: 0,
          return_product_id: id,
        },
        include: [
          {
            model: ScheduleProductList,
            as: "rpl_schedule_product_list_id",
            attributes: [
              "id",
              "returned_weight",
              "schedule_id",
              "schedule_invoice_id",
            ],
          },
        ],
        transaction,
      });

      const scheduleInvoicesMap = new Map();
      const scheduleList = new Set();

      // Update returned_weight in ScheduleProductList ONLY
      for (const rp of returnProducts) {
        const spl = rp.rpl_schedule_product_list_id;
        if (!spl) {
          console.warn(
            `Missing ScheduleProductList relation for RP ID ${rp.id}`
          );
          continue;
        }

        const newReturnedWeight = spl.returned_weight + rp.return_weight;

        // Update returned_weight in ScheduleProductList
        await ScheduleProductList.update(
          {
            returned_weight: newReturnedWeight,
          },
          { where: { id: spl.id }, transaction }
        );

        if (spl.schedule_invoice_id) {
          const invoiceID = spl.schedule_invoice_id;

          // Use rp.return_weight here for proper accumulation
          const existingWeight = scheduleInvoicesMap.get(invoiceID) || 0;
          scheduleInvoicesMap.set(invoiceID, existingWeight + rp.return_weight);
        } else {
          console.warn(`Missing schedule_invoice_id for SPL ID ${spl.id}`);
        }

        if (spl.schedule_id) {
          scheduleList.add(spl.schedule_id);
        } else {
          console.warn(`Missing schedule_id for SPL ID ${spl.id}`);
        }
      }

      console.log(scheduleInvoicesMap, "MAP NG INVOICES");

      for (const [
        invoiceID,
        totalReturnedWeight,
      ] of scheduleInvoicesMap.entries()) {
        await ScheduleInvoiceList.update(
          {
            status: "Re-schedule",
            returned_weight: totalReturnedWeight,
          },
          {
            where: { sales_invoice_id: invoiceID },
            transaction,
          }
        );
      }

      for (const scheduleID of scheduleList) {
        await ScheduleModel.update(
          {
            status: "Re-schedule",
          },
          {
            where: { id: scheduleID },
            transaction,
          }
        );
        await ScheduleDeliver.create(
          {
            schedule_id: scheduleID,
            title: "Re-schedule (Returned Products)",
            delivered_date: new Date(), // Ensure order
            remarks: remarks,
            createdBy: userLogged,
          },
          { transaction }
        );
      }
    }

    // Update the main return product record
    await ReturnProduct.update(updateData, {
      where: { id },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Return product ${status.toLowerCase()} successfully!`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update return product status",
      error: error.message,
    });
  }
});

module.exports = router;
