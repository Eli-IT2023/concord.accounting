const getAccurateDate = require("../utils/accurate_date_time_today");
const router = require("express").Router();
const { where, Op, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const express = require("express");
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
  Payable_Bulk_Transaction,
  Cutoff,
  Inventory_Report,
  Inventory_Journal,
  Currency,
  Production_Raw_Used,
  Production,
  SalesInvoiceInventory,
  SalesInvoice,
  MasterList,
  StockTransferApproveProducts,
  StockTransfer,
  StockTransferProducts,
  Activity_Log,
  Customer,
} = require("../db/models/associations");

const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  currency_sub,
  bank_transaction,
  CashFlow,
  issued_check,
  ProfitLossReport,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
const AccountListSub3 = require("../db/models/ModelsBySubject/accountlist_sub3.model");

const normalizeDateSearch = require("../utils/dateSearchFormatter"); // adjust path as needed
const { Fn } = require("sequelize/lib/utils");

const {
  likeFilter,
  dateFormatFilter,
  castFilter,
  createdAtFilter,
} = require("../utils/filters/sequelizeSearchFilter");
const PayableJournal = require("../db/models/payable_journal.model");
const CheckJournal = require("../db/models/check_journal.model");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//USED MODULE:
// Payable
// router.route("/fetch").get(async (req, res) => {
//   const { startDate, endDate, filterColumn, searchText } = req.query;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;
//   try {
//     let searchFilterWhereClause = {
//       purchaseDate: {
//         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//       },
//     };
//     let warehouseWhereClause = {};
//     let vendorWhereClause = {};
//     const payableTableColumn = [
//       "transaction_id",
//       "MOP",
//       "discount_value",
//       "due_date",
//       "purchaseDate",
//       "container_number",
//       "pier",
//       "status",
//     ];
//     // Handle Date
//     const parseDate = () => {
//       try {
//         if (searchText == "") {
//           searchFilterWhereClause = {
//             purchaseDate: {
//               [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//             },
//           };
//           return "Invalid Date";
//         }

//         if (searchText.toLowerCase() == "n/a") {
//           return "Invalid Date";
//         }

//         if (!searchText.includes("/")) {
//           searchFilterWhereClause = {
//             createdAt: new Date(0),
//           }; // return nothing
//           return "Invalid Date";
//         }

//         // For raw date without specific time
//         const rawStringToDate = new Date(searchText);
//         const stringDate = new Date(
//           rawStringToDate?.toISOString()?.split("T")[0] || ""
//         );
//         stringDate?.setDate(stringDate?.getDate() + 1);
//         // // Validate date if less than start date and greater than end date
//         // if (
//         //   stringDate < new Date(startDate) ||
//         //   stringDate > new Date(endDate)
//         // ) {
//         //   searchFilterWhereClause = {
//         //     createdAt: new Date(0),
//         //   }; // return nothing

//         //   return "Invalid Date";
//         // }

//         // Validate date
//         if (isNaN(rawStringToDate.getTime())) {
//           searchFilterWhereClause = {
//             createdAt: new Date(0),
//           };
//           return "Invalid Date";
//         } else if (
//           !isNaN(rawStringToDate.getTime()) &&
//           !searchText.includes(",") &&
//           !searchText.includes(":")
//         ) {
//           const rawStringToStartDate = new Date(rawStringToDate); // start of day of search text inputted by user
//           const rawStringToEndDate = moment(rawStringToStartDate)
//             .endOf("day")
//             .format("YYYY-MM-DD HH:mm:ss"); // end of day

//           searchFilterWhereClause = {
//             [Op.and]: [
//               {
//                 createdAt: {
//                   [Op.and]: [
//                     { [Op.gte]: rawStringToStartDate },
//                     { [Op.lte]: rawStringToEndDate },
//                   ],
//                 },
//               },
//               {
//                 purchaseDate: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//             ],
//           };
//           return "Valid Date"; // will return Valid if raw string is valid date
//         }

//         // For date that has specific time
//         const splitString = searchText?.split(",");
//         if (!splitString || splitString.length < 2) {
//           return "Invalid Date";
//         }
//         const hoursMinutes = splitString[1]?.split(":");
//         const hours = hoursMinutes[0]?.trim() || "11";
//         const minutes = hoursMinutes[1]?.trim() || "59";
//         const datePart = splitString[0].trim();
//         const period = searchText?.toLowerCase()?.includes("am") ? "am" : "pm";
//         const customizedStartDate = `${datePart}, ${hours}:${minutes} ${period}`;
//         const customizedEndDate = `${datePart}, ${hours}:${
//           parseInt(minutes) + 1
//         } ${period}`;
//         const convertToDate = new Date(customizedEndDate);

//         // Validate date
//         if (isNaN(convertToDate.getTime())) {
//           searchFilterWhereClause = {
//             createdAt: new Date(0),
//           };
//           return "Invalid Date";
//         } else if (!isNaN(convertToDate.getTime())) {
//           // const convertToStartDate = new Date(datePart); // start of day of search text inputted by user
//           searchFilterWhereClause = {
//             [Op.and]: [
//               {
//                 createdAt: {
//                   [Op.and]: [
//                     { [Op.gt]: customizedStartDate },
//                     { [Op.lt]: customizedEndDate },
//                   ],
//                 },
//               },
//               {
//                 purchaseDate: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               ``,
//             ],
//           };
//           return "Valid Date";
//         }
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     if (searchText && searchText.trim() !== "") {
//       switch (filterColumn) {
//         case "transaction_date":
//           parseDate();
//           break;
//         case "transaction_id":
//           searchFilterWhereClause["transaction_id"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         case "receiving_warehouse": //
//           warehouseWhereClause["name"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         case "MOP":
//           searchFilterWhereClause["MOP"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         case "company_name": //
//           vendorWhereClause["company_name"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         case "discount_value":
//           searchFilterWhereClause = {
//             [Op.and]: [
//               {
//                 purchaseDate: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               sequelize.where(literal(`CAST (discount_value AS CHAR)`), {
//                 [Op.like]: `%${searchText}%`,
//               }),
//             ],
//           };
//           break;

//         case "due_date":
//           searchFilterWhereClause = {
//             [Op.and]: [
//               {
//                 purchaseDate: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               sequelize.where(literal(`CAST (due_date AS CHAR)`), {
//                 [Op.like]: `%${searchText}%`,
//               }),
//             ],
//           };
//           break;
//         case "purchaseDate":
//           searchFilterWhereClause = {
//             [Op.and]: [
//               {
//                 purchaseDate: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               sequelize.where(literal(`CAST (purchaseDate AS CHAR)`), {
//                 [Op.like]: `%${searchText}%`,
//               }),
//             ],
//           };
//           break;

//         case "status":
//           searchFilterWhereClause["status"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         default:
//           const validation = parseDate();

//           const cast = (column) => {
//             return sequelize.where(literal(`CAST (${column} AS CHAR)`), {
//               [Op.like]: `%${searchText}%`,
//             });
//           };

//           if (validation === "Invalid Date") {
//             searchFilterWhereClause = {
//               [Op.and]: [
//                 {
//                   purchaseDate: {
//                     [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                   },
//                 },
//                 {
//                   [Op.or]: payableTableColumn.map((col) => {
//                     if (
//                       ["due_date", "purchaseDate", "discount_value"].includes(
//                         col
//                       )
//                     ) {
//                       return cast(col);
//                     } else if (
//                       ["container_number", "pier"].includes(col) &&
//                       searchText.toLowerCase() == "n/a"
//                     ) {
//                       return {
//                         [col]: null,
//                       };
//                     } else {
//                       return {
//                         [col]: {
//                           [Op.like]: `%${searchText}%`,
//                         },
//                       };
//                     }
//                   }),
//                 },
//               ],
//             };
//           }
//           break;
//       }
//     }

//     let { count, rows: isFetch } = await Payable.findAndCountAll({
//       include: [
//         {
//           model: Payable_Product,
//           required: true,
//           include: [
//             {
//               model: Product_Tag_Vendor,
//               required: true,
//             },
//           ],
//         },
//         {
//           model: Payable_Bulk_Transaction,
//           required: false,
//           include: [
//             {
//               model: PayableBulk,
//               required: true,
//             },
//           ],
//         },
//         {
//           model: Currency,
//           attributes: ["currency_name"],
//           required: true,
//         },
//         {
//           model: Warehouse,
//           required: true,
//           where: warehouseWhereClause,
//         },
//         {
//           model: Vendors,
//           required: true,
//           where: vendorWhereClause,
//         },
//         {
//           model: Payable_Fees,
//           required: false,
//         },
//       ],
//       subQuery: false,
//       distinct: true,
//       order: [["createdAt", "DESC"]],
//       limit: limit,
//       offset: offset,
//       where: { ...searchFilterWhereClause, isDeleted: false },
//     });

//     // const mappedFetch = await Promise.all(
//     //   isFetch.map(async (item) => {
//     //     const transactionNumber =
//     //       item?.payable_bulk_transactions.length > 1
//     //         ? item?.payable_bulk_transactions[
//     //             item?.payable_bulk_transactions.length - 1
//     //           ]?.payable_bulk?.transaction_number
//     //         : item?.payable_bulk_transactions[0]?.payable_bulk
//     //             ?.transaction_number;
//     //     if (transactionNumber) {
//     //       const [pendingBankTransactionPayment, pendingIssuedCheckPayment] =
//     //         await Promise.all([
//     //           bank_transaction.sum("amount", {
//     //             where: {
//     //               transaction_number: transactionNumber,
//     //               status: "Pending",
//     //             },
//     //           }),
//     //           issued_check.sum("amount", {
//     //             where: {
//     //               transaction_number: transactionNumber,
//     //               status: "Pending",
//     //             },
//     //           }),
//     //         ]);

//     //       console.log(pendingBankTransactionPayment, "payment==========");
//     //       console.log(pendingIssuedCheckPayment);
//     //       return {
//     //         ...item.toJSON(), // Ensure to convert Sequelize instance to plain object
//     //         amountToPay:
//     //           pendingBankTransactionPayment + pendingIssuedCheckPayment,
//     //       };
//     //     }

//     //     return {
//     //       ...item.toJSON(),
//     //       amountToPay: 0,
//     //     };
//     //   })
//     // );

//     // console.log(mappedFetch, "mappedFetch==========");

//     if (isFetch.length === 0 && filterColumn === "all") {
//       const columns = ["warehouse", "vendor"];
//       for (let index = 0; index < columns.length; index++) {
//         searchFilterWhereClause = {
//           purchaseDate: {
//             [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//           },
//         };
//         vendorWhereClause = {};
//         warehouseWhereClause = {};

//         if (columns[index] === "warehouse") {
//           warehouseWhereClause["name"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//         } else {
//           vendorWhereClause["company_name"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//         }

//         let { count, rows: isFetch } = await Payable.findAndCountAll({
//           include: [
//             {
//               model: Payable_Product,
//               required: true,
//               include: [
//                 {
//                   model: Product_Tag_Vendor,
//                   required: true,
//                 },
//               ],
//             },
//             {
//               model: Currency,
//               attributes: ["currency_name"],
//               required: true,
//             },
//             {
//               model: Warehouse,
//               required: true,
//               where: warehouseWhereClause,
//             },
//             {
//               model: Vendors,
//               required: true,
//               where: vendorWhereClause,
//             },
//             {
//               model: Payable_Fees,
//               required: false,
//             },
//           ],
//           where: { ...searchFilterWhereClause, isDeleted: false },
//           order: [["createdAt", "DESC"]],
//           distinct: true,
//           subQuery: false,
//           limit: limit,
//           offset: offset,
//         });

//         if (isFetch.length > 0) {
//           return res.json({
//             totalItems: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: parseInt(page || 1),
//             data: isFetch,
//           });
//         }
//       }
//     }

//     res.json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: parseInt(page || 1),
//       data: isFetch,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

router.route("/fetchPayableSs").get(async (req, res) => {
  const { startDate, endDate, currencyId, selectedVendor, status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!startDate || !endDate)
    return res
      .status(400)
      .json({ error: "startDate and endDate are required." });

  try {
    // Step 1: Get list of Payable IDs for the current page
    const pagedIds = await Payable.findAll({
      attributes: ["id"],
      where: {
        purchaseDate: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        ...(currencyId !== "All" && { currencyId }),
        isDeleted: false,
        ...(selectedVendor && {
          vendor_id: { [Op.in]: selectedVendor.map((item) => item.value) },
        }),
        ...(status === "Approved"
          ? {
              status: {
                [Op.or]: ["Partially-Paid", "Paid", "Approved"],
              },
            }
          : { status }),
      },
      order: [["date_approved", "DESC"]],
      offset,
      limit,
      raw: true,
    });

    const payableIds = pagedIds.map((p) => p.id);

    // Step 2: Fetch full records for these IDs with all includes
    const isFetch = await Payable.findAll({
      where: {
        id: { [Op.in]: payableIds },
        ...(selectedVendor && {
          vendor_id: { [Op.in]: selectedVendor.map((item) => item.value) },
        }),
      },
      include: [
        {
          model: Payable_Product,
          required: true,
          attributes: ["id", "payable_id", "net_weight", "weight", "unitPrice"],
          include: [
            {
              model: Product_Tag_Vendor,
              required: true,
              attributes: ["id", "product_id", "vendor_id"],
            },
          ],
        },
        {
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: PayableBulk,
              required: true,
            },
          ],
        },
        {
          model: Currency,
          attributes: ["currency_name"],
          required: true,
        },
        {
          model: Warehouse,
          required: true,
          attributes: ["warehouse_id", "name"],
        },
        {
          model: Vendors,
          required: true,
          attributes: [
            "id",
            "company_name",
            "company_designation",
            "fname",
            "lname",
            "mname",
          ],
        },
        {
          model: Payable_Fees,
          required: false,
        },
      ],
      order: [["date_approved", "DESC"]],
    });

    // Step 3: Get total count (distinct Payable IDs)
    const totalCount = await Payable.count({
      where: {
        purchaseDate: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        ...(currencyId !== "All" && { currencyId }),
        isDeleted: false,
        ...(selectedVendor && {
          vendor_id: { [Op.in]: selectedVendor.map((item) => item.value) },
        }),
        ...(status === "Approved"
          ? {
              status: {
                [Op.in]: ["Partially-Paid", "Paid", "Approved"],
              },
            }
          : { status }),
      },
    });

    return res.json({
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error("Error fetching payables:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// router.route("/fetchPayableSearch").get(async (req, res) => {
//   const { startDate, endDate, filterColumn, currencyId, status } = req.query;
//   let { searchText } = req.query;

//   // Normalize the search text for date fields
//   const normalizedDate = normalizeDateSearch(searchText);

//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;

//   if (searchText && searchText.trim() !== "") {
//     const numericText = searchText.replace(/,/g, "");
//     if (!isNaN(numericText)) {
//       searchText = numericText;
//     }
//   }

//   const whereClause = {
//     purchaseDate: {
//       [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//     },
//     ...(currencyId !== "All" && { currencyId }),
//     isDeleted: false,
//     status,
//   };

//   if (searchText && searchText.trim() !== "") {
//     if (filterColumn !== "all") {
//       // Handle specific column filtering with date normalization
//       const isDateColumn = ["createdAt", "due_date", "purchaseDate"].includes(
//         filterColumn
//       );
//       const isNumericColumn = ["discount_value", "totalPrice"].includes(
//         filterColumn
//       );

//       if (isDateColumn) {
//         if (filterColumn === "createdAt" && normalizedDate) {
//           // For datetime columns, search within the full day range
//           whereClause[filterColumn] = {
//             [Op.and]: [
//               { [Op.gte]: `${normalizedDate} 00:00:00` },
//               { [Op.lte]: `${normalizedDate} 23:59:59` },
//             ],
//           };
//         } else if (
//           ["due_date", "purchaseDate"].includes(filterColumn) &&
//           normalizedDate
//         ) {
//           // For date-only columns, use the normalized date
//           whereClause[filterColumn] = { [Op.like]: `%${normalizedDate}%` };
//         } else {
//           // If not a valid date, search as text
//           whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
//         }
//       } else if (isNumericColumn) {
//         // Handle numeric columns
//         const numericValue = parseFloat(searchText);
//         if (!isNaN(numericValue)) {
//           // whereClause[filterColumn] = { [Op.like]: `%${numericValue}%` };
//           whereClause[filterColumn] = sequelize.where(
//             literal(`CAST (${filterColumn} AS CHAR)`),
//             {
//               [Op.like]: `%${searchText}%`,
//             }
//           );
//         } else {
//           whereClause[filterColumn] = { [Op.like]: `%${searchText}%` };
//         }
//       } else {
//         // For text columns (transaction_id, MOP, status, etc.)
//         // Check if it's a nested column
//         if (filterColumn.includes(".")) {
//           whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
//         } else {
//           whereClause[filterColumn] = { [Op.like]: `%${searchText}%` };
//         }
//       }
//     } else {
//       // Build OR conditions with proper date handling for "all" search
//       const orConditions = [];

//       // For datetime columns (createdAt), search for the date part
//       if (normalizedDate) {
//         orConditions.push({
//           createdAt: {
//             [Op.and]: [
//               { [Op.gte]: `${normalizedDate} 00:00:00` },
//               { [Op.lte]: `${normalizedDate} 23:59:59` },
//             ],
//           },
//         });
//       } else {
//         // If not a valid date, search as text in createdAt
//         orConditions.push({
//           createdAt: { [Op.like]: `%${searchText}%` },
//         });
//       }

//       // Regular text fields - always use original searchText
//       orConditions.push(
//         { transaction_id: { [Op.like]: `%${searchText}%` } },
//         { "$warehouse.name$": { [Op.like]: `%${searchText}%` } },
//         { MOP: { [Op.like]: `%${searchText}%` } },
//         { "$vendor.company_name$": { [Op.like]: `%${searchText}%` } },
//         { status: { [Op.like]: `%${searchText}%` } },
//         {
//           totalPrice: sequelize.where(literal(`CAST (totalPrice AS CHAR)`), {
//             [Op.like]: `%${searchText}%`,
//           }),
//         }
//       );

//       // Handle numeric fields
//       const numericValue = parseFloat(searchText);
//       if (!isNaN(numericValue)) {
//         orConditions.push({
//           discount_value: { [Op.like]: `%${numericValue}%` },
//         });
//       }

//       // For date-only columns (due_date, purchaseDate)
//       if (normalizedDate) {
//         orConditions.push(
//           { due_date: { [Op.like]: `%${normalizedDate}%` } },
//           { purchaseDate: { [Op.like]: `%${normalizedDate}%` } }
//         );
//       } else {
//         // If not a valid date, still search as text
//         orConditions.push(
//           { due_date: { [Op.like]: `%${searchText}%` } },
//           { purchaseDate: { [Op.like]: `%${searchText}%` } }
//         );
//       }

//       whereClause[Op.or] = orConditions;
//     }
//   }

//   try {
//     // Step 1: Get total count with the same search conditions
//     const totalCount = await Payable.count({
//       where: whereClause,
//       include: [
//         {
//           model: Warehouse,
//           required: true,
//           attributes: [], // Don't select attributes for count
//         },
//         {
//           model: Vendors,
//           required: true,
//           attributes: [], // Don't select attributes for count
//         },
//       ],
//       distinct: true, // Ensure distinct count when using includes
//     });

//     // Step 2: Get list of Payable IDs for the current page
//     const pagedIds = await Payable.findAll({
//       attributes: ["id"],
//       where: whereClause,
//       include: [
//         {
//           model: Warehouse,
//           required: true,
//           attributes: [], // Don't select attributes for pagination query
//         },
//         {
//           model: Vendors,
//           required: true,
//           attributes: [], // Don't select attributes for pagination query
//         },
//       ],
//       order: [["date_approved", "DESC"]],
//       offset,
//       limit,
//     });

//     const payableIds = pagedIds.map((p) => p.id);

//     // Step 3: Fetch full records for these IDs with all includes
//     const isFetch = await Payable.findAll({
//       where: { id: { [Op.in]: payableIds } },
//       include: [
//         {
//           model: Payable_Product,
//           required: true,
//           include: [
//             {
//               model: Product_Tag_Vendor,
//               required: true,
//             },
//           ],
//         },
//         {
//           model: Payable_Bulk_Transaction,
//           required: false,
//           include: [
//             {
//               model: PayableBulk,
//               required: true,
//             },
//           ],
//         },
//         {
//           model: Currency,
//           attributes: ["currency_name"],
//           required: true,
//         },
//         {
//           model: Warehouse,
//           required: true,
//         },
//         {
//           model: Vendors,
//           required: true,
//         },
//         {
//           model: Payable_Fees,
//           required: false,
//         },
//       ],
//       order: [["date_approved", "DESC"]],
//     });

//     return res.json({
//       totalItems: totalCount,
//       totalPages: Math.ceil(totalCount / limit),
//       currentPage: parseInt(page || 1),
//       data: isFetch,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });
router.route("/fetchPayableSearch").get(async (req, res) => {
  const { startDate, endDate, filterColumn, currencyId, status } = req.query;
  let { searchText } = req.query;

  // Normalize the search text for date fields
  const normalizedDate = normalizeDateSearch(searchText);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (searchText && searchText.trim() !== "") {
    const numericText = searchText.replace(/,/g, "");
    if (!isNaN(numericText)) {
      searchText = numericText;
    }
  }

  const whereClause = {
    purchaseDate: {
      [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    },
    ...(currencyId !== "All" && { currencyId }),
    isDeleted: false,
    status,
  };

  if (searchText && searchText.trim() !== "") {
    if (filterColumn !== "all") {
      // Handle specific column filtering with date normalization
      const isDateColumn = ["createdAt", "due_date", "purchaseDate"].includes(
        filterColumn
      );
      const isNumericColumn = ["discount_value", "totalPrice"].includes(
        filterColumn
      );

      // Handle product search
      if (filterColumn === "product") {
        // Will be handled in the include section below
      } else if (isDateColumn) {
        if (filterColumn === "createdAt" && normalizedDate) {
          whereClause[filterColumn] = {
            [Op.and]: [
              { [Op.gte]: `${normalizedDate} 00:00:00` },
              { [Op.lte]: `${normalizedDate} 23:59:59` },
            ],
          };
        } else if (
          ["due_date", "purchaseDate"].includes(filterColumn) &&
          normalizedDate
        ) {
          whereClause[filterColumn] = { [Op.like]: `%${normalizedDate}%` };
        } else {
          whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
        }
      } else if (isNumericColumn) {
        const numericValue = parseFloat(searchText);
        if (!isNaN(numericValue)) {
          whereClause[filterColumn] = sequelize.where(
            literal(`CAST (${filterColumn} AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
        } else {
          whereClause[filterColumn] = { [Op.like]: `%${searchText}%` };
        }
      } else {
        // For text columns (transaction_id, MOP, status, etc.)
        if (filterColumn.includes(".")) {
          whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
        } else {
          whereClause[filterColumn] = { [Op.like]: `%${searchText}%` };
        }
      }
    } else {
      // Build OR conditions with proper date handling for "all" search
      const orConditions = [];

      // For datetime columns (createdAt), search for the date part
      if (normalizedDate) {
        orConditions.push({
          createdAt: {
            [Op.and]: [
              { [Op.gte]: `${normalizedDate} 00:00:00` },
              { [Op.lte]: `${normalizedDate} 23:59:59` },
            ],
          },
        });
      } else {
        orConditions.push({
          createdAt: { [Op.like]: `%${searchText}%` },
        });
      }

      // Regular text fields - always use original searchText
      orConditions.push(
        { transaction_id: { [Op.like]: `%${searchText}%` } },
        { "$warehouse.name$": { [Op.like]: `%${searchText}%` } },
        { MOP: { [Op.like]: `%${searchText}%` } },
        { "$vendor.company_name$": { [Op.like]: `%${searchText}%` } },
        { status: { [Op.like]: `%${searchText}%` } },
        {
          totalPrice: sequelize.where(literal(`CAST (totalPrice AS CHAR)`), {
            [Op.like]: `%${searchText}%`,
          }),
        }
      );

      // Handle numeric fields
      const numericValue = parseFloat(searchText);
      if (!isNaN(numericValue)) {
        orConditions.push({
          discount_value: { [Op.like]: `%${numericValue}%` },
        });
      }

      // For date-only columns (due_date, purchaseDate)
      if (normalizedDate) {
        orConditions.push(
          { due_date: { [Op.like]: `%${normalizedDate}%` } },
          { purchaseDate: { [Op.like]: `%${normalizedDate}%` } }
        );
      } else {
        orConditions.push(
          { due_date: { [Op.like]: `%${searchText}%` } },
          { purchaseDate: { [Op.like]: `%${searchText}%` } }
        );
      }

      // Add product name and code search for "all" filter
      orConditions.push(
        {
          "$payable_products.product_tag_vendor.product_list.product_name$": {
            [Op.like]: `%${searchText}%`,
          },
        },
        {
          "$payable_products.product_tag_vendor.product_list.product_code$": {
            [Op.like]: `%${searchText}%`,
          },
        }
      );

      whereClause[Op.or] = orConditions;
    }
  }

  try {
    // Step 1: Get total count with the same search conditions
    const totalCount = await Payable.count({
      where: whereClause,
      include: [
        {
          model: Warehouse,
          required: true,
          attributes: [],
        },
        {
          model: Vendors,
          required: true,
          attributes: [],
        },
        // Add product include for product filtering
        {
          model: Payable_Product,
          required: filterColumn === "product" || filterColumn === "all",
          attributes: [],
          include: [
            {
              model: Product_Tag_Vendor,
              required: filterColumn === "product" || filterColumn === "all",
              attributes: [],
              include: [
                {
                  model: ProductList,
                  required:
                    filterColumn === "product" || filterColumn === "all",
                  attributes: [],
                  where:
                    filterColumn === "product"
                      ? {
                          [Op.or]: [
                            {
                              product_name: {
                                [Op.like]: `%${searchText}%`,
                              },
                            },
                            {
                              product_code: {
                                [Op.like]: `%${searchText}%`,
                              },
                            },
                          ],
                        }
                      : {},
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
    });

    // Step 2: Get list of Payable IDs for the current page
    const pagedIds = await Payable.findAll({
      attributes: ["id"],
      where: whereClause,
      include: [
        {
          model: Warehouse,
          required: true,
          attributes: [],
        },
        {
          model: Vendors,
          required: true,
          attributes: [],
        },
        // Add product include for product filtering
        {
          model: Payable_Product,
          required: filterColumn === "product" || filterColumn === "all",
          attributes: [],
          include: [
            {
              model: Product_Tag_Vendor,
              required: filterColumn === "product" || filterColumn === "all",
              attributes: [],
              include: [
                {
                  model: ProductList,
                  required:
                    filterColumn === "product" || filterColumn === "all",
                  attributes: [],
                  where:
                    filterColumn === "product"
                      ? {
                          [Op.or]: [
                            {
                              product_name: {
                                [Op.like]: `%${searchText}%`,
                              },
                            },
                            {
                              product_code: {
                                [Op.like]: `%${searchText}%`,
                              },
                            },
                          ],
                        }
                      : {},
                },
              ],
            },
          ],
        },
      ],
      order: [["date_approved", "DESC"]],
      offset,
      limit,
      distinct: true,
      subQuery: false,
    });

    const payableIds = pagedIds.map((p) => p.id);

    // Step 3: Fetch full records for these IDs with all includes
    const isFetch = await Payable.findAll({
      where: { id: { [Op.in]: payableIds } },
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
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: PayableBulk,
              required: true,
            },
          ],
        },
        {
          model: Currency,
          attributes: ["currency_name"],
          required: true,
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
      ],
      order: [["date_approved", "DESC"]],
    });

    return res.json({
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
//para sa pagfetch ng specific data kapag clinick ang notification
router.route("/fetchDataNotification").get(async (req, res) => {
  const { startDate, endDate, id } = req.query;
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
      ],
      where: {
        due_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        id: id,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable Local
router.route("/fetch_local").get(async (req, res) => {
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
      ],
      where: {
        domestic_type: "local",
        status: "Approved",
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetch_local_payable_bulk").get(async (req, res) => {
  const { startDate, endDate, filterColumn, currencyId } = req.query;
  let { searchText } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!startDate || !endDate)
    return res
      .status(400)
      .json({ error: "startDate and endDate are required." });

  if (searchText && searchText.trim() !== "") {
    const numericText = searchText.replace(/,/g, "");
    if (!isNaN(numericText)) {
      searchText = numericText;
    }
  }

  try {
    let searchFilterWhereClause = {
      payable_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    // Handle Date
    const parseDate = (columnDate) => {
      try {
        if (searchText == "") {
          searchFilterWhereClause = {
            payable_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          };
          return "Invalid Date";
        }

        if (!searchText.includes("/")) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          }; // return nothing
          return "Invalid Date";
        }

        // For raw date without specific time
        const rawStringToDate = new Date(searchText);
        const stringDate = new Date(
          rawStringToDate?.toISOString()?.split("T")[0] || ""
        );
        stringDate?.setDate(stringDate?.getDate() + 1);
        // // Validate date if less than start date and greater than end date
        if (columnDate !== "createdAt") {
          if (
            stringDate < new Date(startDate) ||
            stringDate > new Date(endDate)
          ) {
            searchFilterWhereClause = {
              createdAt: new Date(0),
            }; // return nothing

            return "Invalid Date";
          }
        }
        const isValidDate = moment(
          stringDate.toISOString().split("T")[0],
          "YYYY-MM-DD",
          true
        ).isValid();

        // Validate date
        if (!isValidDate) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (
          isValidDate &&
          !searchText.includes(",") &&
          !searchText.includes(":")
        ) {
          const rawStringToStartDate = new Date(rawStringToDate); // start of day of search text inputted by user
          const rawStringToEndDate = moment(rawStringToStartDate)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss"); // end of day

          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: rawStringToStartDate },
                  { [Op.lte]: rawStringToEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gte]: rawStringToStartDate },
                      { [Op.lte]: rawStringToEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date"; // will return Valid if raw string is valid date
        }

        // Will not proceed to check for specific time for Transaction Date
        if (columnDate !== "createdAt") {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        }

        // For date that has specific time
        const splitString = searchText?.split(",");
        if (!splitString || splitString.length < 2) {
          return "Invalid Date";
        }
        const hoursMinutes = splitString[1]?.split(":");
        const hours = hoursMinutes[0]?.trim() || "11";
        const minutes = hoursMinutes[1]?.trim() || "59";
        const datePart = splitString[0].trim();
        const period = searchText?.toLowerCase()?.includes("am") ? "am" : "pm";
        const customizedStartDate = `${datePart}, ${hours}:${minutes} ${period}`;
        const customizedEndDate = `${datePart}, ${hours}:${
          parseInt(minutes) + 1
        } ${period}`;
        const convertToDate = new Date(customizedEndDate);

        // Validate date
        if (isNaN(convertToDate.getTime())) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (!isNaN(convertToDate.getTime())) {
          // const convertToStartDate = new Date(datePart); // start of day of search text inputted by user
          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: customizedStartDate },
                  { [Op.lte]: customizedEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gt]: customizedStartDate },
                      { [Op.lt]: customizedEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date";
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_no":
          searchFilterWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "date_created":
          parseDate("createdAt");
          break;
        case "transaction_date":
          parseDate("payable_date");
          break;

        case "total_amount":
          searchFilterWhereClause["total_amount"] = sequelize.where(
            literal(`CAST (total_amount AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;

        case "status":
          searchFilterWhereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          searchFilterWhereClause = {
            [Op.and]: [
              {
                payable_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: [
                  {
                    transaction_number: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                  {
                    total_amount: sequelize.where(
                      literal(`CAST (total_amount AS CHAR)`),
                      {
                        [Op.like]: `%${searchText}%`,
                      }
                    ),
                  },
                  {
                    status: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                ],
              },
            ],
          };
          break;
      }
    }

    const totalItems = await PayableBulk.count({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId && currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        isDeleted: false,
        ...searchFilterWhereClause,
      },
    });

    const pagedIds = await PayableBulk.findAll({
      attributes: ["id"],
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId && currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        isDeleted: false,
        ...searchFilterWhereClause,
      },
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      raw: true,
    });

    const payableBulkIds = pagedIds.map((p) => p.id);

    const rows = await PayableBulk.findAll({
      where: {
        isDeleted: false,
        id: {
          [Op.in]: payableBulkIds,
        },
        ...searchFilterWhereClause,
      },
      include: [
        {
          model: Payable_Payment,
          required: true,
        },
        {
          model: Vendors,
          required: true,
        },
        {
          model: Currency,
          required: true,
        },
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              required: true,
              where: {
                domestic_type: "local",
              },
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });

    // const payableBulk = await PayableBulk.findAll({
    //   where: {
    //     isDeleted: false,
    //   },
    //   // distinct: true,
    //   // subQuery: false,
    //   order: [["createdAt", "DESC"]],
    //   limit: limit,
    //   offset: offset,
    // });

    // const payableBulkCount = await PayableBulk.count({
    //   include: [
    //     {
    //       model: Currency,
    //       // attributes: ["currency_name"],
    //       required: true,
    //     },
    //     {
    //       model: Payable_Bulk_Transaction,
    //       required: true,
    //       include: [
    //         {
    //           model: Payable,
    //           required: true,
    //           where: {
    //             domestic_type: "local",
    //           },
    //         },
    //       ],
    //     },
    //   ],
    //   where: {
    //     ...searchFilterWhereClause,
    //     isDeleted: false,
    //     payable_date: {
    //       [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //     },
    //   },
    //   distinct: true,
    // });

    // let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
    //   // where: {
    //   //   domestic_type: "local",
    //   //   status: "Approved",
    //   // },
    //   include: [
    //     {
    //       model: Currency,
    //       // attributes: ["currency_name"],
    //       required: true,
    //     },
    //     {
    //       model: Payable_Bulk_Transaction,
    //       required: true,
    //       include: [
    //         {
    //           model: Payable,
    //           required: true,
    //           where: {
    //             domestic_type: "local",
    //           },
    //         },
    //       ],
    //     },
    //   ],
    //   // subQuery: false,
    //   // distinct: true,
    //   // order: [["createdAt", "DESC"]],
    //   // limit: limit,
    //   // offset: offset,
    //   where: {
    //     ...searchFilterWhereClause,
    //     id: {
    //       [Op.in]: payableBulk.map((item) => item.id),
    //     },
    //     // isDeleted: false,
    //   },
    // });

    // console.log(isFetch, "fetch============");

    if (rows.length === 0 && filterColumn === "all") {
      const columns = ["createdAt", "payable_date"];
      for (let index = 0; index < columns.length; index++) {
        searchFilterWhereClause = {
          payable_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };

        if (columns[index] === "createdAt") {
          parseDate("createdAt");
        } else {
          parseDate("payable_date");
        }

        let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
          // where: {
          //   domestic_type: "local",
          //   status: "Approved",
          // },
          include: [
            {
              model: Payable_Payment,
              required: true,
            },
            {
              model: Vendors,
              required: true,
            },
            {
              model: Currency,
              required: true,
              where: {
                ...(currencyId && currencyId !== "All" && { id: currencyId }),
              },
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: Payable,
                  required: true,
                  where: {
                    domestic_type: "local",
                  },
                },
              ],
            },
          ],
          subQuery: false,
          distinct: true,
          order: [["createdAt", "DESC"]],
          limit: limit,
          offset: offset,
          where: { ...searchFilterWhereClause, isDeleted: false },
        });

        if (isFetch.length > 0) {
          return res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: isFetch,
          });
        }
      }
    }

    // res.json({
    //   totalItems: count,
    //   totalPages: Math.ceil(count / limit),
    //   currentPage: parseInt(page || 1),
    //   data: isFetch,
    // });
    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page || 1),
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetch_overseas_payable_bulk").get(async (req, res) => {
  const { startDate, endDate, filterColumn, currencyId } = req.query;
  let { searchText } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (searchText && searchText.trim() !== "") {
    const numericText = searchText.replace(/,/g, "");
    if (!isNaN(numericText)) {
      searchText = numericText;
    }
  }

  try {
    let searchFilterWhereClause = {
      payable_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    // Handle Date
    const parseDate = (columnDate) => {
      try {
        if (searchText == "") {
          searchFilterWhereClause = {
            payable_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          };
          return "Invalid Date";
        }

        if (!searchText.includes("/")) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          }; // return nothing
          return "Invalid Date";
        }

        // For raw date without specific time
        const rawStringToDate = new Date(searchText);
        const stringDate = new Date(
          rawStringToDate?.toISOString()?.split("T")[0] || ""
        );
        stringDate?.setDate(stringDate?.getDate() + 1);
        // // Validate date if less than start date and greater than end date
        if (columnDate !== "createdAt") {
          if (
            stringDate < new Date(startDate) ||
            stringDate > new Date(endDate)
          ) {
            searchFilterWhereClause = {
              createdAt: new Date(0),
            }; // return nothing

            return "Invalid Date";
          }
        }
        const isValidDate = moment(
          stringDate.toISOString().split("T")[0],
          "YYYY-MM-DD",
          true
        ).isValid();

        // Validate date
        if (!isValidDate) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (
          isValidDate &&
          !searchText.includes(",") &&
          !searchText.includes(":")
        ) {
          const rawStringToStartDate = new Date(rawStringToDate); // start of day of search text inputted by user
          const rawStringToEndDate = moment(rawStringToStartDate)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm:ss"); // end of day

          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: rawStringToStartDate },
                  { [Op.lte]: rawStringToEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gte]: rawStringToStartDate },
                      { [Op.lte]: rawStringToEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date"; // will return Valid if raw string is valid date
        }

        // Will not proceed to check for specific time for Transaction Date
        if (columnDate !== "createdAt") {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        }

        // For date that has specific time
        const splitString = searchText?.split(",");
        if (!splitString || splitString.length < 2) {
          return "Invalid Date";
        }
        const hoursMinutes = splitString[1]?.split(":");
        const hours = hoursMinutes[0]?.trim() || "11";
        const minutes = hoursMinutes[1]?.trim() || "59";
        const datePart = splitString[0].trim();
        const period = searchText?.toLowerCase()?.includes("am") ? "am" : "pm";
        const customizedStartDate = `${datePart}, ${hours}:${minutes} ${period}`;
        const customizedEndDate = `${datePart}, ${hours}:${
          parseInt(minutes) + 1
        } ${period}`;
        const convertToDate = new Date(customizedEndDate);

        // Validate date
        if (isNaN(convertToDate.getTime())) {
          searchFilterWhereClause = {
            createdAt: new Date(0),
          };
          return "Invalid Date";
        } else if (!isNaN(convertToDate.getTime())) {
          // const convertToStartDate = new Date(datePart); // start of day of search text inputted by user
          if (columnDate !== "createdAt") {
            searchFilterWhereClause = {
              payable_date: {
                [Op.and]: [
                  { [Op.gte]: customizedStartDate },
                  { [Op.lte]: customizedEndDate },
                ],
              },
            };
          } else {
            searchFilterWhereClause = {
              [Op.and]: [
                {
                  createdAt: {
                    [Op.and]: [
                      { [Op.gt]: customizedStartDate },
                      { [Op.lt]: customizedEndDate },
                    ],
                  },
                },
                {
                  payable_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
              ],
            };
          }
          return "Valid Date";
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_no":
          searchFilterWhereClause["transaction_number"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        case "date_created":
          parseDate("createdAt");
          break;
        case "transaction_date":
          parseDate("payable_date");
          break;

        case "total_amount":
          searchFilterWhereClause["total_amount"] = sequelize.where(
            literal(`CAST (total_amount AS CHAR)`),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;

        case "status":
          searchFilterWhereClause["status"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;

        default:
          searchFilterWhereClause = {
            [Op.and]: [
              {
                payable_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              {
                [Op.or]: [
                  {
                    transaction_number: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                  {
                    total_amount: sequelize.where(
                      literal(`CAST (total_amount AS CHAR)`),
                      {
                        [Op.like]: `%${searchText}%`,
                      }
                    ),
                  },
                  {
                    status: {
                      [Op.like]: `%${searchText}%`,
                    },
                  },
                ],
              },
            ],
          };
          break;
      }
    }

    let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
      // where: {
      //   domestic_type: "local",
      //   status: "Approved",
      // },
      include: [
        {
          model: Vendors,
          required: true,
        },
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId && currencyId !== "All" && { id: currencyId }),
          },
        },
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              required: true,
              where: {
                domestic_type: "overseas",
              },
            },
          ],
        },
      ],
      subQuery: false,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      where: { ...searchFilterWhereClause, isDeleted: false },
    });

    if (isFetch.length === 0 && filterColumn === "all") {
      const columns = ["createdAt", "payable_date"];
      for (let index = 0; index < columns.length; index++) {
        searchFilterWhereClause = {
          payable_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };

        if (columns[index] === "createdAt") {
          parseDate("createdAt");
        } else {
          parseDate("payable_date");
        }

        let { count, rows: isFetch } = await PayableBulk.findAndCountAll({
          // where: {
          //   domestic_type: "local",
          //   status: "Approved",
          // },
          include: [
            {
              model: Vendors,
              required: true,
            },
            {
              model: Currency,
              required: true,
              where: {
                ...(currencyId && currencyId !== "All" && { id: currencyId }),
              },
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: Payable,
                  required: true,
                  where: {
                    domestic_type: "overseas",
                  },
                },
              ],
            },
          ],
          subQuery: false,
          limit: limit,
          offset: offset,
          order: [["createdAt", "DESC"]],
          where: { ...searchFilterWhereClause, isDeleted: false },
        });

        if (isFetch.length > 0) {
          return res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: isFetch,
          });
        }
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable Overseas
router.route("/fetch_overseas").get(async (req, res) => {
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
      ],
      where: {
        domestic_type: "overseas",
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/getProductData").get(async (req, res) => {
  try {
    const { vendorId, vendorID } = req.query;
    console.log(
      "***********************************************-*vendorID",
      vendorId
    );
    const data = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: ProductList,
          required: true,
          where: {
            status: { [Op.notIn]: ["Archive", "Inactive"] },
          },
        },
      ],
      where: {
        vendor_id: vendorId,
        status: "Active",
      },
    });
    // console.log(data);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getPayableProduct").get(async (req, res) => {
  try {
    const { vendorId } = req.query;
    const data = await Payable_Product.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          where: {
            vendor_id: vendorId,
            status: "Active",
          },
        },
        {
          model: Payable,
          required: true,
          where: {
            [Op.or]: [{ status: "Approved" }, { status: "Paid" }],
          },
        },
      ],
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error");
  }
});

//USED MODULE:
// PayablePayment
router.route("/getInfo").get(async (req, res) => {
  try {
    const { id } = req.query;

    const isFetch = await Payable.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: Payable_Product,
          required: true,
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
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "approved_masterlist",
          required: false,
        },
        {
          model: MasterList,
          attributes: ["fname", "mname", "lname"],
          as: "created_masterlist",
          required: false,
        },
        {
          model: Warehouse,
          required: true,
        },
        {
          model: Currency,
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
      ],
      // order: [["createdAt", "DESC"]],
      order: [
        [Payable_Product, "createdAt", "ASC"],
        [Payable_Product, "order_index", "ASC"],
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: isFetch.purchaseDate },
          },
          {
            to: { [Op.gte]: isFetch.purchaseDate },
          },
          {
            isDeleted: false,
          },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff ? findCutoff.isPosted : false;
    const cutoffExists = findCutoff;

    const isFetchWithCutoffPosted = {
      ...isFetch.toJSON(),
      isCutoffPosted: isPosted,
      cutoffExists: cutoffExists,
    };

    res.json(isFetchWithCutoffPosted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getAvailableProductVendor").get(async (req, res) => {
  try {
    const { vendorId } = req.query;

    console.log("************************vendorID **--** : ", vendorId);

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const isFetch = await Product_Tag_Vendor.findAll({
      where: { vendor_id: vendorId },
      include: [
        {
          model: ProductList,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(isFetch);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getInfobyVendor").get(async (req, res) => {
  try {
    const {
      id,
      module,
      filterColumn,
      payableList,
      currency,
      selectedTransactions,
    } = req.query;

    let { searchText } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const numericText = searchText?.replace(/,/g, "");

    if (!isNaN(numericText)) {
      searchText = numericText;
    }

    let payableWhereClause = {
      isAdded: false,
      ...(id && { vendor_id: id }),
      status: "Approved",
      ...(module && { domestic_type: module }),
    };

    const payableTableColumn = [
      "transaction_id",
      "description",
      "purchaseDate",
      "due_date",
      "totalPrice",
      "discount_value",
    ];

    // Handle Search
    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        case "transaction_id":
        case "description":
          payableWhereClause[filterColumn] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        case "purchaseDate":
        case "due_date":
        case "totalPrice":
        case "discount_value":
          payableWhereClause = {
            [Op.and]: [
              {
                isAdded: false,
                vendor_id: id,
                status: "Approved",
                domestic_type: module,
              },
              sequelize.where(literal(`CAST(${filterColumn} AS CHAR)`), {
                [Op.like]: `%${searchText}%`,
              }),
            ],
          };
          break;

        default:
          payableWhereClause = {
            [Op.and]: [
              {
                isAdded: false,
                vendor_id: id,
                status: "Approved",
                domestic_type: module,
              },
              {
                [Op.or]: payableTableColumn.map((col) => {
                  if (col === "transaction_id" || col === "description") {
                    return {
                      [col]: {
                        [Op.like]: `%${searchText}%`,
                      },
                    };
                  } else {
                    return sequelize.where(literal(`CAST (${col} AS CHAR)`), {
                      [Op.like]: `%${searchText}%`,
                    });
                  }
                }),
              },
            ],
          };
          break;
      }
    }

    // Exclude list of selected transaction from Order List
    if (payableList && payableList.length > 0) {
      payableWhereClause["id"] = {
        [Op.notIn]: payableList,
      };
    }

    // Fetch transaction with specific currency
    if (currency) {
      payableWhereClause["currencyId"] = currency;
    }

    if (
      Array.isArray(selectedTransactions) &&
      selectedTransactions?.length > 0
    ) {
      payableWhereClause.id = {
        [Op.notIn]: selectedTransactions,
      };
    }

    // Get payables count
    const count = await Payable.count({
      attributes: [],
      where: { ...payableWhereClause, isDeleted: false },
    });

    // Get payable ids with pagination
    const payableIds = await Payable.findAll({
      attributes: ["id"],
      where: { ...payableWhereClause, isDeleted: false },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // Main fetching for paginated data
    const isFetch = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
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
      ],
      where: {
        id: {
          [Op.in]: payableIds.map((item) => item.id),
        },
      },
    });

    const items = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
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
      ],
      where: {
        id: {
          [Op.in]: selectedTransactions?.length > 0 ? selectedTransactions : [],
        },
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: { isFetch, items },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getInfobyVendor/search").get(async (req, res) => {
  try {
    const {
      id,
      module,
      filterColumn,
      searchText,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    if (!id || !module) {
      return res.status(400).json({ error: "id and module are required." });
    }

    // Define search conditions based on filter column
    let searchConditions = [];

    if (searchText && searchText.trim() !== "") {
      const normalizedDate = normalizeDateSearch(searchText);

      switch (filterColumn) {
        case "product_code":
          searchConditions.push({
            "$payable_products.product_tag_vendor.product_list.product_code$": {
              [Op.like]: `%${searchText}%`,
            },
          });
          break;

        case "product_name":
          searchConditions.push({
            "$payable_products.product_tag_vendor.product_list.product_name$": {
              [Op.like]: `%${searchText}%`,
            },
          });
          break;

        case "transaction_date":
          if (normalizedDate) {
            searchConditions.push({
              createdAt: {
                [Op.and]: [
                  { [Op.gte]: `${normalizedDate} 00:00:00` },
                  { [Op.lte]: `${normalizedDate} 23:59:59` },
                ],
              },
            });
          } else {
            searchConditions.push({
              createdAt: { [Op.like]: `%${searchText}%` },
            });
          }
          break;

        case "transaction_number":
          searchConditions.push({
            [Op.or]: [
              { transaction_id: { [Op.like]: `%${searchText}%` } },
              { client_transaction_id: { [Op.like]: `%${searchText}%` } },
            ],
          });
          break;

        case "purchase_date":
          if (normalizedDate) {
            searchConditions.push({
              purchaseDate: { [Op.like]: `%${normalizedDate}%` },
            });
          } else {
            searchConditions.push({
              purchaseDate: { [Op.like]: `%${searchText}%` },
            });
          }
          break;

        case "all":
        default:
          searchConditions.push({
            [Op.or]: [
              {
                "$payable_products.product_tag_vendor.product_list.product_code$":
                  {
                    [Op.like]: `%${searchText}%`,
                  },
              },
              {
                "$payable_products.product_tag_vendor.product_list.product_name$":
                  {
                    [Op.like]: `%${searchText}%`,
                  },
              },
              { transaction_id: { [Op.like]: `%${searchText}%` } },
              { client_transaction_id: { [Op.like]: `%${searchText}%` } },
              ...(normalizedDate
                ? [
                    {
                      createdAt: {
                        [Op.and]: [
                          { [Op.gte]: `${normalizedDate} 00:00:00` },
                          { [Op.lte]: `${normalizedDate} 23:59:59` },
                        ],
                      },
                    },
                    {
                      purchaseDate: { [Op.like]: `%${normalizedDate}%` },
                    },
                  ]
                : [
                    { createdAt: { [Op.like]: `%${searchText}%` } },
                    { purchaseDate: { [Op.like]: `%${searchText}%` } },
                  ]),
            ],
          });
          break;
      }
    }

    // Build where clause
    const whereClause = {
      isAdded: false,
      vendor_id: id,
      status: "Approved",
      domestic_type: module,
      isDeleted: false,
      ...(searchConditions.length > 0 && {
        [Op.and]: searchConditions,
      }),
    };

    // Get total count
    const count = await Payable.count({
      distinct: true,
      where: whereClause,
      include: [
        {
          model: Payable_Product,
          required: searchConditions.length > 0,
          attributes: [],
          include: [
            {
              model: Product_Tag_Vendor,
              required: searchConditions.length > 0,
              attributes: [],
              include: [
                {
                  model: ProductList,
                  required: searchConditions.length > 0,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });

    // Get paginated IDs
    const payableIds = await Payable.findAll({
      attributes: ["id"],
      where: whereClause,
      include: [
        {
          model: Payable_Product,
          required: searchConditions.length > 0,
          attributes: [],
          include: [
            {
              model: Product_Tag_Vendor,
              required: searchConditions.length > 0,
              attributes: [],
              include: [
                {
                  model: ProductList,
                  required: searchConditions.length > 0,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
      subQuery: false,
      distinct: true,
    });

    // Fetch full records
    const isFetch = await Payable.findAll({
      include: [
        {
          model: Payable_Product,
          required: true,
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
          required: true,
        },
      ],
      where: {
        id: {
          [Op.in]: payableIds.map((item) => item.id),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: parseInt(page || 1),
      data: { isFetch, items: [] },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/approvedPayable/:param_id").put(async (req, res) => {
  const transaction = await sequelize.transaction(); // Initialize the transaction here

  try {
    const id = req.params.param_id;
    const {
      status,
      products,
      vendorId,
      purchaseDate,
      transaction_id,
      approved_by,
      warehouseID,
      currencyRate,
      currencyName,
      payableJournal: { totalAmount, totalQuantity, averageUnitPrice },
    } = req.body;

    // const warehouse_main_id = await Warehouse.findOne({
    //   where: { branch_type: "Main" },
    // });

    const data = await Payable.update(
      {
        status: status,
        approved_by: approved_by,
        date_approved: await getAccurateDate(),
      },
      { where: { id: id } } // Include the transaction
    );

    if (status === "Approved") {
      for (const product of products) {
        // console.log(`Processing product: ${product.product_id}`);

        // const existingStockRecord = await StockManagement.findOne({
        //   where: {
        //     product_id: product.product_id,
        //     warehouse_id: warehouse_main_id.warehouse_id,
        //   },
        //   transaction, // Include the transaction
        // });

        // const currentStock = existingStockRecord ? existingStockRecord.stock : 0;
        // const updatedStock = currentStock + product.netWeight;

        // Insert or update stock
        // if (existingStockRecord) {
        //   await StockManagement.update(
        //     { stock: updatedStock, price: product.costing, vendor_id: vendorId },
        //     {
        //       where: {
        //         product_id: product.product_id,
        //         warehouse_id: warehouse_main_id.warehouse_id,
        //       },
        //       transaction,
        //     }
        //   );
        // } else {
        await StockManagement.create(
          {
            product_id: product.product_id,
            warehouse_id: warehouseID,
            stock: product.netWeight,
            price: product.costing * currencyRate,
            vendor_id: vendorId,
            date_in: purchaseDate,
            in: product.netWeight,
            price_in: product.costing * currencyRate,
            transaction_number: transaction_id, // dito ako nahinto check sa reject
            module_in_from: "Payable",
          },
          { transaction }
        );

        await Inventory_Journal.create(
          {
            product_id: product.product_id,
            quantity: product.netWeight,
            unit_price: product.costing * currencyRate,
            date_in: purchaseDate,
            type: "in",
            isDeleted: false,
            module_from: "Payable",
            transaction_number: transaction_id,
            warehouse_id: warehouseID,
          },
          { transaction }
        );
        // }

        // // Update or insert into Inventory_Report
        // const existingProduct = await Inventory_Report.findOne({
        //   where: { product_id: product.product_id },
        //   transaction,
        // });

        // if (existingProduct) {
        //   await Inventory_Report.increment(
        //     { product_in: product.netWeight },
        //     {
        //       where: { product_id: product.product_id },
        //       transaction,
        //     }
        //   );
        // } else {
        //   await Inventory_Report.create(
        //     {
        //       product_id: product.product_id,
        //       product_in: product.netWeight,
        //     },
        //     { transaction }
        //   );
        // }
      }

      // Make a payable journal record
      await PayableJournal.create(
        {
          vendor_id: vendorId,
          transaction_number: transaction_id,
          date: purchaseDate,
          total_amount: totalAmount,
          total_quantity: totalQuantity,
          avg_unit_price: averageUnitPrice,
          payment_type: "Debit",
          currency_name: currencyName,
          currency_rate: currencyRate,
        },
        { transaction }
      );

      // Commit the transaction after processing all products
      await transaction.commit();
    }

    const getData = await Payable.findOne({
      where: { id: id },
      attributes: ["transaction_id"],
    });

    const stats = status == "Approved" ? "approved" : "rejected";
    await Activity_Log.create({
      masterlist_id: approved_by,
      action_taken: `Payable: User ${stats} a payable with transaction ID ${getData.transaction_id}`,
    });
    res.status(200).json({ message: "Data updated successfully", data });
  } catch (error) {
    // Rollback transaction if an error occurs
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

//USED MODULE:
// Payable
router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}${month}`;

  const generateTwoNum = Math.floor(10 + Math.random() * 90);
  const time = new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  try {
    // const lastPayCode = await Payable.findOne({
    //   order: [["createdAt", "DESC"]],
    // });

    // let nextCode;
    // if (lastPayCode) {
    //   const lastCode = lastPayCode.transaction_id;
    //   const lastNumber = parseInt(lastCode.substring(1), 10);
    //   nextCode = "PO-" + (lastNumber + 1).toString().padStart(6, "0");
    // } else {
    //   nextCode = "T000001";
    // }

    // res.json(nextCode);
    // Fetch the latest transaction_id

    // const lastPayCode = await Payable.findOne({
    //   where: {
    //     transaction_id: {
    //       [Op.like]: `PO-${currentMonth}%`,
    //     },
    //   },
    //   order: [["createdAt", "DESC"]],
    // });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode = `PO-${currentMonth}${time}${generateTwoNum}`;
    // if (lastPayCode && lastPayCode.transaction_id) {
    //   // console.log(`Last Pay Code: ${lastPayCode.transaction_id}`);
    //   const latestRefCode = lastPayCode.transaction_id;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `PO-${currentMonth}-${newSequence}`;
    //   } else {
    //     // If the refCode doesn't split correctly or sequence is not a number
    //     newRefCode = `PO-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `PO-${currentMonth}-00001`;
    // }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//USED MODULE:
// Payable
router.route("/create").post(async (req, res) => {
  const {
    transactionId,
    clientTransactionId,
    warehouseId,
    vendorId,
    modeOfPayment,
    customerType,
    trackingNumber,
    dueDate,
    weighingFee,
    items,
    otherFee,
    primary_discount,
    isPercent,
    calculatedAmount,
    purchaseDate,
    totalAmount,
    description,
    currencyId,
    createdBy,
    containerNumber,
    pier,
    currencyRate,
  } = req.body;
  const parsedOtherFee = JSON.parse(otherFee);

  // const isPosted = await Cutoff.findOne({
  //   where: {
  //     [Op.and]: [
  //       { from: { [Op.lte]: dueDate } },
  //       { to: { [Op.gte]: dueDate } },
  //     ],
  //     isPosted: true,
  //   },
  // });

  // if (isPosted) {
  //   return res.status(201).json({ message: "Cutoff already posted" });
  // }

  try {
    // items.forEach((element) => {
    //   console.log(element);
    // });
    // return;

    // Client Transaction Id duplicate validation
    const existingClientTransactionId = await Payable.findOne({
      where: {
        client_transaction_id: clientTransactionId,
        isDeleted: false,
      },
    });

    if (existingClientTransactionId) {
      return res.status(409).json({ error: "Transction Id Already Exists." });
    }

    const formatWeighingFee = weighingFee?.replace(/,/g, "");

    const warehouse_main_id = await Warehouse.findOne({
      where: {
        branch_type: "Main",
        isDeleted: false,
      },
    });
    // Create Payable record
    const createdPayable = await Payable.create({
      transaction_id: transactionId,
      client_transaction_id: clientTransactionId,
      warehouse_id: warehouseId,
      vendor_id: vendorId,
      MOP: modeOfPayment,
      domestic_type: customerType,
      due_date: dueDate,
      tracking_number: trackingNumber === "" ? null : trackingNumber,
      weighing_fee: parseFloat(formatWeighingFee),
      isPercent_Discount: isPercent,
      discount_value: primary_discount || 0,
      status: "Pending",
      isAdded: false,
      totalPrice: calculatedAmount,
      totalAmount: totalAmount,
      purchaseDate: purchaseDate,
      description: description,
      currencyId: currencyId,
      created_by: createdBy,
      container_number: containerNumber,
      pier: pier,
      rate: currencyRate || 1,
    });

    if (!createdPayable) {
      return res
        .status(500)
        .json({ message: "Failed to create Payable record" });
    }

    const payable_id = createdPayable.id;

    // commented since the order in adding is not preserved. Ylluja required to be in order same in client side
    // Create Payable_Product records
    // await Promise.all(
    //   items.map(async (data) => {
    //     console.log(data);
    //     await Payable_Product.create({
    //       payable_id: payable_id,
    //       product_vendor_id: data.product_vendor_id,
    //       moisture: data.moisture,
    //       moisture_type: data.moistureType,
    //       weight: data.weight,
    //       unitPrice: data.unitPrice,
    //       net_weight: data.net_weight,
    //       static_net_weight: data.net_weight,
    //     });
    //     return;
    //   })
    // );

    // Create all records in a single transaction
    const payableProducts = items
      .filter((item) => Boolean(item.product_vendor_id))
      .map((data, index) => ({
        payable_id: payable_id,
        product_vendor_id: data.product_vendor_id,
        moisture: data.moisture,
        moisture_type: data.moistureType,
        weight: data.weight,
        unitPrice: data.unitPrice,
        net_weight: data.net_weight,
        static_net_weight: data.net_weight,
        order_index: index + 1, // to maintain the order
      }));

    await Payable_Product.bulkCreate(payableProducts);

    await Promise.all(
      parsedOtherFee.map(async (data) => {
        return await Payable_Fees.create({
          payable_id: payable_id,
          fee_name: data.feeName,
          fee_amount: data.feeAmount,
        });
      })
    );
    await Activity_Log.create({
      masterlist_id: createdBy,
      action_taken: `Payable: User created a new payable with transaction ID ${transactionId}`,
    });
    // Return success response
    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getPayableBulk/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const data = await PayableBulk.findOne({
      where: {
        id: id,
        isDeleted: false,
      },
    });

    const dataTransaction = await Payable_Bulk_Transaction.findAll({
      where: {
        payable_bulk_id: id,
        isDeleted: false,
      },
      include: [
        {
          model: Payable,
          include: [
            {
              model: Payable_Product,
            },
            {
              model: Payable_Fees,
              required: false,
            },
          ],
        },
      ],
    });

    const uniqueByPayableId = [];
    const seen = new Set();

    for (const item of dataTransaction) {
      const id = item.payable?.id;
      if (!seen.has(id)) {
        seen.add(id);
        uniqueByPayableId.push(item);
      }
    }

    const dataPayment = await Payable_Payment.findAll({
      where: {
        payable_id: id,
      },
      include: [
        {
          model: accountlist_sub3,
          required: true,
          include: [
            {
              model: accountlist_base_subject,
              required: true,
            },
          ],
        },
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: data.payable_date },
          },
          {
            to: { [Op.gte]: data.payable_date },
          },
        ],
        isDeleted: false,
      },
    });

    const isPosted = findCutoff?.isPosted || false;
    const cutoffExists = findCutoff;

    console.log("-----------------isPosted-----------------", isPosted);

    res.json({
      data,
      dataTransaction: uniqueByPayableId,
      dataPayment,
      isPosted,
      cutoffExists,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/update").put(async (req, res) => {
  const {
    vendorID,
    warehouseID,
    due_date,
    purchaseDate,
    containerNumber,
    pier,
    currencyId,
    description,
    domestic_type,
    tracking_number,
    id,
    dataProduct,
    removeDataProductIds,
    floatDataProduct,
    userLoggedID,
    currencyRate,
    weighingFee,
    totalAmount,
  } = req.query;

  // const isPosted = await Cutoff.findOne({
  //   where: {
  //     [Op.and]: [
  //       { from: { [Op.lte]: due_date } },
  //       { to: { [Op.gte]: due_date } },
  //     ],
  //     isPosted: true,
  //   },
  // });

  // if (isPosted) {
  //   return res.status(201).json({ message: "Cutoff already posted" });
  // }

  try {
    const getData = await Payable.findOne({
      include: [
        {
          model: Warehouse,
          attributes: ["name"],
        },
        {
          model: Currency,
          attributes: ["currency_name"],
        },
      ],

      where: {
        id: id,
      },
    });

    const getProduct = await Payable_Product.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          include: [
            {
              model: ProductList,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      where: {
        payable_id: id,
      },
    });

    const isUpdated = await Payable.update(
      {
        vendor_id: vendorID,
        warehouse_id: warehouseID,
        due_date: due_date,
        purchaseDate: purchaseDate,
        container_number: containerNumber,
        pier: pier,
        currencyId: currencyId,
        description: description,
        domestic_type: domestic_type,
        tracking_number: tracking_number === undefined ? null : tracking_number,
        rate: currencyRate,
        weighing_fee: weighingFee || 0,
        totalPrice: totalAmount,
      },
      {
        where: {
          id: id,
        },
      }
    );

    const parseNumber = (num) => {
      return parseFloat(String(num || 0).replace(/,/g, ""));
    };

    if (Array.isArray(floatDataProduct)) {
      // for (const data of floatDataProduct) {
      // console.log(data);
      // await Payable_Product.create({
      //   payable_id: id,
      //   product_vendor_id: data.productTagVendorId,
      //   moisture: parseNumber(data.moisture),
      //   moisture_type: data.moisture_type,
      //   weight: parseNumber(data.weight),
      //   unitPrice: parseNumber(data.unitPrice),
      //   net_weight: parseNumber(data.net_weight),
      //   static_net_weight: parseNumber(data.net_weight),
      // });
      // }

      const payableProducts = floatDataProduct.map((data, index) => ({
        payable_id: id,
        product_vendor_id: data.productTagVendorId,
        moisture: parseNumber(data.moisture),
        moisture_type: data.moisture_type,
        weight: parseNumber(data.weight),
        unitPrice: parseNumber(data.unitPrice),
        net_weight: parseNumber(data.net_weight),
        static_net_weight: parseNumber(data.net_weight),
        order_index: index + 1,
      }));

      await Payable_Product.bulkCreate(payableProducts);
    }

    if (Array.isArray(dataProduct)) {
      for (const dataProducts of dataProduct) {
        await Payable_Product.update(
          {
            weight: parseNumber(dataProducts.weight),
            moisture: parseNumber(dataProducts.moisture || 0),
            net_weight: parseNumber(dataProducts.net_weight),
            static_net_weight: parseNumber(dataProducts.net_weight),
            unitPrice: parseNumber(dataProducts.unitPrice),
          },
          {
            where: {
              id: dataProducts.id,
            },
          }
        );
        // console.log(`Update transaction with payable_product: ${dataProducts}`);
      }
    }

    if (Array.isArray(removeDataProductIds)) {
      for (const removeId of removeDataProductIds) {
        await Payable_Product.destroy({
          where: {
            id: removeId,
          },
        });
        console.log(`Removed transaction with payable_product: ${removeId}`);
      }
    }

    const getWareHouse = await Warehouse.findOne({
      where: {
        warehouse_id: warehouseID,
        isDeleted: false,
      },
    });

    const getCurr = await Currency.findOne({
      where: {
        id: currencyId,
      },
    });

    const getUpdatedProduct = await Payable_Product.findAll({
      include: [
        {
          model: Product_Tag_Vendor,
          include: [
            {
              model: ProductList,
              attributes: ["product_name"],
            },
          ],
        },
      ],
      where: {
        payable_id: id,
      },
    });
    const allProduct = getProduct
      .map((record) => record.product_tag_vendor?.product_list.product_name)
      .join(", ");

    const allUpdatedProduct = getUpdatedProduct
      .map((record) => record.product_tag_vendor?.product_list.product_name)
      .join(", ");

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Payable: User updated payable information with transaction ID ${getData.transaction_id} \n
      WareHouse: ${getData.warehouse.name} to ${getWareHouse.name}
      Currency: ${getData.currency.currency_name} to ${getCurr.currency_name}
      Due Date: ${getData.due_date} to ${due_date}
      Purchase Date: ${getData.purchaseDate} to ${purchaseDate}
      Container Number: ${getData.container_number} to ${containerNumber}
      Pier: ${getData.pier} to ${pier}
      Domestic Type: ${getData.domestic_type} to ${domestic_type}
      Products: [${allProduct}] to [${allUpdatedProduct}]
      `,
    });

    if (isUpdated) {
      res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/cancel_transaction").post(async (req, res) => {
  const { id } = req.query;
  try {
    const isCancel = await Payable.update(
      {
        status: "Cancelled",
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (isCancel) {
      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//USED MODULE:
// Payable
router.route("/markPaid_transaction").post(async (req, res) => {
  const { id } = req.query;
  try {
    const isCancel = await Payable.update(
      {
        status: "Paid",
        isPaid: true,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (isCancel) {
      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSubject3LocalPayable").get(async (req, res) => {
  const { subjectId } = req.query;
  try {
    const subject3List = await accountlist_sub3.findAll({
      where: { account_list_base_sub_id: subjectId, isDeleted: false },
    });
    res.status(200).json(subject3List);
  } catch (error) {
    res.status(500).json();
  }
});

router.route("/getSubject1LocalPayable").get(async (req, res) => {
  const { account_selected, selectedPayment, selected_currency_id } = req.query;

  try {
    // Check if matching accounts exist for the selected criteria
    const subjectWithSpecificCurrency = await accountlist_sub3.findOne({
      include: [
        {
          model: accountlist_base_subject,
          required: true,
          where: {
            module_type: account_selected,
          },
        },
        {
          model: Currency,
          required: true,
          where: {
            ...(selected_currency_id && { id: selected_currency_id }),
          },
        },
      ],
    });

    if (!subjectWithSpecificCurrency) {
      return res.status(404).json({
        message: `No matching account (${account_selected}) exists for the selected currency.`,
      });
    }

    // Fetch all subjects matching the criteria
    const subjects = await accountlist_base_subject.findAll({
      where: {
        module_type: account_selected,
        subject_type: selectedPayment,
        isDeleted: false,
      },
      include: [
        {
          model: accountlist_sub3,
          attributes: ["amount"],
          required: false,
          where: {
            ...(selected_currency_id && { currency_id: selected_currency_id }),
          },
          include: [
            {
              model: currency_sub,
              attributes: ["currency_rate"],
              required: true,
            },
          ],
        },
      ],
    });

    // Check if subjects were found
    if (!subjects || subjects.length === 0) {
      return res.status(404).json({
        message: "No matching accounts exist for the selected criteria.",
      });
    }

    const subjectsWithTotal = subjects.map((subject) => {
      const totalAmount = subject.account_list_sub3s.reduce((sum, sub3) => {
        return sum + parseFloat(sub3.amount * sub3.currency.currency_rate || 0);
      }, 0);

      return {
        ...subject.toJSON(),
        totalAmount: totalAmount,
      };
    });

    res.status(200).json(subjectsWithTotal);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/validate-issued-date", async (req, res) => {
  const { issuedDate } = req.body;
  console.log("**************************************issuedDate: ", issuedDate);

  if (!issuedDate) {
    return res.status(400).json({ message: "Issued date is required" });
  }

  try {
    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: issuedDate } },
          { to: { [Op.gte]: issuedDate } },
        ],
        isPosted: true,
        isDeleted: false,
      },
    });

    if (isPosted) {
      return res
        .status(200)
        .json({ isPosted: true, message: "Cutoff already posted" });
    }
    return res
      .status(200)
      .json({ isPosted: false, message: "Issued date is valid" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.route("/addPayment").post(async (req, res) => {
  try {
    const {
      transactionNumber,
      payableDate,
      balance,
      selectedVendorId,
      floatPayment,
      payableList,
      currency,
      currencyRate,
      currentLocation,
      createdBy,
      module, // local or overseas
    } = req.body;

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: payableDate } },
          { to: { [Op.gte]: payableDate } },
        ],
        isPosted: true,
        isDeleted: false,
      },
    });

    if (isPosted) {
      return res.status(201).json({ message: "Cutoff already posted" });
    }

    const createPayableBulk = await PayableBulk.create({
      transaction_number: transactionNumber,
      status: "For-Approval",
      payable_date: payableDate,
      total_amount: balance,
      vendor_id: selectedVendorId,
      currency_id: currency,
      rate: currencyRate,
      created_by: createdBy,
      domestic_type: module,
    });

    if (createPayableBulk) {
      for (const payableLists of payableList) {
        const createPayBulkTransaction = await Payable_Bulk_Transaction.create({
          payable_bulk_id: createPayableBulk.id,
          payable_id: payableLists.id,
        });

        await Payable.update(
          { isAdded: true },
          { where: { id: payableLists.id } }
        );
      }
    }

    if (floatPayment && floatPayment.length > 0) {
      for (const data of floatPayment) {
        await Payable_Payment.create({
          payable_id: createPayableBulk.id,
          accountList_id: data.subject3,
          payment_type: data.paymentMethod,
          check_number: data.checkNumber || null,
          online_name: data.remarks || null,
          ref_number: data.refNumber || null,
          date_issued: data.issuedDate,
          amount: data.amountInputted || 0,
          payment_status: "For-Approval",
          // is_completed: data.paymentMethod === "Cash" ? true : false,
        });
      }
    }

    await Activity_Log.create({
      masterlist_id: createdBy,
      action_taken: `${currentLocation} Purchase: User created a new ${currentLocation.toLowerCase()} purchase with transaction ID ${transactionNumber}`,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/updatePayment").post(async (req, res) => {
  try {
    let {
      id,
      transactionNumber,
      payableDate,
      balance,
      selectedVendorId,
      floatPayment,
      payableList,
      addedIds,
      removeIds,
      removePaymentListId,
      userLoggedID,
      currentLocation,
      currencyRate,
    } = req.body;

    const isPosted = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: payableDate } },
          { to: { [Op.gte]: payableDate } },
        ],
        isPosted: true,
        isDeleted: false,
      },
    });

    if (isPosted) {
      return res.status(201).json({ message: "Cutoff already posted" });
    }

    //For Act log
    const getData = await Payable_Bulk_Transaction.findAll({
      include: [
        {
          model: PayableBulk,
          attributes: ["transaction_number"],
        },
        {
          model: Payable,
          attributes: ["transaction_id"],
        },
      ],
      where: {
        payable_bulk_id: id,
      },
    });

    const getDataPayablePayment = await Payable_Payment.findAll({
      include: [
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        payable_id: id,
      },
    });

    const updatePayableBulk = await PayableBulk.update(
      {
        status: "For-Approval",
        payable_date: payableDate,
        rate: currencyRate,
        // total_amount: balance,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (Array.isArray(removePaymentListId)) {
      for (const paymentListId of removePaymentListId) {
        await Payable_Payment.destroy({
          where: {
            id: paymentListId,
          },
        });
      }
    }

    console.log(addedIds, "addedids=====");

    if (Array.isArray(addedIds)) {
      for (const addedId of addedIds) {
        await Payable_Bulk_Transaction.create({
          payable_bulk_id: id,
          payable_id: addedId,
        });

        await Payable.update(
          {
            isAdded: true,
          },
          {
            where: {
              id: addedId,
            },
          }
        );

        console.log(addedId, "added==");
      }
    } else {
      console.log("No addedIds provided or addedIds is not an array.");
    }

    // if (Array.isArray(removeIds)) {
    //   for (const removeId of removeIds) {
    //     await Payable.update(
    //       {
    //         isAdded: false,
    //       },
    //       {
    //         where: {
    //           id: removeId,
    //         },
    //       }
    //     );

    //     await Payable_Bulk_Transaction.update(
    //       {
    //         isDeleted: true,
    //       },
    //       {
    //         where: {
    //           payable_bulk_id: id,
    //           payable_id: removeId,
    //         },
    //       }
    //     );

    //     // await Payable_Bulk_Transaction.destroy({
    //     //   where: {
    //     //     payable_bulk_id: id,
    //     //     payable_id: removeId,
    //     //   },
    //     // });
    //   }
    // }

    if (floatPayment && floatPayment.length > 0) {
      for (const data of floatPayment) {
        // await Payable_Payment.create({
        //   payable_id: id,
        //   accountList_id: data.subject3,
        //   payment_type: data.paymentMethod,
        //   check_number: data.checkNumber || null,
        //   online_name: data.remarks || null,
        //   ref_number: data.refNumber || null,
        //   date_issued: data.issuedDate,
        //   amount: data.amountInputted || 0,
        // });

        const validateId = await Payable_Payment.findOne({
          where: {
            id: data.id,
          },
        });

        if (validateId) {
          await Payable_Payment.update(
            {
              amount: data.amountInputted || 0,
            },
            {
              where: {
                id: data.id,
              },
            }
          );
        } else {
          await Payable_Payment.create({
            payable_id: id,
            accountList_id: data.subject3,
            payment_type: data.paymentMethod,
            check_number: data.checkNumber || null,
            online_name: data.remarks || null,
            ref_number: data.refNumber || null,
            date_issued: data.issuedDate,
            amount: data.amountInputted || 0,
            payment_status: "For-Approval",
          });
        }
      }
    }
    const getUpdatedData = await Payable_Bulk_Transaction.findAll({
      include: [
        {
          model: PayableBulk,
          attributes: ["transaction_number"],
        },
        {
          model: Payable,
          attributes: ["transaction_id"],
        },
      ],
      where: {
        payable_bulk_id: id,
      },
    });

    const getUpdatedDataPayablePayment = await Payable_Payment.findAll({
      include: [
        {
          model: AccountListSub3,
          attributes: ["account_name"],
        },
      ],
      where: {
        payable_id: id,
      },
    });

    const getBulkTransaction = getUpdatedData[0].payable_bulk;
    const getOldBulkTransaction = getData[0].payable_bulk;

    const oldPayable = getData
      .map((record) => record.payable?.transaction_id)
      .join(", ");

    const updatedPayable = getUpdatedData
      .map((record) => record.payable?.transaction_id)
      .join(", ");

    const oldPaymentList = getDataPayablePayment
      .map((record) => record.account_list_sub3?.account_name)
      .join(", ");

    const updatedPaymentList = getUpdatedDataPayablePayment
      .map((record) => record.account_list_sub3?.account_name)
      .join(", ");

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `${currentLocation} Purchase: User updated local collection information with transaction ID ${getBulkTransaction.transaction_number} \n 
        Order List: [${oldPayable}] to [${updatedPayable}]
        Payment List: [${oldPaymentList}] to [${updatedPaymentList}]
        `,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/updateStatus").post(async (req, res) => {
  try {
    const {
      id,
      payableDate,
      status,
      paymentList,
      floatPayment,
      payableList,
      transactionNumber,
      module,
      approvedBy,
    } = req.body;

    const moduleType =
      module === "local" ? "Local Payable" : "Overseas Payable";

    console.log("*****************************-*payableList : ", status);
    if (status == "Rejected") {
      payableList.forEach((element) => {
        Payable.update(
          {
            isAdded: false,
          },
          {
            where: {
              id: element.payable.id,
            },
          }
        );
      });
    }

    const approved = await PayableBulk.update(
      {
        status: status,
        payable_date: payableDate,
        approved_by: approvedBy,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (status == "Approved") {
      if (floatPayment && floatPayment.length > 0) {
        for (const data of floatPayment) {
          // Distribute data to Cash Flow
          if (data.paymentMethod == "Cash") {
            await CashFlow.create({
              // account_list_id_cash_from: parseInt(data.subject3),
              account_list_id_cash_from: String(data.subject3),
              transaction_date: data.issuedDate,
              transaction_number: transactionNumber,
              account_list_id_cash_to: null,
              module_from: moduleType, //
              description: "",
              amount: data.amountInputted,
              status: "Paid",
            });
            accountlist_sub3.decrement("amount", {
              by: parseFloat(data.amountInputted),
              where: { id: String(data.subject3) },
            });
            await accountlist_transaction_subject.create({
              account_list_sub3_id_transacted: String(data.subject3),
              payment_method: data.paymentMethod,
              amount: data.amountInputted,
              date: data.issuedDate,
              check_or_remarks: "",
              type: "Credit",
              module_from: moduleType,
              transaction_number: transactionNumber,
            });
          }

          // Distribute data to Bank Transaction
          if (
            data.paymentMethod == "Bank" &&
            (data.checkNumber == "" || data.checkNumber == null)
          ) {
            await bank_transaction.create({
              account_list_id_bank_from: String(data.subject3),
              transaction_date: data.issuedDate,
              transaction_number: transactionNumber,
              account_list_id_bank_to: null,
              module_from: moduleType, //
              description: "",
              amount: data.amountInputted,
              status: "Pending",
            });
          }

          // Distribute data to Issued Check
          if (data.paymentMethod == "Bank" && data.checkNumber) {
            await issued_check.create({
              account_list_id_issued_from: String(data.subject3),
              transaction_date: data.issuedDate,
              check_number: data.checkNumber,
              transaction_number: transactionNumber,
              module_from: moduleType,
              description: "To pay",
              amount: data.amountInputted,
              status: "Pending",
            });
          }

          // await Payable_Payment.update(
          //   {
          //     status: true,
          //   },
          //   {
          //     where: {
          //       payable_id: data.id,
          //       accountList_id: String(data.subject3),
          //     },
          //   }
          // );
        }
      }

      console.log(floatPayment, "float==");

      await Payable_Payment.update(
        {
          payment_status: "Approved",
        },
        {
          where: {
            payable_id: id,
          },
        }
      );

      const isAllPaymentNotCash = floatPayment?.some((item) => {
        return item.paymentMethod !== "Cash";
      });

      if (payableList && payableList.length > 0) {
        for (const data of payableList) {
          await Payable.update(
            {
              status: `${isAllPaymentNotCash ? "Partially-Paid" : "Paid"}`,
            },
            {
              where: {
                id: data.payable.id,
                transaction_id: data.payable.transaction_id,
              },
            }
          );
        }
      }
    }

    // if (paymentList && paymentList.length > 0) {
    //   for (const data of paymentList) {
    //     await issued_check.create({
    //       account_list_id_issued_from: data.account_list_sub3.id,
    //       transaction_date: data.date_issued,
    //       check_number: data.check_number,
    //       transaction_number: "to confirm",
    //       module_from: "Payable",
    //       description: "To pay",
    //       amount: data.amount,
    //       status: "Pending",
    //     });
    //   }
    // }

    const getData = await PayableBulk.findOne({
      where: {
        id: id,
      },
    });
    const moduleType2 = module === "local" ? "Local " : "Overseas ";

    await Activity_Log.create({
      masterlist_id: approvedBy,
      action_taken: `${moduleType2} Purchase: User ${status.toLowerCase()} a ${moduleType2.toLocaleLowerCase()} purhcase with transaction ID ${
        getData.transaction_number
      }`,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/bulk/approve-reject").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      id,
      payableDate,
      status,
      paymentList,
      floatPayment,
      payableList,
      transactionNumber,
      module,
      approvedBy,
      vendorId,
      currencyName,
      currencyRate,
    } = req.body;

    const moduleType =
      module === "local" ? "Local Payable" : "Overseas Payable";

    // Helper: Update payables
    const updatePayables = async (data) => {
      await Payable.update(data, {
        where: {
          id: {
            [Op.in]: payableList.map((item) => item.payable.id),
          },
        },
        transaction,
      });
    };

    // Helper: Update payable bulk
    const updateBulkStatus = async (status) => {
      await PayableBulk.update(
        {
          status,
          payable_date: payableDate,
          approved_by: approvedBy,
          date_approved: await getAccurateDate(),
        },
        {
          where: {
            id,
          },
          transaction,
        }
      );
    };

    // --- Handles status approved ---
    if (status === "Approved") {
      // Handles approval with payments
      if (floatPayment.length) {
        for (const data of floatPayment) {
          if (data.paymentMethod == "Cash") {
            await Promise.all([
              // Distribute data to Cash Flow
              CashFlow.create(
                {
                  account_list_id_cash_from: String(data.subject3),
                  transaction_date: data.issuedDate,
                  transaction_number: transactionNumber,
                  account_list_id_cash_to: null,
                  module_from: moduleType,
                  description: "",
                  amount: data.amountInputted,
                  status: "Paid",
                },
                { transaction }
              ),
              // Decrease the selected account's amount by the payment value
              accountlist_sub3.decrement("amount", {
                by: parseFloat(data.amountInputted),
                where: { id: String(data.subject3) },
                transaction,
              }),
              // Create credit entry for subject3 account
              accountlist_transaction_subject.create(
                {
                  account_list_sub3_id_transacted: String(data.subject3),
                  payment_method: data.paymentMethod,
                  amount: data.amountInputted,
                  date: data.issuedDate,
                  check_or_remarks: "",
                  type: "Credit",
                  module_from: moduleType,
                  transaction_number: transactionNumber,
                  rate: currencyRate,
                },
                { transaction }
              ),
              // Create a payable journal for purchase report
              PayableJournal.create(
                {
                  vendor_id: vendorId,
                  transaction_number: transactionNumber,
                  date: data.issuedDate,
                  total_amount: data.amountInputted,
                  total_quantity: 0,
                  avg_unit_price: 0,
                  payment_type: "Credit",
                  currency_name: currencyName,
                  currency_rate: currencyRate,
                },
                { transaction }
              ),
            ]);
          }

          // Distribute data to Bank Transaction
          if (data.paymentMethod == "Bank" && !data.checkNumber) {
            await bank_transaction.create(
              {
                account_list_id_bank_from: String(data.subject3),
                transaction_date: data.issuedDate,
                transaction_number: transactionNumber,
                account_list_id_bank_to: null,
                module_from: moduleType,
                description: "",
                amount: data.amountInputted,
                status: "Pending",
              },
              { transaction }
            );
          }

          // Process payment with check number
          if (data.paymentMethod == "Bank" && data.checkNumber) {
            // Distribute data to Issued Check
            await issued_check.create(
              {
                account_list_id_issued_from: String(data.subject3),
                transaction_date: data.issuedDate,
                check_number: data.checkNumber,
                transaction_number: transactionNumber,
                module_from: moduleType,
                description: "To pay",
                amount: data.amountInputted,
                status: "Pending",
              },
              { transaction }
            );

            // Create a check journal "Debit" entry for trial balance
            await CheckJournal.create(
              {
                module_from: moduleType,
                transaction_number: transactionNumber,
                transaction_date: payableDate,
                issued_date: data.issuedDate,
                type: "Debit",
                amount: data.amountInputted,
                check_number: data.checkNumber,
                currency_name: currencyName,
                currency_rate: currencyRate,
              },
              { transaction }
            );
          }
        }
      }

      // Update payment status to "Approved"
      await Payable_Payment.update(
        {
          payment_status: "Approved",
        },
        {
          where: {
            payable_id: id, // payable bulk
          },
          transaction,
        }
      );

      // Check payments to finalize PayableBulk/Payable status
      if (floatPayment.length) {
        const [payableSummary, totalPayment, payments] = await Promise.all([
          PayableBulk.findOne({
            attributes: ["total_amount"],
            where: {
              id,
              isDeleted: false,
            },
            transaction,
            raw: true,
          }),
          Payable_Payment.sum("amount", {
            where: {
              payable_id: id,
              payment_status: "Approved",
            },
            transaction,
          }),
          // Get all Payments to determine their payment types (Cash or Bank)
          Payable_Payment.findAll({
            attributes: ["payment_type"],
            where: {
              payable_id: id,
            },
            transaction,
            raw: true,
          }),
        ]);
        const isAllBank = payments.every((p) => p.payment_type === "Bank");
        const isAllCash = payments.every((p) => p.payment_type === "Cash");
        const hasFullPayment = payableSummary.total_amount === totalPayment;
        const isPaid = hasFullPayment && isAllCash; // payment settled with all cash

        const getStatus = (isAllBank, isPaid) => {
          if (isAllBank) return "Approved";
          if (isPaid) return "Paid";
          return "Partially-Paid";
        };

        // Update payable bulk status
        await updateBulkStatus(getStatus(isAllBank, isPaid));

        // Update payable status
        if (payableList?.length) {
          await updatePayables({ status: getStatus(isAllBank, isPaid) });
        }
      }

      // Handles approval without payments
      if (!floatPayment.length) {
        // Update payable bulk status to "Approved"
        await updateBulkStatus("Approved");
      }
    }

    // --- Handles rejected status ---
    if (status == "Rejected") {
      // Update payables "isAdded" column to false
      await updatePayables({ isAdded: false });

      // Update payable bulk status to "Rejected"
      await updateBulkStatus("Rejected");
    }

    // --- Create activity log ---
    const getData = await PayableBulk.findOne({
      attributes: ["transaction_number"],
      where: {
        id,
      },
      transaction,
      raw: true,
    });

    const moduleLabel = module === "local" ? "Local " : "Overseas ";

    await Activity_Log.create(
      {
        masterlist_id: approvedBy,
        action_taken: `${moduleLabel} Purchase: User ${status.toLowerCase()} a ${moduleLabel.toLocaleLowerCase()} purhcase with transaction ID ${
          getData.transaction_number
        }`,
      },
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({ message: `Transaction ${status} successfully.` });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/getLatestCutoff").get(async (req, res) => {
  const date = new Date();

  const data = await Cutoff.findOne({
    where: {
      [Op.and]: [{ from: { [Op.lte]: date } }, { to: { [Op.gte]: date } }],
    },
  });

  res.json(data);
});

router.route("/fetchPreviousCutoffPayable").get(async (req, res) => {
  const { startDate, endDate, currencyId } = req.query;
  try {
    const date = new Date();
    const currentCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.gte]: startDate } },
          { to: { [Op.lte]: endDate } },
        ],
        isDeleted: false,
      },
    });

    if (!currentCutoff) {
      return res.status(404).json({ message: "Current cutoff not found" });
    }

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        [Op.and]: [
          { purchaseDate: { [Op.lt]: currentCutoff.from } },
          { isPaid: false },
          // { isAdded: false },
          { status: "Approved" },
        ],
        isDeleted: false,
      },
    });

    const totalPreviousCutoffPrice = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.totalPrice * value.rate
          : value.totalPrice)
      );
    }, 0);

    res.json({ totalPrice: totalPreviousCutoffPrice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchCurrentCutoffPayable").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        [Op.and]: [
          {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          // { isPaid: false },
          { status: "Approved" },
        ],
        isDeleted: false,
      },
    });

    const totalCurrentCutoffPrice = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.totalPrice * value.rate
          : value.totalPrice)
      );
    }, 0);

    res.json({ totalPrice: totalCurrentCutoffPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentTotalPayable").get(async (req, res) => {
  const { startDate, endDate, currencyId } = req.query;
  try {
    const date = new Date();
    const currentCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.gte]: startDate } },
          { to: { [Op.lte]: endDate } },
        ],
        isDeleted: false,
      },
    });

    if (!currentCutoff) {
      return res.status(404).json({ message: "Current cutoff not found" });
    }

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        [Op.and]: [
          {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          // { isPaid: false },
          { status: { [Op.ne]: "Rejected" } },
          { status: { [Op.ne]: "Pending" } },
        ],
        isDeleted: false,
      },
    });

    const totalCurrentCutoffPrice = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.totalPrice * value.rate
          : value.totalPrice)
      );
    }, 0);

    res.json({ totalPrice: totalCurrentCutoffPrice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchTotalDiscount").get(async (req, res) => {
  const { startDate, endDate, currencyId } = req.query;
  try {
    // const date = new Date();
    const currentCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.gte]: startDate } },
          { to: { [Op.lte]: endDate } },
        ],
      },
    });

    if (!currentCutoff) {
      return res.status(404).json({ message: "Current cutoff not found" });
    }

    // Calculate the total discount sum in php
    // const fetchTotalDiscount = await Payable.sum("discount_value", {
    //   where: {
    //     [Op.and]: [
    //       // { createdAt: { [Op.gt]: currentCutoff.from } },
    //       {
    //         due_date: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //       },
    //       { isPercent_Discount: 0 },
    //       { status: "Approved" },
    //     ],
    //   },
    // });

    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        [Op.and]: [
          // { createdAt: { [Op.gt]: currentCutoff.from } },
          {
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
          { isPercent_Discount: 0 },
          { status: "Approved" },
        ],
        isDeleted: false,
      },
    });

    const fetchTotalDiscount = data.reduce((total, value) => {
      return (
        total +
        (currencyId === "All"
          ? value.discount_value * value.currency.currency_rate
          : value.discount_value)
      );
    }, 0);

    //commented kasi as per sir Pat d kasama to display ang discount sa payable

    // // Fetch all Discount in percent
    // const fetchDiscountInPercent = await Payable_Product.findAll({
    //   include: [
    //     {
    //       model: Payable,
    //       required: true,
    //       include: [
    //         {
    //           model: Currency,
    //           required: true,
    //           where: {
    //             id: currencyId,
    //           },
    //         },
    //       ],
    //       where: {
    //         isPercent_Discount: 1,
    //         purchaseDate: {
    //           [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //         },
    //         status: "Approved",
    //       },
    //     },
    //   ],
    // });

    // // Calculate the total discount sum in percent
    // const totalDiscountInPercent = fetchDiscountInPercent.reduce(
    //   (total, value) => {
    //     const totalWeight = value.unitPrice * value.weight;
    //     const totalMoisture =
    //       (value.moisture / 100) * value.unitPrice * value.weight;
    //     return (
    //       total +
    //       parseFloat(
    //         totalWeight -
    //           totalMoisture -
    //           value.payable.weighing_fee -
    //           value.payable.totalPrice
    //         //  * value.payable.currency.currency_rate
    //       )
    //     );
    //   },
    //   0
    // );

    // console.log(totalDiscountInPercent);

    res.json({
      totalDiscount: parseFloat(fetchTotalDiscount),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchTotalIssued").get(async (req, res) => {
  const { startDate, endDate, currencyId } = req.query;
  try {
    const data = await Payable_Bulk_Transaction.findAll({
      include: [
        {
          model: PayableBulk,
          required: true,
          where: {
            status: "Approved",
            isDeleted: false,
            payable_date: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
        },
        {
          model: Payable,
          required: true,
          include: [
            {
              model: Currency,
              required: true,
              where: {
                ...(currencyId !== "All" && { id: currencyId }),
              },
            },
          ],
          where: {
            isAdded: true,
            purchaseDate: {
              [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
            },
          },
        },
      ],
    });
    const totalIssued = data.reduce((total, value) => {
      console.log(
        "id",
        value.payable.transaction_id,
        "Vaaal",
        value.payable.totalPrice,
        "Rate",
        value.payable.currency.currency_rate,
        "equal",
        value.payable.totalPrice * value.payable.rate
      );
      return (
        total +
        (currencyId === "All"
          ? value.payable.totalPrice * value.payable.currency.currency_rate
          : value.payable.totalPrice)
      );
    }, 0);

    // console.log("------------------", totalIssued);
    res.json(totalIssued);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
});

router.route("/summary/total-issued").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;

    const paymentSummary = await Payable_Payment.findOne({
      attributes: [
        [
          sequelize.literal(`SUM(
            CASE
              WHEN ${currencyId !== "All"} THEN amount
              ELSE amount * currency_rate
            END
          )`),
          "totalIssued",
        ],
      ],
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Bulk_Transaction,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                  where: {
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
                    },
                    ...(currencyId !== "All" && { currencyId }),
                    isDeleted: false,
                  },
                },
              ],
            },
            {
              model: Currency,
              required: true,
              attributes: [],
            },
          ],
          where: {
            status: {
              [Op.in]: ["Approved", "Partially-Paid", "Paid"],
            },
            isDeleted: false,
          },
        },
      ],
      where: {
        payment_status: "Approved",
      },
      subQuery: false,
      raw: true,
    });

    res.status(200).json(paymentSummary.totalIssued || 0);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/fetchTotalPayable").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate, currencyId } = req.query;

    if (!currencyId)
      return res.status(400).json({ error: "currencyId is required." });

    const data = await PayableBulk.findAll({
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              include: [
                {
                  model: Currency,
                },
              ],
              required: true,
              where: {
                domestic_type: domestic_type === "local" ? "local" : "overseas",
              },
            },
          ],
        },
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        isDeleted: false,
        payable_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        status: "Approved",
      },
    });

    const totalPayable = data.reduce((total, payableBulk) => {
      const amount = payableBulk.payable_bulk_transactions.reduce(
        (subtotal, transaction) => {
          const payableRate = transaction.payable?.currency.currency_rate || 1;
          // console.log("Rate", payableRate);

          const payablePrice = transaction.payable?.totalPrice;

          // console.log("Amount", payablePrice);

          // const transactionTotal = payableRate * payablePrice;
          const transactionTotal =
            currencyId === "All" ? payablePrice * payableRate : payablePrice;

          return subtotal + transactionTotal;
        },
        0
      );

      return total + amount;
    }, 0);
    res.status(200).json(totalPayable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchTotalPaid").get(async (req, res) => {
  try {
    const { domestic_type, startDate, endDate, currencyId } = req.query;

    if (!currencyId)
      return res.status(400).json({ error: "currencyId is required" });

    const payableBulk = await PayableBulk.findAll({
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: true,
          include: [
            {
              model: Payable,
              include: [
                {
                  model: Currency,
                },
              ],
              required: true,
              where: {
                domestic_type: domestic_type === "local" ? "local" : "overseas",
              },
            },
          ],
        },
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId !== "All" && { id: currencyId }),
          },
        },
      ],
      where: {
        isDeleted: false,
        payable_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        status: "Approved",
      },
    });

    const payableBulkTransactionNumber = payableBulk.map((item) => {
      return item.transaction_number;
    });

    // const totalPaidBankTransactions = await bank_transaction.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Payable" : "Overseas Payable",
    //     status: "Confirmed",
    //     transaction_number: {
    //       [Op.in]: payableBulkTransactionNumber,
    //     },
    //   },
    // });

    const confirmedBankTransactions = await bank_transaction.findAll({
      where: {
        transaction_number: payableBulkTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Payable" : "Overseas Payable",
        status: "Confirmed",
      },
      attributes: ["transaction_number"],
    });

    const confirmedIssuedCheck = await issued_check.findAll({
      where: {
        transaction_number: payableBulkTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Payable" : "Overseas Payable",
        status: "Paid",
      },
      attributes: ["transaction_number"],
    });

    const totalPaidCashflow = await CashFlow.findAll({
      where: {
        transaction_number: payableBulkTransactionNumber,
        module_from:
          domestic_type === "local" ? "Local Payable" : "Overseas Payable",
        status: "Paid",
      },
      attributes: ["transaction_number"],
    });

    const confirmedTransactionNumbers = confirmedBankTransactions.map(
      (tx) => tx.transaction_number
    );
    const confirmedIssuedTransactionNumbers = confirmedIssuedCheck.map(
      (tx) => tx.transaction_number
    );

    const confirmedCashTransactionNumbers = totalPaidCashflow.map(
      (tx) => tx.transaction_number
    );

    const countedIds = new Set();

    const totalPaidTransactions = payableBulk
      .filter((item) => item.status === "Approved")
      .reduce((total, value) => {
        const amount = value.payable_bulk_transactions.reduce(
          (subtotal, transaction) => {
            const id = transaction.payable?.transaction_id;
            const payableRate =
              transaction.payable?.currency.currency_rate || 1;
            const payableAmount = transaction.payable?.totalPrice;
            const transactionNumber = value.transaction_number;

            // console.log(
            //   "Transaction ID:",
            //   id,
            //   "Amount:",
            //   payableRate,
            //   "Rate:",
            //   payableAmount,
            //   "Transaction Number:",
            //   transactionNumber,
            //   "Type of transactionNumber:",
            //   typeof transactionNumber,
            //   "Bank Confirmed List:",
            //   confirmedTransactionNumbers.map(String),
            //   "Issued Confirmed List:",
            //   confirmedIssuedTransactionNumbers.map(String)
            // );

            if (
              confirmedTransactionNumbers.includes(transactionNumber) ||
              confirmedIssuedTransactionNumbers.includes(transactionNumber) ||
              confirmedCashTransactionNumbers.includes(transactionNumber)
            ) {
              countedIds.add(id);
              // const transactionTotal = payableRate * payableAmount;
              const transactionTotal =
                currencyId === "All"
                  ? payableAmount * payableRate
                  : payableAmount;
              return subtotal + transactionTotal;
            }

            return subtotal;
          },
          0
        );

        return total + amount;
      }, 0);

    // const totalPaidIssuedCheck = await issued_check.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Payable" : "Overseas Payable",
    //     status: "Paid",
    //     transaction_number: {
    //       [Op.in]: payableBulkTransactionNumber,
    //     },
    //   },
    // });

    // const totalPaidCashflow = await CashFlow.sum("amount", {
    //   where: {
    //     module_from:
    //       domestic_type === "local" ? "Local Payable" : "Overseas Payable",
    //     status: "Paid",
    //     transaction_number: {
    //       [Op.in]: payableBulkTransactionNumber,
    //     },
    //   },
    // });

    // const totalPaid =
    //   totalPaidBankTransactions + totalPaidIssuedCheck + totalPaidCashflow;

    res.status(200).json(totalPaidTransactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// For local/overseas tab total payable widget
router.route("/summary/total-payable").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "Missing startDate/endDate query param" });

    const payableSummary = await PayableBulk.findOne({
      attributes: [
        [
          sequelize.literal(`SUM(
            CASE
              WHEN ${currencyId !== "All"} THEN total_amount
              ELSE total_amount * currency_rate
            END
          )`),
          "totalPayable",
        ],
      ],
      include: [
        {
          model: Currency,
          required: true,
          attributes: [],
        },
      ],
      where: {
        [Op.and]: [
          { domestic_type },
          { ...(currencyId !== "All" && { currency_id: currencyId }) },
        ],
        payable_date: {
          [Op.between]: [startDate, endDate],
        },
        isDeleted: false,
      },
      raw: true,
    });

    const paymentSummary = await Payable_Payment.findOne({
      attributes: [
        [
          sequelize.literal(`
            SUM(
              CASE
                WHEN ${currencyId !== "All"} THEN amount
                ELSE amount * currency_rate
              END
            )
          `),
          "totalPaid",
        ],
      ],
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: [],
          include: [
            {
              model: Currency,
              required: true,
              attributes: [],
            },
          ],
          where: {
            domestic_type,
            ...(currencyId !== "All" && { currency_id: currencyId }),
            isDeleted: false,
          },
        },
      ],
      where: {
        date_issued: {
          [Op.between]: [startDate, endDate],
        },
        payment_status: "Approved",
      },
      raw: true,
    });

    const payableBalance =
      (payableSummary.totalPayable || 0) - (paymentSummary.totalPaid || 0);

    res.status(200).json({ totalPayable: payableBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// For local/overseas tab total paid widget
router.route("/summary/total-paid").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "Missing startDate/endDate query param" });

    const totalPaid = await Payable_Payment.findOne({
      attributes: [
        [
          sequelize.literal(`
            SUM(
              CASE
                WHEN ${currencyId !== "All"} THEN amount
                ELSE amount * currency_rate
              END
            )
          `),
          "totalPaid",
        ],
      ],
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: [],
          include: [
            {
              model: Currency,
              required: true,
              attributes: [],
            },
          ],
          where: {
            domestic_type,
            ...(currencyId !== "All" && { currency_id: currencyId }),
            isDeleted: false,
          },
        },
      ],
      where: {
        date_issued: {
          [Op.between]: [startDate, endDate],
        },
        payment_status: "Approved",
      },
      raw: true,
    });

    res.status(200).json(totalPaid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/fetchPreviousPurchaseKilo").get(async (req, res) => {
  try {
    const { startDate, currencyId } = req.query;

    // Validate query param
    if (!startDate) {
      return res.status(400).json({ message: "Missing startDate query param" });
    }

    // Get the previous cutoff
    const previousCutoffDate = await Cutoff.findOne({
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    // If no previous cutoff date return 0
    if (!previousCutoffDate) {
      return res.status(200).json({ previousPurchaseKilo: 0 });
    }

    // Sum all weight from previous cutoff
    const previousPurchaseKilo = await Payable_Product.findOne({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("net_weight")),
          "previousPurchaseKilo",
        ],
      ],
      include: [
        {
          model: Payable,
          required: true,
          attributes: [],
          where: {
            purchaseDate: {
              [Op.between]: [previousCutoffDate.from, previousCutoffDate.to],
            },
            ...(currencyId !== "All" && { currencyId }),
            isDeleted: false,
            status: {
              [Op.in]: ["Approved", "Partially-Paid", "Paid"],
            },
          },
        },
      ],
      raw: true,
    });

    res.status(200).json(previousPurchaseKilo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentPurchaseKilo").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;

    // Validate query param
    if (!startDate) {
      return res.status(400).json({ message: "Missing startDate query param" });
    }

    if (!endDate) {
      return res.status(400).json({ message: "Missing endDate query param" });
    }

    // Sum all weight from current cutoff
    const currentPurchaseKilo = await Payable_Product.findOne({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("net_weight")),
          "currentPurchaseKilo",
        ],
      ],
      include: [
        {
          model: Payable,
          required: true,
          attributes: [],
          where: {
            purchaseDate: {
              [Op.between]: [startDate, endDate],
            },
            ...(currencyId !== "All" && { currencyId }),
            isDeleted: false,
            status: {
              [Op.in]: ["Approved", "Partially-Paid", "Paid"],
            },
          },
        },
      ],
      raw: true,
    });

    res.status(200).json(currentPurchaseKilo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/deletePayable").delete(async (req, res) => {
  try {
    const { primary_id, purchase_date, transaction_id, userLoggedID } =
      req.query;

    const getCutoff = await Cutoff.findOne({
      isDeleted: false,
      where: {
        [Op.and]: [
          {
            from: {
              [Op.lte]: purchase_date, // from date is less than or equal to purchase date
            },
          },
          {
            to: {
              [Op.gte]: purchase_date, // to date is greater than or equal to purchase date
            },
          },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    // const CutoffFrom = getCutoff.from;

    // const CutoffTo = getCutoff.to;
    const isPosted = getCutoff.isPosted;
    const CutoffName = getCutoff.name;

    if (isPosted) {
      return res.status(201).json({
        success: false,
        purchase_date: purchase_date,
        cutoff_name: CutoffName,
      });
    }

    //step ONE  check first in the Local and Overseas if there is a transaction
    const checkTransaction = await Payable_Bulk_Transaction.findOne({
      where: { payable_id: primary_id, isDeleted: false },
      include: [
        { model: Payable, required: true },
        {
          model: PayableBulk,
          required: true,
          where: {
            isDeleted: false,
          },
        },
      ],
    });

    if (checkTransaction) {
      const transactionNumber =
        checkTransaction.payable_bulk.transaction_number;
      const moduleType = checkTransaction.payable.domestic_type;
      return res.status(202).json({
        success: false,
        transactionNumber,
        moduleType,
      });
    }

    const getPayableProducts = await Payable_Product.findAll({
      where: {
        payable_id: primary_id,
      },
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
        },
      ],
    });

    if (getPayableProducts) {
      for (const data of getPayableProducts) {
        // console.log(data.product_tag_vendor.product_id);
        const product_id = data.product_tag_vendor.product_id;

        const fetchPayableStockManagement = await StockManagement.findAll({
          where: {
            product_id: product_id,
            transaction_number: transaction_id,
            isDeleted: false,
          },
        });

        for (const stock_data of fetchPayableStockManagement) {
          // console.log(stock_data.stock_management_id);

          const payableStockManagment_id = stock_data.stock_management_id;
          // -------------------   step TWO check in the Production if it is being used if not can be deleted
          const checkRawUsedProd = await Production_Raw_Used.findOne({
            where: {
              stock_management_id: payableStockManagment_id,
            },
            include: [
              {
                model: Production,
                where: {
                  isDeleted: false,
                },
                required: true,
              },
            ],
          });

          if (checkRawUsedProd) {
            return res.status(203).json({
              success: false,
              transactionNumber: checkRawUsedProd.production.production_id,
            });
          }

          // ------------------------- step THREE check in the Sales if it is being used if not can be deleted
          const checkSalesProducts = await SalesInvoiceInventory.findOne({
            where: {
              stock_management_id: payableStockManagment_id,
              isDeleted: false,
            },
            include: [
              {
                model: SalesInvoice,
                required: true,
              },
            ],
          });

          if (checkSalesProducts) {
            const transactionNumber =
              checkSalesProducts?.sales_invoice?.transaction_id;

            return res.status(207).json({
              success: false,
              transactionNumber: transactionNumber,
            });
          }

          // step Four check in the stock Transfer if it is being used if not can be deleted

          const checkStockTransfer = await StockTransferApproveProducts.findOne(
            {
              where: {
                stockmanagement_id: payableStockManagment_id,
                isDeleted: false,
              },
              include: [
                {
                  model: StockTransferProducts,
                  required: true,
                  include: [
                    {
                      model: StockTransfer,
                      required: true,
                    },
                  ],
                },
              ],
            }
          );

          if (checkStockTransfer) {
            const transactionNumber =
              checkStockTransfer.stock_transfer_product.stock_transfer_mother
                .transaction_id;

            return res
              .status(208)
              .json({ success: false, transactionNumber: transactionNumber });
          }
        }
      }
    }

    // Mark all products related to the transaction as deleted
    const softDeleteByTransaction = async (Model, whereClause) => {
      await Model.update(
        {
          isDeleted: true,
        },
        {
          where: whereClause,
        }
      );
    };

    // Where clauses for soft delete
    const whereClauses = {
      byPayableId: { id: primary_id },
      byTransactionNumber: { transaction_number: transaction_id },
    };

    // prettier-ignore
    await Promise.all([
      softDeleteByTransaction(Payable, whereClauses.byPayableId),
      softDeleteByTransaction(StockManagement, whereClauses.byTransactionNumber),
      softDeleteByTransaction(PayableJournal, whereClauses.byTransactionNumber),
      softDeleteByTransaction(Inventory_Journal, whereClauses.byTransactionNumber),
    ]);

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `User deleted a payable with transaction ID : ${transaction_id}`,
    });

    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

router.route("/localOverseasdeletePayable").delete(async (req, res) => {
  try {
    const { primary_id, purchase_date, transaction_id, userLoggedID } =
      req.query;

    const getCutoff = await Cutoff.findOne({
      where: {
        isDeleted: false,
        [Op.and]: [
          {
            from: {
              [Op.lte]: purchase_date, // from date is less than or equal to purchase date
            },
          },
          {
            to: {
              [Op.gte]: purchase_date, // to date is greater than or equal to purchase date
            },
          },
        ],
      },
    });

    // const CutoffFrom = getCutoff.from;

    // const CutoffTo = getCutoff.to;
    const isPosted = getCutoff.isPosted;
    const CutoffName = getCutoff.name;

    if (isPosted) {
      return res.status(201).json({
        success: false,
        purchase_date: purchase_date,
        cutoff_name: CutoffName,
      });
    }

    // const getData = await Payable_Payment.findAll({
    //   where: {
    //     payable_id: primary_id,
    //   },
    //   include: [
    //     {
    //       model: PayableBulk,
    //       required: true,
    //     },
    //   ],
    // });

    // if (getData) {
    //   for (const data of getData) {
    //     console.log(data.payable_bulk.transaction_number);
    //   }
    // }

    // Data to Delete
    // const profitLossReportData = await ProfitLossReport.findAll({
    //   include: [
    //     {
    //       model: issued_check,
    //     },
    //     {
    //       model: bank_transaction,
    //     },
    //   ],
    //   where: {
    //     [Op.or]: [
    //       { "$issued_check.transaction_number$": transaction_id },
    //       { "$bank_transaction.transaction_number$": transaction_id },
    //     ],
    //   },
    // });

    // for (const item of profitLossReportData) {
    //   // Delete Profit Loss Report
    //   await ProfitLossReport.destroy({
    //     where: {
    //       [Op.and]: [
    //         { issued_check_id: item.issued_check_id },
    //         { bank_transaction_id: item.bank_transaction_id },
    //       ],
    //     },
    //   });
    // }

    const getPaymentsBank = await bank_transaction.findAll({
      where: {
        transaction_number: transaction_id,
        isDeleted: false,
      },
    });

    if (getPaymentsBank) {
      for (const data of getPaymentsBank) {
        // console.log(data.status, data.id, data.account_list_id_bank_from);
        if (data.status === "Pending") {
          // await bank_transaction.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });
          await bank_transaction.update(
            { isDeleted: true },
            {
              where: {
                id: data.id,
              },
            }
          );
        } else if (data.status === "Confirmed") {
          await accountlist_sub3.increment(
            { amount: data.amount },
            {
              where: {
                id: data.account_list_id_bank_from,
              },
            }
          );

          // await bank_transaction.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });
          await bank_transaction.update(
            { isDeleted: true },
            {
              where: {
                id: data.id,
              },
            }
          );
        }
      }
    }

    const getPaymentsCheck = await issued_check.findAll({
      where: {
        transaction_number: transaction_id,
        isDeleted: false,
      },
    });

    if (getPaymentsCheck) {
      for (const data of getPaymentsCheck) {
        if (data.status === "Pending") {
          // await issued_check.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });

          await issued_check.update(
            { isDeleted: false },
            {
              where: {
                id: data.id,
              },
            }
          );
        } else if (data.status === "Paid") {
          await accountlist_sub3.increment(
            { amount: data.amount },
            {
              where: {
                id: data.account_list_id_issued_from,
              },
            }
          );

          // await issued_check.destroy({
          //   where: {
          //     id: data.id,
          //   },
          // });

          await issued_check.update(
            { isDeleted: false },
            {
              where: {
                id: data.id,
              },
            }
          );
        }
      }
    }

    const getPaymentsCAsh = await CashFlow.findAll({
      where: {
        transaction_number: transaction_id,
      },
    });

    if (getPaymentsCAsh) {
      for (const data of getPaymentsCAsh) {
        // console.log(data.amount);

        await accountlist_sub3.increment(
          { amount: data.amount },
          {
            where: {
              id: data.account_list_id_cash_from,
            },
          }
        );

        // await CashFlow.destroy({
        //   where: {
        //     id: data.id,
        //   },
        // });

        await CashFlow.update(
          { isDeleted: false },
          {
            where: {
              id: data.id,
            },
          }
        );
      }
    }

    const PayablesFetch = await Payable_Bulk_Transaction.findAll({
      where: {
        payable_bulk_id: primary_id,
      },
    });

    if (PayablesFetch) {
      for (const data of PayablesFetch) {
        await Payable.update(
          { isAdded: false, status: "Approved" },
          {
            where: {
              id: data.payable_id,
            },
          }
        );
      }
    }

    // await PayableBulk.destroy({
    //   where: {
    //     id: primary_id,
    //   },
    // });

    await PayableBulk.update(
      { isDeleted: true },
      {
        where: {
          id: primary_id,
        },
      }
    );

    // await accountlist_transaction_subject.destroy({
    //   where: {
    //     transaction_number: transaction_id,
    //   },
    // });
    await accountlist_transaction_subject.update(
      { isDeleted: true },
      {
        where: {
          transaction_number: transaction_id,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `User deleted a payable with transaction ID : ${transaction_id}`,
    });

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});

router.route("/deleteOrderListTransaction").put(async (req, res) => {
  try {
    const { id, idToRemove } = req.body;

    await Payable.update(
      {
        isAdded: false,
      },
      {
        where: {
          id: idToRemove,
        },
      }
    );

    await Payable_Bulk_Transaction.update(
      {
        isDeleted: true,
      },
      {
        where: {
          payable_bulk_id: id,
          payable_id: idToRemove,
        },
      }
    );

    res
      .status(200)
      .json({ message: "Order List Transaction Successfully Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router
  .route("/getBackOrderListTransaction")
  .post(express.text({ type: "*/*" }), async (req, res) => {
    try {
      const { id, idToAdd } = req.body;

      await Payable.update(
        {
          isAdded: true,
        },
        {
          where: {
            id: {
              [Op.in]: idToAdd,
            },
          },
        }
      );

      await Payable_Bulk_Transaction.update(
        {
          isDeleted: false,
        },
        {
          where: {
            payable_bulk_id: id,
            payable_id: {
              [Op.in]: idToAdd,
            },
          },
        }
      );

      res
        .status(200)
        .json({ message: "Order List Transaction Successfully Updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

router.route("/fetch_customer_with_payable").get(async (req, res) => {
  const { domestic_type } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Count unique Vendors for pagination
    const count = await Vendors.count({
      distinct: true,
      col: "id",
      where: {
        isArchive: false,
      },
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: [],
          where: {
            domestic_type,
            isDeleted: false,
            status: { [Op.ne]: "Paid" },
          },
          include: [
            {
              model: Payable_Payment,
              required: false,
              attributes: [],
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              attributes: ["id"],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });

    // Fetch Vendors and related Payables with Payments
    const rows = await Vendors.findAll({
      where: {
        isArchive: false,
      },
      include: [
        {
          model: PayableBulk,
          required: true,
          where: {
            domestic_type,
            isDeleted: false,
            status: { [Op.ne]: "Paid" },
          },
          include: [
            {
              model: Payable_Payment,
              required: false,
              attributes: ["amount"],
              // where: {
              //   isDeleted: false,
              // },
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              attributes: ["id"],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      limit: limit,
      offset: offset,
      order: [["company_name", "ASC"]],
    });

    // Compute Remaining Balance
    const dataWithBalance = rows.map((vendor) => {
      const vendorJSON = vendor.toJSON();

      let totalRemainingBalance = 0;

      vendorJSON.payable_bulks = vendorJSON.payable_bulks.map((pb) => {
        const totalPayments = pb.payable_bulk_payments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );

        // Remaining balance is zero when status is For-Approval
        const isForApproval = pb.status === "For-Approval";
        const remaining = isForApproval
          ? pb.total_amount
          : pb.total_amount - totalPayments;

        totalRemainingBalance += remaining;

        return {
          ...pb,
          remaining_balance: remaining,
        };
      });

      return {
        ...vendorJSON,
        total_remaining_balance: totalRemainingBalance,
      };
    });

    // Return
    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: dataWithBalance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetch_customer_with_payable/search").get(async (req, res) => {
  const { searchText, domestic_type } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const vendorWhereClause = {
    ...(searchText !== "" && likeFilter(searchText, "company_name")),
    isArchive: false,
  };

  try {
    // Count unique Vendors for pagination
    const count = await Vendors.count({
      distinct: true,
      col: "id",
      where: vendorWhereClause,
      include: [
        {
          model: PayableBulk,
          required: true,
          where: {
            domestic_type,
            isDeleted: false,
            status: { [Op.ne]: "Paid" },
          },
          include: [
            {
              model: Payable_Payment,
              required: false,
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              attributes: ["id"],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });

    // Fetch Vendors and related Payables with Payments
    const rows = await Vendors.findAll({
      where: vendorWhereClause,
      include: [
        {
          model: PayableBulk,
          required: true,
          where: {
            domestic_type,
            isDeleted: false,
            status: { [Op.ne]: "Paid" },
          },
          include: [
            {
              model: Payable_Payment,
              required: false,
              attributes: ["amount"],
              // where: {
              //   isDeleted: false,
              // },
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              attributes: ["id"],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      limit: limit,
      offset: offset,
      order: [["company_name", "ASC"]],
    });

    // Compute Remaining Balance
    const dataWithBalance = rows.map((vendor) => {
      const vendorJSON = vendor.toJSON();

      let totalRemainingBalance = 0;

      vendorJSON.payable_bulks = vendorJSON.payable_bulks.map((pb) => {
        const totalPayments = pb.payable_bulk_payments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );

        // Remaining balance is zero when status is For-Approval
        const isForApproval = pb.status === "For-Approval";
        const remaining = isForApproval
          ? pb.total_amount
          : pb.total_amount - totalPayments;

        totalRemainingBalance += remaining;

        return {
          ...pb,
          remaining_balance: remaining,
        };
      });

      return {
        ...vendorJSON,
        total_remaining_balance: totalRemainingBalance,
      };
    });

    // Return
    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: dataWithBalance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetch_local_payable_bulk_perVendor").get(async (req, res) => {
  const { domestic_type } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { vendor_id } = req.query;
  try {
    // Get the Payable Bulk total count
    const totalItems = await PayableBulk.count({
      where: {
        isDeleted: false,
        vendor_id,
        domestic_type,
      },
      distinct: true,
    });

    // Get Payable Bulk Ids for main fetching
    const payableBulkIds = await PayableBulk.findAll({
      attributes: ["id"],
      where: {
        isDeleted: false,
        vendor_id,
        domestic_type,
      },
      limit,
      offset,
      raw: true,
    });

    // Main fetching
    const rows = await PayableBulk.findAll({
      where: {
        id: payableBulkIds.map((item) => item.id),
      },
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Payable_Payment,
          required: false,
          attributes: ["amount"],
        },
      ],
    });

    const dataBalance = rows.map((bulk) => {
      const plainBulk = bulk.toJSON(); // <-- convert to plain object

      const totalPaid = plainBulk.payable_bulk_payments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
      const remaining = plainBulk.total_amount - totalPaid;

      return {
        ...plainBulk,
        remaining_balance: remaining,
      };
    });

    return res.json({
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: dataBalance,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getLocalOverseasPayableBulk").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!currencyId || !domestic_type)
      return res
        .status(400)
        .json({ error: "currencyId and domestic_type are required" });

    // Where clause for Payable Payment
    const payablePaymentWhereClause = {
      date_issued: {
        [Op.between]: [startDate, endDate],
      },
      "$payable_bulk.status$": {
        [Op.ne]: "For-Approval",
      },
      "$payable_bulk.isDeleted$": false,
      "$payable_bulk.domestic_type$": domestic_type,
      ...(currencyId !== "All" && {
        "$payable_bulk.currency_id$": currencyId,
      }),
    };

    // Get Payable Payment count for pagination
    const count = await Payable_Payment.count({
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: ["id"],
        },
      ],
      where: payablePaymentWhereClause,
      distinct: true,
    });

    // Get all Payable Payment ids
    const payablePaymentIds = await Payable_Payment.findAll({
      attributes: ["id", "createdAt"],
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: ["id"],
        },
      ],
      where: payablePaymentWhereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      raw: true,
    });

    // Main Fetching
    const payablePayment = await Payable_Payment.findAll({
      include: [
        {
          model: PayableBulk,
          required: true,
          include: [
            {
              model: Vendors,
              required: true,
            },
            {
              model: Currency,
              required: true,
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: Payable,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: accountlist_sub3,
          required: true,
        },
      ],
      where: {
        id: {
          [Op.in]: payablePaymentIds.map((item) => item.id),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: payablePayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/getLocalOverseasPayableBulk/search").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, filterColumn, currencyId } =
      req.query;
    let { searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Remove commas of searchText if it is numeric/number
    if (searchText && searchText.trim() !== "") {
      const numericText = searchText.replace(/,/g, "");
      if (!isNaN(numericText)) {
        searchText = numericText;
      }
    }

    // Where clause for Payable Payment
    const payablePaymentWhereClause = {
      date_issued: { [Op.between]: [startDate, endDate] },
      "$payable_bulk.status$": { [Op.ne]: "For-Approval" },
      "$payable_bulk.isDeleted$": false,
      "$payable_bulk.domestic_type$": domestic_type,
      ...(currencyId !== "All" && { "$payable_bulk.currency_id$": currencyId }),
    };

    // --- For Search Filter ---
    const filterCondition = (field) =>
      field === filterColumn || filterColumn === "all";

    const searchFilters = {
      "payable_bulk.transaction_number": likeFilter,
      payment_status: likeFilter,
      date_issued: dateFormatFilter,
      amount: castFilter,
      "payable_bulk_payment.createdAt": createdAtFilter,
    };

    const buildFilters = Object.entries(searchFilters).reduce(
      (acc, [col, fn]) => {
        if (filterCondition(col)) acc.push(fn(searchText, col));
        return acc;
      },
      []
    );

    // Get Payable Payment count for pagination
    const count = await Payable_Payment.count({
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: ["id"],
        },
      ],
      where: {
        ...payablePaymentWhereClause,
        ...(searchText !== "" && { [Op.or]: buildFilters }),
      },
      distinct: true,
    });

    // Get all Payable Payment ids
    const payablePaymentIds = await Payable_Payment.findAll({
      attributes: ["id", "createdAt"],
      include: [
        {
          model: PayableBulk,
          required: true,
          attributes: ["id"],
        },
      ],
      where: {
        ...payablePaymentWhereClause,
        ...(searchText !== "" && { [Op.or]: buildFilters }),
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      raw: true,
    });

    // Main Fetching
    const payablePayment = await Payable_Payment.findAll({
      include: [
        {
          model: PayableBulk,
          required: true,
          include: [
            {
              model: Vendors,
              required: true,
            },
            {
              model: Currency,
              required: true,
            },
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: Payable,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          model: accountlist_sub3,
          required: true,
        },
      ],
      where: {
        id: {
          [Op.in]: payablePaymentIds.map((item) => item.id),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: payablePayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Allows payment after PayableBulk is approved
router.route("/payment").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      payableBulkId,
      newPayment: {
        paymentMethod,
        subject3,
        issuedDate,
        amountInputted,
        checkNumber,
        refNumber,
      },
      transactionNumber,
      module,
    } = req.body;

    const moduleType =
      module === "local" ? "Local Payable" : "Overseas Payable";

    // Create payable payment
    await Payable_Payment.create(
      {
        payable_id: payableBulkId,
        accountList_id: subject3,
        payment_type: paymentMethod,
        check_number: checkNumber,
        ref_number: refNumber,
        amount: amountInputted,
        date_issued: issuedDate,
        payment_status: "For-Approval",
      },
      { transaction }
    );

    // Handle cash payment
    // if (isCash) {
    //   await Promise.all([
    //     CashFlow.create(
    //       {
    //         account_list_id_cash_from: subject3,
    //         transaction_date: issuedDate,
    //         transaction_number: transactionNumber,
    //         account_list_id_cash_to: null,
    //         module_from: moduleType,
    //         description: "",
    //         amount: amountInputted,
    //         status: "Paid",
    //       },
    //       {
    //         transaction,
    //       }
    //     ),
    //     accountlist_sub3.decrement("amount", {
    //       by: parseFloat(amountInputted),
    //       where: { id: subject3 },
    //       transaction,
    //     }),
    //     accountlist_transaction_subject.create(
    //       {
    //         account_list_sub3_id_transacted: subject3,
    //         payment_method: paymentMethod,
    //         amount: amountInputted,
    //         date: issuedDate,
    //         check_or_remarks: "",
    //         type: "Credit",
    //         module_from: moduleType,
    //         transaction_number: transactionNumber,
    //       },
    //       {
    //         transaction,
    //       }
    //     ),
    //   ]);
    // }

    // // Check payment to finalize PayableBulk/Payable status
    // const [payableSummary, totalPayment, payments] = await Promise.all([
    //   PayableBulk.findOne({
    //     attributes: ["total_amount"],
    //     where: {
    //       id: payableBulkId,
    //       isDeleted: false,
    //     },
    //     transaction,
    //     raw: true,
    //   }),
    //   Payable_Payment.sum("amount", {
    //     where: {
    //       payable_id: payableBulkId,
    //       payment_status: "Approved",
    //     },
    //     transaction,
    //   }),
    //   // Get all Payments to determine their payment types
    //   Payable_Payment.findAll({
    //     attributes: ["payment_type"],
    //     where: {
    //       payable_id: payableBulkId,
    //     },
    //     transaction,
    //     raw: true,
    //   }),
    // ]);
    // const isAllBank = payments.every((p) => p.payment_type === "Bank");
    // const isPaid = payableSummary.total_amount === totalPayment; // payment is settled

    // const getStatus = (isAllBank, isPaid) => {
    //   if (isAllBank && !totalPayment) return "Approved"; // If payments is all bank and no approved payments yet return "Approved"
    //   if (isPaid) return "Paid";
    //   return "Partially-Paid";
    // };

    // // Update Payable and Payable bulk status
    // const payableBulkTransaction = await Payable_Bulk_Transaction.findAll({
    //   attributes: ["payable_id"],
    //   where: {
    //     payable_bulk_id: payableBulkId,
    //     isDeleted: false,
    //   },
    //   transaction,
    //   raw: true,
    // });

    // await Payable.update(
    //   { status: getStatus(isAllBank, isPaid) },
    //   {
    //     where: {
    //       id: {
    //         [Op.in]: payableBulkTransaction.map((item) => item.payable_id),
    //       },
    //       isDeleted: false,
    //     },
    //     transaction,
    //   }
    // );

    // await PayableBulk.update(
    //   {
    //     status: getStatus(isAllBank, isPaid),
    //   },
    //   {
    //     where: {
    //       id: payableBulkId,
    //       isDeleted: false,
    //     },
    //     transaction,
    //   }
    // );

    await transaction.commit();
    res.sendStatus(204);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/payment/approve").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      paymentId,
      payableIdList,
      module,
      paymentData,
      vendorId,
      currencyName,
      currencyRate,
    } = req.body;

    const transactionNumber = paymentData.payable_bulk.transaction_number;
    const payableBulkId = paymentData.payable_bulk.id;
    const isLocal = module === "local";
    const moduleType = isLocal ? "Local Payable" : "Overseas Payable";

    // Payment services
    const PaymentApprovalService = {
      // Distribute data to Cash Flow
      handleCashPayment: async ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) => {
        await Promise.all([
          CashFlow.create(
            {
              account_list_id_cash_from: String(paymentData.accountList_id),
              transaction_date: paymentData.date_issued,
              transaction_number: transactionNumber,
              account_list_id_cash_to: null,
              module_from: moduleType,
              description: "",
              amount: paymentData.amount,
              status: "Paid",
            },
            { transaction }
          ),
          accountlist_sub3.decrement("amount", {
            by: parseFloat(paymentData.amount),
            where: { id: String(paymentData.accountList_id) },
            transaction,
          }),
          accountlist_transaction_subject.create(
            {
              account_list_sub3_id_transacted: String(paymentData.accountList_id), // prettier-ignore
              payment_method: paymentData.payment_type,
              amount: paymentData.amount,
              date: paymentData.date_issued,
              check_or_remarks: "",
              type: "Credit",
              module_from: moduleType,
              transaction_number: transactionNumber,
              rate: currencyRate,
            },
            { transaction }
          ),
          // Create a payable journal for purchase report
          PayableJournal.create(
            {
              vendor_id: vendorId,
              transaction_number: transactionNumber,
              date: paymentData.date_issued,
              total_amount: paymentData.amount,
              total_quantity: 0,
              avg_unit_price: 0,
              payment_type: "Credit",
              currency_name: currencyName,
              currency_rate: currencyRate,
            },
            { transaction }
          ),
        ]);
      },
      // Distribute data to Bank Transaction
      handleBankPayment: async ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) => {
        await bank_transaction.create(
          {
            account_list_id_bank_from: String(paymentData.accountList_id),
            transaction_date: paymentData.date_issued,
            transaction_number: transactionNumber,
            account_list_id_bank_to: null,
            module_from: moduleType,
            description: "",
            amount: paymentData.amount,
            status: "Pending",
          },
          { transaction }
        );
      },
      // Process payment with check number
      handleCheckPayment: async ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) => {
        // Distribute data to Issued Check
        await issued_check.create(
          {
            account_list_id_issued_from: String(paymentData.accountList_id),
            transaction_date: paymentData.date_issued,
            check_number: paymentData.check_number,
            transaction_number: transactionNumber,
            module_from: moduleType,
            description: "To pay",
            amount: paymentData.amount,
            status: "Pending",
          },
          {
            transaction,
          }
        );

        // Create a check journal "Debit" entry for trial balance
        await CheckJournal.create(
          {
            module_from: moduleType,
            transaction_number: transactionNumber,
            transaction_date: paymentData.payable_bulk.payable_date,
            issued_date: paymentData.date_issued,
            type: "Debit",
            amount: paymentData.amount,
            check_number: paymentData.check_number,
            currency_name: currencyName,
            currency_rate: currencyRate,
          },
          { transaction }
        );
      },
      // prettier-ignore
      distributePayments: async function ({
        paymentData,
        transactionNumber,
        moduleType,
        transaction,
      }) {
        const args = { paymentData, transactionNumber, moduleType, transaction };
        if (paymentData.payment_type === "Cash") await this.handleCashPayment(args);
        if (paymentData.payment_type === "Bank" && !paymentData.check_number) await this.handleBankPayment(args);
        if (paymentData.payment_type === "Bank" && paymentData.check_number) await this.handleCheckPayment(args);
      },
      // Update payable payment status
      updatePayablePayment: async ({ paymentId, transaction }) => {
        await Payable_Payment.update(
          {
            payment_status: "Approved",
          },
          {
            where: {
              id: paymentId,
            },
            transaction,
          }
        );
      },
      // Check payments
      paymentSummary: async ({ transactionNumber, transaction }) => {
        const [issuedTotal = 0, bankTotal = 0, cashTotal = 0] =
          await Promise.all([
            issued_check.sum("amount", {
              where: {
                transaction_number: transactionNumber,
                status: "Paid",
                isDeleted: false,
              },
              transaction,
            }),

            bank_transaction.sum("amount", {
              where: {
                transaction_number: transactionNumber,
                module_from: {
                  [Op.in]: ["Local Payable", "Overseas Payable"],
                },
                status: "Confirmed",
                isDeleted: false,
              },
              transaction,
            }),

            CashFlow.sum("amount", {
              where: {
                transaction_number: transactionNumber,
                status: "Paid",
                isDeleted: false,
              },
              transaction,
            }),
          ]);

        return issuedTotal + bankTotal + cashTotal;
      },
      // Determine the status if its "Paid" or "Partially-Paid"
      getStatus: ({ totalPayment, paymentData }) => {
        const totalPayableAmount = paymentData.payable_bulk.total_amount; // Total Payable
        const isPaid = totalPayment === totalPayableAmount; // Payment is settled
        const payableStatus = isPaid ? "Paid" : "Partially-Paid";

        return payableStatus;
      },
      // Update all Payable's and PayableBulk status
      updateStatus: async ({ model, payableStatus, id, transaction }) => {
        const payableIdList = Array.isArray(id) ? id : [id];
        await model.update(
          {
            status: payableStatus,
          },
          {
            where: {
              id: {
                [Op.in]: payableIdList,
              },
            },
            transaction,
          }
        );
      },
    };

    // ----- Payment Approval Workflow -----

    // 1. Distribute payments (Bank/Check/Cash)
    await PaymentApprovalService.distributePayments({
      paymentData,
      transactionNumber,
      moduleType,
      transaction,
    });

    // 2. Update payment
    await PaymentApprovalService.updatePayablePayment({
      paymentId,
      transaction,
    });

    // 3. Check payments and determine status for Payable/PayableBulk
    const totalPayment = await PaymentApprovalService.paymentSummary({ transactionNumber, transaction }); // prettier-ignore
    const payableStatus = PaymentApprovalService.getStatus({
      totalPayment,
      paymentData,
    });

    // 4. Update payables/payablebulk status
    await PaymentApprovalService.updateStatus({
      model: Payable,
      payableStatus,
      id: payableIdList,
      transaction,
    });
    await PaymentApprovalService.updateStatus({
      model: PayableBulk,
      payableStatus,
      id: payableBulkId,
      transaction,
    });

    await transaction.commit();
    return res
      .status(200)
      .json({ message: "Payment has been successfully approved." });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch data for local / overseas pdf viewer
router.route("/local-overseas-pdf").get(async (req, res) => {
  try {
    const { id } = req.query;

    // Pdf Data for Table
    const pdfData = await Payable_Product.findAll({
      include: [
        {
          model: Payable,
          required: true,
          include: [
            {
              model: Payable_Bulk_Transaction,
              required: true,
              include: [
                {
                  model: PayableBulk,
                  required: true,
                  where: {
                    id,
                    isDeleted: false,
                  },
                },
              ],
              where: {
                isDeleted: false,
              },
            },
          ],
          where: {
            isDeleted: false,
          },
        },
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
    });

    // Total Amount
    const totalPrice = await Payable.sum("totalPrice", {
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: true,
          attributes: [],
          include: [
            {
              model: PayableBulk,
              required: true,
              attributes: [],
              where: {
                id,
                isDeleted: false,
              },
            },
          ],
          where: {
            isDeleted: false,
          },
        },
      ],
    });

    res.status(200).json({ pdfData, totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/backload/products-to-return").get(async (req, res) => {
  try {
    const { payableId, payableTransactionNumber } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!payableId)
      return res.status(400).json({ error: "payableId is required." });

    const { count, rows: payableProducts } =
      await Payable_Product.findAndCountAll({
        attributes: [
          "payable_id",
          "net_weight",
          "unitPrice",
          "static_net_weight",
          "moisture",
        ],
        include: [
          {
            model: Product_Tag_Vendor,
            required: true,
            attributes: ["id"],
            include: [
              {
                model: ProductList,
                required: true,
                attributes: ["product_id", "product_code", "product_name"],
              },
            ],
          },
          {
            model: Payable,
            required: true,
            attributes: ["transaction_id"],
          },
        ],
        where: {
          payable_id: payableId,
        },
        limit,
        offset,
      });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: payableProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/backload/return-product").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      product: {
        productId,
        payableId,
        payableTransactionNumber,
        quantityToReturn,
        unitPrice,
      },
    } = req.body;

    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

    // Get Product info for stock management
    const { transaction_id, warehouse_id, vendor_id, purchaseDate } =
      await Payable.findOne({
        attributes: [
          "transaction_id",
          "warehouse_id",
          "vendor_id",
          "purchaseDate",
        ],
        where: {
          id: payableId,
          isDeleted: false,
        },
        raw: true,
        transaction,
      });

    // Validate stock
    const totalStock = await StockManagement.sum("stock", {
      where: {
        product_id: productId,
        warehouse_id: warehouse_id,
        transaction_number: payableTransactionNumber,
      },
      transaction,
    });

    if (parseNumber(quantityToReturn) > totalStock) {
      await transaction.rollback();
      return res.status(409).json({
        error: "The return quantity exceeds the available stock.",
        totalStock,
      });
    }

    // Return the Stock (as negative entry)
    const returnProduct = await StockManagement.create(
      {
        product_id: productId,
        warehouse_id: warehouse_id,
        stock: -parseNumber(quantityToReturn),
        in: -parseNumber(quantityToReturn),
        price: unitPrice,
        price_in: unitPrice,
        vendor_id: vendor_id,
        date_in: purchaseDate,
        transaction_number: transaction_id,
        module_in_from: "PO Backload",
      },
      {
        transaction,
      }
    );

    // --- Decrement net weight for the selected product in the given payable (PO) ---
    const productToReturn = await Payable_Product.findOne({
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          where: {
            product_id: productId,
          },
        },
      ],
      where: {
        payable_id: payableId,
      },
    });

    const returnPayableProduct = await productToReturn.decrement("net_weight", {
      by: parseNumber(quantityToReturn),
      transaction,
    });

    // await Payable_Product.update(
    //   {
    //     net_weight:
    //       parseNumber(productToReturn.weight) - parseNumber(quantityToReturn),
    //   },
    //   {
    //     where: {
    //       id: productToReturn.id,
    //     },
    //     transaction,
    //   }
    // );

    await Payable.decrement("totalPrice", {
      by: parseNumber(quantityToReturn * unitPrice),
      where: {
        id: payableId,
      },
      transaction,
    });

    await transaction.commit();
    res.status(200).json({ message: "The Product Returned Successfully." });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// to validate cutoff before payment approval
router.route("/payment/:id/cutoff-validation").get(async (req, res) => {
  try {
    const { id } = req.params;

    // Get the payment record to find the payment date
    const payment = await Payable_Payment.findOne({
      where: {
        id: id,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Check if cutoff exists for the payment date
    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: payment.date_issued },
          },
          {
            to: { [Op.gte]: payment.date_issued },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;
    const cutoffExists = !!findCutoff;

    res.json({
      isPosted,
      cutoffExists,
      paymentDate: payment.date_issued,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
