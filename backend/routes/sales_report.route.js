const router = require("express").Router();
const { Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  SalesInvoice,
  SalesInvoiceInventory,
  Customer,
  ProductList,
  StockManagement,
  Cutoff,
  Currency,
} = require("../db/models/associations");
const SalesJournal = require("../db/models/sales_journal.model");

router.route("/getSalesReport").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const data = await SalesInvoiceInventory.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: SalesInvoice,
          include: [
            {
              model: Customer,
            },
          ],
        },
      ],
    });
    res.json({
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSalesInvoiceInventoryByProduct").get(async (req, res) => {
  try {
    const { cutoff_fromdate, cutoff_todate } = req.query;

    if (!cutoff_fromdate || !cutoff_todate) {
      return res.status(400).json({ message: "Date range is required." });
    }

    const previousCutoff = await Cutoff.findOne({
      where: {
        to: { [Op.lt]: cutoff_fromdate },
      },
      order: [["to", "DESC"]],
    });

    console.log(
      "************************************************************** previousCutoff: ",
      previousCutoff
    );

    const data = await SalesInvoiceInventory.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: SalesInvoice,
          where: {
            isDeleted: false,
            invoice_date: {
              [Op.between]: [cutoff_fromdate, cutoff_todate],
            },
            status: "Approved",
          },
        },
        {
          model: StockManagement,
          include: [
            {
              model: ProductList,
            },
          ],
        },
      ],
    });

    const previousSalesAmount = await SalesInvoiceInventory.findAll({
      include: [
        {
          model: SalesInvoice,
          where: {
            invoice_date: {
              [Op.between]: [previousCutoff?.from, previousCutoff?.to],
            },
            status: "Approved",
          },
        },
      ],
      where: {
        isDeleted: false,
      },
    });

    res.json({
      previousSalesAmount,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getCutoffs").get(async (req, res) => {
  const isFetch = await Cutoff.findAll({
    order: [["createdAt", "DESC"]],
    where: {
      isDeleted: false,
    },
  });
  res.status(200).json(isFetch);
});

// Endpoint for Sales Breakdown by Product (Table)
router.route("/products-tab").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validation for query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query param are required.",
      });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get product list total count associated with sales invoice
    const count = await ProductList.count({
      attributes: [],
      include: [
        {
          model: StockManagement,
          required: true,
          attributes: [],
          include: [
            {
              model: SalesInvoiceInventory,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  attributes: [],
                  where: {
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    status: {
                      [Op.in]: ["Approved", "Partially Collected", "Collected"],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
    });

    // Get product list ids
    const productIds = await ProductList.findAll({
      attributes: [
        [
          sequelize.fn("DISTINCT", sequelize.col("product_list.product_id")),
          "product_id",
        ],
      ],
      include: [
        {
          model: StockManagement,
          required: true,
          attributes: [],
          include: [
            {
              model: SalesInvoiceInventory,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  attributes: [],
                  where: {
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    status: {
                      [Op.in]: ["Approved", "Partially Collected", "Collected"],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
      subQuery: false,
      raw: true,
    });

    // prettier-ignore
    // Sum all discounts; convert fixed (non-percentage) discounts into percentage
    const { totalDiscount } = (() => {
      const salesInventory = "stock_managements.sales_invoice_tag_inventories"

      // Sales invoice inventory table columns
      const discountType = sequelize.col(`${salesInventory}.discount_type`);
      const quantity = sequelize.col(`${salesInventory}.quantity`);

      const totalDiscount = sequelize.literal(`
        SUM(
          CASE
            WHEN ${sequelize.escape(discountType)} != "percentage" 
            THEN (discount_item / (unit_price * ${sequelize.escape(quantity)})) * 100
            ELSE discount_item
          END
        )
      `);

      return { totalDiscount }
    })()

    // Main fetching to get the Sales Breakdown by Product
    const products = await ProductList.findAll({
      // prettier-ignore
      attributes: [
        "product_code",
        "product_name",
        [sequelize.literal(`SUM(net_weight)`), "netQuantitySold"],
        [sequelize.literal(`AVG(unit_price * currency_rate)`), "averageUnitPrice"],
        [sequelize.literal(`SUM(net_weight) * AVG(unit_price * currency_rate)`), "amount"],
        [totalDiscount, "discount"]
      ],
      include: [
        {
          model: StockManagement,
          required: true,
          attributes: [],
          include: [
            {
              model: SalesInvoiceInventory,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
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
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    status: {
                      [Op.in]: ["Approved", "Partially Collected", "Collected"],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      where: {
        product_id: {
          [Op.in]: productIds.map((item) => item.product_id),
        },
      },
      group: ["product_list.product_id"],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for Sales Breakdown by Product (Table) with Search
router.route("/products-tab-search").get(async (req, res) => {
  try {
    const { startDate, endDate, searchFunction, filterColumn } = req.query;

    // Validation for query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query param are required.",
      });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build search where clause
    let productListWhereClause = {};
    const productListColumnTable = [
      "product_code",
      "product_name",
      "product_category",
      "unit_of_measure",
    ];

    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        case "product_code":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "product_name":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "product_category":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "unit_of_measure":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        default:
          productListWhereClause = {
            [Op.or]: productListColumnTable.map((col) => {
              return {
                [col]: {
                  [Op.like]: `%${searchFunction}%`,
                },
              };
            }),
          };
          break;
      }
    }

    // Get product list total count with search filter
    const count = await ProductList.count({
      attributes: [],
      include: [
        {
          model: StockManagement,
          required: true,
          attributes: [],
          include: [
            {
              model: SalesInvoiceInventory,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  attributes: [],
                  where: {
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    status: {
                      [Op.in]: ["Approved", "Partially Collected", "Collected"],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      where: productListWhereClause,
      distinct: true,
    });

    // Get product list ids with search filter
    const productIds = await ProductList.findAll({
      attributes: [
        [
          sequelize.fn("DISTINCT", sequelize.col("product_list.product_id")),
          "product_id",
        ],
      ],
      include: [
        {
          model: StockManagement,
          required: true,
          attributes: [],
          include: [
            {
              model: SalesInvoiceInventory,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  attributes: [],
                  where: {
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    status: {
                      [Op.in]: ["Approved", "Partially Collected", "Collected"],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      where: productListWhereClause,
      limit,
      offset,
      subQuery: false,
      raw: true,
    });

    // prettier-ignore
    // Sum all discounts; convert fixed (non-percentage) discounts into percentage
    const { totalDiscount } = (() => {
      const salesInventory = "stock_managements.sales_invoice_tag_inventories"

      // Sales invoice inventory table columns
      const discountType = sequelize.col(`${salesInventory}.discount_type`);
      const quantity = sequelize.col(`${salesInventory}.quantity`);

      const totalDiscount = sequelize.literal(`
        SUM(
          CASE
            WHEN ${sequelize.escape(discountType)} != "percentage" 
            THEN (discount_item / (unit_price * ${sequelize.escape(quantity)})) * 100
            ELSE discount_item
          END
        )
      `);

      return { totalDiscount }
    })()

    // Main fetching to get the Sales Breakdown by Product with search
    const products = await ProductList.findAll({
      // prettier-ignore
      attributes: [
        "product_code",
        "product_name",
        [sequelize.literal(`SUM(net_weight)`), "netQuantitySold"],
        [sequelize.literal(`AVG(unit_price * currency_rate)`), "averageUnitPrice"],
        [sequelize.literal(`SUM(net_weight) * AVG(unit_price * currency_rate)`), "amount"],
        [totalDiscount, "discount"]
      ],
      include: [
        {
          model: StockManagement,
          required: true,
          attributes: [],
          include: [
            {
              model: SalesInvoiceInventory,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
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
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    status: {
                      [Op.in]: ["Approved", "Partially Collected", "Collected"],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      where: {
        [Op.and]: [
          {
            product_id: {
              [Op.in]: productIds.map((item) => item.product_id),
            },
          },
          productListWhereClause,
        ],
      },
      group: ["product_list.product_id"],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for Sales Breakdown by Clients (Table)
router.route("/clients-tab").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validation for query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query param are required.",
      });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get the customer name
    const customerName = sequelize.literal(`(
      CASE 
        WHEN company_name IS NULL OR company_name = "" THEN CONCAT(first_name, ' ', last_name)
        ELSE company_name
      END
    )`);

    // Date condition for accounts paid
    const accountsReceivedDateCondition = `date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Sum by payment type (Debit/Credit) and date
    const sumPaymentTypeAmount = (payment_type, dateCondition) =>
      `SUM(
         CASE WHEN payment_type=${sequelize.escape(payment_type)} 
           AND ${dateCondition} THEN total_amount * sales_journals.currency_rate
           ELSE 0 
         END)
       `;

    // Get the net balance by Debit - Credit
    const netBalance = (date) => {
      const dateCondition = `date <= ${sequelize.escape(date)}`;
      return sequelize.literal(
        `${sumPaymentTypeAmount("Debit", dateCondition)} 
           - 
           ${sumPaymentTypeAmount("Credit", dateCondition)}`
      );
    };

    // prettier-ignore
    // Helper: Apply a SQL aggregate (SUM/AVG) conditionally using CASE over a date range
    const aggregateBetweenDates = ({ fn, column, startDate, endDate }) => {
       const elseValue = fn === "AVG" ? "NULL" : "0"
       return sequelize.literal(`
        ${fn}(
         CASE
           WHEN date BETWEEN ${sequelize.escape(startDate)} 
           AND ${sequelize.escape(endDate)}
           AND payment_type = 'Debit'
           THEN ${column}
           ELSE ${elseValue}
         END
        )`)
     }

    // Get the customers total count
    const count = await Customer.count({
      distinct: true,
      col: "customer_id",
    });

    // Get the customer ids
    const customerIds = await Customer.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("customer_id")), "customer_id"],
      ],
      raw: true,
      limit,
      offset,
    });

    // Main fetching to get the sales breakdown by clients/customer
    const customers = await Customer.findAll({
      // prettier-ignore
      attributes: [
        [sequelize.literal(`customer.customer_id`), "customerId"],
        [customerName, "customerName"],
        [netBalance(startDate), 'lastAccountBalance'],
        [netBalance(endDate), 'accountsReceivable'],             
        [sequelize.literal(sumPaymentTypeAmount("Credit", accountsReceivedDateCondition)),"accountsReceived"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_quantity", startDate, endDate}), "netQuantitySold"],
        [aggregateBetweenDates({ fn: "AVG", column: "avg_unit_price * sales_journals.currency_rate", startDate, endDate}), "averageUnitPrice"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_amount * sales_journals.currency_rate", startDate, endDate}), "newSalesAmount"],
      ],
      include: [
        {
          model: SalesJournal,
          required: false,
          attributes: [],
          where: {
            isDeleted: false,
          },
        },
      ],
      group: ["customer.customer_id"],
      where: {
        customer_id: {
          [Op.in]: customerIds.map((item) => item.customer_id),
        },
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: customers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for Sales Breakdown by Clients (Table) with Search
router.route("/clients-tab-search").get(async (req, res) => {
  try {
    const { startDate, endDate, searchFunction, filterColumn } = req.query;

    // Validation for query params
    if (!startDate || !endDate)
      return res.status(400).json({
        error: "startDate and endDate query param are required.",
      });

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get the customer name
    const customerName = sequelize.literal(`(
      CASE 
        WHEN company_name IS NULL OR company_name = "" THEN CONCAT(first_name, ' ', last_name)
        ELSE company_name
      END
    )`);

    // Build search where clause
    let customerWhereClause = {};
    const customerColumnTable = [
      "first_name",
      "last_name",
      "company_address",
      "country",
      "company_name",
      "company_nature",
    ];

    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        case "client_name":
          // Special handling for client name (combination of first_name + last_name OR company_name)
          customerWhereClause = {
            [Op.or]: [
              {
                [Op.and]: [
                  {
                    first_name: {
                      [Op.like]: `%${searchFunction}%`,
                    },
                  },
                  {
                    [Op.or]: [
                      { company_name: { [Op.is]: null } },
                      { company_name: "" },
                    ],
                  },
                ],
              },
              {
                [Op.and]: [
                  {
                    last_name: {
                      [Op.like]: `%${searchFunction}%`,
                    },
                  },
                  {
                    [Op.or]: [
                      { company_name: { [Op.is]: null } },
                      { company_name: "" },
                    ],
                  },
                ],
              },
              {
                company_name: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
            ],
          };
          break;
        case "company_address":
          customerWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "country":
          customerWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "company_name":
          customerWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "company_nature":
          customerWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        default:
          // Search across all fields
          customerWhereClause = {
            [Op.or]: [
              {
                first_name: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
              {
                last_name: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
              {
                company_address: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
              {
                country: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
              {
                company_name: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
              {
                company_nature: {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
            ],
          };
          break;
      }
    }

    // Date condition for accounts paid
    const accountsReceivedDateCondition = `date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Sum by payment type (Debit/Credit) and date
    const sumPaymentTypeAmount = (payment_type, dateCondition) =>
      `SUM(
         CASE WHEN payment_type=${sequelize.escape(payment_type)} 
           AND ${dateCondition} THEN total_amount * sales_journals.currency_rate
           ELSE 0 
         END)
       `;

    // Get the net balance by Debit - Credit
    const netBalance = (date) => {
      const dateCondition = `date <= ${sequelize.escape(date)}`;
      return sequelize.literal(
        `${sumPaymentTypeAmount("Debit", dateCondition)} 
           - 
           ${sumPaymentTypeAmount("Credit", dateCondition)}`
      );
    };

    // prettier-ignore
    // Helper: Apply a SQL aggregate (SUM/AVG) conditionally using CASE over a date range
    const aggregateBetweenDates = ({ fn, column, startDate, endDate }) => {
       const elseValue = fn === "AVG" ? "NULL" : "0"
       return sequelize.literal(`
        ${fn}(
         CASE
           WHEN date BETWEEN ${sequelize.escape(startDate)} 
           AND ${sequelize.escape(endDate)}
           AND payment_type = 'Debit'
           THEN ${column}
           ELSE ${elseValue}
         END
        )`)
     }

    // Get the customers total count with search filter
    const count = await Customer.count({
      distinct: true,
      col: "customer_id",
      where: customerWhereClause,
    });

    // Get the customer ids with search filter
    const customerIds = await Customer.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("customer_id")), "customer_id"],
      ],
      where: customerWhereClause,
      raw: true,
      limit,
      offset,
    });

    // Main fetching to get the sales breakdown by clients/customer with search
    const customers = await Customer.findAll({
      // prettier-ignore
      attributes: [
        [sequelize.literal(`customer.customer_id`), "customerId"],
        [customerName, "customerName"],
        [netBalance(startDate), 'lastAccountBalance'],
        [netBalance(endDate), 'accountsReceivable'],             
        [sequelize.literal(sumPaymentTypeAmount("Credit", accountsReceivedDateCondition)),"accountsReceived"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_quantity", startDate, endDate}), "netQuantitySold"],
        [aggregateBetweenDates({ fn: "AVG", column: "avg_unit_price * sales_journals.currency_rate", startDate, endDate}), "averageUnitPrice"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_amount * sales_journals.currency_rate", startDate, endDate}), "newSalesAmount"],
      ],
      include: [
        {
          model: SalesJournal,
          required: false,
          attributes: [],
          where: {
            isDeleted: false,
          },
        },
      ],
      group: ["customer.customer_id"],
      where: {
        [Op.and]: [
          {
            customer_id: {
              [Op.in]: customerIds.map((item) => item.customer_id),
            },
          },
          customerWhereClause,
        ],
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: customers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for Sales report overview summary
router.route("/overview").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Where clause for sales invoice
    const salesWhereClause = {
      invoice_date: {
        [Op.between]: [startDate, endDate],
      },
      isDeleted: false,
    };

    // Helper: Fallback to 0 if the number is undefined or null
    const normalize = (num) => num ?? 0;

    // Helper: An SQL condition that sums the amount by payment type and given date
    const sumPaymentTypeAmount = (payment_type, dateCondition) => `
      SUM(
        CASE
          WHEN payment_type = '${payment_type}' AND ${dateCondition} THEN total_amount * currency_rate
          ELSE 0
        END
      )
    `;

    // Date condition for accounts received
    const accountsReceivedDateCondition = `date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Find the prevous cutoff for previous period sales
    const prevCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        to: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["to", "DESC"]],
    });

    // Fetchings for overview summary
    const [
      totalSales,
      numberOfTransactions,
      lastAccountsReceivable,
      accountsReceived,
      accountsReceivable,
      prevPeriodSales,
    ] = await Promise.all([
      // For total sales
      SalesInvoice.findOne({
        attributes: [
          [sequelize.literal(`SUM(total_amount * currency_rate)`), "total"],
        ],
        include: [
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
        where: salesWhereClause,
        raw: true,
      }),
      // For number of transactions
      SalesInvoice.count({
        where: salesWhereClause,
      }),
      // For last accounts receivable
      SalesInvoice.findOne({
        attributes: [
          [sequelize.literal(`total_amount * currency_rate`), "total"],
        ],
        include: [
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
        where: salesWhereClause,
        order: [["createdAt", "DESC"]],
        raw: true,
      }),
      // For accounts received
      SalesJournal.findOne({
        attributes: [
          [
            sequelize.literal(
              sumPaymentTypeAmount("Credit", accountsReceivedDateCondition)
            ),
            "total",
          ],
        ],
        where: {
          isDeleted: false,
        },
        raw: true,
      }),
      // For accounts receivable
      SalesJournal.findOne({
        attributes: [
          [
            sequelize.literal(`
              ${sumPaymentTypeAmount("Debit", `date < '${endDate}'`)} -
              ${sumPaymentTypeAmount("Credit", `date < '${endDate}'`)}`),
            "total",
          ],
        ],
        where: {
          isDeleted: false,
        },
        raw: true,
      }),
      // For previous period sales
      SalesInvoice.findOne({
        attributes: [
          [sequelize.literal(`SUM(total_amount * currency_rate)`), "total"],
        ],
        include: [
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
        where: {
          invoice_date: {
            [Op.between]: [prevCutoff?.from, prevCutoff?.to],
          },
          isDeleted: false,
        },
        raw: true,
      }),
    ]);

    const totalSalesAmount = normalize(totalSales?.total);

    // Get the average sales amount
    const averageSalesValue = () => {
      if (!numberOfTransactions) return 0; // Prevents dividing by 0

      return totalSalesAmount / numberOfTransactions;
    };

    // Get the sales growth index
    const salesGrowthIndex = () => {
      const prevPeriodSalesAmount = normalize(prevPeriodSales?.total);

      if (!prevPeriodSalesAmount) return 0; // Prevents dividing by 0

      return (
        ((totalSalesAmount - prevPeriodSalesAmount) / prevPeriodSalesAmount) *
        100
      );
    };

    // Get the accounts receivable turnover ratio
    const arTurnOverRatio = () => {
      const lastAr = normalize(lastAccountsReceivable?.total);
      const paid = normalize(accountsReceived?.total);

      const totalReceivablesAvailable = totalSalesAmount + lastAr;

      if (totalReceivablesAvailable === 0) return 0; // Prevents dividing by 0

      return (paid / totalReceivablesAvailable) * 100;
    };

    res.status(200).json({
      totalSales: normalize(totalSales?.total),
      numberOfTransactions: normalize(numberOfTransactions),
      averageSalesValue: normalize(averageSalesValue()),
      lastAccountsReceivable: normalize(lastAccountsReceivable?.total),
      accountsReceived: normalize(accountsReceived?.total),
      accountsReceivable: normalize(accountsReceivable?.total),
      prevPeriodSales: normalize(prevPeriodSales?.total),
      salesGrowthIndex: normalize(salesGrowthIndex()), // percentage
      arTurnOverRatio: normalize(arTurnOverRatio()), // percentage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
