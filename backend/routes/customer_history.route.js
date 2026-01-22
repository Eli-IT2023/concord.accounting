const router = require("express").Router();
const { where, Op, fn, col, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Customer,
  Activity_Log,
  Customer_SocialLinks,
  Customer_ContactPerson,
  SalesInvoice,
  SalesInvoiceTagProduct,
  ProductList,
  Packaging,
} = require("../db/models/associations");
const {
  createDateTimeSearchConditions,
} = require("../utils/dateTimeSearchConditions");
const session = require("express-session");
const moment = require("moment");

router.route("/getCustomerHistory").get(async (req, res) => {
  try {
    const { customerId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get invoices with their products (with proper counting)
    const { count, rows: invoices } = await SalesInvoice.findAndCountAll({
      where: { customer_id: customerId },
      include: [
        {
          model: SalesInvoiceTagProduct,
          include: [
            {
              model: ProductList,
              include: [
                {
                  model: Packaging,
                  as: "prod_packaging",
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    if (!invoices || invoices.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        message: "No purchase history found",
      });
    }

    // Format the response to match frontend structure
    const formattedData = invoices.map((invoice) => ({
      id: invoice?.id,
      transaction_id: invoice?.transaction_id,
      createdAt: invoice?.createdAt,
      paymentTerms: invoice?.payment_terms,
      products: invoice?.sales_invoice_tag_products.map((product) => ({
        productId: product?.product_id,
        productCode: product?.product_list.product_code || "",
        productName: product?.product_list.product_name,
        quantity: product?.quantity,
        unitPrice: product?.unit_price,
        packaging: product?.product_list.prod_packaging?.packaging_name || "",
        subtotal: product?.subtotal,
        discount: `${product?.discount_item}%`,
      })),
    }));

    // Calculate total products for accurate pagination
    const totalProducts = await SalesInvoiceTagProduct.count({
      include: [
        {
          model: SalesInvoice,
          where: { customer_id: customerId },
          required: true,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: formattedData,
      totalItems: totalProducts, // Total number of product records
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getCustomerHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/getCustomerHistoryBySearch").get(async (req, res) => {
  try {
    const { customerId, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const whereClause = { customer_id: customerId };
    const include = [
      {
        model: SalesInvoiceTagProduct,
        required: true,
        include: [
          {
            model: ProductList,
            required: true,
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
                required: false,
              },
            ],
          },
        ],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (filterColumn && filterColumn !== "all") {
        switch (filterColumn) {
          case "product_id":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.col(
                "sales_invoice_tag_products.product_list.product_code"
              ),
              { [Op.like]: `%${text}%` }
            );
            break;

          case "sales_invoice_id":
            whereClause.transaction_id = { [Op.like]: `%${text}%` };
            break;

          case "product_name":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.col(
                "sales_invoice_tag_products.product_list.product_name"
              ),
              { [Op.like]: `%${text}%` }
            );
            break;

          case "quantity":
            const quantityValue = parseFloat(text.replace(/,/g, ""));
            if (!isNaN(quantityValue)) {
              whereClause[Op.and] = {
                [Op.or]: [
                  // Exact match with tolerance
                  {
                    "$sales_invoice_tag_products.quantity$": {
                      [Op.between]: [
                        quantityValue - 0.0001,
                        quantityValue + 0.0001,
                      ],
                    },
                  },
                  // Partial number match (like "450" matching "4500")
                  Sequelize.where(
                    Sequelize.literal(
                      `CAST(\`sales_invoice_tag_products\`.\`quantity\` AS CHAR)`
                    ),
                    { [Op.like]: `%${text}%` }
                  ),
                  // Handle formatted numbers (with commas)
                  Sequelize.where(
                    Sequelize.fn(
                      "FORMAT",
                      Sequelize.col("sales_invoice_tag_products.quantity"),
                      0
                    ),
                    { [Op.like]: `%${text}%` }
                  ),
                ],
              };
            } else {
              whereClause[Op.and] = Sequelize.where(
                Sequelize.literal(
                  `CAST(\`sales_invoice_tag_products\`.\`quantity\` AS CHAR)`
                ),
                { [Op.like]: `%${text}%` }
              );
            }
            break;

          case "unit_price":
            const priceValue = parseFloat(text.replace(/,/g, ""));
            if (!isNaN(priceValue)) {
              whereClause[Op.and] = {
                [Op.or]: [
                  // Exact match with tolerance
                  {
                    "$sales_invoice_tag_products.unit_price$": {
                      [Op.between]: [priceValue - 0.0001, priceValue + 0.0001],
                    },
                  },
                  // Partial number match
                  Sequelize.where(
                    Sequelize.literal(
                      `CAST(\`sales_invoice_tag_products\`.\`unit_price\` AS CHAR)`
                    ),
                    { [Op.like]: `%${text}%` }
                  ),
                  // Handle formatted numbers (with commas and decimals)
                  Sequelize.where(
                    Sequelize.fn(
                      "FORMAT",
                      Sequelize.col("sales_invoice_tag_products.unit_price"),
                      2
                    ),
                    { [Op.like]: `%${text}%` }
                  ),
                ],
              };
            } else {
              whereClause[Op.and] = Sequelize.where(
                Sequelize.literal(
                  `CAST(\`sales_invoice_tag_products\`.\`unit_price\` AS CHAR)`
                ),
                { [Op.like]: `%${text}%` }
              );
            }
            break;

          case "packaging":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.col(
                "sales_invoice_tag_products.product_list.prod_packaging.packaging_name"
              ),
              { [Op.like]: `%${text}%` }
            );
            break;

          case "payment":
            whereClause.payment_terms = { [Op.like]: `%${text}%` };
            break;

          case "amount":
            const amountValue = parseFloat(text.replace(/,/g, ""));
            if (!isNaN(amountValue)) {
              whereClause[Op.and] = {
                [Op.or]: [
                  // Exact match with tolerance
                  {
                    "$sales_invoice_tag_products.subtotal$": {
                      [Op.between]: [
                        amountValue - 0.0001,
                        amountValue + 0.0001,
                      ],
                    },
                  },
                  // Partial number match
                  Sequelize.where(
                    Sequelize.literal(
                      `CAST(\`sales_invoice_tag_products\`.\`subtotal\` AS CHAR)`
                    ),
                    { [Op.like]: `%${text}%` }
                  ),
                  // Handle formatted numbers (with commas and decimals)
                  Sequelize.where(
                    Sequelize.fn(
                      "FORMAT",
                      Sequelize.col("sales_invoice_tag_products.subtotal"),
                      2
                    ),
                    { [Op.like]: `%${text}%` }
                  ),
                ],
              };
            } else {
              whereClause[Op.and] = Sequelize.where(
                Sequelize.literal(
                  `CAST(\`sales_invoice_tag_products\`.\`subtotal\` AS CHAR)`
                ),
                { [Op.like]: `%${text}%` }
              );
            }
            break;

          case "discount":
            // Remove % sign if present
            const discountText = text.replace(/%/g, "");
            const discountValue = parseFloat(discountText);
            if (!isNaN(discountValue)) {
              whereClause[Op.and] = {
                [Op.or]: [
                  // Exact match with tolerance
                  {
                    "$sales_invoice_tag_products.discount_item$": {
                      [Op.between]: [
                        discountValue - 0.0001,
                        discountValue + 0.0001,
                      ],
                    },
                  },
                  // Partial number match
                  Sequelize.where(
                    Sequelize.literal(
                      `CAST(\`sales_invoice_tag_products\`.\`discount_item\` AS CHAR)`
                    ),
                    { [Op.like]: `%${discountText}%` }
                  ),
                ],
              };
            } else {
              whereClause[Op.and] = Sequelize.where(
                Sequelize.literal(
                  `CAST(\`sales_invoice_tag_products\`.\`discount_item\` AS CHAR)`
                ),
                { [Op.like]: `%${discountText}%` }
              );
            }
            break;

          case "date":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.fn(
                "DATE_FORMAT",
                Sequelize.col("sales_invoice.createdAt"),
                "%M %d, %Y"
              ),
              { [Op.like]: `%${text}%` }
            );
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          { transaction_id: { [Op.like]: `%${text}%` } },
          Sequelize.where(
            Sequelize.col(
              "sales_invoice_tag_products.product_list.product_code"
            ),
            { [Op.like]: `%${text}%` }
          ),
          Sequelize.where(
            Sequelize.col(
              "sales_invoice_tag_products.product_list.product_name"
            ),
            { [Op.like]: `%${text}%` }
          ),
          Sequelize.where(
            Sequelize.col(
              "sales_invoice_tag_products.product_list.prod_packaging.packaging_name"
            ),
            { [Op.like]: `%${text}%` }
          ),
          { payment_terms: { [Op.like]: `%${text}%` } },
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("sales_invoice.createdAt"),
              "%M %d, %Y"
            ),
            { [Op.like]: `%${text}%` }
          ),
        ];

        // Try to parse as number for quantity/price fields
        const numericValue = parseFloat(text.replace(/,/g, ""));
        if (!isNaN(numericValue)) {
          whereClause[Op.or].push(
            ...["quantity", "unit_price", "subtotal", "discount_item"].map(
              (col) => {
                return {
                  [`$sales_invoice_tag_products.${col}$`]: {
                    [Op.or]: [
                      {
                        [Op.between]: [
                          numericValue - 0.0001,
                          numericValue + 0.0001,
                        ],
                      },
                      // String pattern match for partial input
                      Sequelize.where(
                        Sequelize.literal(
                          `CAST(\`sales_invoice_tag_products\`.\`${col}\` AS CHAR)`
                        ),
                        {
                          [Op.like]: `%${text}%`,
                        }
                      ),
                    ],
                  },
                };
              }
            )
          );
        }
      }
    }

    const { count, rows: invoices } = await SalesInvoice.findAndCountAll({
      where: whereClause,
      include: include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    // Format the response
    const formattedData = invoices.map((invoice) => ({
      id: invoice?.id,
      transaction_id: invoice?.transaction_id,
      createdAt: invoice?.createdAt,
      paymentTerms: invoice?.payment_terms,
      products: invoice?.sales_invoice_tag_products.map((product) => ({
        productId: product?.product_id,
        productCode: product?.product_list?.product_code,
        productName: product?.product_list?.product_name,
        quantity: product?.quantity,
        unitPrice: product?.unit_price,
        packaging: product?.product_list?.prod_packaging?.packaging_name,
        subtotal: product?.subtotal,
        discount: `${product?.discount_item}%`,
      })),
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getCustomerHistoryBySearch:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Add this to your customerHistory routes
router.route("/getFilteredCustomerHistory").get(async (req, res) => {
  try {
    const { customerId, filterStatus, fromDate, toDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const whereClause = { customer_id: customerId };

    if (filterStatus) {
      whereClause.payment_terms = filterStatus;
    }

    // Add date range filter if provided
    if (fromDate || toDate) {
      whereClause.createdAt = {};

      if (fromDate) {
        whereClause.createdAt[Op.gte] = new Date(fromDate);
      }

      if (toDate) {
        // Include the entire day for the toDate
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = endOfDay;
      }
    }

    const include = [
      {
        model: SalesInvoiceTagProduct,
        required: true,
        include: [
          {
            model: ProductList,
            required: true,
            include: [
              {
                model: Packaging,
                as: "prod_packaging",
                required: false,
              },
            ],
          },
        ],
      },
    ];

    const { count, rows: invoices } = await SalesInvoice.findAndCountAll({
      where: whereClause,
      include: include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    // Format the response
    const formattedData = invoices.map((invoice) => ({
      id: invoice.id,
      transaction_id: invoice.transaction_id,
      createdAt: invoice.createdAt,
      paymentTerms: invoice.payment_terms,
      products: invoice.sales_invoice_tag_products.map((product) => ({
        productId: product.product_id,
        productCode: product.product_list?.product_code || "",
        productName: product.product_list?.product_name || "",
        quantity: product.quantity,
        unitPrice: product.unit_price,
        packaging: product.product_list?.prod_packaging?.packaging_name || "",
        subtotal: product.subtotal,
        discount: product.discount_item ? `${product.discount_item}%` : "0%",
      })),
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
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
module.exports = router;
