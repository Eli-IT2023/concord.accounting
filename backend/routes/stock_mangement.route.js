const express = require("express");
const router = express.Router();
const { Op, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  StockManagement,
  Warehouse,
  ProductList,
  Vendors,
  Packaging,
} = require("../db/models/associations");

router.route("/getStockManagement").get(async (req, res) => {
  try {
    const { id, category, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let stockManagementWhereClause = {};
    let stockManagementHavingWhereClause = {};
    let productListWhereClause = {
      product_category: category,
    };
    let warehouseWhereClause = {};
    const productListTableColumn = [
      "product_code",
      "product_name",
      "unit_of_measure",
      "threshold",
    ];
    console.log(filterColumn, "filter column ============");

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
              include: [
                {
                  model: Packaging,
                  as: "prod_packaging",
                },
              ],
            },
          ],
          where: stockManagementWhereClause,
          having: stockManagementHavingWhereClause,
          order: [[{ model: ProductList }, "createdAt", "DESC"]],
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
      const warehouseAndStock = ["warehouse_name", "stock", "average_price"];
      if (searchText && searchText.trim() !== "") {
        for (const item of warehouseAndStock) {
          stockManagementWhereClause = {};
          stockManagementHavingWhereClause = {};
          productListWhereClause = {
            product_category: category,
          };
          warehouseWhereClause = {};

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

            default:
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
              data: data,
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
        data: data,
      });
    } else {
      res.status(400).send("No data found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
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
    const { count, rows: stockDetails } = await StockManagement.findAndCountAll(
      {
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        where: {
          product_id: productId,
          warehouse_id: warehouseId,
        },
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
          {
            model: Warehouse,
          },
        ],
      }
    );
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: stockDetails,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
