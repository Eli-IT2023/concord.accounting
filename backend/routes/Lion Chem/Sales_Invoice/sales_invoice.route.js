const express = require("express");
const { where, Op, fn, col, literal, Sequelize } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  StockManagement,
  Activity_Log,
  TaxSettings,
  SalesInvoice,
  Packaging,
  Source,
  Finish_Raw_Material,
  SalesInvoiceTagProduct,
  Customer,
  MasterList,
  Currency,
  Product_Tag_Vendor,
  Vendors,
  SalesInvoiceStockManagementHistory,
  SeriesNumber,
  TaxReport,
  ProductTagCustomer,
  ConcordNotification,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const incrementSeriesNumber = require("../../../utils/incrementSeriesNumber");
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

// === Series number logic that supports both default and custom input ===

router.route("/getAgent").get(async (req, res) => {
  try {
    const data = await MasterList.findAll({
      order: [["createdAt", "DESC"]],
      // TEMPORARY LANG WALA TO PARA MAKITA SI ELI ADMIN AS AGENT
      // where: {
      //   emp_id: {
      //     [Op.ne]: "00000",
      //   },
      // },
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getStockmanagement").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const productIds = req.query.productIds
      ? req.query.productIds.split(",")
      : [];

    const selectedWarehouse = req.query.selectedWarehouse;

    const whereClause = {
      status: "Active",
      ...(productIds.length > 0 && {
        product_id: { [Op.in]: productIds },
      }),
    };

    // ✅ MUST be findAndCountAll
    const { count, rows } = await ProductList.findAndCountAll({
      include: [
        {
          model: Packaging,
          required: true,
          attributes: ["id", "packaging_name", "unit_quantity", "unit"],
          as: "prod_packaging",
        },
      ],
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true, // ✅ important when using include
    });

    // ✅ safeguard (extra safe)
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        data: [],
      });
    }

    const stockQuery = {
      attributes: [
        "product_id",
        [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
      ],
      where: {
        product_id: {
          [Op.in]: rows.map((row) => row.product_id),
        },
      },
      group: ["product_id"],
    };

    if (selectedWarehouse) {
      stockQuery.where.warehouse_id = selectedWarehouse;
    }

    const stockData = await StockManagement.findAll(stockQuery);

    const stockMap = stockData.reduce((map, item) => {
      map[item.product_id] = Number(item.get("total_stock")) || 0;
      return map;
    }, {});

    const formattedData = rows.map((row) => {
      const plainData = row.get({ plain: true });
      plainData.current_stock = stockMap[row.product_id] || 0;
      return plainData;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getStockmanagement:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getStockmanagent_Search").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { searchTerm } = req.query;
    const { count, rows } = await ProductList.findAndCountAll({
      include: [
        {
          model: Packaging,
          required: true,
          attributes: ["id", "packaging_name", "unit_quantity", "unit"],
        },
      ],
      where: {
        status: "Active",
        product_category: "Finish Product",
        ...(searchTerm && {
          [Op.or]: [
            { $product_name$: { [Op.like]: `%${searchTerm}%` } },
            { $product_code$: { [Op.like]: `%${searchTerm}%` } },
            { "$packaging.packaging_name$": { [Op.like]: `%${searchTerm}%` } },
            { "$source.name$": { [Op.like]: `%${searchTerm}%` } },
          ],
        }),
      },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getTaxSettings").get(async (req, res) => {
  try {
    const getTax = await TaxSettings.findAll({
      where: {
        status: "active",
        applicability: "Sales",
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(getTax);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// v2
// router.route("/createSales2").post(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     console.log("=== CREATE SALES REQUEST RECEIVED ===");
//     console.log("Full Request Body:", JSON.stringify(req.body, null, 2));

//     const {
//       transactionId,
//       sales_invoiceText,
//       deliveryText,
//       selectedCustomer,
//       poNumber,
//       selectedDueDate,
//       selectedInvoiceDate,
//       selectedMethod,
//       selectedPaymentTerms,
//       selectedOtherTerms,
//       // inputPaymentTerms,
//       remarks,
//       userLoggedID,
//       selectedDestination,
//       selectedCurrency,
//       currencyRate,
//       selectedWarehouse,
//       isCheckedDelivery,
//       isCheckedTax,
//       isZeroRated,
//       taxSelectedID,
//       productLists,
//       totalGross,
//       totalDiscountedAmount,
//       withholdTaxAmount,
//       netReceivableAmount,
//       taxRate,
//       selectedTaxName,
//     } = req.body;

//     let finalOtherPaymentTerms = selectedOtherTerms;

//     if (selectedPaymentTerms !== "Other") {
//       finalOtherPaymentTerms = null;
//     }

//

//     // 1. Create the invoice
//     const create_data = await SalesInvoice.create(
//       {
//         transaction_id: transactionId,
//         destination: selectedDestination,
//         sales_invoice: sales_invoiceText,
//         is_only_deliver_number: isCheckedDelivery,
//         delivery_number: deliveryText,
//         customer_id: selectedCustomer,
//         po_number: poNumber,
//         due_date: selectedDueDate,
//         invoice_date: selectedInvoiceDate,
//         payment_method: selectedMethod,
//         payment_terms: selectedPaymentTerms,
//         other_payment_terms: finalOtherPaymentTerms,
//         is_tax_applied: isCheckedTax,
//         tax_settings_id: taxSelectedID || null,
//         currency_id: selectedCurrency,
//         rate: currencyRate,
//         remarks: remarks,
//         warehouse_id: selectedWarehouse,
//         created_by: userLoggedID,
//         total_gross: totalGross,
//         withhold_tax: withholdTaxAmount,
//         net_amount: netReceivableAmount,
//         isZeroRated: isZeroRated,
//         totalDiscountedAmount: totalDiscountedAmount,
//         taxRate: taxRate,
//         selectedTaxName: selectedTaxName,
//       },
//       { transaction }
//     );

//     const invoiceId = create_data.sales_invoice_id;

//     // 2. Process each product
//     for (const item of productLists) {
//       let remainingQty = item.quantity;

//       // get packaging
//       const getUnit = await ProductList.findOne({
//         where: {
//           product_id: item.product_id,
//         },
//         include: [
//           {
//             model: Packaging,
//             as: "prod_packaging",
//           },
//         ],
//       });

//       // Get all stock entries for FIFO
//       const stockEntries = await StockManagement.findAll({
//         where: { product_id: item.product_id },
//         order: [["expiry_date", "ASC"]],
//         transaction,
//       });

//       // === First pass: deduct from positive stock ===
//       for (const stockEntry of stockEntries) {
//         if (remainingQty <= 0) break;

//         const availableInBatch = stockEntry.stock;
//         if (availableInBatch <= 0) continue;

//         const deduction = Math.min(availableInBatch, remainingQty);

//         await SalesInvoiceStockManagementHistory.create(
//           {
//             stock_management_id: stockEntry.stock_management_id,
//             sales_invoice_id: invoiceId,
//             deducted_stock: deduction,
//             isDeleted: 0,
//           },
//           { transaction }
//         );

//         await StockManagement.update(
//           { stock: stockEntry.stock - deduction },
//           {
//             where: { stock_management_id: stockEntry.stock_management_id },
//             transaction,
//           }
//         );

//         remainingQty -= deduction;
//       }

//       // === Second pass: spread negative balance ===
//       if (remainingQty > 0) {
//         const zeroOrNegativeEntries = await StockManagement.findAll({
//           where: {
//             product_id: item.product_id,
//             stock: { [Op.lte]: 0 },
//           },
//           order: [["expiry_date", "ASC"]],
//           transaction,
//         });

//         if (zeroOrNegativeEntries.length > 0) {
//           const spreadAmount = remainingQty / zeroOrNegativeEntries.length;

//           for (const batch of zeroOrNegativeEntries) {
//             const newStock = batch.stock - spreadAmount;

//             await StockManagement.update(
//               { stock: newStock },
//               {
//                 where: { stock_management_id: batch.stock_management_id },
//                 transaction,
//               }
//             );

//             await SalesInvoiceStockManagementHistory.create(
//               {
//                 stock_management_id: batch.stock_management_id,
//                 sales_invoice_id: invoiceId,
//                 deducted_stock: spreadAmount, // Negative value for shortage allocation
//                 isDeleted: 0,
//               },
//               { transaction }
//             );
//           }
//         }
//       }

//       // === Log stock movement ===
//       await Activity_Log.create({
//         masterlist_id: userLoggedID,
//         action_taken: `Processed stock for product ${
//           item.product_id
//         } - Deducted ${item.quantity} (${
//           remainingQty > 0 ? "with negative balance" : "fully"
//         })`,
//         reference_id: invoiceId,
//         reference_table: "sales_invoices",
//         transaction,
//       });

//       // === Create invoice tag product ===
//       await SalesInvoiceTagProduct.create(
//         {
//           sales_invoice_id: invoiceId,
//           product_id: item.product_id,
//           unit_price: item.unit_price,
//           discount_item: item.discount_percentage,
//           quantity: item.quantity,
//           actual_quantity: item.quantity,
//           subtotal: item.subtotal,
//           discount_type: "Percentage",
//           packaging_unit_quantity: getUnit.prod_packaging?.unit_quantity,
//           isDeleted: 0,
//         },
//         { transaction }
//       );
//     }

//     // === Log invoice creation ===
//     await Activity_Log.create({
//       masterlist_id: userLoggedID,
//       action_taken: `Created new Sales Invoice: ${transactionId}`,
//       reference_id: invoiceId,
//       reference_table: "sales_invoices",
//       transaction,
//     });

//     // for tax report
//     if (isCheckedTax && taxSelectedID) {
//       const transaction_amount = totalGross;
//       const findTax = await TaxSettings.findOne({
//         where: { id: taxSelectedID },
//         transaction,
//       });

//       const createTaxReport = await TaxReport.create(
//         {
//           module_id: invoiceId,
//           module_name: "Sales Invoice",
//           transaction_number: transactionId,
//           transaction_user: selectedCustomer,
//           tax_id: taxSelectedID,
//           tax_name: findTax ? findTax.name : null,
//           tax_rate: findTax ? findTax.rate : null,
//           tax_type: findTax ? findTax.applicability : null,
//           transaction_amount: transaction_amount,
//           tax_amount: withholdTaxAmount,
//           transaction_date: selectedInvoiceDate,
//           transaction_status: "Unpaid",
//         },
//         { transaction }
//       );
//     }

//     // Commit transaction
//     await transaction.commit();

//     return res.status(200).json({
//       message: "Sales invoice created successfully",
//       invoiceId,
//       transactionId,
//     });
//   } catch (error) {
//     await transaction.rollback();

//     console.error("Error in createSales2:", {
//       message: error.message,
//       stack: error.stack,
//       body: req.body,
//       timestamp: new Date().toISOString(),
//     });

//     return res.status(500).json({
//       message: "Internal server error",
//       error:
//         process.env.NODE_ENV === "development"
//           ? {
//               message: error.message,
//               stack: error.stack,
//             }
//           : undefined,
//     });
//   }
// });

// v3
router.route("/createSales2").post(async (req, res) => {
  let transaction = await sequelize.transaction();
  try {
    console.log("=== CREATE SALES REQUEST RECEIVED ===");

    const {
      transactionId,
      invoiceTitle,
      sales_invoiceText: userProvidedSalesInvoiceText,
      deliveryText: userProvidedDeliveryText,
      selectedCustomer,
      poNumber,
      selectedDueDate,
      selectedInvoiceDate,
      selectedMethod,
      selectedPaymentTerms,
      selectedOtherTerms,
      remarks,
      userLoggedID,
      selectedDestination,
      selectedCurrency,
      currencyRate,
      selectedWarehouse,
      isCheckedDelivery,
      isCheckedTax,
      isZeroRated,
      taxSelectedID,
      productLists,
      totalGross,
      totalDiscountedAmount,
      withholdTaxAmount,
      netReceivableAmount,
      taxRate,
      selectedTaxName,
      scaDiscountPercentage,
      scaDiscountAmount,
      vatPercentage,
      vatAmount,
    } = req.body;

    const finalOtherPaymentTerms =
      selectedPaymentTerms === "Other" ? selectedOtherTerms : null;

    // Helper function to extract numeric part from formatted series number
    const extractNumericPart = (formattedNumber) => {
      if (!formattedNumber) return "";

      // Check if there's a dash in the format (AAA-00001)
      const dashIndex = formattedNumber.indexOf("-");

      if (dashIndex !== -1) {
        // Format: AAA-00001 - extract only the numeric part after dash
        return formattedNumber.substring(dashIndex + 1);
      } else {
        // Format: 00001 (no alphabetical prefix)
        return formattedNumber;
      }
    };

    // Helper function to extract alphabetical prefix
    const extractAlphabeticalPrefix = (formattedNumber) => {
      if (!formattedNumber) return "";

      const dashIndex = formattedNumber.indexOf("-");

      if (dashIndex !== -1) {
        // Format: AAA-00001 - extract alphabetical part before dash
        return formattedNumber.substring(0, dashIndex);
      } else {
        // No alphabetical prefix
        return "";
      }
    };

    // Helper function to format series number with alphabetical prefix
    const formatWithAlphabeticalPrefix = (alphabetical, numeric) => {
      if (!numeric) return null;

      if (alphabetical && alphabetical.trim() !== "") {
        return `${alphabetical}-${numeric}`;
      } else {
        return numeric;
      }
    };

    const handleSeriesNumber = async (category, userInputText) => {
      const series = await SeriesNumber.findOne({
        where: { category },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!series) {
        await transaction.rollback();
        throw new Error(`${category} series number configuration not found`);
      }

      // Get alphabetical prefix from database
      const dbAlphabeticalPrefix = series.alphabetical_value || "";
      const dbSeriesValue = series.series_number; // This should be numeric only

      // Improved increment function
      const incrementSeriesNumber = (currentValue) => {
        if (!currentValue || typeof currentValue !== "string") return "1";

        // Clean the input (remove non-numeric)
        const cleanValue = currentValue.replace(/\D/g, "");

        // Convert to number
        const number = parseInt(cleanValue, 10);

        if (isNaN(number)) return "1";

        // Increment
        const nextNumber = number + 1;

        // Preserve leading zeros by padding to original length
        // If original was empty or invalid, default to 4-digit format
        const targetLength = currentValue.length > 0 ? currentValue.length : 4;
        return nextNumber.toString().padStart(targetLength, "0");
      };

      let finalNumericValue;
      let alphabeticalPrefix = dbAlphabeticalPrefix;

      if (userInputText) {
        // Extract parts from user input
        const userNumeric = extractNumericPart(userInputText);
        const userAlphabetical = extractAlphabeticalPrefix(userInputText);

        // If user provided alphabetical prefix, use it
        if (userAlphabetical && userAlphabetical.trim() !== "") {
          alphabeticalPrefix = userAlphabetical;
        }

        if (userNumeric === dbSeriesValue) {
          // User input matches database value, increment database
          const newDbValue = incrementSeriesNumber(dbSeriesValue);
          await SeriesNumber.update(
            {
              series_number: newDbValue,
              alphabetical_value: alphabeticalPrefix,
            },
            { where: { category }, transaction }
          );
          finalNumericValue = `${dbSeriesValue}`;
          console.log(
            `[${category}] Default match. Incremented ${dbSeriesValue} -> ${newDbValue}`
          );
        } else {
          // User provided custom number, update database with next increment
          const newDbValue = incrementSeriesNumber(userNumeric);
          await SeriesNumber.update(
            {
              series_number: newDbValue,
              alphabetical_value: alphabeticalPrefix,
            },
            { where: { category }, transaction }
          );
          finalNumericValue = `${userNumeric}`;
          console.log(
            `[${category}] Custom input. Updated ${userNumeric} -> ${newDbValue}`
          );
        }
      } else {
        // No user input, use database value and increment
        const newDbValue = incrementSeriesNumber(dbSeriesValue);
        await SeriesNumber.update(
          {
            series_number: newDbValue,
            alphabetical_value: alphabeticalPrefix,
          },
          { where: { category }, transaction }
        );
        finalNumericValue = `${dbSeriesValue}`;
        console.log(
          `[${category}] Auto-generated: ${finalNumericValue} -> ${newDbValue}`
        );
      }

      // Return the formatted value with alphabetical prefix
      return formatWithAlphabeticalPrefix(
        alphabeticalPrefix,
        finalNumericValue
      );
    };

    // === Smart Handling of Series Numbers ===
    let resolvedSalesInvoiceText = null;
    let resolvedDeliveryText = null;

    // → CASE 1: Delivery Checkbox is ON (DC Mode)
    if (isCheckedDelivery) {
      // SI must be EMPTY
      resolvedSalesInvoiceText = null;

      // Only DC gets a series number
      resolvedDeliveryText = await handleSeriesNumber(
        "DC",
        userProvidedDeliveryText
      );
    } else {
      // → CASE 2: SI ONLY (no delivery number)
      if (userProvidedSalesInvoiceText && !userProvidedDeliveryText) {
        resolvedSalesInvoiceText = await handleSeriesNumber(
          "SI",
          userProvidedSalesInvoiceText
        );
        resolvedDeliveryText = null;
      }

      // → CASE 3: DR ONLY (no sales invoice)
      else if (!userProvidedSalesInvoiceText && userProvidedDeliveryText) {
        resolvedDeliveryText = await handleSeriesNumber(
          "DR",
          userProvidedDeliveryText
        );
        resolvedSalesInvoiceText = null;
      }

      // → CASE 4: BOTH PROVIDED (generate both)
      else if (userProvidedSalesInvoiceText && userProvidedDeliveryText) {
        resolvedSalesInvoiceText = await handleSeriesNumber(
          "SI",
          userProvidedSalesInvoiceText
        );

        resolvedDeliveryText = await handleSeriesNumber(
          "DR",
          userProvidedDeliveryText
        );
      }
    }

    // === Create Sales Invoice ===
    const createdInvoice = await SalesInvoice.create(
      {
        transaction_id: transactionId,
        destination: selectedDestination,
        invoice_title: invoiceTitle,
        sales_invoice: resolvedSalesInvoiceText,
        is_only_deliver_number: isCheckedDelivery,
        delivery_number: resolvedDeliveryText,
        customer_id: selectedCustomer,
        po_number: poNumber,
        due_date: selectedDueDate,
        invoice_date: selectedInvoiceDate,
        payment_method: selectedMethod,
        payment_terms: selectedPaymentTerms,
        other_payment_terms: finalOtherPaymentTerms,
        is_tax_applied: isCheckedTax,
        tax_settings_id: taxSelectedID || null,
        currency_id: selectedCurrency,
        rate: currencyRate,
        remarks: remarks,
        warehouse_id: selectedWarehouse,
        created_by: userLoggedID,
        total_gross: totalGross,
        withhold_tax: withholdTaxAmount,
        net_amount: netReceivableAmount,
        isZeroRated: isZeroRated,
        totalDiscountedAmount: totalDiscountedAmount,
        taxRate: taxRate,
        selectedTaxName: selectedTaxName,
        vat_percentage: vatPercentage,
        vat_amount: vatAmount,
        sca_discount_percentage: scaDiscountPercentage,
        sca_discount_amount: scaDiscountAmount,
      },
      { transaction }
    );

    const invoiceId = createdInvoice.sales_invoice_id;

    // === Process Products ===
    for (const item of productLists) {
      let remainingQty = item.quantity;

      const getUnit = await ProductList.findOne({
        where: { product_id: item.product_id },
        include: [{ model: Packaging, as: "prod_packaging" }],
        transaction,
      });

      const stockEntries = await StockManagement.findAll({
        where: { product_id: item.product_id },
        order: [["expiry_date", "ASC"]],
        transaction,
      });

      for (const stockEntry of stockEntries) {
        if (remainingQty <= 0) break;
        const available = stockEntry.stock;
        if (available <= 0) continue;

        const deduct = Math.min(available, remainingQty);

        await SalesInvoiceStockManagementHistory.create(
          {
            stock_management_id: stockEntry.stock_management_id,
            sales_invoice_id: invoiceId,
            deducted_stock: deduct,
            isDeleted: 0,
          },
          { transaction }
        );

        await StockManagement.update(
          { stock: available - deduct },
          {
            where: { stock_management_id: stockEntry.stock_management_id },
            transaction,
          }
        );

        remainingQty -= deduct;
      }

      if (remainingQty > 0) {
        const negativeEntries = await StockManagement.findAll({
          where: {
            product_id: item.product_id,
            stock: { [Op.lte]: 0 },
          },
          order: [["expiry_date", "ASC"]],
          transaction,
        });

        const spread = remainingQty / negativeEntries.length;

        for (const batch of negativeEntries) {
          const newStock = batch.stock - spread;

          await StockManagement.update(
            { stock: newStock },
            {
              where: { stock_management_id: batch.stock_management_id },
              transaction,
            }
          );

          await SalesInvoiceStockManagementHistory.create(
            {
              stock_management_id: batch.stock_management_id,
              sales_invoice_id: invoiceId,
              deducted_stock: spread,
              isDeleted: 0,
            },
            { transaction }
          );
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Processed stock for product ${item.product_id} - Deducted ${item.quantity}`,
        reference_id: invoiceId,
        reference_table: "sales_invoices",
        transaction,
      });

      await SalesInvoiceTagProduct.create(
        {
          sales_invoice_id: invoiceId,
          customer_id: selectedCustomer,
          product_id: item.product_id,
          unit_price: item.unit_price,
          discount_item: item.discount_percentage,
          quantity: item.quantity,
          actual_quantity: item.quantity,
          subtotal: item.subtotal,
          discount_type: "Percentage",
          packaging_unit_quantity: getUnit.prod_packaging?.unit_quantity,
          isDeleted: 0,
        },
        { transaction }
      );

      // concord notification
      // condition first if raw or finished
      let message = "";
      let moduleUrl = "";
      let moduleTo = "";

      let getCurrentStock = null;
      const unitQuantity = getUnit.prod_packaging?.unit_quantity || 1;

      // FIX: Check if threshold is not null (null means no threshold, 0 means zero threshold)
      if (getUnit.threshold === null) continue; // Skip if no threshold set

      const formattedThreshold = Number(getUnit.threshold || 0).toLocaleString(
        "en-US",
        {
          maximumFractionDigits: 2,
        }
      );

      if (getUnit.product_category === "Finish Product") {
        moduleUrl = `/inventory/create-update-formulation/${getUnit.product_id}`;
        moduleTo = "Formulation";

        getCurrentStock = await StockManagement.sum("stock", {
          where: { product_id: getUnit.product_id },
          transaction,
        });
      } else {
        moduleUrl = `/inventory/update-product/${getUnit.product_id}`;
        moduleTo = "Product List";

        getCurrentStock = await StockManagement.sum("stock", {
          where: { product_id: getUnit.product_id },
          transaction,
        });
      }

      // compute the weight
      const computedCurrentStock = getCurrentStock * unitQuantity;

      // FIXED: This will now trigger for threshold = 0 when stock <= 0
      // For threshold = 0: -100 <= 0 = TRUE, 0 <= 0 = TRUE, 100 <= 0 = FALSE
      // For threshold = null: Already skipped above
      if (computedCurrentStock <= getUnit.threshold) {
        // Customize message based on stock level
        if (getUnit.threshold === 0) {
          if (computedCurrentStock < 0) {
            const deficit = Math.abs(computedCurrentStock);
            message = `Product ${getUnit.product_code} ${
              getUnit.product_name
            } has negative stock (deficit: ${deficit.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })} kg). Please restock immediately.`;
          } else {
            message = `Product ${getUnit.product_code} ${getUnit.product_name} has reached zero stock. Please restock.`;
          }
        } else {
          message = `Product ${getUnit.product_code} ${getUnit.product_name} has hit the threshold of ${formattedThreshold} kg(s). Please restock.`;
        }

        // Add suffix for finish products
        if (getUnit.product_category === "Finish Product" && getUnit.suffix) {
          message = message.replace(
            `Product ${getUnit.product_code} `,
            `Product ${getUnit.product_code} - ${getUnit.suffix} `
          );
        }

        await ConcordNotification.create(
          {
            module_id: getUnit.product_id,
            module_from: "Sales Invoice",
            module_url: moduleUrl,
            module_to: moduleTo,
            type: "Threshold Alert",
            message,
            isRead: false,
            createdBy: userLoggedID,
          },
          {
            transaction,
          }
        );
      }
    }

    // === Log Invoice Creation ===
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Created new Sales Invoice: ${resolvedSalesInvoiceText}`,
      reference_id: invoiceId,
      reference_table: "sales_invoices",
      transaction,
    });

    // === Create Tax Report if Tax Applied ===
    if (isCheckedTax && taxSelectedID) {
      const taxInfo = await TaxSettings.findOne({
        where: { id: taxSelectedID },
        transaction,
      });

      await TaxReport.create(
        {
          module_id: invoiceId,
          module_name: "Sales Invoice",
          transaction_number: resolvedSalesInvoiceText,
          transaction_user: selectedCustomer,
          tax_id: taxSelectedID,
          tax_name: taxInfo?.name || null,
          tax_rate: taxInfo?.rate || null,
          tax_type: taxInfo?.applicability || null,
          transaction_amount: totalGross,
          tax_amount: withholdTaxAmount,
          transaction_date: selectedInvoiceDate,
          transaction_status: "Unpaid",
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Sales invoice created successfully",
      invoiceId,
      sales_invoiceText: resolvedSalesInvoiceText,
      deliveryText: resolvedDeliveryText,
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Error in /createSales2:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    if (
      error.name === "SequelizeDatabaseError" &&
      error.parent?.code === "ER_LOCK_DEADLOCK"
    ) {
      return res.status(409).json({
        message: "Another transaction is in progress. Please try again.",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
});

// v1
// router.route("/createSales").post(async (req, res) => {
//   try {
//     const {
//       transactionId,
//       sales_invoiceText,
//       deliveryText,
//       selectedCustomer,
//       poNumber,
//       selectedDueDate,
//       selectedInvoiceDate,
//       selectedMethod,
//       inputPaymentTerms,
//       remarks,
//       userLoggedID,
//       selectedDestination,
//       selectedCurrency,
//       currencyRate,
//       selectedWarehouse,
//       isCheckedDelivery,
//       isCheckedTax,
//       isZeroRated,
//       taxSelectedID,
//       lineItems,
//       totalGross,
//       withholdTaxAmount,
//       netReceivableAmount,
//     } = req.body;

//     const create_data = await SalesInvoice.create({
//       transaction_id: transactionId,
//       destination: selectedDestination,
//       sales_invoice: sales_invoiceText,
//       is_only_deliver_number: isCheckedDelivery,
//       delivery_number: deliveryText,
//       customer_id: selectedCustomer,
//       po_number: poNumber,
//       due_date: selectedDueDate,
//       invoice_date: selectedInvoiceDate,
//       payment_method: selectedMethod,
//       payment_terms: inputPaymentTerms,
//       is_tax_applied: isCheckedTax,
//       tax_settings_id: taxSelectedID || null,
//       currency_id: selectedCurrency,
//       rate: currencyRate,
//       remarks: remarks,
//       warehouse_id: selectedWarehouse,
//       created_by: userLoggedID,
//       total_gross: totalGross,
//       withhold_tax: withholdTaxAmount,
//       net_amount: netReceivableAmount,
//       isZeroRated: isZeroRated,
//     });

//     if (!create_data) {
//       return res.status(400).json({ message: "Failed to create invoice" });
//     }

//     const salesId = create_data.sales_invoice_id;
//     for (const item of lineItems) {
//       const rawMaterials = await Finish_Raw_Material.findAll({
//         where: {
//           product_id: item.product_id,
//         },
//         include: [
//           {
//             model: Product_Tag_Vendor,
//             required: true,
//           },
//         ],
//       });

//       if (rawMaterials && rawMaterials.length > 0) {
//         for (const rawMaterial of rawMaterials) {
//           const reservedAmount = item.quantity * rawMaterial.weight;
//           await ProductList.increment("reserved", {
//             by: reservedAmount,
//             where: {
//               product_id: rawMaterial.product_tag_vendor.product_id,
//             },
//           });

//           console.log(
//             `Updated reserved stock for product_tag_vendor.product_id: ${rawMaterial.product_tag_vendor.product_id}, added: ${reservedAmount}`
//           );
//         }
//       }

//       await SalesInvoiceTagProduct.create({
//         sales_invoice_id: salesId,
//         product_id: item.product_id,
//         unit_price: item.unit_price,
//         discount_item: item.discount_percentage,
//         quantity: item.quantity,
//         subtotal: item.subtotal,
//         discount_type: "Percentage",
//         isDeleted: 0,
//       });
//     }
//     await Activity_Log.create({
//       masterlist_id: userLoggedID,
//       action_taken: `Created a new Sales: SI = ${sales_invoiceText} | DR = ${deliveryText}`,
//     });

//     return res.status(200).json({
//       message: "Sales invoice created successfully",
//     });
//   } catch (error) {
//     console.error("Error creating sales invoice:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// });

// v2 update
router.route("/updateSales").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log("=== UPDATE SALES REQUEST RECEIVED ===");
    console.log("Full Request Body:", JSON.stringify(req.body, null, 2));

    const {
      transactionId,
      invoiceTitle,
      sales_invoiceText,
      deliveryText,
      selectedCustomer,
      poNumber,
      selectedDueDate,
      selectedInvoiceDate,
      selectedMethod,
      selectedPaymentTerms,
      selectedOtherTerms,
      // inputPaymentTerms,
      remarks,
      userLoggedID,
      selectedDestination,
      selectedCurrency,
      currencyRate,
      selectedWarehouse,
      isCheckedDelivery,
      isCheckedTax,
      isZeroRated,
      taxSelectedID,
      lineItems,
      totalGross,
      totalDiscountedAmount,
      withholdTaxAmount,
      netReceivableAmount,
      taxRate,
      selectedTaxName,
      scaDiscountPercentage,
      scaDiscountAmount,
      vatPercentage,
      vatAmount,
      id,
    } = req.body;

    // Get existing invoice
    const getInvoice = await SalesInvoice.findOne({
      where: { sales_invoice_id: id },
      transaction,
    });

    if (!getInvoice) {
      await transaction.rollback();
      return res.status(404).json({ message: "Invoice not found" });
    }

    let finalOtherPaymentTerms = selectedOtherTerms;

    if (selectedPaymentTerms !== "Other") {
      finalOtherPaymentTerms = null;
    }

    // Prepare update fields
    const updateData = {
      invoice_title: invoiceTitle,
      delivery_number: deliveryText,
      sales_invoice: sales_invoiceText,
      po_number: poNumber,
      due_date: selectedDueDate,
      invoice_date: selectedInvoiceDate,
      payment_method: selectedMethod,
      payment_terms: selectedPaymentTerms,
      other_payment_terms: finalOtherPaymentTerms,
      destination: selectedDestination,
      remarks: remarks,
      is_only_deliver_number: isCheckedDelivery ? 1 : 0,
      is_tax_applied: isCheckedTax ? 1 : 0,
      isZeroRated: isZeroRated ? 1 : 0,
      total_gross: totalGross || 0,
      totalDiscountedAmount: totalDiscountedAmount || 0,
      withhold_tax: withholdTaxAmount || 0,
      net_amount: netReceivableAmount || 0,
      vat_percentage: vatPercentage || 0,
      vat_amount: vatAmount || 0,
      sca_discount_percentage: scaDiscountPercentage || 0,
      sca_discount_amount: scaDiscountAmount || 0,
    };

    // Handle currency update if changed
    if (getInvoice.currency_id !== selectedCurrency) {
      updateData.currency_id = selectedCurrency;
      const getCurrency = await Currency.findOne({
        where: { id: selectedCurrency },
        transaction,
      });
      updateData.rate = getCurrency.currency_rate;
    }

    // Handle tax settings update if changed
    if (getInvoice.tax_settings_id !== taxSelectedID) {
      updateData.tax_settings_id = taxSelectedID;
      const getTax = await TaxSettings.findOne({
        where: { id: taxSelectedID },
        transaction,
      });
      updateData.taxRate = getTax.rate;
      updateData.selectedTaxName = getTax.name;
    }

    // Calculate total quantities for comparison
    let totalUpcomingQuantity = lineItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    let totalCurrentStock = 0;

    // Get all current invoice products to calculate original quantities
    const currentInvoiceProducts = await SalesInvoiceTagProduct.findAll({
      where: { sales_invoice_id: id },
      transaction,
    });

    totalCurrentStock = currentInvoiceProducts.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    if (totalUpcomingQuantity !== totalCurrentStock) {
      // Restore original stock by reversing previous deductions
      const getInvoiceHistory =
        await SalesInvoiceStockManagementHistory.findAll({
          where: { sales_invoice_id: id, isDeleted: 0 },
          transaction,
        });

      for (const history of getInvoiceHistory) {
        const getStockData = await StockManagement.findOne({
          where: { stock_management_id: history.stock_management_id },
          transaction,
        });

        let newStock = getStockData.stock + history.deducted_stock;

        await StockManagement.update(
          { stock: newStock },
          {
            where: { stock_management_id: history.stock_management_id },
            transaction,
          }
        );
      }

      // Mark old deductions as deleted
      await SalesInvoiceStockManagementHistory.update(
        { isDeleted: 1 },
        {
          where: { sales_invoice_id: id },
          transaction,
        }
      );

      // Process new deductions with improved negative stock handling
      for (const item of lineItems) {
        let productId = item.product_id;
        let qtyToDeduct = item.quantity;

        // Get stock batches sorted by oldest first (FIFO)
        let stockBatches = await StockManagement.findAll({
          where: { product_id: productId },
          order: [["expiry_date", "ASC"]],
          transaction,
        });

        // First pass: deduct from positive stock
        for (const batch of stockBatches) {
          console.log("this is the batch stock", batch.stock);
          if (qtyToDeduct <= 0) break;

          let available = batch.stock;
          if (available <= 0) continue;

          let deductNow = Math.min(available, qtyToDeduct);
          let newStock = batch.stock - deductNow;

          await StockManagement.update(
            { stock: newStock },
            {
              where: { stock_management_id: batch.stock_management_id },
              transaction,
            }
          );

          await SalesInvoiceStockManagementHistory.create(
            {
              sales_invoice_id: id,
              stock_management_id: batch.stock_management_id,
              deducted_stock: deductNow,
              isDeleted: 0,
            },
            { transaction }
          );

          qtyToDeduct -= deductNow;
        }

        // Second pass: handle negative stock allocation if needed
        if (qtyToDeduct > 0) {
          console.log("negats ang value");
          const zeroOrNegativeBatches = await StockManagement.findAll({
            where: {
              product_id: productId,
              stock: { [Op.lte]: 0 },
            },
            order: [["expiry_date", "ASC"]],
            transaction,
          });

          if (zeroOrNegativeBatches.length > 0) {
            const spreadAmount = qtyToDeduct / zeroOrNegativeBatches.length;

            for (const batch of zeroOrNegativeBatches) {
              const newStock = batch.stock - spreadAmount;

              await StockManagement.update(
                { stock: newStock },
                {
                  where: { stock_management_id: batch.stock_management_id },
                  transaction,
                }
              );

              await SalesInvoiceStockManagementHistory.create(
                {
                  sales_invoice_id: id,
                  stock_management_id: batch.stock_management_id,
                  deducted_stock: spreadAmount,
                  isDeleted: 0,
                },
                { transaction }
              );
            }
          }
        }
      }
    }

    // Update product line items
    for (const item of lineItems) {
      await SalesInvoiceTagProduct.update(
        {
          unit_price: item.unit_price,
          discount_item: item.discount_percentage,
          subtotal: item.subtotal,
          quantity: item.quantity,
        },
        {
          where: { id: item.salesTagProductId },
          transaction,
        }
      );
    }

    // Update the invoice itself
    await SalesInvoice.update(updateData, {
      where: { sales_invoice_id: id },
      transaction,
    });

    await transaction.commit();
    return res
      .status(200)
      .json({ message: "Sales invoice updated successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating sales invoice:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? { message: error.message, stack: error.stack }
          : undefined,
    });
  }
});

// router.route("/updateSales").post(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     console.log("=== UPDATE SALES REQUEST RECEIVED ===");
//     console.log("Full Request Body:", JSON.stringify(req.body, null, 2));

//     const {
//       transactionId,
//       sales_invoiceText,
//       deliveryText,
//       selectedCustomer,
//       poNumber,
//       selectedDueDate,
//       selectedInvoiceDate,
//       selectedMethod,
//       inputPaymentTerms,
//       remarks,
//       userLoggedID,
//       selectedDestination,
//       selectedCurrency,
//       currencyRate,
//       selectedWarehouse,
//       isCheckedDelivery,
//       isCheckedTax,
//       isZeroRated,
//       taxSelectedID,
//       lineItems,
//       totalGross,
//       totalDiscountedAmount,
//       withholdTaxAmount,
//       netReceivableAmount,
//       taxRate,
//       selectedTaxName,
//       id,
//     } = req.body;

//     // First, get the current sales invoice data to compare changes
//     const currentInvoice = await SalesInvoice.findByPk(id, {
//       include: [
//         {
//           model: SalesInvoiceTagProduct,
//           where: { isDeleted: false },
//           required: false,
//         },
//       ],
//       transaction,
//     });

//     if (!currentInvoice) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "Sales invoice not found" });
//     }

//     // Get current products for comparison
//     const currentProducts = currentInvoice.SalesInvoiceTagProducts || [];

//     console.log(
//       "Current products in DB:",
//       currentProducts.map((p) => ({
//         id: p.id,
//         product_id: p.product_id,
//         quantity: p.quantity,
//         unit_price: p.unit_price,
//         discount_item: p.discount_item,
//       }))
//     );

//     console.log(
//       "New line items from request:",
//       lineItems.map((p) => ({
//         salesTagProductId: p.salesTagProductId,
//         product_id: p.product_id,
//         quantity: p.quantity,
//         unit_price: p.unit_price,
//         discount_percentage: p.discount_percentage,
//       }))
//     );

//     // Check if main invoice data has changed
//     const invoiceDataChanged =
//       currentInvoice.transaction_id !== transactionId ||
//       currentInvoice.sales_invoice !== sales_invoiceText ||
//       currentInvoice.delivery_number !== deliveryText ||
//       currentInvoice.customer_id !== selectedCustomer ||
//       currentInvoice.po_number !== poNumber ||
//       new Date(currentInvoice.due_date).getTime() !==
//         new Date(selectedDueDate).getTime() ||
//       new Date(currentInvoice.invoice_date).getTime() !==
//         new Date(selectedInvoiceDate).getTime() ||
//       currentInvoice.payment_method !== selectedMethod ||
//       currentInvoice.payment_terms !== inputPaymentTerms ||
//       currentInvoice.destination !== selectedDestination ||
//       currentInvoice.currency_id !== selectedCurrency ||
//       parseFloat(currentInvoice.rate || 0) !== parseFloat(currencyRate || 0) ||
//       currentInvoice.is_only_deliver_number !== isCheckedDelivery ||
//       currentInvoice.is_tax_applied !== isCheckedTax ||
//       currentInvoice.isZeroRated !== isZeroRated ||
//       currentInvoice.tax_settings_id !== taxSelectedID ||
//       currentInvoice.remarks !== remarks;

//     // Check if products have changed
//     let productsChanged = false;
//     const productChanges = [];

//     // Check for quantity changes in existing products
//     for (const lineItem of lineItems) {
//       if (lineItem.salesTagProductId) {
//         // This is an existing product
//         const currentProduct = currentProducts.find(
//           (p) => p.id === lineItem.salesTagProductId
//         );
//         if (currentProduct) {
//           const quantityChanged =
//             parseFloat(currentProduct.quantity) !==
//             parseFloat(lineItem.quantity);
//           const priceChanged =
//             parseFloat(currentProduct.unit_price) !==
//             parseFloat(lineItem.unit_price);
//           const discountChanged =
//             parseFloat(currentProduct.discount_item || 0) !==
//             parseFloat(lineItem.discount_percentage || 0);

//           if (quantityChanged || priceChanged || discountChanged) {
//             productsChanged = true;
//             productChanges.push({
//               type: "modified",
//               salesTagProductId: lineItem.salesTagProductId,
//               product_id: lineItem.product_id,
//               oldQuantity: parseFloat(currentProduct.quantity),
//               newQuantity: parseFloat(lineItem.quantity),
//               quantityDelta:
//                 parseFloat(lineItem.quantity) -
//                 parseFloat(currentProduct.quantity),
//               oldPrice: parseFloat(currentProduct.unit_price),
//               newPrice: parseFloat(lineItem.unit_price),
//               oldDiscount: parseFloat(currentProduct.discount_item || 0),
//               newDiscount: parseFloat(lineItem.discount_percentage || 0),
//             });
//           }
//         }
//       } else {
//         // This is a new product
//         productsChanged = true;
//         productChanges.push({
//           type: "added",
//           product_id: lineItem.product_id,
//           quantity: parseFloat(lineItem.quantity),
//           quantityDelta: parseFloat(lineItem.quantity), // New product, so delta is the full quantity
//         });
//       }
//     }

//     // Check for removed products
//     for (const currentProduct of currentProducts) {
//       const stillExists = lineItems.find(
//         (item) => item.salesTagProductId === currentProduct.id
//       );
//       if (!stillExists) {
//         productsChanged = true;
//         productChanges.push({
//           type: "removed",
//           salesTagProductId: currentProduct.id,
//           product_id: currentProduct.product_id,
//           oldQuantity: parseFloat(currentProduct.quantity),
//           quantityDelta: -parseFloat(currentProduct.quantity), // Removing, so negative delta
//         });
//       }
//     }

//     console.log("Invoice data changed:", invoiceDataChanged);
//     console.log("Products changed:", productsChanged);
//     console.log("Product changes:", productChanges);

//     // If no changes detected, return early
//     if (!invoiceDataChanged && !productsChanged) {
//       await transaction.rollback();
//       return res.status(200).json({
//         message: "No changes detected - update skipped",
//         hasChanges: false,
//       });
//     }

//     // Update main invoice data if it has changed
//     if (invoiceDataChanged) {
//       await SalesInvoice.update(
//         {
//           transaction_id: transactionId,
//           destination: selectedDestination,
//           sales_invoice: sales_invoiceText,
//           is_only_deliver_number: isCheckedDelivery,
//           delivery_number: deliveryText,
//           customer_id: selectedCustomer,
//           po_number: poNumber,
//           due_date: selectedDueDate,
//           invoice_date: selectedInvoiceDate,
//           payment_method: selectedMethod,
//           payment_terms: inputPaymentTerms,
//           is_tax_applied: isCheckedTax,
//           tax_settings_id: taxSelectedID || null,
//           currency_id: selectedCurrency,
//           rate: currencyRate,
//           remarks: remarks,
//           warehouse_id: selectedWarehouse,
//           created_by: userLoggedID,
//           total_gross: totalGross,
//           withhold_tax: withholdTaxAmount,
//           net_amount: netReceivableAmount,
//           isZeroRated: isZeroRated,
//           totalDiscountedAmount: totalDiscountedAmount,
//           taxRate: taxRate,
//           selectedTaxName: selectedTaxName,
//         },
//         {
//           where: { sales_invoice_id: id },
//           transaction,
//         }
//       );

//       console.log("Main invoice data updated");
//     }

//     // Process product changes if any
//     if (productsChanged) {
//       // Process stock adjustments for quantity changes
//       for (const change of productChanges) {
//         if (Math.abs(change.quantityDelta || 0) > 0) {
//           console.log(
//             `Processing stock change for product ${change.product_id}: delta = ${change.quantityDelta}`
//           );

//           if (change.quantityDelta > 0) {
//             // Quantity increased - need to deduct more stock (standard FIFO)
//             let remainingQty = change.quantityDelta;

//             // Get all stock entries for FIFO
//             const stockEntries = await StockManagement.findAll({
//               where: {
//                 product_id: change.product_id,
//                 warehouse_id: selectedWarehouse,
//               },
//               order: [["expiry_date", "ASC"]],
//               transaction,
//             });

//             // === First pass: deduct from positive stock ===
//             for (const stockEntry of stockEntries) {
//               if (remainingQty <= 0) break;

//               const availableInBatch = stockEntry.stock;
//               if (availableInBatch <= 0) continue;

//               const deduction = Math.min(availableInBatch, remainingQty);

//               await StockManagement.update(
//                 { stock: stockEntry.stock - deduction },
//                 {
//                   where: {
//                     stock_management_id: stockEntry.stock_management_id,
//                   },
//                   transaction,
//                 }
//               );

//               remainingQty -= deduction;
//               console.log(
//                 `Deducted ${deduction} from stock entry ${stockEntry.stock_management_id}, remaining to deduct: ${remainingQty}`
//               );
//             }

//             // === Second pass: spread negative balance ===
//             if (remainingQty > 0) {
//               const zeroOrNegativeEntries = await StockManagement.findAll({
//                 where: {
//                   product_id: change.product_id,
//                   warehouse_id: selectedWarehouse,
//                   stock: { [Op.lte]: 0 },
//                 },
//                 order: [["expiry_date", "ASC"]],
//                 transaction,
//               });

//               if (zeroOrNegativeEntries.length > 0) {
//                 const splitAmount = Math.floor(
//                   remainingQty / zeroOrNegativeEntries.length
//                 );
//                 let distributed = 0;

//                 for (let i = 0; i < zeroOrNegativeEntries.length; i++) {
//                   let deduction = splitAmount;
//                   if (i === zeroOrNegativeEntries.length - 1) {
//                     deduction = remainingQty - distributed; // last one gets remainder
//                   }

//                   await StockManagement.update(
//                     { stock: zeroOrNegativeEntries[i].stock - deduction },
//                     {
//                       where: {
//                         stock_management_id:
//                           zeroOrNegativeEntries[i].stock_management_id,
//                       },
//                       transaction,
//                     }
//                   );

//                   distributed += deduction;
//                   console.log(
//                     `Applied negative balance ${deduction} to stock entry ${zeroOrNegativeEntries[i].stock_management_id}`
//                   );
//                 }
//               }
//             }
//           } else {
//             // Quantity decreased - need to return stock (FIFO return)
//             const returnQty = Math.abs(change.quantityDelta);
//             const originalQuantity = change.oldQuantity;

//             // Ensure we don't return more than was originally deducted
//             const actualReturnQty = Math.min(returnQty, originalQuantity);

//             if (actualReturnQty > 0) {
//               // Get all stock entries in FIFO order (oldest first)
//               const stockEntries = await StockManagement.findAll({
//                 where: {
//                   product_id: change.product_id,
//                   warehouse_id: selectedWarehouse,
//                 },
//                 order: [["expiry_date", "ASC"]],
//                 transaction,
//               });

//               let remainingToReturn = actualReturnQty;

//               // Return stock to oldest entries first (FIFO)
//               for (const stockEntry of stockEntries) {
//                 if (remainingToReturn <= 0) break;

//                 // Calculate how much we can add to this entry
//                 const addAmount = Math.min(remainingToReturn, originalQuantity);

//                 await StockManagement.update(
//                   { stock: stockEntry.stock + addAmount },
//                   {
//                     where: {
//                       stock_management_id: stockEntry.stock_management_id,
//                     },
//                     transaction,
//                   }
//                 );

//                 remainingToReturn -= addAmount;
//                 console.log(
//                   `Returned ${addAmount} to stock entry ${stockEntry.stock_management_id}, remaining to return: ${remainingToReturn}`
//                 );
//               }

//               // If we still have stock to return (shouldn't happen since we capped at originalQuantity)
//               if (remainingToReturn > 0) {
//                 // Create new stock entry for remaining
//                 await StockManagement.create(
//                   {
//                     product_id: change.product_id,
//                     warehouse_id: selectedWarehouse,
//                     stock: remainingToReturn,
//                   },
//                   { transaction }
//                 );
//                 console.log(
//                   `Created new stock entry with ${remainingToReturn} returned stock for product ${change.product_id}`
//                 );
//               }
//             }
//           }

//           // Log the stock movement
//           await Activity_Log.create(
//             {
//               masterlist_id: userLoggedID,
//               action_taken: `Stock adjustment for product ${change.product_id} - ${change.type} (Delta: ${change.quantityDelta})`,
//               reference_id: id,
//               reference_table: "sales_invoices",
//             },
//             { transaction }
//           );
//         }
//       }

//       // Update product records
//       // First, mark all existing products as deleted
//       await SalesInvoiceTagProduct.update(
//         { isDeleted: true },
//         { where: { sales_invoice_id: id }, transaction }
//       );

//       // Then update/create the line items
//       for (const product of lineItems) {
//         if (product.salesTagProductId) {
//           // Update existing product
//           await SalesInvoiceTagProduct.update(
//             {
//               product_id: product.product_id,
//               unit_price: product.unit_price,
//               discount_item: product.discount_percentage,
//               quantity: product.quantity,
//               subtotal: product.subtotal,
//               isDeleted: false,
//             },
//             { where: { id: product.salesTagProductId }, transaction }
//           );
//         } else {
//           // Create new product
//           await SalesInvoiceTagProduct.create(
//             {
//               sales_invoice_id: id,
//               product_id: product.product_id,
//               unit_price: product.unit_price,
//               discount_item: product.discount_percentage,
//               quantity: product.quantity,
//               subtotal: product.subtotal,
//               isDeleted: false,
//               discount_type: "Percentage",
//             },
//             { transaction }
//           );
//         }
//       }

//       console.log("Product records updated");
//     }

//     // Handle raw material reservations (keeping your existing logic)
//     const existingTagProducts = await SalesInvoiceTagProduct.findAll({
//       where: { sales_invoice_id: id, isDeleted: true },
//       transaction,
//     });

//     const rawMaterialCache = new Map();
//     const affectedRawMaterialIds = new Set();

//     const allProductIds = [
//       ...existingTagProducts.map((p) => p.product_id),
//       ...lineItems.map((p) => p.product_id),
//     ];

//     for (const productId of new Set(allProductIds)) {
//       const rawMaterials = await Finish_Raw_Material.findAll({
//         where: { product_id: productId },
//         include: [{ model: Product_Tag_Vendor, required: true }],
//         transaction,
//       });
//       rawMaterialCache.set(productId, rawMaterials);

//       for (const rawMaterial of rawMaterials) {
//         affectedRawMaterialIds.add(rawMaterial.product_tag_vendor.product_id);
//       }
//     }

//     if (affectedRawMaterialIds.size > 0) {
//       await ProductList.update(
//         { reserved: 0 },
//         {
//           where: {
//             product_id: { [Op.in]: Array.from(affectedRawMaterialIds) },
//           },
//           transaction,
//         }
//       );
//     }

//     for (const product of lineItems) {
//       const rawMaterials = rawMaterialCache.get(product.product_id) || [];

//       for (const rawMaterial of rawMaterials) {
//         const reservedAmount = product.quantity * rawMaterial.weight;

//         await ProductList.increment("reserved", {
//           by: reservedAmount,
//           where: {
//             product_id: rawMaterial.product_tag_vendor.product_id,
//           },
//           transaction,
//         });
//       }
//     }

//     // Log the update
//     await Activity_Log.create(
//       {
//         masterlist_id: userLoggedID,
//         action_taken: `Updated Sales Invoice: ${transactionId}${
//           invoiceDataChanged ? " (Invoice data)" : ""
//         }${productsChanged ? " (Products)" : ""}`,
//         reference_id: id,
//         reference_table: "sales_invoices",
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     return res.status(200).json({
//       message: "Sales invoice updated successfully",
//       hasChanges: true,
//       changesApplied: {
//         invoiceData: invoiceDataChanged,
//         products: productsChanged,
//         productChanges: productChanges.length,
//       },
//     });
//   } catch (error) {
//     await transaction.rollback();

//     console.error("Error updating sales invoice:", {
//       message: error.message,
//       stack: error.stack,
//       body: req.body,
//       timestamp: new Date().toISOString(),
//     });

//     return res.status(500).json({
//       message: "Internal server error",
//       error:
//         process.env.NODE_ENV === "development"
//           ? {
//               message: error.message,
//               stack: error.stack,
//             }
//           : undefined,
//     });
//   }
// });

router.route("/getSalesData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { rbacUserRole, userLoggedID } = req.query; // Get these from query params

    // Build the base where clause
    const whereClause = {
      status: {
        [Op.ne]: "Cancelled",
      },
    };

    // If user role is "Sales", filter by created_by
    if (rbacUserRole === "Sales" && userLoggedID) {
      whereClause.created_by = userLoggedID;
    }

    const { count, rows } = await SalesInvoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          required: true,
          attributes: [
            "customer_id",
            "company_name",
            "company_address",
            "tin",
            "company_nature",
          ],
        },
        {
          model: MasterList,
          required: true,
          attributes: ["id", "fname", "mname", "lname"],
          as: "sales_created_masterlist",
        },
        {
          model: SalesInvoiceTagProduct,
          include: [
            {
              model: ProductList,
              as: "product_list",
            },
            {
              model: Customer,
              as: "sitp_customer_id",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // Manual PTC Resolver
    for (const invoice of rows) {
      for (const item of invoice.sales_invoice_tag_products) {
        item.dataValues.product_tag_customer = await ProductTagCustomer.findOne(
          {
            where: {
              product_id: item.product_id,
              customer_id: invoice.customer_id,
            },
          }
        );
      }
    }

    return res.json({
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// search fetch
router.route("/getSalesDataSearch").get(async (req, res) => {
  try {
    const { searchText, searchField, rbacUserRole, userLoggedID } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: {
        [Op.ne]: "Cancelled",
      },
    };

    // If user role is "Sales", filter by created_by
    if (rbacUserRole === "Sales" && userLoggedID) {
      whereClause.created_by = userLoggedID;
    }

    const include = [
      {
        model: Customer,
        required: true,
        attributes: ["customer_id", "company_name"],
      },
      {
        model: MasterList,
        required: true,
        attributes: ["id", "fname", "mname", "lname"],
        as: "sales_created_masterlist",
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();
      console.log("SEARCH FIELD", searchField);

      if (searchField) {
        switch (searchField) {
          case "transaction_id":
            whereClause.transaction_id = { [Op.like]: `%${text}%` };
            break;
          case "customer":
            whereClause["$customer.company_name$"] = { [Op.like]: `%${text}%` };
            break;
          case "invoice_date":
            whereClause[Op.or] = [
              ...createDateTimeSearchConditions(
                "sales_invoice",
                searchText,
                "invoice_date"
              ),
            ];
            break;
          case "date_created":
            whereClause[Op.or] = [
              ...createDateTimeSearchConditions(
                "sales_invoice",
                searchText,
                "createdAt"
              ),
            ];
            break;
          case "gross_amount":
            const cleanText = text.replace(/,/g, "");
            const searchNumber = parseFloat(cleanText);

            whereClause[Op.or] = [
              ...(!isNaN(searchNumber)
                ? [
                    {
                      total_gross: {
                        [Op.between]: [
                          searchNumber - 0.0001,
                          searchNumber + 0.0001,
                        ],
                      },
                    },
                  ]
                : []),
              Sequelize.where(
                Sequelize.fn(
                  "REPLACE",
                  Sequelize.fn("FORMAT", Sequelize.col("total_gross"), 0),
                  ",",
                  ""
                ),
                {
                  [Op.like]: `%${cleanText}%`,
                }
              ),
              Sequelize.where(
                Sequelize.fn("FORMAT", Sequelize.col("total_gross"), 0),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
              Sequelize.where(Sequelize.literal(`CAST(total_gross AS CHAR)`), {
                [Op.like]: `%${text}%`,
              }),
            ].filter(
              (condition) =>
                condition !== null && Object.keys(condition).length > 0
            );
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          { transaction_id: { [Op.like]: `%${text}%` } },
          { invoice_title: { [Op.like]: `%${text}%` } },
          ...createDateTimeSearchConditions(
            "sales_invoice",
            text,
            "invoice_date"
          ),
          ...createDateTimeSearchConditions("sales_invoice", text, "createdAt"),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sales_created_masterlist\`.fname, ' ', \`sales_created_masterlist\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          {
            [Op.or]: [
              (() => {
                const cleanText = text.replace(/,/g, "");
                const searchNumber = parseFloat(cleanText);

                if (!isNaN(searchNumber)) {
                  if (text.endsWith(",")) {
                    return {
                      total_gross: {
                        [Op.between]: [searchNumber, searchNumber + 1],
                      },
                    };
                  }
                  return {
                    total_gross: {
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
                  Sequelize.fn("FORMAT", Sequelize.col("total_gross"), 0),
                  ",",
                  ""
                ),
                {
                  [Op.like]: `%${text.replace(/,/g, "")}%`,
                }
              ),
              Sequelize.where(Sequelize.literal(`CAST(total_gross AS CHAR)`), {
                [Op.like]: `%${text}%`,
              }),
            ].filter((condition) => condition !== null),
          },
          { "$customer.company_name$": { [Op.like]: `%${text}%` } },
        ];
      }
    }

    const { count, rows } = await SalesInvoice.findAndCountAll({
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

router.route("/getFilteredSalesInvoice").get(async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      agentId,
      invoiceType,
      rbacUserRole,
      userLoggedID,
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // If user role is "Sales", filter by created_by
    if (rbacUserRole === "Sales" && userLoggedID) {
      whereClause.created_by = userLoggedID;
    }

    // Add date range filter if provided
    if (fromDate || toDate) {
      whereClause.invoice_date = {};

      if (fromDate) {
        whereClause.invoice_date[Op.gte] = new Date(fromDate);
      }

      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.invoice_date[Op.lte] = endOfDay;
      }
    }

    if (agentId) {
      whereClause["$sales_created_masterlist.id$"] = agentId;
    }

    if (invoiceType) {
      switch (invoiceType) {
        case "DR":
          whereClause.is_only_deliver_number = 1;
          break;
        case "SI":
          whereClause.is_only_deliver_number = 0;
          whereClause.sales_invoice = {
            [Op.ne]: "",
          };
          break;
        case "Other":
          whereClause[Op.and] = [
            { is_only_deliver_number: 0 },
            {
              sales_invoice: "",
            },
          ];
          break;
        default:
          break;
      }
    }

    const { count, rows } = await SalesInvoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          required: true,
          attributes: ["customer_id", "company_name"],
        },
        {
          model: MasterList,
          required: true,
          attributes: ["id", "fname", "mname", "lname"],
          as: "sales_created_masterlist",
          where: agentId ? { id: agentId } : {},
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

router.route("/getSpecificSalesData").get(async (req, res) => {
  try {
    const invoiceId = req.query.id;
    console.log(`Fetching invoice ID: ${invoiceId}`);

    // Get sales invoice data
    const salesSpecificData = await SalesInvoice.findOne({
      where: { sales_invoice_id: invoiceId },
      include: [
        { model: Customer, required: true },
        { model: TaxSettings, required: false },
        {
          model: SalesInvoiceTagProduct,
          required: true,
          include: [
            {
              model: ProductList,
              required: true,
              include: [
                { model: Packaging, as: "prod_packaging", required: true },
              ],
            },
          ],
        },
        { model: Currency, required: true },
      ],
    });

    if (!salesSpecificData) {
      console.log("Invoice not found");
      return res.status(404).json({ message: "Sales invoice not found" });
    }

    // Log critical data structure
    console.log("\n[Key Data] First product details:", {
      product_id: salesSpecificData.sales_invoice_tag_products[0]?.product_id,
      quantity: salesSpecificData.sales_invoice_tag_products[0]?.quantity,
      stock: salesSpecificData.sales_invoice_tag_products[0]?.stock,
      unit_price: salesSpecificData.sales_invoice_tag_products[0]?.unit_price,
      subtotal: salesSpecificData.sales_invoice_tag_products[0]?.subtotal,
    });

    // Get current stock
    const productIds = salesSpecificData.sales_invoice_tag_products.map(
      (prod) => prod.product_id
    );
    const stockData = await StockManagement.findAll({
      attributes: [
        "product_id",
        [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
      ],
      where: { product_id: productIds },
      group: ["product_id"],
    });

    const stockMap = stockData.reduce(
      (map, item) => ({
        ...map,
        [item.product_id]: parseFloat(item.get("total_stock")) || 0,
      }),
      {}
    );

    // Process products - IMPORTANT: Using quantity from SalesInvoiceTagProduct
    const productsWithStock = salesSpecificData.sales_invoice_tag_products.map(
      (prod) => ({
        salesTagProductId: prod.id,
        product_id: prod.product_id,
        product_code: prod.product_list?.product_code,
        product_name: prod.product_list?.product_name,
        quantity: prod.quantity, // Using quantity from SalesInvoiceTagProduct
        unitPrice: prod.unit_price,
        discount: prod.discount_item,
        subtotal: prod.subtotal,
        current_stock: stockMap[prod.product_id] || 0,
        srp_amount: prod.product_list?.srp_amount || 0,
        packaging_name: prod.product_list?.prod_packaging?.packaging_name,
        unit_quantity: prod.product_list?.prod_packaging?.unit_quantity,
        unit: prod.product_list?.prod_packaging?.unit,
      })
    );

    console.log(
      "\n[Processed] First product:",
      productsWithStock[0] || "No products"
    );

    const transformedData = {
      ...salesSpecificData.dataValues,
      products: productsWithStock,
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching specific sales data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// for series number validation
// Update your route to handle specific validation
router.get("/seriesNumberValidation", async (req, res) => {
  try {
    const { salesInvoice, deliveryNumber, isOnlyDelivery } = req.query;

    // Helper function to extract parts from formatted series number
    const extractSeriesNumberParts = (formattedNumber) => {
      if (!formattedNumber)
        return { fullText: "", numeric: "", alphabetical: "" };

      // Check if there's a dash in the format (AAA-00001)
      const dashIndex = formattedNumber.indexOf("-");

      if (dashIndex !== -1) {
        // Format: AAA-00001
        return {
          fullText: formattedNumber,
          alphabetical: formattedNumber.substring(0, dashIndex),
          numeric: formattedNumber.substring(dashIndex + 1),
        };
      } else {
        // Format: 00001 (no alphabetical prefix)
        return {
          fullText: formattedNumber,
          alphabetical: "",
          numeric: formattedNumber,
        };
      }
    };

    let validationResults = {
      salesInvoice: { exists: false, records: [] },
      deliveryNumber: { exists: false, records: [] },
    };

    // Validate Sales Invoice
    if (salesInvoice) {
      const salesInvoiceParts = extractSeriesNumberParts(salesInvoice);

      // Search for EXACT match of the full formatted text
      const salesInvoiceRecords = await SalesInvoice.findAll({
        where: {
          sales_invoice: salesInvoiceParts.fullText,
        },
        attributes: [
          "sales_invoice_id",
          "sales_invoice",
          "delivery_number",
          "is_only_deliver_number",
        ],
      });

      validationResults.salesInvoice = {
        exists: salesInvoiceRecords.length > 0,
        records: salesInvoiceRecords,
        parts: salesInvoiceParts,
      };
    }

    // Validate Delivery Number (could be DR or DC)
    if (deliveryNumber) {
      const deliveryNumberParts = extractSeriesNumberParts(deliveryNumber);
      let whereCondition = {};

      if (isOnlyDelivery === "true") {
        // Delivery Confirmation: is_only_deliver_number = 1
        whereCondition = {
          delivery_number: deliveryNumberParts.fullText,
          is_only_deliver_number: 1,
        };
      } else if (isOnlyDelivery === "false") {
        // Delivery Receipt: is_only_deliver_number = 0
        whereCondition = {
          delivery_number: deliveryNumberParts.fullText,
          is_only_deliver_number: 0,
        };
      } else {
        // If isOnlyDelivery not specified, check both
        whereCondition = {
          delivery_number: deliveryNumberParts.fullText,
        };
      }

      const deliveryRecords = await SalesInvoice.findAll({
        where: whereCondition,
        attributes: [
          "sales_invoice_id",
          "sales_invoice",
          "delivery_number",
          "is_only_deliver_number",
        ],
      });

      validationResults.deliveryNumber = {
        exists: deliveryRecords.length > 0,
        records: deliveryRecords,
        parts: deliveryNumberParts,
      };
    }

    // Check if any validation failed
    const hasErrors =
      (salesInvoice && validationResults.salesInvoice.exists) ||
      (deliveryNumber && validationResults.deliveryNumber.exists);

    res.json({
      exists: hasErrors,
      details: validationResults,
      message: hasErrors
        ? "Series number already exists"
        : "Series number is available",
    });
  } catch (error) {
    console.error("Error in seriesNumberValidation:", error);
    res.status(500).json({
      error: error.message,
      exists: true, // Treat errors as existing to prevent duplicates
      details: {},
    });
  }
});

module.exports = router;
