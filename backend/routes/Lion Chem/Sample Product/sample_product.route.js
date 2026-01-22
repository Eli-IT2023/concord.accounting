const express = require("express");
const { Op, Sequelize, col, literal, where } = require("sequelize");
const router = express.Router();
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");

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
  Customer,
  Packaging,
  SampleProduct,
  SampleProductList,
  SampleProductListHistory,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// get customer
router.route("/getCustomer/").get(async (req, res) => {
  try {
    const getCustomer = await Customer.findAll({
      where: {
        status: 1,
      },
    });
    if (getCustomer) {
      return res.json(getCustomer);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json();
  }
});

// get product list
router.route("/getProductData").get(async (req, res) => {
  try {
    console.log("Starting /getProductData request");

    // Verify database connection
    await sequelize.authenticate();
    console.log("Database connection verified");

    const query = ProductList.findAll({
      attributes: [
        "product_id",
        "product_code",
        "product_name",
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(stock), 0)
            FROM stock_managements 
            WHERE stock_managements.product_id = product_list.product_id
          )`),
          "total_stock",
        ],
      ],
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          attributes: ["id", "packaging_name"], // Add or change attributes as needed
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log("Generated SQL Query:", query.toString());

    const data = await query;
    console.log("Raw database response:", JSON.stringify(data, null, 2));

    // Process the data with correct field names
    const processedData = data.map((item) => {
      const plainItem = item.get({ plain: true });
      console.log(
        `Processing product ${plainItem.product_id}: ${plainItem.product_name}`
      );

      return {
        product_id: plainItem.product_id,
        product_code: plainItem.product_code,
        product_name: plainItem.product_name,
        total_stock: parseFloat(plainItem.total_stock) || 0,
        packaging: plainItem.prod_packaging
          ? {
              id: plainItem.prod_packaging.id,
              packaging_name: plainItem.prod_packaging.packaging_name,
            }
          : null,
        rawData: process.env.NODE_ENV === "development" ? plainItem : undefined,
      };
    });

    console.log("Final response data:", JSON.stringify(processedData, null, 2));

    res.json({
      success: true,
      count: processedData.length,
      data: processedData,
    });
  } catch (err) {
    console.error("Error in /getProductData:", {
      timestamp: new Date().toISOString(),
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        sql: err.sql, // If available
        parameters: err.parameters, // If available
      },
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
      requestId: req.id, // If you have request ID tracking
      details:
        process.env.NODE_ENV === "development"
          ? {
              message: err.message,
              type: err.name,
            }
          : undefined,
    });
  }
});

// create sample product
router.route("/create").post(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let submissionData = req.body;

    const {
      customer_id,
      remarks,
      userLoggedID,
      confirmation_remarks,
      products,
    } = submissionData;

    // Generate unique SP number
    const generateUniqueRrNumber = async () => {
      const RR_PREFIX = "SP-";
      const MAX_ATTEMPTS = 5;
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const now = new Date();
        const datetimeStr = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
          String(now.getHours()).padStart(2, "0"),
          String(now.getMinutes()).padStart(2, "0"),
          String(now.getSeconds()).padStart(2, "0"),
        ].join("");

        const sp_no = `${RR_PREFIX}${datetimeStr}${randomNum}`;

        const existing = await SampleProduct.findOne({
          where: { sp_no },
          transaction: t,
        });

        if (!existing) return sp_no;
        attempts++;
      }

      throw new Error("Failed to generate unique SP number");
    };

    const sp_no = await generateUniqueRrNumber();

    // Calculate total quantity
    const totalQuantity = products.reduce((sum, prod) => {
      const qty = parseFloat(
        (prod.quantity || "0").toString().replace(/,/g, "")
      );
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);

    const requestedAt = new Date();

    // Create main SampleProduct record
    const createData = await SampleProduct.create(
      {
        sp_no,
        customer_id,
        remarks,
        status: "For-Approval",
        requestedBy: userLoggedID,
        requestedRemarks: confirmation_remarks,
        totalQuantity,
        requestedAt,
      },
      { transaction: t }
    );

    if (createData) {
      // Insert each product into SampleProductList
      await Promise.all(
        products.map(async (prod) => {
          await SampleProductList.create(
            {
              sample_product_id: createData.id,
              product_id: prod.product_id,
              remaining_quantity: prod.total_stock,
              release_quantity: parseFloat(
                (prod.quantity || "0").toString().replace(/,/g, "")
              ),
              remarks: prod.product_remarks,
            },
            { transaction: t }
          );
        })
      );
    }

    await t.commit(); // Only commit if all succeeded

    return res.status(200).json({
      success: true,
      message: "Sample product created successfully",
      sp_no,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error in /create route:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// fetch data table
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await SampleProduct.findAndCountAll({
      where: {
        isDeleted: 0,
      },
      include: [
        {
          model: SampleProductList,
          as: "spl_sample_product_id",
          include: [
            {
              model: ProductList,
              as: "spl_product_id",
            },
          ],
        },
        {
          model: Customer,
          as: "sp_customer_id",
        },
        {
          model: MasterList,
          as: "sp_requested_by",
        },
        {
          model: MasterList,
          as: "sp_approved_by",
        },
        {
          model: MasterList,
          as: "sp_prepared_by",
        },
        {
          model: MasterList,
          as: "sp_dispatched_by",
        },
        {
          model: MasterList,
          as: "sp_received_by",
        },
        {
          model: MasterList,
          as: "sp_rejected_by",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

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

// fetch data view
router.route("/fetchSampleProduct/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    console.log("the id", id);

    const getSampleProduct = await SampleProduct.findOne({
      where: {
        id,
        isDeleted: 0,
      },
      include: [
        {
          model: Customer,
          as: "sp_customer_id",
        },
      ],
    });

    console.log("fetch sample product", getSampleProduct);

    if (getSampleProduct) {
      return res.json(getSampleProduct);
    } else {
      return res.status(404).json({ message: "Sample Product not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// fetch product list view
router.route("/fetchProductListData/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    console.log("the sample product id", id);

    const getSampleProductList = await SampleProductList.findAll({
      where: {
        sample_product_id: id,
      },
      include: [
        {
          model: ProductList,
          as: "spl_product_id",
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
      ],
    });

    if (getSampleProductList.length > 0) {
      console.log("This is the fetchProductListData", getSampleProductList);
      return res.json({ data: getSampleProductList });
    } else {
      return res.status(404).json({ message: "Sample Product not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// update status
router.route("/updateStatus").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, status, remarks, userId } = req.body;

    console.log("ID:", id);
    console.log("New Status:", status);
    console.log("Remarks:", remarks);
    console.log("User ID:", userId);

    const updateFields = { status };

    if (status === "Approved") {
      updateFields.approvedBy = userId;
      updateFields.approvedRemarks = remarks;
      updateFields.approvedAt = new Date();

      // Fetch product list under this sample product
      const fetchProductList = await SampleProductList.findAll({
        where: {
          sample_product_id: id,
          isDeleted: 0,
        },
        transaction,
      });

      for (const item of fetchProductList) {
        let remainingQty = item.release_quantity;

        const stockEntries = await StockManagement.findAll({
          where: {
            product_id: item.product_id,
            isDeleted: 0,
          },
          order: [["createdAt", "ASC"]],
          transaction,
          lock: true,
        });

        for (const stock of stockEntries) {
          if (remainingQty <= 0) break;

          const availableStock = stock.stock;
          let deducted = 0;

          if (remainingQty >= availableStock) {
            deducted = availableStock;
            remainingQty -= availableStock;
            await stock.update({ stock: 0 }, { transaction });
          } else {
            deducted = remainingQty;
            await stock.update(
              { stock: availableStock - remainingQty },
              { transaction }
            );
            remainingQty = 0;
          }

          // Insert FIFO log
          await SampleProductListHistory.create(
            {
              sample_product_id: id,
              stock_management_id: stock.stock_management_id,
              borrowed_quantity: deducted,
            },
            { transaction }
          );

          console.log(
            `📘 Logged FIFO: Deducted ${deducted} from Stock ID ${stock.stock_management_id} for Sample Product List ${item.id}`
          );
        }

        if (remainingQty > 0) {
          console.warn(
            `⚠️ Not enough stock for product ID ${item.product_id}. ${remainingQty} units not deducted.`
          );
        }
      }
    } else if (status === "Declined") {
      updateFields.rejectedBy = userId;
      updateFields.rejectedRemarks = remarks;
      updateFields.rejectedAt = new Date();

      // 1. Check if FIFO logs exist
      const historyLogs = await SampleProductListHistory.findAll({
        where: { sample_product_id: id },
        transaction,
      });

      if (historyLogs.length > 0) {
        // 2. Roll back the borrowed stock
        for (const log of historyLogs) {
          const stock = await StockManagement.findOne({
            where: { stock_management_id: log.stock_management_id },
            transaction,
            lock: true,
          });

          if (stock) {
            const newStockLevel = stock.stock + log.borrowed_quantity;
            await stock.update({ stock: newStockLevel }, { transaction });

            console.log(
              `🔁 Restored ${log.borrowed_quantity} units to Stock ID ${stock.stock_management_id}`
            );
          }
        }

        // 3. Delete history logs
        await SampleProductListHistory.destroy({
          where: { sample_product_id: id },
          transaction,
        });

        console.log(
          `🧹 Cleaned up SampleProductListHistory for sample_product_id = ${id}`
        );
      } else {
        console.log(`✅ No FIFO logs found. Safe to decline without rollback.`);
      }
    } else if (status === "In-Preparation") {
      updateFields.preparedBy = userId;
      updateFields.preparedRemarks = remarks;
      updateFields.preparedAt = new Date();
    } else if (status === "Dispatched") {
      updateFields.dispatchedBy = userId;
      updateFields.dispatchedRemarks = remarks;
      updateFields.dispatchedAt = new Date();
    } else if (status === "Received") {
      updateFields.receivedBy = userId;
      updateFields.receivedRemarks = remarks;
      updateFields.receivedAt = new Date();
    }

    // Update the sample product status
    await SampleProduct.update(updateFields, {
      where: { id },
      transaction,
    });

    await transaction.commit();
    res.json({ success: true, message: "Status updated successfully." });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error in updateStatus:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the where clause dynamically
    const whereClause = { isDeleted: 0 };

    // if (filterVendor && filterVendor !== "All") {
    //   whereClause.vendor_id = filterVendor;
    // }

    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    // if (filterPaymentStatus && filterPaymentStatus !== "All") {
    //   whereClause.payment_status = filterPaymentStatus;
    // }

    if (filterDateCreated) {
      const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .startOf("day") // 00:00:00
        .toDate();

      const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .endOf("day") // 23:59:59.999\
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const { count, rows } = await SampleProduct.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      include: [
        {
          model: Customer,
          as: "sp_customer_id",
          attributes: ["company_name"],
        },
        {
          model: MasterList,
          as: "sp_requested_by",
          attributes: ["fname", "lname"],
        },
        {
          model: MasterList,
          as: "sp_approved_by",
          attributes: ["fname", "lname"],
        },
        {
          model: MasterList,
          as: "sp_prepared_by",
          attributes: ["fname", "lname"],
        },
        {
          model: MasterList,
          as: "sp_dispatched_by",
          attributes: ["fname", "lname"],
        },
        {
          model: MasterList,
          as: "sp_received_by",
          attributes: ["fname", "lname"],
        },
      ],
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows,
      filters: {
        status: filterStatus,
        createdAt: filterDateCreated,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              sql: error.sql,
            }
          : undefined,
    });
  }
});

router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = { isDeleted: 0 };

    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    const include = [
      {
        model: Customer,
        as: "sp_customer_id",
        attributes: ["company_name"],
      },
      {
        model: MasterList,
        as: "sp_requested_by",
        attributes: ["id", "fname", "lname"],
      },
      {
        model: MasterList,
        as: "sp_approved_by",
        attributes: ["id", "fname", "lname"],
      },
      {
        model: MasterList,
        as: "sp_prepared_by",
        attributes: ["id", "fname", "lname"],
      },
      {
        model: MasterList,
        as: "sp_dispatched_by",
        attributes: ["id", "fname", "lname"],
      },
      {
        model: MasterList,
        as: "sp_received_by",
        attributes: ["id", "fname", "lname"],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (filterColumn !== "all") {
        switch (filterColumn) {
          case "id":
          case "customer":
            whereClause[Op.and] = [
              // Search by customer company name
              { "$sp_customer_id.company_name$": { [Op.like]: `%${text}%` } },
            ];
            break;

          case "requestor":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.literal(
                `CONCAT(\`sp_requested_by->r\`.fname, ' ', \`sp_requested_by-.\`.lname)`
              ),
              {
                [Op.like]: `%${text}%`,
              }
            );
            break;
        }
      } else {
        // Global search across multiple fields

        const searchConditions = [
          { "$sp_customer_id.company_name$": { [Op.like]: `%${text}%` } },
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sp_requested_by\`.fname, ' ', \`sp_requested_by\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sp_approved_by\`.fname, ' ', \`sp_approved_by\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sp_prepared_by\`.fname, ' ', \`sp_prepared_by\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sp_dispatched_by\`.fname, ' ', \`sp_dispatched_by\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`sp_received_by\`.fname, ' ', \`sp_received_by\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          // date
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("sample_product.createdAt"),
              "%M %d, %Y"
            ),
            { [Op.like]: `%${text}%` }
          ),
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("sample_product.createdAt"),
              "%Y-%m-%d"
            ),
            { [Op.like]: `%${text}%` }
          ),
          //time
          { status: { [Op.like]: `%${text}%` } },
        ];

        const timeConditions = createDateTimeSearchConditions(
          "sample_product",
          text
        );
        if (timeConditions.length > 0) {
          searchConditions.push(...timeConditions);
        }

        whereClause[Op.or] = searchConditions;
      }
    }
    const { count, rows } = await SampleProduct.findAndCountAll({
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

module.exports = router;
