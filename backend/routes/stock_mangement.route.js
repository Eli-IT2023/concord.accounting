const express = require("express");
const router = express.Router();
const { Op, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  StockManagement,
  Warehouse,
  ProductList,
  Vendors,
  Cutoff,
} = require("../db/models/associations");
const {
  dateFormatFilter,
  castFilter,
  likeFilter,
  createdAtFilter,
} = require("../utils/filters/sequelizeSearchFilter.js");
const { inventoryReport, stockManagement } = require("../services");
const irService = inventoryReport.inventoryReportService;
const irHelper = inventoryReport.inventoryReportHelper;

const smService = stockManagement.stockManagementService;
const smHelper = stockManagement.stockManagementHelper;

router.route("/getStockManagement").get(async (req, res) => {
  try {
    const { id, category, filterColumn } = req.query;
    let { searchText } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!category) {
      return res.status(404).json({ message: "Product Category not found" });
    }

    if (searchText && searchText.trim() !== "") {
      const numericText = searchText.replace(/,/g, "");
      if (!isNaN(numericText)) {
        searchText = numericText;
      }
    }

    let stockManagementWhereClause = {};
    let stockManagementHavingWhereClause = {};
    let productListWhereClause = {
      product_category: category,
    };
    let warehouseWhereClause = { status: 1, isDeleted: false };
    const productListTableColumn = [
      "product_code",
      "product_name",
      "unit_of_measure",
      "threshold",
    ];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Handle Filter for warehouse name
        case "warehouse_name":
          warehouseWhereClause = {
            name: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Handle Filter for product code
        case "product_code":
          productListWhereClause["product_code"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Handle Filter for product name
        case "product_name":
          productListWhereClause["product_name"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Handle Filter for unit of measure
        case "unit_of_measure":
          productListWhereClause["unit_of_measure"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Handle Filter for threshold
        case "threshold":
          productListWhereClause["threshold"] = {
            [Op.like]: `%${searchText}%`,
          };
          break;
        // Handle Filter for Stock Quantity
        case "stock":
          stockManagementHavingWhereClause = sequelize.where(
            sequelize.cast(sequelize.fn("SUM", sequelize.col("stock")), "CHAR"),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;
        // Handle Filter for Average price
        case "average_price":
          stockManagementHavingWhereClause = sequelize.where(
            sequelize.cast(sequelize.fn("AVG", sequelize.col("price")), "CHAR"),
            {
              [Op.like]: `%${searchText}%`,
            }
          );
          break;

        // Handle Filter for Total Price
        case "total_price":
          stockManagementHavingWhereClause = sequelize.where(
            sequelize.cast(
              sequelize.literal("SUM(stock) * AVG(price)"),
              "CHAR"
            ),
            { [Op.like]: `%${searchText}%` }
          );
          break;

        default:
          productListWhereClause = {
            [Op.and]: [
              {
                product_category: category,
              },
              {
                [Op.or]: productListTableColumn.map((col) => {
                  return {
                    [col]: {
                      [Op.like]: `%${searchText}%`,
                    },
                  };
                }),
              },
            ],
          };
          break;
      }
    }

    if (id) {
      stockManagementWhereClause["warehouse_id"] = id;
    }

    const widgets = await StockManagement.findAll({
      attributes: [
        "product_id",
        "warehouse_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
        [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
        [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
      ],
      group: ["product_id", "warehouse_id"],
      include: [
        {
          model: Warehouse,
          where: warehouseWhereClause,
        },
        {
          model: ProductList,
          where: productListWhereClause,
        },
      ],
      where: {
        isDeleted: false,
      },
    });

    async function fetchData(
      warehouseWhereClause,
      productListWhereClause,
      stockManagementWhereClause,
      stockManagementHavingWhereClause,
      limit,
      offset
    ) {
      try {
        const result = await StockManagement.findAndCountAll({
          attributes: [
            "product_id",
            "warehouse_id",
            [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
            [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
            [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
            [sequelize.literal("SUM(stock) * AVG(price)"), "totalPrice"],
          ],
          group: ["product_id", "warehouse_id"],
          include: [
            {
              model: Warehouse,
              where: warehouseWhereClause,
            },
            {
              model: ProductList,
              where: productListWhereClause,
            },
          ],
          where: { ...stockManagementWhereClause, isDeleted: false },
          having: stockManagementHavingWhereClause,
          subQuery: false,
          limit: limit,
          offset: offset,
          distinct: true,
        });

        return {
          count: Array.isArray(result.count)
            ? result.count.length
            : result.count,
          data: result.rows,
        };
      } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
      }
    }

    let { count, data } = await fetchData(
      warehouseWhereClause,
      productListWhereClause,
      stockManagementWhereClause,
      stockManagementHavingWhereClause,
      limit,
      offset
    );

    // if data is empty and filter is all, search for warehouse name, stock quantity and average price
    if (data.length === 0 && filterColumn === "all") {
      const warehouseAndStock = [
        "warehouse_name",
        "stock",
        "total_price",
        "average_price",
      ];
      if (searchText && searchText.trim() !== "") {
        for (const item of warehouseAndStock) {
          stockManagementWhereClause = {};
          stockManagementHavingWhereClause = {};
          productListWhereClause = {
            product_category: category,
          };
          warehouseWhereClause = {};

          if (id) {
            stockManagementWhereClause["warehouse_id"] = id;
          }

          switch (item) {
            case "warehouse_name":
              warehouseWhereClause = {
                name: {
                  [Op.like]: `%${searchText}%`,
                },
              };
              break;
            case "stock":
              stockManagementHavingWhereClause = sequelize.where(
                sequelize.cast(
                  sequelize.fn("SUM", sequelize.col("stock")),
                  "CHAR"
                ),
                {
                  [Op.like]: `%${searchText}%`,
                }
              );
              break;

            case "total_price":
              stockManagementHavingWhereClause = sequelize.where(
                sequelize.cast(
                  sequelize.literal("SUM(stock) * AVG(price)"),
                  "CHAR"
                ),
                { [Op.like]: `%${searchText}%` }
              );
              break;

            case "average_price":
              stockManagementHavingWhereClause = sequelize.where(
                sequelize.cast(
                  sequelize.fn("AVG", sequelize.col("price")),
                  "CHAR"
                ),
                {
                  [Op.like]: `%${searchText}%`,
                }
              );
              break;
          }

          let { count, data } = await fetchData(
            warehouseWhereClause,
            productListWhereClause,
            stockManagementWhereClause,
            stockManagementHavingWhereClause,
            limit,
            offset
          );

          if (data.length > 0) {
            return res.status(200).json({
              totalItems: count,
              totalPages: Math.ceil(count / limit),
              currentPage: parseInt(page || 1),
              data: { data: data || [], widgets },
            });
          }
        }
      }
    }

    if (data) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: { data: data || [], widgets },
      });
    } else {
      res.status(400).send("No data found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getStockManagementFetchModule").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { category } = req.query;
    // console.log(category);

    if (!category) {
      return res.status(404).json({ message: "Product Category not found" });
    }

    // Count groups with category filter
    const [countResult] = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT sm.product_id, sm.warehouse_id
        FROM stock_managements sm
        INNER JOIN product_lists pl
          ON sm.product_id = pl.product_id
        INNER JOIN warehouses w
          ON sm.warehouse_id = w.warehouse_id
        WHERE sm.isDeleted = 0
          AND pl.product_category = :category
        GROUP BY sm.product_id, sm.warehouse_id
      ) AS grouped
    `,
      {
        replacements: { category },
      }
    );

    const totalGroups = countResult[0].total;

    // 2. Fetch paginated grouped data
    const data = await StockManagement.findAll({
      attributes: [
        "product_id",
        "warehouse_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
        [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
        [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
        [sequelize.literal("SUM(stock) * AVG(price)"), "totalPrice"],
      ],
      group: ["product_id", "warehouse_id"],
      include: [
        {
          model: ProductList,
          required: true,
          where: { product_category: category },
        },
        {
          model: Warehouse,
          required: true,
        },
      ],
      where: { isDeleted: false },
      order: [[literal("total_stock"), "DESC"]],
      limit,
      offset,
    });

    // console.log(data);

    return res.json({
      totalItems: totalGroups,
      totalPages: Math.ceil(totalGroups / limit),
      currentPage: page,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// router.route("/getStockManagementFetchModule-search").get(async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const { category, warehouseId, filterColumn, searchText } = req.query;

//     // console.log(req.query);

//     if (!category) {
//       return res.status(404).json({ message: "Product Category not found" });
//     }

//     // Build dynamic WHERE clause for findAll
//     let whereClause = {
//       isDeleted: false,
//     };

//     if (warehouseId) {
//       whereClause.warehouse_id = warehouseId;
//     }

//     if (filterColumn && filterColumn !== "all" && searchText) {
//       whereClause[`$product_list.${filterColumn}$`] = {
//         [Op.like]: `%${searchText}%`,
//       };
//     } else {
//       whereClause = {
//         ...whereClause, // preserve startDate, endDate, and status_tab
//         [Op.or]: [
//           {
//             "$product_list.product_code$": {
//               [Op.like]: `%${searchText}%`,
//             },
//           },
//           { "$product_list.product_name$": { [Op.like]: `%${searchText}%` } },
//           {
//             "$product_list.unit_of_measure$": { [Op.like]: `%${searchText}%` },
//           },
//           castFilter(searchText, "total_stock", "total_stock"),
//           castFilter(searchText, "average_price", "average_price"),
//           castFilter(searchText, "total_price", "total_price"),
//         ],
//       };
//     }

//     // Build dynamic SQL for COUNT query
//     let searchCondition = "";
//     if (filterColumn && filterColumn !== "all" && searchText) {
//       searchCondition = ` AND pl.${filterColumn} LIKE :searchText `;
//     } else if (searchText) {
//       searchCondition = `
//         AND (
//           pl.product_code LIKE :searchText
//           OR pl.product_name LIKE :searchText
//           OR pl.unit_of_measure LIKE :searchText
//         )
//       `;
//     }

//     let warehouseCondition = "";
//     if (warehouseId) {
//       warehouseCondition = ` AND sm.warehouse_id = :warehouseId `;
//     }

//     // 1️⃣ Count total groups matching filters
//     const [countResult] = await sequelize.query(
//       `
//       SELECT COUNT(*) AS total
//       FROM (
//         SELECT sm.product_id, sm.warehouse_id
//         FROM stock_managements sm
//         INNER JOIN product_lists pl
//           ON sm.product_id = pl.product_id
//         INNER JOIN warehouses w
//           ON sm.warehouse_id = w.warehouse_id
//         WHERE sm.isDeleted = 0
//           AND pl.product_category = :category
//           ${warehouseCondition}
//           ${searchCondition}
//         GROUP BY sm.product_id, sm.warehouse_id
//       ) AS grouped
//       `,
//       {
//         replacements: {
//           category,
//           warehouseId,
//           searchText: `%${searchText}%`,
//         },
//       }
//     );

//     const totalGroups = countResult[0].total;

//     // 2️⃣ Fetch paginated grouped data
//     const data = await StockManagement.findAll({
//       where: whereClause,
//       attributes: [
//         "product_id",
//         "warehouse_id",
//         [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
//         [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
//         [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
//         [sequelize.literal("SUM(stock) * AVG(price)"), "totalPrice"],
//       ],
//       group: ["product_id", "warehouse_id"],
//       include: [
//         {
//           model: ProductList,
//           required: true,
//           where: { product_category: category },
//         },
//         {
//           model: Warehouse,
//           required: true,
//         },
//       ],
//       order: [[sequelize.literal("total_stock"), "DESC"]],
//       limit,
//       offset,
//     });

//     return res.json({
//       totalItems: totalGroups,
//       totalPages: Math.ceil(totalGroups / limit),
//       currentPage: page,
//       data: data,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/getStockManagementFetchModule-search").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { category, warehouseId, filterColumn, searchText } = req.query;

    if (!category) {
      return res.status(404).json({ message: "Product Category not found" });
    }

    // Build dynamic search condition
    let searchCondition = "";
    if (filterColumn && filterColumn !== "all" && searchText) {
      // Specific column search
      if (
        ["total_stock", "average_price", "total_price"].includes(filterColumn)
      ) {
        // For aggregated columns, we'll use HAVING clause
        searchCondition = `HAVING ${filterColumn} LIKE :searchText`;
      } else {
        // For non-aggregated columns
        searchCondition = `AND pl.${filterColumn} LIKE :searchText`;
      }
    } else if (searchText) {
      // Search across all columns including aggregated ones
      searchCondition = `
        AND (
          pl.product_code LIKE :searchText
          OR pl.product_name LIKE :searchText
          OR pl.unit_of_measure LIKE :searchText
        )
      `;
    }

    // Build warehouse condition
    let warehouseCondition = "";
    if (warehouseId) {
      warehouseCondition = `AND sm.warehouse_id = :warehouseId`;
    }

    // 1️⃣ Count total groups matching filters
    const [countResult] = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT 
          sm.product_id, 
          sm.warehouse_id,
          SUM(sm.stock) AS total_stock,
          SUM(sm.price) AS total_price,
          AVG(sm.price) AS average_price
        FROM stock_managements sm
        INNER JOIN product_lists pl
          ON sm.product_id = pl.product_id
        INNER JOIN warehouses w
          ON sm.warehouse_id = w.warehouse_id
        WHERE sm.isDeleted = 0
          AND pl.product_category = :category
          ${warehouseCondition}
          ${
            filterColumn &&
            filterColumn !== "all" &&
            searchText &&
            !["total_stock", "average_price", "total_price"].includes(
              filterColumn
            )
              ? `AND pl.${filterColumn} LIKE :searchText`
              : searchText && !filterColumn
              ? `AND (pl.product_code LIKE :searchText OR pl.product_name LIKE :searchText OR pl.unit_of_measure LIKE :searchText)`
              : ""
          }
        GROUP BY sm.product_id, sm.warehouse_id
        ${
          filterColumn &&
          ["total_stock", "average_price", "total_price"].includes(
            filterColumn
          ) &&
          searchText
            ? `HAVING ${filterColumn} LIKE :searchText`
            : ""
        }
      ) AS grouped
      `,
      {
        replacements: {
          category,
          warehouseId,
          searchText: `%${searchText}%`,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const totalGroups = countResult.total;

    // 2️⃣ Fetch paginated grouped data using raw SQL
    const data = await sequelize.query(
      `
      SELECT 
        sm.product_id,
        sm.warehouse_id,
        SUM(sm.stock) AS total_stock,
        SUM(sm.price) AS total_price,
        AVG(sm.price) AS average_price,
        SUM(sm.stock) * AVG(sm.price) AS totalPrice,
        pl.product_code,
        pl.product_name,
        pl.unit_of_measure,
        pl.product_category,
        pl.threshold,
        w.name
      FROM stock_managements sm
      INNER JOIN product_lists pl 
        ON sm.product_id = pl.product_id
      INNER JOIN warehouses w 
        ON sm.warehouse_id = w.warehouse_id
      WHERE sm.isDeleted = 0
        AND pl.product_category = :category
        ${warehouseCondition}
        ${
          filterColumn &&
          filterColumn !== "all" &&
          searchText &&
          !["total_stock", "average_price", "total_price"].includes(
            filterColumn
          )
            ? `AND pl.${filterColumn} LIKE :searchText`
            : searchText && !filterColumn
            ? `AND (pl.product_code LIKE :searchText OR pl.product_name LIKE :searchText OR pl.unit_of_measure LIKE :searchText)`
            : ""
        }
      GROUP BY sm.product_id, sm.warehouse_id
      ${
        filterColumn &&
        ["total_stock", "average_price", "total_price"].includes(
          filterColumn
        ) &&
        searchText
          ? `HAVING ${filterColumn} LIKE :searchText`
          : ""
      }
      ORDER BY total_stock DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          category,
          warehouseId,
          searchText: `%${searchText}%`,
          limit,
          offset,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const Mapped_data = data.map((row) => ({
      stock_management_id: row.stock_management_id,
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      total_stock: row.total_stock,
      total_price: row.total_price,
      average_price: row.average_price,
      totalPrice: row.totalPrice,
      product_list: {
        product_code: row.product_code,
        product_name: row.product_name,
        unit_of_measure: row.unit_of_measure,
        product_category: row.product_category,
        threshold: row.threshold,
      },
      warehouse: {
        name: row.name,
      },
    }));

    console.log(Mapped_data);

    return res.json({
      totalItems: totalGroups,
      totalPages: Math.ceil(totalGroups / limit),
      currentPage: page,
      data: Mapped_data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error", error: err.message });
  }
});

router
  .route("/getStockManagementFetchModule-warehouseFilter")
  .get(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { category, warehouseId } = req.query;
      // console.log(category);

      if (!category) {
        return res.status(404).json({ message: "Product Category not found" });
      }

      // Count groups with category filter
      const [countResult] = await sequelize.query(
        `
      SELECT COUNT(*) AS total
      FROM (
        SELECT sm.product_id, sm.warehouse_id
        FROM stock_managements sm
        INNER JOIN product_lists pl
          ON sm.product_id = pl.product_id
        INNER JOIN warehouses w
          ON sm.warehouse_id = w.warehouse_id
        WHERE sm.isDeleted = 0
          AND pl.product_category = :category
          AND sm.warehouse.id = :warehouseId
        GROUP BY sm.product_id, sm.warehouse_id
      ) AS grouped
    `,
        {
          replacements: { category, warehouseId },
        }
      );

      const totalGroups = countResult[0].total;

      // 2. Fetch paginated grouped data
      const data = await StockManagement.findAll({
        attributes: [
          "product_id",
          "warehouse_id",
          [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
          [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
          [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
          [sequelize.literal("SUM(stock) * AVG(price)"), "totalPrice"],
        ],
        group: ["product_id", "warehouse_id"],
        include: [
          {
            model: ProductList,
            required: true,
            where: { product_category: category },
          },
          {
            model: Warehouse,
            required: true,
          },
        ],
        where: { isDeleted: false, warehouse_id: warehouseId },
        order: [[literal("total_stock"), "DESC"]],
        limit,
        offset,
      });

      // console.log(data);

      return res.json({
        totalItems: totalGroups,
        totalPages: Math.ceil(totalGroups / limit),
        currentPage: page,
        data,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json("Error");
    }
  });

router.route("/getStockManagementWidgets").get(async (req, res) => {
  const { category } = req.query;
  let productListWhereClause = {
    product_category: category,
  };
  // let warehouseWhereClause = {};
  const widgets = await StockManagement.findAll({
    attributes: [
      "product_id",
      "warehouse_id",
      [sequelize.fn("SUM", sequelize.col("stock")), "total_stock"],
      [sequelize.fn("SUM", sequelize.col("price")), "total_price"],
      [sequelize.fn("AVG", sequelize.col("price")), "average_price"],
    ],
    group: ["product_id", "warehouse_id"],
    include: [
      {
        model: Warehouse,
        // where: warehouseWhereClause,
      },
      {
        model: ProductList,
        where: productListWhereClause,
      },
    ],
    where: {
      isDeleted: false,
    },
  });

  // for (const data of widgets) {
  //   // const element = array[index];
  //   console.log("Widgets Data:", data.total_stock);
  // }

  //
  res.status(200).json(widgets);
});

router.route("/viewStockDetails").get(async (req, res) => {
  const { productId, warehouseId } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  if (!productId || !warehouseId) {
    return res.status(400).json({ error: "Missing productId or warehouseId" });
  }

  try {
    const { count, rows: stockManagement } =
      await StockManagement.findAndCountAll({
        order: [["createdAt", "DESC"]],
        where: {
          product_id: productId,
          warehouse_id: warehouseId,
          isDeleted: false,
        },
        include: [
          {
            model: ProductList,
          },
          {
            model: Warehouse,
          },
        ],
      });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: stockManagement,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/viewStockDetailsTable").get(async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!productId || !warehouseId) {
      return res
        .status(400)
        .json({ error: "Missing productId or warehouseId" });
    }

    const { count, rows: stockManagement } =
      await StockManagement.findAndCountAll({
        order: [["createdAt", "DESC"]],
        // limit: limit,
        // offset: offset,
        // distinct: true,
        // subQuery: false,
        where: {
          product_id: productId,
          warehouse_id: warehouseId,
          isDeleted: false,
        },
        include: [
          {
            model: ProductList,
          },
          {
            model: Warehouse,
          },
        ],
      });

    const stockDetails = await StockManagement.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [
          sequelize.literal("SUM(stock) * AVG(price) / SUM(stock)"),
          "totalPrice",
        ],
      ],
      where: {
        stock_management_id: stockManagement.map(
          (item) => item.stock_management_id
        ),
      },
      include: [
        {
          model: ProductList,
          attributes: ["product_code", "product_name"],
        },
        {
          model: Warehouse,
          attributes: ["name"],
        },
      ],
      group: [
        "stock_management.warehouse_id",
        "product_list.product_code",
        "warehouse.name",
      ],
    });

    res.json({
      totalItems: stockDetails.length,
      totalPages: Math.ceil(stockDetails.length / limit),
      currentPage: parseInt(page || 1),
      data: stockDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint to get the stock management widgets based on given product category
router.route("/widgets").get(async (req, res) => {
  try {
    const { productCategory } = req.query;

    // Get the latest cutoff
    const latestCutoff = await Cutoff.findOne({
      attributes: ["from", "to"],
      where: {
        isDeleted: false,
      },
      order: [["to", "DESC"]],
      limit: 1,
    });

    const startDate = latestCutoff?.from;
    const endDate = latestCutoff?.to;

    const { total } = await irService.getInventorySummaryAndTotal(
      startDate,
      endDate,
      productCategory
    );

    res.status(200).json({
      totalQuantity: total.finalInventoryQuantity,
      overallPrice: total.finalInventoryAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to get the product category summary for table
router.route("/products/category-summary").get(async (req, res) => {
  try {
    const { productCategory, warehouseId } = req.query;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Main query
    const { count, products } = await smService.getProductsSummary({
      productCategory,
      warehouseId,
      limit,
      offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for products table search filter
router.route("/products/category-summary/search").get(async (req, res) => {
  try {
    const { productCategory, warehouseId, filterColumn, searchText } =
      req.query;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Condition for filter
    const shouldApplyFilter = (col) =>
      filterColumn === "all" || col === filterColumn;

    // Searchable columns mapped to their corresponding filter logic
    const searchFilters = {
      product_code: smHelper.likeFilter,
      product_name: smHelper.likeFilter,
      unit_of_measure: smHelper.likeFilter,
      stock_quantity: smHelper.castFilter,
      average_price: smHelper.castFilter,
      total_price: smHelper.castFilter,
    };

    // Build dynamic search conditions based on enabled columns and join them with OR
    const buildFilters = Object.entries(searchFilters).reduce(
      (acc, [col, fn]) => {
        if (shouldApplyFilter(col)) {
          acc.push(fn(col, searchText));
        }
        return acc;
      },
      []
    );

    const likeSearch = buildFilters.join(" OR ");

    // Main query
    const { count, products } = await smService.getProductsSummary({
      productCategory,
      warehouseId,
      limit,
      offset,
      likeSearch,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// prettier-ignore
// Endpoint for viewing a product
router.route("/products/:productId/warehouses/:warehouseId").get(async (req, res) => {
  try {
    const { productId, warehouseId } = req.params;

    // For pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Main query
    const { count, products } = await smService.getProductsSummary({
      productCategory: null,
      warehouseId,
      productId,
      limit,
      offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
