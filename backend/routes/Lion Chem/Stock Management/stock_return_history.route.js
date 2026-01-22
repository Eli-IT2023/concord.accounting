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
  ReturnStockHistory,
  StockManagement,
  ProductList,
  ReturnProductList,
  ScheduleProductList,
} = require("../../../db/models/associations");
const moment = require("moment");

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
      createdAt: {
        [Op.between]: [currentMonthStartStr, currentMonthEndStr],
      },
    };

    const { count, rows } = await ReturnStockHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ReturnProductList,
          as: "rsh_return_product_list_id",
          include: [
            {
              model: ScheduleProductList,
              as: "rpl_schedule_product_list_id",
            },
          ],
        },
        {
          model: StockManagement,
          as: "rsh_stock_management_id",
          include: [
            {
              model: ProductList,
            },
          ],
        },
      ],
      limit,
      offset,
      order: [
        [
          sortDBTableColumn || "createdAt",
          sortType === "desc" ? "DESC" : "ASC",
        ],
      ],
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const {
      sortType = "desc",
      sortDBTableColumn = "createdAt",
      month,
      year,
      dateFilterType = "month",
      productCategory,
    } = req.query;

    // Build where clause
    const whereClause = {
      isDeleted: 0,
    };

    // Handle date filter based on type
    if (dateFilterType === "month" && month) {
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    } else if (dateFilterType === "year" && year) {
      const startOfYear = moment(year, "YYYY").startOf("year").toDate();
      const endOfYear = moment(year, "YYYY").endOf("year").toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfYear, endOfYear],
      };
    }

    // Build include clause with where conditions
    const includeClause = [
      {
        model: ReturnProductList,
        as: "rsh_return_product_list_id",
        required: true,
        include: [
          {
            model: ScheduleProductList,
            as: "rpl_schedule_product_list_id",
          },
        ],
      },
      {
        model: StockManagement,
        as: "rsh_stock_management_id",
        required: true,
        include: [
          {
            model: ProductList,
            required: true,
            where:
              productCategory && productCategory !== "All"
                ? {
                    product_category: productCategory,
                  }
                : undefined,
          },
        ],
      },
    ];

    const { count, rows } = await ReturnStockHistory.findAndCountAll({
      where: whereClause,
      include: includeClause,
      distinct: true, // Important for accurate counting with joins
      limit,
      offset,
      order: [
        [
          sortDBTableColumn || "createdAt",
          sortType === "desc" ? "DESC" : "ASC",
        ],
      ],
    });

    let startDate, endDate;

    if (dateFilterType === "month" && month) {
      startDate = moment(month, "YYYY-MM")
        .startOf("month")
        .format("YYYY-MM-DD");
      endDate = moment(month, "YYYY-MM").endOf("month").format("YYYY-MM-DD");
    } else if (dateFilterType === "year" && year) {
      startDate = moment(year, "YYYY").startOf("year").format("YYYY-MM-DD");
      endDate = moment(year, "YYYY").endOf("year").format("YYYY-MM-DD");
    } else {
      // Default to current month if no date filter
      startDate = moment().startOf("month").format("YYYY-MM-DD");
      endDate = moment().endOf("month").format("YYYY-MM-DD");
    }

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows,
      dateFilter: {
        start: startDate,
        end: endDate,
        type: dateFilterType || "month",
      },
    });
  } catch (error) {
    console.error("❌ Error fetching return stock history:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// search filter
// ✅ Corrected /searchData endpoint
router.route("/searchData").get(async (req, res) => {
  try {
    const {
      month,
      year,
      dateFilterType,
      productCategory,
      sortType,
      sortDBTableColumn,
      search,
      filterColumn = "all",
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log("🔍 Search parameters:", {
      search,
      filterColumn,
      month,
      year,
      dateFilterType,
      productCategory,
    });

    // Initialize base where clause for main model
    const whereClause = { isDeleted: 0 };

    // -----------------------
    // 📅 Handle Date Filtering
    // -----------------------
    if (dateFilterType === "month" && month) {
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();
      whereClause.createdAt = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    } else if (dateFilterType === "year" && year) {
      const startOfYear = moment(year, "YYYY").startOf("year").toDate();
      const endOfYear = moment(year, "YYYY").endOf("year").toDate();
      whereClause.createdAt = { [Op.between]: [startOfYear, endOfYear] };
    }

    // -----------------------
    // 🧱 Build Include Clause
    // -----------------------
    const productListWhere = {};

    // Handle product category filter
    if (productCategory && productCategory !== "All") {
      productListWhere.product_category = productCategory;
    }

    // Build include clause
    const includeClause = [
      {
        model: ReturnProductList,
        as: "rsh_return_product_list_id",
        required: true,
        include: [
          {
            model: ScheduleProductList,
            as: "rpl_schedule_product_list_id",
          },
        ],
      },
      {
        model: StockManagement,
        as: "rsh_stock_management_id",
        required: true,
        include: [
          {
            model: ProductList,
            required: true,
            where:
              Object.keys(productListWhere).length > 0
                ? productListWhere
                : undefined,
          },
        ],
      },
    ];

    // -----------------------
    // 🔍 Handle Search Conditions
    // -----------------------
    if (search && search.trim() !== "") {
      const searchValue = search.trim();
      const searchValueWithoutCommas = searchValue.replace(/,/g, "");

      // Parse numeric value for weight search
      let numericWeightValue = null;
      if (searchValueWithoutCommas && !isNaN(searchValueWithoutCommas)) {
        numericWeightValue = parseFloat(searchValueWithoutCommas);
      }

      // Check if search looks like a date
      const possibleDateFormats = [
        "MMM. DD, YYYY",
        "MMM DD, YYYY",
        "MMM D, YYYY",
        "MMMM D, YYYY",
        "YYYY-MM-DD",
        "MM/DD/YYYY",
        "DD/MM/YYYY",
        "M/D/YYYY",
        "D/M/YYYY",
        "MM-DD-YYYY",
        "DD-MM-YYYY",
        "M-D-YYYY",
        "D-M-YYYY",
        "YYYY",
        "MMM YYYY",
        "MMMM YYYY",
        "MMM. DD, YYYY - hh:mm A",
        "MMM DD, YYYY - hh:mm A",
        "YYYY-MM-DD HH:mm:ss",
        "YYYY-MM-DD HH:mm",
      ];

      let parsedExpiryDate = null;
      let parsedCreatedAtDate = null;

      // Try to parse as expiry_date (date only)
      for (const format of possibleDateFormats) {
        if (format.includes("HH:mm") || format.includes("hh:mm")) {
          // Skip time formats for expiry date
          continue;
        }
        const momentDate = moment(searchValue, format, true);
        if (momentDate.isValid()) {
          parsedExpiryDate = momentDate.toDate();
          break;
        }
      }

      // Try to parse as createdAt (date with possible time)
      for (const format of possibleDateFormats) {
        const momentDate = moment(searchValue, format, true);
        if (momentDate.isValid()) {
          parsedCreatedAtDate = momentDate.toDate();
          break;
        }
      }

      // Initialize search conditions array
      const searchConditions = [];

      // Add LOT search condition
      if (filterColumn === "all" || filterColumn === "lot") {
        searchConditions.push({
          lot: { [Op.like]: `%${searchValue}%` },
        });
      }

      // Add product code search
      if (filterColumn === "all" || filterColumn === "productCode") {
        const { Sequelize } = require("sequelize");
        searchConditions.push(
          Sequelize.literal(`
            EXISTS (
              SELECT 1 FROM stock_managements sm
              INNER JOIN product_lists pl ON sm.product_id = pl.product_id
              WHERE sm.stock_management_id = return_stock_history.stock_management_id
              AND pl.product_code LIKE '%${searchValue}%'
            )
          `)
        );
      }

      // Add product name search
      if (filterColumn === "all" || filterColumn === "productName") {
        const { Sequelize } = require("sequelize");
        searchConditions.push(
          Sequelize.literal(`
            EXISTS (
              SELECT 1 FROM stock_managements sm
              INNER JOIN product_lists pl ON sm.product_id = pl.product_id
              WHERE sm.stock_management_id = return_stock_history.stock_management_id
              AND pl.product_name LIKE '%${searchValue}%'
            )
          `)
        );
      }

      // Add weight returned search
      if (filterColumn === "all" || filterColumn === "weight") {
        if (numericWeightValue !== null) {
          const { Sequelize } = require("sequelize");
          searchConditions.push(
            Sequelize.literal(`
              EXISTS (
                SELECT 1 FROM return_product_lists rpl
                INNER JOIN schedule_product_lists spl ON rpl.schedule_product_list_id = spl.id
                WHERE rpl.id = return_stock_history.return_product_list_id
                AND (return_stock_history.return_quantity * spl.packaging_unit_quantity) = ${numericWeightValue}
              )
            `)
          );
        }
      }

      // Add expiry date search
      if (filterColumn === "all" && parsedExpiryDate) {
        // Format the date for SQL comparison (YYYY-MM-DD)
        const formattedExpiryDate =
          moment(parsedExpiryDate).format("YYYY-MM-DD");
        whereClause.expiry_date = formattedExpiryDate;
      }

      // Add createdAt (date returned) search
      if (filterColumn === "all" && parsedCreatedAtDate) {
        // For createdAt, we search by the day (ignore time)
        const startOfDay = moment(parsedCreatedAtDate).startOf("day").toDate();
        const endOfDay = moment(parsedCreatedAtDate).endOf("day").toDate();

        if (!whereClause.createdAt) {
          whereClause.createdAt = { [Op.between]: [startOfDay, endOfDay] };
        } else if (whereClause.createdAt[Op.between]) {
          // If we already have a date range from month/year filter, combine with AND
          const existingRange = whereClause.createdAt[Op.between];
          whereClause[Op.and] = [
            { createdAt: { [Op.between]: existingRange } },
            { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
          ];
          delete whereClause.createdAt;
        }
      }

      // Apply search conditions to where clause
      if (searchConditions.length > 0) {
        if (filterColumn === "all") {
          whereClause[Op.or] = searchConditions;
        } else {
          whereClause[Op.and] = searchConditions;
        }
      }

      // Also apply search to product list where clause for more efficient filtering
      if (
        filterColumn === "productCode" ||
        filterColumn === "productName" ||
        filterColumn === "all"
      ) {
        if (!productListWhere[Op.and]) {
          productListWhere[Op.and] = [];
        }

        if (filterColumn === "productCode") {
          productListWhere[Op.and].push({
            product_code: { [Op.like]: `%${searchValue}%` },
          });
        } else if (filterColumn === "productName") {
          productListWhere[Op.and].push({
            product_name: { [Op.like]: `%${searchValue}%` },
          });
        } else if (filterColumn === "all") {
          productListWhere[Op.or] = [
            { product_code: { [Op.like]: `%${searchValue}%` } },
            { product_name: { [Op.like]: `%${searchValue}%` } },
          ];
        }
      }
    }

    // Update include clause with search conditions for ProductList
    includeClause[1].include[0].where =
      Object.keys(productListWhere).length > 0 ? productListWhere : undefined;

    // -----------------------
    // 🗃️ Build Final Query Options
    // -----------------------
    const queryOptions = {
      where: whereClause,
      include: includeClause,
      distinct: true,
      limit,
      offset,
      order: [
        [
          sortDBTableColumn || "createdAt",
          sortType === "desc" || sortType === "DESC" ? "DESC" : "ASC",
        ],
      ],
    };

    console.log(
      "Final query options:",
      JSON.stringify(queryOptions.where, null, 2)
    );

    // -----------------------
    // 📊 Execute Query
    // -----------------------
    const { count, rows } = await ReturnStockHistory.findAndCountAll(
      queryOptions
    );

    // Calculate date range for response
    let startDate, endDate;
    if (dateFilterType === "month" && month) {
      startDate = moment(month, "YYYY-MM")
        .startOf("month")
        .format("YYYY-MM-DD");
      endDate = moment(month, "YYYY-MM").endOf("month").format("YYYY-MM-DD");
    } else if (dateFilterType === "year" && year) {
      startDate = moment(year, "YYYY").startOf("year").format("YYYY-MM-DD");
      endDate = moment(year, "YYYY").endOf("year").format("YYYY-MM-DD");
    } else {
      // Default to current month if no date filter
      startDate = moment().startOf("month").format("YYYY-MM-DD");
      endDate = moment().endOf("month").format("YYYY-MM-DD");
    }

    // -----------------------
    // 📤 Final Response
    // -----------------------
    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows,
      searchInfo: {
        query: search,
        filter: filterColumn,
        results: rows.length,
      },
      dateFilter: {
        start: startDate,
        end: endDate,
        type: dateFilterType || "month",
      },
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
