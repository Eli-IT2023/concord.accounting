const router = require("express").Router();
const { Op } = require("sequelize");
const sequelize = require("../../../db/config/sequelize.config");
const {
  TaxReport,
  Vendors,
  MasterList,
  PurchaseOrder,
  SalesInvoice,
  Customer,
} = require("../../../db/models/associations");
const moment = require("moment");

const amountFormat = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0.00";
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// FETCH DATA
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    // Dynamic current month start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Format to YYYY-MM-DD
    const currentMonthStartStr = moment(currentMonthStart).format("YYYY-MM-DD");
    const currentMonthEndStr = moment(currentMonthEnd).format("YYYY-MM-DD");

    console.log(
      `Filtering by current month: ${currentMonthStartStr} to ${currentMonthEndStr}`
    );

    // Build where clause
    const whereClause = {
      isDeleted: 0,
      transaction_date: {
        [Op.between]: [currentMonthStartStr, currentMonthEndStr],
      },
    };

    const { count, rows } = await TaxReport.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [
        [
          sortDBTableColumn || "createdAt",
          sortType === "desc" ? "DESC" : "ASC",
        ],
      ],
    });

    if (!rows.length) {
      return res.status(200).json({
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        data: [],
        currentMonthFilter: {
          start: currentMonthStartStr,
          end: currentMonthEndStr,
        },
      });
    }

    // We'll fetch related data dynamically
    const formattedRows = [];

    for (const item of rows) {
      let transactionUser = null;
      let moduleReference = null;

      // 🔹 If Purchase Order
      if (item.module_name === "Purchase Order") {
        const vendor = await Vendors.findOne({
          where: { id: item.transaction_user },
          attributes: ["id", "company_name"],
        });

        const purchaseOrder = await PurchaseOrder.findOne({
          where: { id: item.module_id },
          attributes: ["id", "po_number"],
        });

        transactionUser = vendor
          ? { full_name: vendor.company_name }
          : { full_name: "Unknown Vendor" };
        moduleReference = purchaseOrder ? purchaseOrder.po_number : null;
      }

      // 🔹 If Sales Invoice
      else if (item.module_name === "Sales Invoice") {
        const customer = await Customer.findOne({
          where: { customer_id: item.transaction_user },
          attributes: ["customer_id", "company_name"],
        });

        const salesInvoice = await SalesInvoice.findOne({
          where: { sales_invoice_id: item.module_id },
          attributes: ["sales_invoice_id", "transaction_id"],
        });

        transactionUser = customer
          ? { full_name: customer.company_name }
          : { full_name: "Unknown Customer" };
        moduleReference = salesInvoice ? salesInvoice.transaction_id : null;
      }

      formattedRows.push({
        id: item.id,
        transaction_number: item.transaction_number,
        tax_id: item.tax_id,
        tax_name: item.tax_name,
        tax_rate: item.tax_rate,
        tax_type: item.tax_type,
        transaction_amount: item.transaction_amount,
        tax_amount: item.tax_amount,
        transaction_date: item.transaction_date
          ? moment(item.transaction_date).format("YYYY-MM-DD")
          : null,
        transaction_status: item.transaction_status,
        transaction_user: transactionUser,
        module_reference: moduleReference,
      });
    }

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
      currentMonthFilter: {
        start: currentMonthStartStr,
        end: currentMonthEndStr,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching tax reports:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// APPLY FILTER DATA (Updated for month/year)
router.route("/getFilteredData").get(async (req, res) => {
  try {
    const { month, year, dateFilterType, filterTransactionType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    // Initialize whereClause with isDeleted filter
    const whereClause = { isDeleted: 0 };

    // Handle date filter based on type
    if (dateFilterType === "month" && month) {
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();

      whereClause.transaction_date = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    } else if (dateFilterType === "year" && year) {
      const startOfYear = moment(year, "YYYY").startOf("year").toDate();
      const endOfYear = moment(year, "YYYY").endOf("year").toDate();

      whereClause.transaction_date = {
        [Op.between]: [startOfYear, endOfYear],
      };
    }

    // Handle transaction type filter
    if (filterTransactionType) {
      whereClause.tax_type = filterTransactionType;
    }

    const { count, rows } = await TaxReport.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [
        [
          sortDBTableColumn || "createdAt",
          sortType === "desc" ? "DESC" : "ASC",
        ],
      ],
    });

    if (!rows.length) {
      // Calculate date range for empty response
      let startDate, endDate;

      if (dateFilterType === "month" && month) {
        startDate = moment(month).startOf("month").format("YYYY-MM-DD");
        endDate = moment(month).endOf("month").format("YYYY-MM-DD");
      } else if (dateFilterType === "year" && year) {
        startDate = moment(year).startOf("year").format("YYYY-MM-DD");
        endDate = moment(year).endOf("year").format("YYYY-MM-DD");
      } else {
        // Default to current month if no date filter
        startDate = moment().startOf("month").format("YYYY-MM-DD");
        endDate = moment().endOf("month").format("YYYY-MM-DD");
      }

      return res.status(200).json({
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        data: [],
        dateFilter: {
          start: startDate,
          end: endDate,
          type: dateFilterType || "month",
        },
      });
    }

    // We'll fetch related data dynamically
    const formattedRows = [];

    for (const item of rows) {
      let transactionUser = null;
      let moduleReference = null;

      // 🔹 If Purchase Order
      if (item.module_name === "Purchase Order") {
        const vendor = await Vendors.findOne({
          where: { id: item.transaction_user },
          attributes: ["id", "company_name"],
        });

        const purchaseOrder = await PurchaseOrder.findOne({
          where: { id: item.module_id },
          attributes: ["id", "po_number"],
        });

        transactionUser = vendor
          ? { full_name: vendor.company_name }
          : { full_name: "Unknown Vendor" };
        moduleReference = purchaseOrder ? purchaseOrder.po_number : null;
      }

      // 🔹 If Sales Invoice
      else if (item.module_name === "Sales Invoice") {
        const customer = await Customer.findOne({
          where: { customer_id: item.transaction_user },
          attributes: ["customer_id", "company_name"],
        });

        const salesInvoice = await SalesInvoice.findOne({
          where: { sales_invoice_id: item.module_id },
          attributes: ["sales_invoice_id", "transaction_id"],
        });

        transactionUser = customer
          ? { full_name: customer.company_name }
          : { full_name: "Unknown Customer" };
        moduleReference = salesInvoice ? salesInvoice.transaction_id : null;
      }

      formattedRows.push({
        id: item.id,
        transaction_number: item.transaction_number,
        tax_id: item.tax_id,
        tax_name: item.tax_name,
        tax_rate: item.tax_rate,
        tax_type: item.tax_type,
        transaction_amount: item.transaction_amount,
        tax_amount: item.tax_amount,
        transaction_date: item.transaction_date
          ? moment(item.transaction_date).format("YYYY-MM-DD")
          : null,
        transaction_status: item.transaction_status,
        transaction_user: transactionUser,
        module_reference: moduleReference,
      });
    }

    // Calculate date range for response
    let startDate, endDate;

    if (dateFilterType === "month" && month) {
      startDate = moment(month).startOf("month").format("YYYY-MM-DD");
      endDate = moment(month).endOf("month").format("YYYY-MM-DD");
    } else if (dateFilterType === "year" && year) {
      startDate = moment(year).startOf("year").format("YYYY-MM-DD");
      endDate = moment(year).endOf("year").format("YYYY-MM-DD");
    } else {
      // Default to current month if no date filter
      startDate = moment().startOf("month").format("YYYY-MM-DD");
      endDate = moment().endOf("month").format("YYYY-MM-DD");
    }

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
      dateFilter: {
        start: startDate,
        end: endDate,
        type: dateFilterType || "month",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// search filter
// ✅ Improved /searchData endpoint
router.route("/searchData").get(async (req, res) => {
  try {
    const {
      month,
      year,
      dateFilterType,
      filterTransactionType,
      sortType,
      sortDBTableColumn,
      search,
      filterColumn,
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log("this is the search value", search);
    console.log("this is the filter column", filterColumn);

    // Initialize base where clause
    const whereClause = { isDeleted: 0 };

    // -----------------------
    // 📅 Handle Date Filtering
    // -----------------------
    if (dateFilterType === "month" && month) {
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();
      whereClause.transaction_date = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    } else if (dateFilterType === "year" && year) {
      const startOfYear = moment(year, "YYYY").startOf("year").toDate();
      const endOfYear = moment(year, "YYYY").endOf("year").toDate();
      whereClause.transaction_date = { [Op.between]: [startOfYear, endOfYear] };
    }

    // -------------------------------
    // 💰 Handle Transaction Type Filter
    // -------------------------------
    if (filterTransactionType) {
      whereClause.tax_type = {
        [Op.like]: filterTransactionType,
      };
    }

    // -------------------------------------
    // 🔍 Handle Search (main DB-level logic)
    // -------------------------------------
    let isTransactionUserSearch = false;

    if (search && search.trim() !== "") {
      const searchValue = search.trim();
      const searchValueWithoutCommas = searchValue.replace(/,/g, "");
      const searchValueAsNumber = parseFloat(searchValueWithoutCommas);
      const isNumericSearch = !isNaN(searchValueAsNumber);

      // Check if looks like a date
      let parsedDate = null;
      const looksLikeDate =
        /^(?:\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|[a-zA-Z]+\s+\d{1,2},?\s+\d{4}|\d{4})$/.test(
          searchValue
        );

      if (looksLikeDate) {
        const dateFormats = [
          "MMMM D, YYYY",
          "MMM D, YYYY",
          "YYYY-MM-DD",
          "MM/DD/YYYY",
          "DD/MM/YYYY",
          "MMMM YYYY",
          "MMM YYYY",
          "YYYY",
        ];
        for (const format of dateFormats) {
          const momentDate = moment(searchValue, format, true);
          if (momentDate.isValid()) {
            parsedDate = momentDate.toDate();
            break;
          }
        }
      }

      // -----------------------
      // 🧱 Build Search Conditions
      // -----------------------
      const searchConditions = [];

      // transactionUser search handled later
      if (filterColumn === "all" || filterColumn === "transactionUser") {
        isTransactionUserSearch = true;
      }

      if (filterColumn === "all" || filterColumn === "tax_type") {
        searchConditions.push({
          tax_type: { [Op.like]: `%${searchValue}%` },
        });
      }

      if (filterColumn === "all" || filterColumn === "taxRate") {
        // Handle percentage values for tax_rate
        let taxRateSearchValue = searchValue;
        let taxRateSearchNumber = searchValueAsNumber;

        // If search value ends with %, process it specially for tax_rate
        if (searchValue.endsWith("%")) {
          taxRateSearchValue = searchValue.slice(0, -1).trim(); // Remove %
          taxRateSearchNumber = parseFloat(
            taxRateSearchValue.replace(/,/g, "")
          );
        }

        if (!isNaN(taxRateSearchNumber)) {
          searchConditions.push({
            tax_rate: {
              [Op.between]: [
                taxRateSearchNumber - 0.001,
                taxRateSearchNumber + 0.001,
              ],
            },
          });
        }
      }

      if (filterColumn === "all" || filterColumn === "date") {
        if (parsedDate) {
          const startOfDay = moment(parsedDate).startOf("day").toDate();
          const endOfDay = moment(parsedDate).endOf("day").toDate();
          searchConditions.push({
            transaction_date: { [Op.between]: [startOfDay, endOfDay] },
          });
        } else if (looksLikeDate) {
          searchConditions.push({
            transaction_date: { [Op.like]: `%${searchValue}%` },
          });
        }
      }

      if (filterColumn === "all") {
        searchConditions.push(
          { transaction_number: { [Op.like]: `%${searchValue}%` } },
          { tax_type: { [Op.like]: `%${searchValue}%` } },
          { transaction_status: { [Op.like]: `%${searchValue}%` } },
          { tax_name: { [Op.like]: `%${searchValue}%` } }
        );

        if (isNumericSearch) {
          searchConditions.push(
            {
              transaction_amount: {
                [Op.between]: [
                  searchValueAsNumber - 0.01,
                  searchValueAsNumber + 0.01,
                ],
              },
            },
            {
              tax_amount: {
                [Op.between]: [
                  searchValueAsNumber - 0.01,
                  searchValueAsNumber + 0.01,
                ],
              },
            }
          );
          let taxRateSearchValue = searchValue;
          let taxRateSearchNumber = searchValueAsNumber;

          if (searchValue.endsWith("%")) {
            taxRateSearchValue = searchValue.slice(0, -1).trim();
            taxRateSearchNumber = parseFloat(
              taxRateSearchValue.replace(/,/g, "")
            );
          }

          if (!isNaN(taxRateSearchNumber)) {
            searchConditions.push({
              tax_rate: {
                [Op.between]: [
                  taxRateSearchNumber - 0.001,
                  taxRateSearchNumber + 0.001,
                ],
              },
            });
          }
        }
      }

      // Remove invalid conditions
      const validConditions = searchConditions.filter((condition) => {
        const key = Object.keys(condition)[0];
        const value = condition[key];
        if (key === "tax_rate" && value[Op.between]) {
          return !isNaN(value[Op.between][0]) && !isNaN(value[Op.between][1]);
        }
        return true;
      });

      // ✅ Apply SQL search only if NOT transactionUser search
      if (!isTransactionUserSearch && validConditions.length > 0) {
        whereClause[Op.or] = validConditions;
      }
    }

    console.log("Final where clause:", JSON.stringify(whereClause, null, 2));

    // ---------------------------------
    // 🗃️ Fetch Main TaxReport Data
    // ---------------------------------
    const { count, rows } = await TaxReport.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [
        [
          sortDBTableColumn || "createdAt",
          sortType === "desc" ? "DESC" : "ASC",
        ],
      ],
    });

    console.log(`Found ${count} records, ${rows.length} in current page`);

    if (!rows.length) {
      const startDate = moment(month || year || moment())
        .startOf(dateFilterType || "month")
        .format("YYYY-MM-DD");
      const endDate = moment(month || year || moment())
        .endOf(dateFilterType || "month")
        .format("YYYY-MM-DD");

      return res.status(200).json({
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        data: [],
        dateFilter: {
          start: startDate,
          end: endDate,
          type: dateFilterType || "month",
        },
      });
    }

    const formattedRows = [];

    for (const item of rows) {
      let transactionUser = null;
      let moduleReference = null;

      if (item.module_name === "Purchase Order") {
        const vendor = await Vendors.findOne({
          where: { id: item.transaction_user },
          attributes: ["id", "company_name"],
        });

        const purchaseOrder = await PurchaseOrder.findOne({
          where: { id: item.module_id },
          attributes: ["id", "po_number"],
        });

        transactionUser = vendor
          ? { full_name: vendor.company_name }
          : { full_name: "Unknown Vendor" };
        moduleReference = purchaseOrder ? purchaseOrder.po_number : null;
      } else if (item.module_name === "Sales Invoice") {
        const customer = await Customer.findOne({
          where: { customer_id: item.transaction_user },
          attributes: ["customer_id", "company_name"],
        });

        const salesInvoice = await SalesInvoice.findOne({
          where: { sales_invoice_id: item.module_id },
          attributes: ["sales_invoice_id", "transaction_id"],
        });

        transactionUser = customer
          ? { full_name: customer.company_name }
          : { full_name: "Unknown Customer" };
        moduleReference = salesInvoice ? salesInvoice.transaction_id : null;
      }

      formattedRows.push({
        id: item.id,
        transaction_number: item.transaction_number,
        tax_id: item.tax_id,
        tax_name: item.tax_name,
        tax_rate: item.tax_rate,
        tax_type: item.tax_type,
        transaction_amount: item.transaction_amount,
        tax_amount: item.tax_amount,
        transaction_date: item.transaction_date
          ? moment(item.transaction_date).format("YYYY-MM-DD")
          : null,
        transaction_status: item.transaction_status,
        transaction_user: transactionUser,
        module_reference: moduleReference,
        module_name: item.module_name,
        _company_name: transactionUser ? transactionUser.full_name : null,
      });
    }

    let finalData = formattedRows;

    if (search && search.trim() !== "") {
      const searchValue = search.trim().toLowerCase();

      if (filterColumn === "transactionUser") {
        // Only search transactionUser (customer/vendor names)
        finalData = formattedRows.filter((item) => {
          const companyName = item._company_name?.toLowerCase() || "";
          const transactionNumber =
            item.transaction_number?.toLowerCase() || "";
          return (
            companyName.includes(searchValue) ||
            transactionNumber.includes(searchValue)
          );
        });
      } else if (filterColumn === "all") {
        // Enhance "all" search to ALSO include transactionUser in client-side
        finalData = formattedRows.filter((item) => {
          const companyName = item._company_name?.toLowerCase() || "";
          const transactionNumber =
            item.transaction_number?.toLowerCase() || "";
          const taxType = item.tax_type?.toLowerCase() || "";
          const taxName = item.tax_name?.toLowerCase() || "";
          const transactionStatus =
            item.transaction_status?.toLowerCase() || "";
          // Handle tax_rate percentage search in client-side
          let taxRateMatches = false;
          if (item.tax_rate !== null && item.tax_rate !== undefined) {
            const taxRateString = item.tax_rate.toString();
            const taxRateFormatted = amountFormat(item.tax_rate) + "%";

            // Check both raw value and formatted value
            taxRateMatches =
              taxRateString.includes(searchValue) ||
              taxRateFormatted.toLowerCase().includes(searchValue);
          }

          return (
            companyName.includes(searchValue) ||
            transactionNumber.includes(searchValue) ||
            taxType.includes(searchValue) ||
            taxName.includes(searchValue) ||
            transactionStatus.includes(searchValue) ||
            taxRateMatches || // Use the tax_rate matching
            item.tax_amount?.toString().includes(searchValue) ||
            item.transaction_amount?.toString().includes(searchValue)
          );
        });
      }
    }
    console.log("Final data after filtering:", finalData.length, "items");

    const startDate = moment(month || year || moment())
      .startOf(dateFilterType || "month")
      .format("YYYY-MM-DD");
    const endDate = moment(month || year || moment())
      .endOf(dateFilterType || "month")
      .format("YYYY-MM-DD");

    // ---------------------------------
    // 📤 Final Response
    // ---------------------------------
    return res.status(200).json({
      totalItems: finalData.length,
      totalPages: Math.ceil(finalData.length / limit),
      currentPage: page,
      data: finalData,
      dateFilter: {
        start: startDate,
        end: endDate,
        type: dateFilterType || "month",
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// EXPORT TO EXCEL (Updated for month/year)
router.route("/exportData").get(async (req, res) => {
  try {
    const { month, year, dateFilterType, filterTransactionType } = req.query;

    // Initialize whereClause with isDeleted filter
    const whereClause = { isDeleted: 0 };

    // Handle date filter based on type
    if (dateFilterType === "month" && month) {
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();

      whereClause.transaction_date = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    } else if (dateFilterType === "year" && year) {
      const startOfYear = moment(year, "YYYY").startOf("year").toDate();
      const endOfYear = moment(year, "YYYY").endOf("year").toDate();

      whereClause.transaction_date = {
        [Op.between]: [startOfYear, endOfYear],
      };
    }

    // Handle transaction type filter
    if (filterTransactionType) {
      whereClause.tax_type = filterTransactionType;
    }

    // Get ALL data without pagination for export
    const rows = await TaxReport.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    if (!rows.length) {
      return res.status(200).json([]);
    }

    // Format data for export - same logic as getFilteredData
    const formattedRows = [];

    for (const item of rows) {
      let transactionUser = null;
      let moduleReference = null;

      // 🔹 If Purchase Order
      if (item.module_name === "Purchase Order") {
        const vendor = await Vendors.findOne({
          where: { id: item.transaction_user },
          attributes: ["id", "company_name"],
        });

        const purchaseOrder = await PurchaseOrder.findOne({
          where: { id: item.module_id },
          attributes: ["id", "po_number"],
        });

        transactionUser = vendor
          ? { full_name: vendor.company_name }
          : { full_name: "Unknown Vendor" };
        moduleReference = purchaseOrder ? purchaseOrder.po_number : null;
      }

      // 🔹 If Sales Invoice
      else if (item.module_name === "Sales Invoice") {
        const customer = await Customer.findOne({
          where: { customer_id: item.transaction_user },
          attributes: ["customer_id", "company_name"],
        });

        const salesInvoice = await SalesInvoice.findOne({
          where: { sales_invoice_id: item.module_id },
          attributes: ["sales_invoice_id", "transaction_id"],
        });

        transactionUser = customer
          ? { full_name: customer.company_name }
          : { full_name: "Unknown Customer" };
        moduleReference = salesInvoice ? salesInvoice.transaction_id : null;
      }

      formattedRows.push({
        id: item.id,
        transaction_number: item.transaction_number,
        tax_id: item.tax_id,
        tax_name: item.tax_name,
        tax_rate: item.tax_rate,
        tax_type: item.tax_type,
        transaction_amount: item.transaction_amount,
        tax_amount: item.tax_amount,
        transaction_date: item.transaction_date
          ? moment(item.transaction_date).format("YYYY-MM-DD")
          : null,
        transaction_status: item.transaction_status,
        transaction_user: transactionUser,
        module_reference: moduleReference,
      });
    }

    return res.status(200).json(formattedRows);
  } catch (error) {
    console.error("❌ Error exporting tax reports to Excel:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// CHECK DATA AVAILABILITY (Updated for month/year)
router.route("/checkDataAvailability").get(async (req, res) => {
  try {
    const { month, year, dateFilterType, filterTransactionType } = req.query;

    // Initialize whereClause with isDeleted filter
    const whereClause = { isDeleted: 0 };

    // Handle date filter based on type
    if (dateFilterType === "month" && month) {
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();

      whereClause.transaction_date = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    } else if (dateFilterType === "year" && year) {
      const startOfYear = moment(year, "YYYY").startOf("year").toDate();
      const endOfYear = moment(year, "YYYY").endOf("year").toDate();

      whereClause.transaction_date = {
        [Op.between]: [startOfYear, endOfYear],
      };
    }

    // Handle transaction type filter
    if (filterTransactionType) {
      whereClause.tax_type = filterTransactionType;
    }

    // Check if any data exists with the current filters
    const count = await TaxReport.count({
      where: whereClause,
    });

    return res.status(200).json({
      hasData: count > 0,
      count: count,
    });
  } catch (error) {
    console.error("❌ Error checking data availability:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
