const router = require("express").Router();
const { where, Op, literal, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Production,
  StockManagement,
  ProductList,
  Production_Raw_Used,
  Production_Finish_Product,
  Production_finish_raw_used,
  Warehouse,
  Cutoff,
  SalesInvoiceInventory,
  SalesInvoice,
  StockTransferApproveProducts,
  StockTransferProducts,
  StockTransfer,
  Activity_Log,
  Inventory_Report,
  Inventory_Journal,
  Production_History,
  Production_History_Suffix,
  Vendors,
} = require("../db/models/associations");
const moment = require("moment-timezone");
const session = require("express-session");
const Production_Raw = require("../db/models/production_raw_used.model");
const Production_Finished_Product = require("../db/models/production_finish_product.model");
const ProductionConsumableUsed = require("../db/models/production_consumable_used.model");
const {
  likeFilter,
  dateFormatFilter,
  castFilter,
} = require("../utils/filters/sequelizeSearchFilter");
const { inventoryReport } = require("../services");
const irService = inventoryReport.inventoryReportService;
const irHelper = inventoryReport.inventoryReportHelper;

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

//USED MODULE:
// Production
router.route("/getDataProduction").get(async (req, res) => {
  try {
    const { startDate, endDate, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const productionTableColumn = ["desc", "date_produce", "production_id"];
    let productionWhereClause = {
      date_produce: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    // Production query
    async function productionQuery(productionWhereClause) {
      const { count, rows: isFetch } = await Production.findAndCountAll({
        include: [
          {
            model: Production_Finish_Product,
            required: true,
            where: {
              isDeleted: false,
            },
            include: [
              {
                model: Production_finish_raw_used,
                required: true,
                where: {
                  isDeleted: false,
                },
              },
            ],
          },
          {
            model: Production_Raw_Used,
          },
        ],
        // subQuery: false,
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        distinct: true,
        where: { ...productionWhereClause, isDeleted: false },
      });

      return { count, isFetch };
    }

    // Modifies the result of the Production query
    function modifyQueryResult(datas) {
      const fetchArray = [];

      datas.forEach((data) => {
        let productionTotalWeightIn = 0;
        let productionTotalNetWeight = 0;

        let productionTotalRawWeight = 0;

        data.production_finish_products.forEach((data1) => {
          data1.production_finish_raw_useds.forEach((data2) => {
            // Accumulate the sums for this production
            productionTotalWeightIn += data2.dataValues.weight_in;
            productionTotalNetWeight += data2.dataValues.net_weight;
          });
        });

        data.production_raw_useds.forEach((data1) => {
          productionTotalRawWeight += data1.dataValues.weight_in;
        });

        // Calculate percent of loss for this production
        let productionWeightLoss =
          productionTotalWeightIn - productionTotalNetWeight;
        let productionPercentLoss =
          (productionWeightLoss / productionTotalWeightIn) * 100;

        // Round to 2 decimal places
        productionPercentLoss = Math.round(productionPercentLoss * 100) / 100;

        // Push the summary data for this production to the array
        fetchArray.push({
          id: data.id,
          production_id: data.production_id,
          desc: data.desc,
          createdAt: data.createdAt,
          weight_in: productionTotalWeightIn,
          net_weight: productionTotalNetWeight,
          weight_loss: productionWeightLoss,
          total_raw_weight: productionTotalRawWeight,
          percent_loss: isNaN(productionPercentLoss)
            ? 0
            : productionPercentLoss,
          date_produce: data.date_produce,
          status: data.status,
        });
      });
      return fetchArray;
    }

    // Individually Search for Production ID, Production Description and Date Produce
    const individualSearchUsingSqlLike = async (
      filterColumn,
      productionWhereClause,
      isFetch,
      newArrayResult
    ) => {
      if (filterColumn === "date_produce") {
        productionWhereClause = {
          [Op.and]: [
            {
              date_produce: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            sequelize.where(literal(`CAST (${filterColumn} AS CHAR)`), {
              [Op.like]: `%${searchText}%`,
            }),
          ],
        };
      } else {
        productionWhereClause[filterColumn] = {
          [Op.like]: `%${searchText}%`,
        };
      }

      ({ count, isFetch } = await productionQuery(productionWhereClause));
      newArrayResult = modifyQueryResult(isFetch);

      return newArrayResult;
    };

    // Individually Search for Weight In, Net Weight and Loss using array filter method
    const individualSearchUsingArrayFilter = (filterColumn) => {
      const filteredFetch = newArrayResult.filter((item) => {
        const weightInToString = item.weight_in.toString();
        const netWeightToString = item.net_weight.toString();
        const percentLossToString = `${item.percent_loss.toString()}%`;
        // Conditional Statement Based on filterColumn value
        switch (filterColumn) {
          case "weight_in":
            return weightInToString.includes(searchText);
          case "net_weight":
            return netWeightToString.includes(searchText);
          case "loss":
            return percentLossToString.includes(searchText);
        }
      });

      return filteredFetch;
    };

    let { count, isFetch } = await productionQuery(productionWhereClause);
    let newArrayResult = modifyQueryResult(isFetch);

    // Handle Individual Search for columns
    if (searchText && searchText.trim() !== "") {
      let returnedArray;
      switch (filterColumn) {
        case "production_id":
        case "desc":
        case "date_produce": // Consolidated case
          returnedArray = await individualSearchUsingSqlLike(
            filterColumn,
            productionWhereClause,
            isFetch,
            newArrayResult
          );
          return res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: returnedArray,
          });
        case "weight_in":
        case "net_weight":
        case "loss": // Consolidated case
          returnedArray = individualSearchUsingArrayFilter(filterColumn);
          return res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: returnedArray,
          });
      }
    }

    // Filtered array based on Weight In, Net Weight and Loss
    const filteredFetch = newArrayResult.filter((item) => {
      const weightInToString = item.weight_in.toString();
      const netWeightToString = item.net_weight.toString();
      const percentLossToString = `${item.percent_loss.toString()}%`;
      return (
        weightInToString.includes(searchText) ||
        netWeightToString.includes(searchText) ||
        percentLossToString.includes(searchText)
      );
    });

    // ----- Handle Search filter "All" -----
    if (filteredFetch.length > 0) {
      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: filteredFetch,
      });
    } else {
      // If There's no Weight In/Net Weight/Loss searched, then search for Production ID, Product Description and Date Produce
      if (searchText && searchText.trim() !== "") {
        const escapedSearchText = searchText.replace(/%/g, `\\%`); // to read % as literal character
        productionWhereClause = {
          [Op.and]: [
            {
              date_produce: {
                [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
              },
            },
            {
              [Op.or]: productionTableColumn.map((col) => {
                // Search for description
                if (col === "desc") {
                  // Handle "n/a" input for description
                  if (searchText?.toLowerCase() === "n/a") {
                    return {
                      [col]: {
                        [Op.or]: [
                          {
                            [Op.eq]: null,
                          },
                          {
                            [Op.eq]: "",
                          },
                        ],
                      },
                    };
                  }

                  return {
                    [col]: {
                      [Op.like]: `%${escapedSearchText}%`,
                    },
                  };
                  // Search for Date Produce
                } else if (col === "date_produce") {
                  return {
                    [col]: sequelize.where(
                      literal(`CAST (date_produce AS CHAR)`),
                      {
                        [Op.like]: `%${escapedSearchText}%`,
                      }
                    ),
                  };
                  // For Production ID
                } else {
                  return {
                    [col]: {
                      [Op.like]: `%${escapedSearchText}%`,
                    },
                  };
                }
              }),
            },
          ],
        };
      }

      let { count, isFetch } = await productionQuery(productionWhereClause);
      newArrayResult = modifyQueryResult(isFetch);

      if (filteredFetch.length === 0) {
        if (newArrayResult.length > 0) {
          return res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: newArrayResult,
          });
        } else {
          // If both are empty, return an empty array
          newArrayResult.length = 0;
        }
      }

      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: newArrayResult,
      });
    }
  } catch (error) {
    console.error("Error fetching production data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.route("/getDataProductionNew").get(async (req, res) => {
//   try {
//     const { startDate, endDate, searchText, filterColumn } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     const productionTableColumn = ["desc", "date_produce", "production_id"];
//     let productionWhereClause = {
//       date_produce: {
//         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//       },
//     };

//     // Production query
//     async function productionQuery(productionWhereClause) {
//       const { count, rows: isFetch } = await Production.findAndCountAll({
//         include: [
//           {
//             model: Production_Finish_Product,
//             required: true,
//             where: {
//               isDeleted: false,
//             },
//             // include: [
//             //   {
//             //     model: Production_finish_raw_used,
//             //     required: true,
//             //     where: {
//             //       isDeleted: false,
//             //     },
//             //   },
//             // ],
//           },
//           {
//             model: Production_Raw_Used,
//             required: true,
//             where: {
//               isDeleted: false,
//             },
//           },
//         ],
//         // subQuery: false,
//         order: [["createdAt", "DESC"]],
//         limit: limit,
//         offset: offset,
//         distinct: true,
//         where: { ...productionWhereClause, isDeleted: false },
//       });

//       return { count, isFetch };
//     }

//     // Modifies the result of the Production query
//     function modifyQueryResult(datas) {
//       const fetchArray = [];

//       datas.forEach((data) => {
//         let productionTotalWeightIn = 0;
//         let productionTotalNetWeight = 0;

//         let productionTotalRawWeight = 0;

//         // data.production_finish_products.forEach((data1) => {
//         //   data1.production_finish_raw_useds.forEach((data2) => {
//         //     // Accumulate the sums for this production
//         //     productionTotalWeightIn += data2.dataValues.weight_in;
//         //     productionTotalNetWeight += data2.dataValues.net_weight;
//         //   });
//         // });

//         data.production_raw_useds.forEach((data1) => {
//           productionTotalWeightIn += data1.dataValues.weight_in;
//         });

//         data.production_finish_products.forEach((data) => {
//           productionTotalNetWeight += data.dataValues.produce;
//         });

//         // Calculate percent of loss for this production
//         let productionWeightLoss =
//           productionTotalWeightIn - productionTotalNetWeight;
//         let productionPercentLoss =
//           (productionWeightLoss / productionTotalWeightIn) * 100;

//         // Round to 2 decimal places
//         productionPercentLoss = Math.round(productionPercentLoss * 100) / 100;

//         // Push the summary data for this production to the array
//         fetchArray.push({
//           id: data.id,
//           production_id: data.production_id,
//           desc: data.desc,
//           createdAt: data.createdAt,
//           weight_in: productionTotalWeightIn,
//           net_weight: productionTotalNetWeight,
//           weight_loss: productionWeightLoss,
//           total_raw_weight: productionTotalRawWeight,
//           percent_loss: isNaN(productionPercentLoss)
//             ? 0
//             : productionPercentLoss,
//           date_produce: data.date_produce,
//           status: data.status,
//         });
//       });
//       return fetchArray;
//     }

//     // Individually Search for Production ID, Production Description and Date Produce
//     const individualSearchUsingSqlLike = async (
//       filterColumn,
//       productionWhereClause,
//       isFetch,
//       newArrayResult
//     ) => {
//       if (filterColumn === "date_produce") {
//         productionWhereClause = {
//           [Op.and]: [
//             {
//               date_produce: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//             },
//             sequelize.where(literal(`CAST (${filterColumn} AS CHAR)`), {
//               [Op.like]: `%${searchText}%`,
//             }),
//           ],
//         };
//       } else {
//         productionWhereClause[filterColumn] = {
//           [Op.like]: `%${searchText}%`,
//         };
//       }

//       ({ count, isFetch } = await productionQuery(productionWhereClause));
//       newArrayResult = modifyQueryResult(isFetch);

//       return newArrayResult;
//     };

//     // Individually Search for Weight In, Net Weight and Loss using array filter method
//     const individualSearchUsingArrayFilter = (filterColumn) => {
//       const filteredFetch = newArrayResult.filter((item) => {
//         const weightInToString = item.weight_in.toString();
//         const netWeightToString = item.net_weight.toString();
//         const percentLossToString = `${item.percent_loss.toString()}%`;
//         // Conditional Statement Based on filterColumn value
//         switch (filterColumn) {
//           case "weight_in":
//             return weightInToString.includes(searchText);
//           case "net_weight":
//             return netWeightToString.includes(searchText);
//           case "loss":
//             return percentLossToString.includes(searchText);
//         }
//       });

//       return filteredFetch;
//     };

//     let { count, isFetch } = await productionQuery(productionWhereClause);
//     let newArrayResult = modifyQueryResult(isFetch);

//     // Handle Individual Search for columns
//     if (searchText && searchText.trim() !== "") {
//       let returnedArray;
//       switch (filterColumn) {
//         case "production_id":
//         case "desc":
//         case "date_produce": // Consolidated case
//           returnedArray = await individualSearchUsingSqlLike(
//             filterColumn,
//             productionWhereClause,
//             isFetch,
//             newArrayResult
//           );
//           return res.status(200).json({
//             totalItems: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: parseInt(page || 1),
//             data: returnedArray,
//           });
//         case "weight_in":
//         case "net_weight":
//         case "loss": // Consolidated case
//           returnedArray = individualSearchUsingArrayFilter(filterColumn);
//           return res.status(200).json({
//             totalItems: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: parseInt(page || 1),
//             data: returnedArray,
//           });
//       }
//     }

//     // Filtered array based on Weight In, Net Weight and Loss
//     const filteredFetch = newArrayResult.filter((item) => {
//       const weightInToString = item.weight_in.toString();
//       const netWeightToString = item.net_weight.toString();
//       const percentLossToString = `${item.percent_loss.toString()}%`;
//       return (
//         weightInToString.includes(searchText) ||
//         netWeightToString.includes(searchText) ||
//         percentLossToString.includes(searchText)
//       );
//     });

//     // ----- Handle Search filter "All" -----
//     if (filteredFetch.length > 0) {
//       return res.status(200).json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: filteredFetch,
//       });
//     } else {
//       // If There's no Weight In/Net Weight/Loss searched, then search for Production ID, Product Description and Date Produce
//       if (searchText && searchText.trim() !== "") {
//         const escapedSearchText = searchText.replace(/%/g, `\\%`); // to read % as literal character
//         productionWhereClause = {
//           [Op.and]: [
//             {
//               date_produce: {
//                 [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//               },
//             },
//             {
//               [Op.or]: productionTableColumn.map((col) => {
//                 // Search for description
//                 if (col === "desc") {
//                   // Handle "n/a" input for description
//                   if (searchText?.toLowerCase() === "n/a") {
//                     return {
//                       [col]: {
//                         [Op.or]: [
//                           {
//                             [Op.eq]: null,
//                           },
//                           {
//                             [Op.eq]: "",
//                           },
//                         ],
//                       },
//                     };
//                   }

//                   return {
//                     [col]: {
//                       [Op.like]: `%${escapedSearchText}%`,
//                     },
//                   };
//                   // Search for Date Produce
//                 } else if (col === "date_produce") {
//                   return {
//                     [col]: sequelize.where(
//                       literal(`CAST (date_produce AS CHAR)`),
//                       {
//                         [Op.like]: `%${escapedSearchText}%`,
//                       }
//                     ),
//                   };
//                   // For Production ID
//                 } else {
//                   return {
//                     [col]: {
//                       [Op.like]: `%${escapedSearchText}%`,
//                     },
//                   };
//                 }
//               }),
//             },
//           ],
//         };
//       }

//       let { count, isFetch } = await productionQuery(productionWhereClause);
//       newArrayResult = modifyQueryResult(isFetch);

//       if (filteredFetch.length === 0) {
//         if (newArrayResult.length > 0) {
//           return res.status(200).json({
//             totalItems: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: parseInt(page || 1),
//             data: newArrayResult,
//           });
//         } else {
//           // If both are empty, return an empty array
//           newArrayResult.length = 0;
//         }
//       }

//       res.status(200).json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: newArrayResult,
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching production data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/getDataProductionNew").get(async (req, res) => {
  try {
    const { startDate, endDate, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let productionWhereClause = {
      date_produce: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };

    const { count, rows: isFetch } = await Production.findAndCountAll({
      where: { ...productionWhereClause, isDeleted: false },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/getDataProductionNew/search").get(async (req, res) => {
  try {
    const { startDate, endDate, searchText, filterColumn } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let productionWhereClause = {
      date_produce: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
      isDeleted: false,
    };

    // Filter condition for search
    const filterCondition = (field) => {
      return filterColumn === field || filterColumn === "all";
    };

    // Table Columns
    const textColumns = ["production_id", "desc", "status"];
    const dateColumns = ["date_produce"];
    const numberColumns = [
      "total_quantity",
      "total_produce",
      "loss_percent",
      "loss_quantity",
    ];

    // Helper function for different filters
    const buildFilters = (fn, columns) =>
      columns.reduce((acc, col) => {
        if (filterCondition(col)) acc.push(fn(searchText, col));
        return acc;
      }, []);

    // Consolidate filters for search query
    const orConditions = [
      ...buildFilters(likeFilter, textColumns),
      ...buildFilters(dateFormatFilter, dateColumns),
      ...buildFilters(castFilter, numberColumns),
    ];

    const { count, rows: isFetch } = await Production.findAndCountAll({
      where: {
        ...productionWhereClause,
        ...(searchText?.trim() !== "" && { [Op.or]: orConditions }),
      },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: isFetch,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/getProductionDetails/:id").get(async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Production.findOne({
      where: { id: id },
    });
    if (data) {
      return res.json(data);
    } else {
      return res.status(404).json("No data found for this production list");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// Production
router.route("/consumables/summary").get(async (req, res) => {
  const { selectedWarehouse } = req.query;

  let stockManagementWhereClause = {
    warehouse_id: selectedWarehouse,
    // stock: { [Op.gt]: 0 },
    isDeleted: false,
  };

  try {
    const consumables = await StockManagement.findAll({
      where: stockManagementWhereClause,
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [sequelize.fn("AVG", sequelize.col("price")), "averagePrice"],
      ],
      include: [
        {
          model: ProductList,
          attributes: [
            "product_id",
            "product_code",
            "product_name",
            "unit_of_measure",
            "status",
          ],
          where: {
            product_category: {
              [Op.eq]: "Consumables",
            },
            status: {
              [Op.notIn]: ["Archive", "Inactive"],
            },
          },
          required: true,
        },
      ],
      group: [
        "stock_management.product_id",
        "product_list.product_id",
        "product_list.product_code",
        "product_list.product_name",
        "product_list.unit_of_measure",
      ],
    });

    res.json(consumables);
  } catch (error) {
    console.error("Error fetching consumable products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/consumables/list").get(async (req, res) => {
  try {
    const data = await ProductList.findAll({
      where: {
        product_category: "Consumables",
      },
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/consumables/:consumableId/summary").get(async (req, res) => {
  try {
    const { consumableId } = req.params;

    const data = await StockManagement.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [sequelize.fn("AVG", sequelize.col("price")), "averagePrice"],
      ],
      where: {
        product_id: consumableId,
      },
      group: ["product_id"],
    });

    res.status(200).json(...data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/consumables/:productionId").get(async (req, res) => {
  try {
    const { productionId } = req.params;
    const { warehouseId } = req.query;

    if (!warehouseId)
      return res.status(404).json({ error: "Warehouse id not found" });

    if (!productionId)
      return res.status(404).json({ error: "Production id not found" });

    const consumables = await ProductionConsumableUsed.findAll({
      attributes: [
        "product_id",
        [
          sequelize.fn("MAX", sequelize.col("production_price")),
          "production_price",
        ],
        [sequelize.fn("SUM", sequelize.col("costing")), "costing"],
        [sequelize.fn("SUM", sequelize.col("weight_in")), "weight_in"],
      ],
      include: [
        {
          model: ProductList,
          required: true,
          attributes: ["product_code", "product_name", "unit_of_measure"],
        },
      ],
      where: {
        production_id: productionId,
        isDeleted: false,
      },
      group: ["production_consumable_used.product_id"],
    });

    const consumableWithCurrentStock = await Promise.all(
      consumables.map(async (item) => {
        const totalStock = await StockManagement.sum("stock", {
          where: {
            product_id: item.product_id,
            warehouse_id: warehouseId,
            isDeleted: false,
          },
        });

        return {
          costing: item.costing,
          production_price: item.production_price,
          weight_in: item.weight_in,
          totalStock,
          product_id: item.product_id,
          product_code: item.product_list.product_code,
          product_name: item.product_list.product_name,
          unit_of_measure: item.product_list.unit_of_measure,
        };
      })
    );

    res.status(200).json(consumableWithCurrentStock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Old route to fetch one existing consumable upon editing/update
router.route("/consumables/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.query;

    if (!warehouseId)
      return res.status(404).json({ message: "Warehouse not found." });

    // Check if theres existing consumable in specific production id
    const productionConsumable = await ProductionConsumableUsed.findOne({
      where: {
        production_id: id,
        isDeleted: false,
      },
    });

    if (!productionConsumable)
      return res.status(404).json({ message: "No Consumable found." });

    // Get the Product Id and Unit Price of consumable
    const { product_id, production_price } =
      await ProductionConsumableUsed.findOne({
        where: {
          production_id: id,
          isDeleted: false,
        },
      });

    // Get the Quantity
    const quantity = await ProductionConsumableUsed.sum("weight_in", {
      where: {
        production_id: id,
        isDeleted: false,
      },
    });

    const total = quantity * production_price; // Get the total Amount

    // Get max quantity of selected consumable for validation
    const maxQuantity = await StockManagement.sum("stock", {
      where: {
        product_id: product_id,
        warehouse_id: warehouseId,
        isDeleted: false,
      },
    });

    res.status(200).json({
      productId: product_id,
      unitPrice: production_price,
      quantity,
      total,
      maxQuantity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//USED MODULE:
// Production
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
    // const lastPayCode = await Production.findOne({
    //   where: {
    //     production_id: {
    //       [Op.like]: `PROD-${currentMonth}%`,
    //     },
    //   },
    //   order: [["createdAt", "DESC"]],
    // });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode = `PROD-${currentMonth}${time}${generateTwoNum}`;
    // if (lastPayCode && lastPayCode.production_id) {
    //   // console.log(`Last Pay Code: ${lastPayCode.production_id}`);
    //   const latestRefCode = lastPayCode.production_id;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `PROD-${currentMonth}-${newSequence}`;
    //   } else {
    //     // If the refCode doesn't split correctly or sequence is not a number
    //     newRefCode = `PROD-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `PROD-${currentMonth}-00001`;
    // }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//USED MODULE:
// Production
router.route("/getRawProd").get(async (req, res) => {
  const { selectedWarehouse, usage, vendorId } = req.query;

  let stockManagementWhereClause = {
    warehouse_id: selectedWarehouse,
    ...(vendorId !== "Any" && vendorId && { vendor_id: vendorId }),
    // stock: { [Op.gt]: 0 },
    isDeleted: false,
  };

  if (usage === "For Production Form") {
    stockManagementWhereClause["stock"] = {
      [Op.gt]: 0,
    };
  }

  try {
    const rawProducts = await StockManagement.findAll({
      where: stockManagementWhereClause,
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("stock")), "totalStock"],
        [sequelize.fn("AVG", sequelize.col("price")), "averagePrice"],
      ],
      include: [
        {
          model: ProductList,
          attributes: [
            "product_id",
            "product_code",
            "product_name",
            "unit_of_measure",
            "status",
          ],
          where: {
            product_category: {
              [Op.ne]: "Consumables",
            },
            status: {
              [Op.notIn]: ["Archive", "Inactive"],
            },
          },
          required: true,
        },
      ],
      group: [
        "stock_management.product_id",
        "product_list.product_id",
        "product_list.product_code",
        "product_list.product_name",
        "product_list.unit_of_measure",
      ],
    });

    res.json(rawProducts);
  } catch (error) {
    console.error("Error fetching raw products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//USED MODULE:
// Production
router.route("/getFinishProd").get(async (req, res) => {
  try {
    const isFetch = await ProductList.findAll({
      where: {
        product_category: {
          [Op.in]: ["Raw Materials", "Consumables", "Finish Product"],
        },
        status: {
          [Op.notIn]: ["Archive", "Inactive"],
        },
      },
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Production
router.route("/getNewFinishProd").get(async (req, res) => {
  try {
    const { selectedWarehouse, usage } = req.query;
    const isFetch = await StockManagement.findAll({
      attributes: [[sequelize.fn("SUM", sequelize.col("stock")), "totalStock"]],
      include: [
        {
          model: ProductList,
          required: true,
          attributes: [
            "product_id",
            "product_name",
            "product_code",
            "unit_of_measure",
          ],
          where: {
            product_category: {
              [Op.ne]: "Consumables",
            },
            status: {
              [Op.notIn]: ["Archive", "Inactive"],
            },
          },
        },
      ],
      group: ["stock_management.product_id", "product_list.product_name"],
      where: {
        warehouse_id: selectedWarehouse,
        isDeleted: false,
        // ...(usage === "For Production Form" && {
        //   stock: {
        //     [Op.gt]: 0,
        //   },
        // }),
      },
    });

    console.log(isFetch, "fetch");

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//USED MODULE:
// Production
router.route("/create_production").post(async (req, res) => {
  const {
    raws,
    finishedProductRows,
    production_id,
    description,
    date,
    shift,
    selectedWarehouse,
    userLoggedID,
  } = req.body;

  try {
    // const fetchWarehouse = await Warehouse.findOne({
    //   where: {
    //     branch_type: "Main",
    //   },
    // });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date },
          },
          {
            to: { [Op.gte]: date },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const roundToTwo = (num) => {
      return Math.round((num + Number.EPSILON) * 100) / 100;
    };
    let hasInsufficientStock = false;

    //validate if enough stock management
    for (const data of raws) {
      const required_quantity = roundToTwo(Number(data.weightIn));

      const fetchRawStock = await StockManagement.findAll({
        where: {
          product_id: data.prod_id,
          warehouse_id: selectedWarehouse,
          stock: { [Op.gt]: 0 },
          isDeleted: false,
        },
        order: [["date_in", "ASC"]],
      });

      const totalAvailableStock = roundToTwo(
        fetchRawStock.reduce((sum, inv) => sum + Number(inv.stock), 0)
      );

      if (totalAvailableStock < required_quantity) {
        console.log(
          `Product ID: ${data.prod_id}`,
          `Required Quantity: ${required_quantity}`,
          `Available Stock: ${totalAvailableStock}`,
          `Missing: ${roundToTwo(required_quantity - totalAvailableStock)}`
        );
        hasInsufficientStock = true;
      }

      if (hasInsufficientStock) {
        return res.status(400).json({
          success: false,
          message:
            "Some products have insufficient stock. Check console for details.",
        });
      }
    }

    const isCreate = await Production.create({
      production_id: production_id,
      desc: description === "" ? null : description,
      date_produce: date,
      shift: shift,
      warehouse_id: selectedWarehouse,
      created_by: userLoggedID,
      status: "Pending",
    });

    if (isCreate) {
      // Debug: Log the raw materials being processed

      // Create a map to store raw materials by their stock_id
      const productionRawUsedsMap = new Map();

      // Process raw materials first Original  code

      // for (const data of raws) {
      //   console.log("Processing raw material:", data);

      //   const array_product_id = data.prod_id;
      //   const remaining_quantity = roundToTwo(Number(data.weightIn));

      //   // console.log(
      //   //   "Created Production_Raw_Used:",
      //   //   productionRawUsed.id,
      //   //   "for stock_id:",
      //   //   data.stock_id
      //   // );

      //   // Store in map using stock_id as key

      //   // Update stock management

      //   const inventories = await StockManagement.findAll({
      //     where: {
      //       product_id: array_product_id,
      //       warehouse_id: selectedWarehouse,
      //       stock: { [Op.gt]: 0 },
      //     },
      //     order: [["createdAt", "ASC"]],
      //   });

      //   for (const inventory of inventories) {
      //     if (remaining_quantity <= 0) break;

      //     const toDeductQuantity = roundToTwo(
      //       Math.min(remaining_quantity, Number(inventory.stock))
      //     );

      //     //Minusss
      //     // await inventory.update({
      //     //   stock: roundToTwo(Number(inventory.stock) - toDeductQuantity),
      //     // });

      //     const productionRawUsed = await Production_Raw_Used.create({
      //       production_id: isCreate.id,
      //       stock_management_id: inventory.stock_management_id,
      //       product_id: array_product_id,
      //       production_price: data.prod_price,
      //       weight_in: remaining_quantity,
      //     });

      //     productionRawUsedsMap.set(
      //       String(array_product_id),
      //       productionRawUsed
      //     );
      //   }
      //   // if (fetchRawStock) {
      //   //   const existingStock = parseFloat(fetchRawStock.stock);
      //   //   const newStockIn = parseFloat(data.weightIn);
      //   //   const totalStock = existingStock - newStockIn;

      //   //   await StockManagement.update(
      //   //     {
      //   //       stock: totalStock,
      //   //     },
      //   //     {
      //   //       where: {
      //   //         product_id: data.prod_id,
      //   //         warehouse_id: selectedWarehouse,
      //   //       },
      //   //     }
      //   //   );
      //   //   console.log("updated");
      //   //   console.log(totalStock);
      //   //   console.log(date);
      //   // } else {
      //   //   await StockManagement.create({
      //   //     warehouse_id: selectedWarehouse,
      //   //     product_id: data.prod_id,
      //   //     stock: data.produce,
      //   //     price: 0,
      //   //   });
      //   // }
      // }
      const usedStockIds = new Set();

      for (const data of raws) {
        const array_product_id = data.prod_id;
        let remaining_quantity = roundToTwo(Number(data.weightIn));

        const stockChanges = [];

        while (remaining_quantity > 0) {
          const inventory = await StockManagement.findOne({
            where: {
              product_id: array_product_id,
              warehouse_id: selectedWarehouse,
              stock: { [Op.gt]: 0 },
              stock_management_id: { [Op.notIn]: [...usedStockIds] },
              isDeleted: false,
            },
            order: [["createdAt", "ASC"]],
          });

          if (!inventory) {
            console.log(
              "Not enough stock available for product:",
              array_product_id
            );
            break;
          }

          const availableStock = Number(inventory.stock);
          const toDeductQuantity = roundToTwo(
            Math.min(remaining_quantity, availableStock)
          );

          // Insert to inventory_report table
          await Inventory_Report.create({
            cut_off_id: findCutoff.id,
            product_id: data.prod_id,
            average_price: data.prod_price,
            product_out: toDeductQuantity,
            unit_price: inventory.price,
            from_counting: 0,
            date_in: date,
            sales_invoice_id: null,
            isDeleted: false,
            transaction_id: production_id,
            module_in_from: "Production",
          });

          await inventory.update({
            stock: roundToTwo(Number(inventory.stock) - toDeductQuantity),
          });

          usedStockIds.add(inventory.stock_management_id);

          stockChanges.push({
            stock_management_id: inventory.stock_management_id,
            new_stock: roundToTwo(availableStock - toDeductQuantity),
          });

          const productionRawUsed = await Production_Raw_Used.create({
            production_id: isCreate.id,
            stock_management_id: inventory.stock_management_id,
            product_id: array_product_id,
            production_price: data.prod_price,
            weight_in: toDeductQuantity,
          });

          productionRawUsedsMap.set(
            String(array_product_id),
            productionRawUsed
          );
          remaining_quantity = roundToTwo(
            remaining_quantity - toDeductQuantity
          );
        }
      }

      // Debug: Log the map contents
      console.log(
        "Production Raw Useds Map:",
        Array.from(productionRawUsedsMap.entries()).map(([key, value]) => ({
          key,
          id: value.id,
        }))
      );

      // Process finished products
      for (const data of finishedProductRows) {
        console.log("Processing finished product:", data);
        // Calculate total cost from raw materials
        let totalCost = 0;
        for (const raw_used of data.raw_used) {
          totalCost += parseFloat(raw_used.costing);
        }

        const productionFinishProduct = await Production_Finish_Product.create({
          production_id: isCreate.id,
          product_id: data.prod_id,
          produce: data.produce,
          weight_in: data.weightIn,
        });

        // Update stock for finished product
        // const fetchStock = await StockManagement.findOne({
        //   where: {
        //     product_id: data.prod_id,
        //     warehouse_id: fetchWarehouse.warehouse_id,
        //   },
        // });

        // if (fetchStock) {
        //   const existingStock = parseFloat(fetchStock.stock);
        //   const newStockIn = parseFloat(data.produce);
        //   const totalStock = existingStock + newStockIn;

        //   await StockManagement.update(
        //     {
        //       stock: totalStock,
        //     },
        //     {
        //       where: {
        //         product_id: data.prod_id,
        //         warehouse_id: fetchWarehouse.warehouse_id,
        //       },
        //     }
        //   );
        // } else {

        //Create after ma produce
        // await StockManagement.create({
        //   warehouse_id: selectedWarehouse,
        //   product_id: data.prod_id,
        //   stock: data.produce,
        //   price: totalCost / data.produce,
        //   vendor_id: null,
        //   date_in: date,
        //   in: data.produce,
        //   price_in: totalCost / data.produce,
        //   transaction_number: production_id,
        //   module_in_from: "Production",
        // });
        // }
        //

        // Process raw materials used for this finished product
        for (const raw_used of data.raw_used) {
          console.log("Processing raw_used:", raw_used);
          console.log(
            "Looking for raw_product_id:",
            // String(raw_used.raw_stock_id)
            String(raw_used.raw_product_id)
          );

          // Get the corresponding raw used entry using raw_stock_id
          const correspondingRawUsed = productionRawUsedsMap.get(
            // String(raw_used.raw_stock_id)
            String(raw_used.raw_product_id)
          );

          if (correspondingRawUsed) {
            console.log(
              "Found corresponding raw used:",
              correspondingRawUsed.id
            );

            await Production_finish_raw_used.create({
              production_finish_product_id: productionFinishProduct.id,
              production_raw_used_id: correspondingRawUsed.id,
              weight_in: raw_used.weightIn,
              net_weight: raw_used.newWeight,
            });
          } else {
            console.log(
              "No corresponding raw used found for:",
              raw_used.raw_product_id
            );
            console.log(
              "Available raw used ids:",
              Array.from(productionRawUsedsMap.keys())
            );
          }
        }
      }
    }

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Productions: User created new production with Production ID ${production_id}`,
    });

    res.status(200).json({ message: "Production created successfully" });
  } catch (error) {
    console.error("Error creating production:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Production
router.route("/create_production_new").post(async (req, res) => {
  const {
    raws,
    finishedProductRows,
    production_id,
    description,
    startDate,
    date,
    shift,
    machine,
    selectedWarehouse,
    userLoggedID,
    consumableId,
    quantity,
    averagePrice,
    total,
    totalQuantity,
    totalProduce,
    consumables,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // const fetchWarehouse = await Warehouse.findOne({
    //   where: {
    //     branch_type: "Main",
    //   },
    // });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date },
          },
          {
            to: { [Op.gte]: date },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted;

    if (isPosted) {
      if (transaction) await transaction.rollback();
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const roundToTwo = (num) => {
      return Math.round((num + Number.EPSILON) * 100) / 100;
    };

    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

    let hasInsufficientStock = false;

    //validate if enough stock management
    for (const data of raws) {
      const required_quantity = roundToTwo(Number(data.weightIn));

      const fetchRawStock = await StockManagement.findAll({
        where: {
          product_id: data.prod_id,
          ...(data.vendor_id !== "Any" &&
            data.vendor_id && { vendor_id: data.vendor_id }),
          warehouse_id: selectedWarehouse,
          stock: { [Op.gt]: 0 },
          isDeleted: false,
        },
        order: [["date_in", "ASC"]],
        transaction,
      });

      const totalAvailableStock = roundToTwo(
        fetchRawStock.reduce((sum, inv) => sum + Number(inv.stock), 0)
      );

      if (totalAvailableStock < required_quantity) {
        console.log(
          `Product ID: ${data.prod_id}`,
          `Required Quantity: ${required_quantity}`,
          `Available Stock: ${totalAvailableStock}`,
          `Missing: ${roundToTwo(required_quantity - totalAvailableStock)}`
        );
        hasInsufficientStock = true;
      }

      if (hasInsufficientStock) {
        return res.status(400).json({
          success: false,
          message:
            "Some products have insufficient stock. Check console for details.",
        });
      }
    }

    const lossQuantity = parseNumber(totalQuantity) - parseNumber(totalProduce);

    const lossPercent = (lossQuantity / parseNumber(totalQuantity)) * 100;

    const isCreate = await Production.create(
      {
        production_id: production_id,
        desc: description === "" ? null : description,
        date_produce: date,
        start_date: startDate,
        shift: shift,
        machine,
        warehouse_id: selectedWarehouse,
        created_by: userLoggedID,
        status: "Pending",
        total_quantity: totalQuantity,
        total_produce: totalProduce,
        loss_percent: lossPercent,
        loss_quantity: lossQuantity,
      },
      {
        transaction,
      }
    );

    // --- For Consumable ---
    const productionId = isCreate.id;

    if (consumables.length > 0) {
      for (const consumableItem of consumables) {
        let remainingStock = parseNumber(consumableItem.weightIn);
        const consumableProductId = consumableItem.prod_id;
        const consumableUnitPrice = parseNumber(consumableItem.prod_price) ?? 0;

        const consumableStockList = await StockManagement.findAll({
          where: {
            product_id: consumableProductId,
            warehouse_id: selectedWarehouse,
            isDeleted: false,
            stock: {
              [Op.gt]: 0,
            },
          },
          transaction,
        });

        for (const [index, item] of consumableStockList.entries()) {
          if (remainingStock <= 0) continue; // Skip if the remaining stock is 0 to avoid unnecessary creation of ProductionConsumableUsed

          const amountToDecrement = Math.min(remainingStock, item.stock);

          const createConsumable = await ProductionConsumableUsed.create(
            {
              production_id: productionId,
              product_id: consumableProductId,
              stock_management_id: item.stock_management_id,
              weight_in: parseNumber(amountToDecrement) ?? 0,
              production_price: consumableUnitPrice,
              costing: parseNumber(amountToDecrement) * consumableUnitPrice,
            },
            { transaction }
          );

          remainingStock -= amountToDecrement;
        }
      }

      const validateConsumableStocks = async (consumableList) => {
        for (const consumableItem of consumableList) {
          const { stock } = await StockManagement.findOne({
            attributes: ["stock"],
            where: {
              stock_management_id: consumableItem.stock_management_id,
              isDeleted: false,
            },
            raw: true,
            transaction,
          });

          if (consumableItem.weight_in <= stock) continue; // Skip if the product has enough stock

          // Total available/remaining stock to be displayed for user information or swal in frontend
          const availableStock = await StockManagement.sum("stock", {
            where: {
              product_id: consumableItem.product_id,
              warehouse_id: selectedWarehouse,
            },
            transaction,
          });

          const { product_name } = await ProductList.findOne({
            attributes: ["product_name"],
            where: {
              product_id: consumableItem.product_id,
            },
            raw: true,
            transaction,
          });

          return {
            availableStock,
            productName: product_name,
          };
        }

        return null;
      };

      // Get all consumable used from the production
      const consumableList = await ProductionConsumableUsed.findAll({
        where: {
          production_id: productionId,
          isDeleted: false,
        },
        transaction,
      });

      // To validate consumable stock availability
      const validationError = await validateConsumableStocks(consumableList);

      if (validationError) {
        // Will not proceed to approve transaction if the consumable has insufficient stock
        return res.status(409).json({
          message: "Insufficient Consumable stock.",
          ...validationError,
        });
      }

      // If the comsumable has enough stock proceed with the decrementing of stock
      await Promise.all([
        ...consumableList.map((item) =>
          StockManagement.decrement("stock", {
            by: item.weight_in,
            where: {
              stock_management_id: item.stock_management_id,
              isDeleted: false,
            },
            transaction,
          })
        ),
        // Save Record for Inventory Report Product Out
        ...consumableList.map((item) =>
          Inventory_Report.create(
            {
              cut_off_id: findCutoff.id,
              product_id: item.product_id,
              average_price: item.production_price,
              product_out: item.weight_in,
              unit_price: item.production_price,
              from_counting: 0,
              date_in: date,
              sales_invoice_id: null,
              isDeleted: false,
              transaction_id: production_id,
              module_in_from: "Production",
            },
            { transaction }
          )
        ),
      ]);
    }

    if (isCreate) {
      // --- Handle creation of production raw materials ---
      const rawMaterialList = [];

      for (const {
        prod_id: productId,
        vendor_id: vendorId,
        prod_price: productionPrice,
        weightIn,
        cost,
      } of raws) {
        let quantity = weightIn; // Raw material quantity
        const usedStockManagementIds = []; // List of stock management id already used by Production_Raw_Used

        // Loop until the raw material quantity is fully deducted
        while (quantity > 0) {
          // Find stock management for Production_Raw_Used
          const stockManagement = await StockManagement.findOne({
            attributes: ["stock_management_id", "stock"],
            where: {
              stock_management_id: { [Op.notIn]: usedStockManagementIds }, // Exclude already used stock management id
              product_id: productId,
              warehouse_id: selectedWarehouse,
              ...(vendorId !== "Any" && vendorId && { vendor_id: vendorId }),
              stock: { [Op.gt]: 0 },
              transaction_number: { [Op.ne]: "Product Creation" },
              isDeleted: false,
            },
            transaction,
          });

          // Validation: ensure there's stock before proceeding
          if (!stockManagement) {
            await transaction.rollback();
            return res.status(400).json({
              error: `Insufficient stock for product ${productId}`,
            });
          }

          // Deduct the quantity and record the stock management id used for next iteration
          const deductQuantity = Math.min(quantity, stockManagement.stock);
          quantity -= deductQuantity;
          usedStockManagementIds.push(stockManagement.stock_management_id);

          // Build the data for Production_Raw_Used creation
          rawMaterialList.push({
            production_id: isCreate.id,
            stock_management_id: stockManagement.stock_management_id,
            product_id: productId,
            vendor_id: vendorId === "Any" ? null : vendorId,
            production_price: productionPrice,
            weight_in: deductQuantity,
            costing: cost,
          });
        }
      }

      await Production_Raw_Used.bulkCreate(rawMaterialList, { transaction });

      // --- Handle creation of production finished products ---
      const finishedProductList = finishedProductRows.map((item) => ({
        production_id: isCreate.id,
        product_id: item.prod_id,
        produce: item.produce,
        weight_in: item.weightIn,
        unit_price: item.unit_price,
        costing: item.costing,
      }));

      await Production_Finish_Product.bulkCreate(finishedProductList, {
        transaction,
      });
    }

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Productions: User created new production with Production ID ${production_id}`,
    });

    await transaction.commit();
    res.status(200).json({ message: "Production created successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error creating production:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getProductionRawUsed/:id", async (req, res) => {
  const { id } = req.params;
  const { warehouse_id } = req.query;
  try {
    // const data = await Production_Raw_Used.findAll({
    //   include: [
    //     {
    //       model: StockManagement,
    //       include: [
    //         {
    //           model: ProductList,
    //         },
    //       ],
    //     },
    //   ],
    //   where: [
    //     {
    //       production_id: id,
    //     },
    //   ],
    // });

    const data = await Production_Raw_Used.findAll({
      where: { production_id: id, isDeleted: false },
      include: [
        {
          model: StockManagement,
          include: [
            {
              model: ProductList,
            },
          ],
        },
        {
          model: Production,
          required: true,
        },
      ],
    });

    const productIds = data.map((item) => item.product_id);

    const stockSum = await StockManagement.findAll({
      attributes: [
        "product_id",
        [Sequelize.fn("SUM", Sequelize.col("stock")), "total_stock"],
      ],
      where: {
        product_id: { [Op.in]: productIds },
        warehouse_id: warehouse_id,
        isDeleted: false,
      },
      group: ["product_id"],
    });

    const stockMap = new Map(
      stockSum.map((item) => [
        item.dataValues.product_id,
        item.dataValues.total_stock,
      ])
    );

    // Merge stockSum into Data
    const mergedData = data.map((item) => ({
      ...item.dataValues,
      total_stock: stockMap.get(item.dataValues.product_id) || 0,
    }));

    console.log("mergg", mergedData);

    res.json(mergedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all raw materials with specific production
router.route("/raw-materials/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId, status } = req.query;

    // Get all stock from the StockManagement with specified vendor_id and product_id
    const currentStock = `
      SELECT SUM(stock)
      FROM stock_managements sm
      WHERE sm.product_id = production_raw_used.product_id
      AND sm.isDeleted = false
      AND (
        production_raw_used.vendor_id IS NULL OR -- For materials with supplier code "Any"
        sm.vendor_id = production_raw_used.vendor_id -- For materials with specified supplier code
      )
    `;

    // Initialize vendor id as "Any" if the value is null
    const vendorId = `
      CASE
        WHEN production_raw_used.vendor_id IS NULL THEN "Any"
        ELSE production_raw_used.vendor_id
      END
    `;

    // Main fetching to get all raw materials in a production transaction
    const rawMaterials = await Production_Raw_Used.findAll({
      attributes: [
        "product_id",
        [sequelize.literal(`${vendorId}`), "vendor_id"],
        [sequelize.col("supplier_code"), "supplier_code"],
        [sequelize.col("unit_of_measure"), "uom"],
        [sequelize.col("product_code"), "product_code"],
        [sequelize.col("product_name"), "product_name"],
        [sequelize.literal(`(${currentStock})`), "current_stock"],
        [sequelize.literal(`SUM(weight_in)`), "quantity"],
        [sequelize.literal("AVG(production_price)"), "unit_price"],
        [sequelize.literal("SUM(weight_in * production_price)"), "costing"],
      ],
      include: [
        {
          model: Vendors,
          required: false,
          attributes: [],
        },
        {
          model: ProductList,
          required: true,
          attributes: [],
        },
        {
          model: Production,
          required: true,
          attributes: [],
          where: {
            id,
            warehouse_id: warehouseId,
            isDeleted: false,
          },
        },
        {
          model: StockManagement,
          required: true,
          attributes: [],
          where: {
            isDeleted: false,
          },
        },
      ],
      where: {
        isDeleted: false,
      },
      group: [
        "production_raw_used.product_id",
        "production_raw_used.vendor_id",
      ],
      raw: true,
    });

    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getProductionFinishProduct/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Production_Finish_Product.findAll({
      include: [
        {
          model: ProductList,
        },
        {
          model: Production_finish_raw_used,
          include: [
            {
              model: Production_Raw_Used,
              include: [
                {
                  model: ProductList,
                },
              ],
            },
          ],
        },
      ],
      where: [
        {
          production_id: id,
          isDeleted: false,
        },
      ],
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/getProductionFinishProductNew/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await ProductList.findAll({
      attributes: [
        "product_id",
        "product_name",
        "product_code",
        "unit_of_measure",
        [
          sequelize.literal(`(
          SELECT SUM(s.stock)
          FROM stock_managements AS s
          WHERE s.product_id = product_list.product_id and isDeleted = false
        )`),
          "totalStock",
        ],
      ],
      include: [
        {
          model: Production_Finish_Product,
          required: true,
          attributes: ["id", "product_id", "produce", "unit_price", "costing"],
          where: {
            production_id: id,
            isDeleted: false,
          },
        },
      ],
      raw: true,
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// router.route("/updateProduction").put(async (req, res) => {
//   try {
//     const {
//       userLoggedID,
//       raws,
//       productionId,
//       finishedProductRows,
//       description,
//       dateProduce,
//       wareHouseID,
//       id,
//       shift,
//     } = req.body;

//     console.log("finish", finishedProductRows);
//     console.log("Finish Raws", finishedProductRows[0].raw_used);
//     console.log("raws", raws);

//     const roundToTwo = (num) => {
//       return Math.round((num + Number.EPSILON) * 100) / 100;
//     };

//     const findCutoff = await Cutoff.findOne({
//       where: {
//         [Op.and]: [
//           {
//             from: { [Op.lte]: dateProduce },
//           },
//           {
//             to: { [Op.gte]: dateProduce },
//           },
//         ],
//         isDeleted: false,
//       },
//       order: [["createdAt", "DESC"]],
//     });

//
//      const isPosted = findCutoff?.isPosted || false;

//     if (isPosted) {
//       return res.status(409).json({ message: "Cutoff is already posted" });
//     }

//     const isUpdate = await Production.update(
//       {
//         desc: description === "" ? null : description,
//         date_produce: dateProduce,
//         shift: shift,
//       },
//       {
//         where: {
//           id: id,
//         },
//       }
//     );

//     const usedStockIds = new Set();
//     const productionRawUsedsMap = new Map();

//     if (isUpdate) {
//       const existingProductionRawUsed = await Production_Raw_Used.findAll({
//         where: {
//           production_id: id,
//           isDeleted: false,
//         },
//       });

//       console.log(existingProductionRawUsed, "existing======");

//       for (const existingRaw of existingProductionRawUsed) {
//         console.log("ID TO DELETE", existingRaw.id);
//         const stockItem = await StockManagement.findOne({
//           where: {
//             stock_management_id: existingRaw.stock_management_id,
//             product_id: existingRaw.product_id,
//             warehouse_id: wareHouseID,
//             isDeleted: false,
//           },
//         });

//         // if (stockItem) {
//         //   stockItem.stock += existingRaw.weight_in;
//         //   await stockItem.save();
//         // }

//         // await Production_finish_raw_used.destroy({
//         //   where: { production_raw_used_id: existingRaw.id },
//         // });
//         await Production_finish_raw_used.update(
//           { isDeleted: true },
//           {
//             where: { production_raw_used_id: existingRaw.id, isDeleted: false },
//           }
//         );
//       }

//       // await Production_Raw_Used.destroy({ where: { production_id: id } });
//       await Production_Raw_Used.update(
//         { isDeleted: true },
//         { where: { production_id: id, isDeleted: false } }
//       );
//       // await Production_Finished_Product.destroy({
//       //   where: { production_id: id },
//       // });

//       await Production_Finished_Product.update(
//         { isDeleted: true },
//         {
//           where: { production_id: id, isDeleted: false },
//         }
//       );
//       for (const data of raws) {
//         const array_product_id = data.prod_id;
//         let remaining_quantity = roundToTwo(Number(data.weightIn));

//         const stockChanges = [];

//         while (remaining_quantity > 0) {
//           const inventory = await StockManagement.findOne({
//             where: {
//               product_id: array_product_id,
//               warehouse_id: wareHouseID,
//               stock: { [Op.gt]: 0 },
//               stock_management_id: { [Op.notIn]: [...usedStockIds] },
//             },
//             order: [["createdAt", "ASC"]],
//           });

//           if (!inventory) {
//             console.log(
//               "Not enough stock available for product:",
//               array_product_id
//             );
//             break;
//           }

//           const availableStock = Number(inventory.stock);
//           const toDeductQuantity = roundToTwo(
//             Math.min(remaining_quantity, availableStock)
//           );

//           // await inventory.update({
//           //   stock: roundToTwo(Number(inventory.stock) - toDeductQuantity),
//           // });

//           usedStockIds.add(inventory.stock_management_id);

//           stockChanges.push({
//             stock_management_id: inventory.stock_management_id,
//             new_stock: roundToTwo(availableStock - toDeductQuantity),
//           });

//           const productionRawUsed = await Production_Raw_Used.create({
//             production_id: id,
//             stock_management_id: inventory.stock_management_id,
//             product_id: array_product_id,
//             production_price: data.prod_price,
//             weight_in: toDeductQuantity,
//           });

//           productionRawUsedsMap.set(
//             String(array_product_id),
//             productionRawUsed
//           );
//           remaining_quantity = roundToTwo(
//             remaining_quantity - toDeductQuantity
//           );
//         }
//       }

//       // Debug: Log the map contents
//       console.log(
//         "Production Raw Useds Map:",
//         Array.from(productionRawUsedsMap.entries()).map(([key, value]) => ({
//           key,
//           id: value.id,
//         }))
//       );

//       // Process finished products
//       for (const data of finishedProductRows) {
//         console.log("Processing finished product:", data);
//         // Calculate total cost from raw materials
//         let totalCost = 0;
//         for (const raw_used of data.raw_used) {
//           totalCost += parseFloat(raw_used.costing);
//         }

//         const productionFinishProduct = await Production_Finish_Product.create({
//           production_id: id,
//           product_id: data.prod_id,
//           produce: data.produce,
//           weight_in: data.weightIn,
//         });

//         // Update stock for finished product
//         // const fetchStock = await StockManagement.findOne({
//         //   where: {
//         //     product_id: data.prod_id,
//         //     warehouse_id: fetchWarehouse.warehouse_id,
//         //   },
//         // });

//         // if (fetchStock) {
//         //   const existingStock = parseFloat(fetchStock.stock);
//         //   const newStockIn = parseFloat(data.produce);
//         //   const totalStock = existingStock + newStockIn;

//         //   await StockManagement.update(
//         //     {
//         //       stock: totalStock,
//         //     },
//         //     {
//         //       where: {
//         //         product_id: data.prod_id,
//         //         warehouse_id: fetchWarehouse.warehouse_id,
//         //       },
//         //     }
//         //   );
//         // } else {

//         //Create after ma produce
//         // await StockManagement.create({
//         //   warehouse_id: selectedWarehouse,
//         //   product_id: data.prod_id,
//         //   stock: data.produce,
//         //   price: totalCost / data.produce,
//         //   vendor_id: null,
//         //   date_in: date,
//         //   in: data.produce,
//         //   price_in: totalCost / data.produce,
//         //   transaction_number: production_id,
//         //   module_in_from: "Production",
//         // });
//         // }
//         //

//         // Process raw materials used for this finished product
//         for (const raw_used of data.raw_used) {
//           console.log("Processing raw_used:", raw_used);
//           console.log(
//             "Looking for raw_product_id:",
//             // String(raw_used.raw_stock_id)
//             String(raw_used.raw_product_id)
//           );

//           // Get the corresponding raw used entry using raw_stock_id
//           const correspondingRawUsed = productionRawUsedsMap.get(
//             // String(raw_used.raw_stock_id)
//             String(raw_used.raw_product_id)
//           );

//           if (correspondingRawUsed) {
//             console.log(
//               "Found corresponding raw used:",
//               correspondingRawUsed.id
//             );

//             await Production_finish_raw_used.create({
//               production_finish_product_id: productionFinishProduct.id,
//               production_raw_used_id: correspondingRawUsed.id,
//               weight_in: raw_used.weightIn,
//               net_weight: raw_used.newWeight,
//             });
//           } else {
//             console.log(
//               "No corresponding raw used found for:",
//               raw_used.raw_product_id
//             );
//             console.log(
//               "Available raw used ids:",
//               Array.from(productionRawUsedsMap.keys())
//             );
//           }
//         }
//       }
//     }

//     return res.status(200).json();
//   } catch (error) {
//     console.log(error);
//   }
// });

router.route("/updateProduction").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      userLoggedID,
      raws,
      productionId,
      finishedProductRows,
      description,
      dateProduce,
      wareHouseID,
      id,
      shift,
      materialToDelete,
    } = req.body;

    const roundToTwo = (num) => {
      return Math.round((num + Number.EPSILON) * 100) / 100;
    };

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: dateProduce },
          },
          {
            to: { [Op.gte]: dateProduce },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      await transaction.rollback();
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const isUpdate = await Production.update(
      {
        desc: description === "" ? null : description,
        date_produce: dateProduce,
        shift: shift,
      },
      {
        where: {
          id: id,
        },
        transaction,
      }
    );

    // Handle Update For Materials
    async function handleUpdateMaterials({
      id,
      productionId,
      raws,
      wareHouseID,
      findCutoff,
      dateProduce,
      materialToDelete,
    }) {
      // Handle Delete Materials
      async function deleteMaterial(data, weightIn) {
        const array_product_id = data.prod_id;
        let remaining_quantity = roundToTwo(Number(weightIn));
        const usedStockIds = new Set();

        while (remaining_quantity > 0) {
          const inventory = await StockManagement.findOne({
            where: {
              product_id: array_product_id,
              warehouse_id: wareHouseID,
              stock: {
                [Op.or]: [{ [Op.gt]: 0 }, { [Op.eq]: 0 }],
              },
              stock_management_id: { [Op.notIn]: [...usedStockIds] },
              isDeleted: false,
            },
            transaction, // Putting transaction here is necessary to save the changes from adding new stock
            order: [["createdAt", "ASC"]],
          });

          if (!inventory) {
            console.log(
              "Not enough stock available for product:",
              array_product_id
            );
            break;
          }

          const availableStock = Number(inventory.stock);
          const toAddQuantity =
            availableStock < remaining_quantity
              ? Math.max(remaining_quantity, availableStock)
              : Math.min(remaining_quantity, availableStock);

          await inventory.update(
            {
              stock: roundToTwo(Number(inventory.stock) + toAddQuantity),
            },
            {
              transaction,
            }
          );

          usedStockIds.add(inventory.stock_management_id);

          remaining_quantity = roundToTwo(remaining_quantity - toAddQuantity);
        }
      }

      for (const material of materialToDelete) {
        await deleteMaterial(material, material.weightIn);

        // Mark existing records as deleted in Production Raw Used and Inventory Report
        await Production_Raw_Used.update(
          {
            isDeleted: true,
          },
          {
            where: {
              production_id: id,
              product_id: material.prod_id,
              isDeleted: false,
            },
            transaction,
          }
        );

        await Inventory_Report.update(
          {
            isDeleted: true,
          },
          {
            where: {
              transaction_id: productionId,
              product_id: material.prod_id,
              isDeleted: false,
            },
            transaction,
          }
        );
      }

      // To be used by Finished Product function
      const productionRawUsedsMap = new Map();

      // Manages stock usage by adding or deducting stock from inventory based on specified actions
      async function handleStockUsage(data, weightIn, action) {
        const array_product_id = data.prod_id;
        let remaining_quantity =
          action === "Deduct"
            ? Math.abs(roundToTwo(Number(weightIn)))
            : roundToTwo(Number(weightIn));
        const usedStockIds = new Set();
        const stockChanges = [];

        let stockClause = {};

        if (action === "Add" || action === "Update") {
          stockClause = {
            [Op.or]: [{ [Op.gt]: 0 }, { [Op.eq]: 0 }],
          };
        } else {
          stockClause = {
            [Op.gt]: 0,
          };
        }

        while (remaining_quantity > 0) {
          const inventory = await StockManagement.findOne({
            where: {
              product_id: array_product_id,
              warehouse_id: wareHouseID,
              stock: stockClause,
              stock_management_id: { [Op.notIn]: [...usedStockIds] },
              isDeleted: false,
            },
            transaction,
            order: [["createdAt", "ASC"]],
          });

          if (!inventory) {
            console.log(
              "Not enough stock available for product:",
              array_product_id
            );
            break;
          }

          const availableStock = Number(inventory.stock);
          const toDeductQuantity = roundToTwo(
            (action === "Add" || action === "Update") &&
              availableStock < remaining_quantity
              ? Math.max(remaining_quantity, availableStock)
              : Math.min(remaining_quantity, availableStock)
          );

          if (action === "Create") {
            await inventory.update(
              {
                stock: roundToTwo(Number(inventory.stock) - toDeductQuantity),
              },
              {
                transaction,
              }
            );
          }

          if (action === "Add") {
            await inventory.increment("stock", {
              by: toDeductQuantity,
              transaction,
            });
          }

          if (action === "Deduct") {
            await inventory.decrement("stock", {
              by: toDeductQuantity,
              transaction,
            });
          }

          usedStockIds.add(inventory.stock_management_id);

          stockChanges.push({
            stock_management_id: inventory.stock_management_id,
            new_stock: roundToTwo(availableStock - toDeductQuantity),
          });

          if (action === "Create" || action === "Update") {
            const productionRawUsed = await Production_Raw_Used.create(
              {
                production_id: id,
                stock_management_id: inventory.stock_management_id,
                product_id: array_product_id,
                production_price: data.prod_price,
                weight_in: toDeductQuantity,
                costing: data.cost,
              },
              {
                transaction,
              }
            );

            // Insert to inventory_report table
            await Inventory_Report.create(
              {
                cut_off_id: findCutoff.id,
                product_id: data.prod_id,
                average_price: data.prod_price,
                product_out: toDeductQuantity,
                unit_price: inventory.price,
                from_counting: 0,
                date_in: dateProduce,
                sales_invoice_id: null,
                isDeleted: false,
                transaction_id: productionId,
                module_in_from: "Production",
              },
              {
                transaction,
              }
            );

            productionRawUsedsMap.set(
              String(array_product_id),
              productionRawUsed
            );
          }

          remaining_quantity = roundToTwo(
            remaining_quantity - toDeductQuantity
          );
        }
      }

      // Handle Update and Create Material
      async function processMaterialConsumption(
        data,
        production_id, // Production Transaction id
        wareHouseID,
        findCutoff,
        dateProduce,
        id, // Production id
        action,
        handleStockUsage
      ) {
        // Handle update existing material
        if (action === "Update") {
          // Get the Stock Quantity difference
          const totalExistingWeightInMaterial = await Production_Raw_Used.sum(
            "weight_in",
            {
              where: {
                production_id: id,
                product_id: data.prod_id,
                isDeleted: false,
              },
              transaction,
            }
          );

          const quantityDifference =
            totalExistingWeightInMaterial - data.weightIn;

          // Mark existing records as deleted in Production Raw Used and Inventory Report
          // for the specified production and product, allowing for the creation of new entries.
          await Production_Raw_Used.update(
            {
              isDeleted: true,
            },
            {
              where: {
                production_id: id,
                product_id: data.prod_id,
                isDeleted: false,
              },
              transaction,
            }
          );

          await Inventory_Report.update(
            {
              isDeleted: true,
            },
            {
              where: {
                transaction_id: production_id,
                product_id: data.prod_id,
                isDeleted: false,
              },
              transaction,
            }
          );

          if (quantityDifference > 0) {
            await handleStockUsage(data, quantityDifference, "Add");
          } else if (quantityDifference < 0) {
            await handleStockUsage(data, quantityDifference, "Deduct");
          }

          await handleStockUsage(data, data.weightIn, action);

          // Handle Create Material
        } else if (action === "Create") {
          await handleStockUsage(data, data.weightIn, action);
        }
      }

      for (const item of raws) {
        // If Material is newly added Create it
        // If its Existing Material Update it
        const action = item.newItem ? "Create" : "Update";
        await processMaterialConsumption(
          item,
          productionId,
          wareHouseID,
          findCutoff,
          dateProduce,
          id,
          action,
          handleStockUsage
        );
      }

      return productionRawUsedsMap;
    }

    const productionRawUsedsMap = await handleUpdateMaterials({
      id,
      productionId,
      raws,
      wareHouseID,
      findCutoff,
      dateProduce,
      materialToDelete,
    });

    // Handle Update For Finished Product
    async function handleUpdateFinishedProduct() {
      // Delete all Finished Product first within the Production to avoid duplication of data
      await Production_Finish_Product.update(
        {
          isDeleted: true,
        },
        {
          where: {
            production_id: id,
            isDeleted: false,
          },
          transaction,
        }
      );

      // Process finished products
      for (const data of finishedProductRows) {
        console.log("Processing finished product:", data);
        // Calculate total cost from raw materials
        let totalCost = 0;
        for (const raw_used of data.raw_used) {
          totalCost += parseFloat(raw_used.costing);
        }

        const productionFinishProduct = await Production_Finish_Product.create(
          {
            production_id: id,
            product_id: data.prod_id,
            produce: data.produce,
            weight_in: data.weightIn,
          },
          {
            transaction,
          }
        );

        // Process raw materials used for this finished product
        for (const raw_used of data.raw_used) {
          console.log("Processing raw_used:", raw_used);
          console.log(
            "Looking for raw_product_id:",
            // String(raw_used.raw_stock_id)
            String(raw_used.raw_product_id)
          );

          // Get the corresponding raw used entry using raw_stock_id
          const correspondingRawUsed = productionRawUsedsMap.get(
            // String(raw_used.raw_stock_id)
            String(raw_used.raw_product_id)
          );

          if (correspondingRawUsed) {
            console.log(
              "Found corresponding raw used:",
              correspondingRawUsed.id
            );

            await Production_finish_raw_used.create(
              {
                production_finish_product_id: productionFinishProduct.id,
                production_raw_used_id: correspondingRawUsed.id,
                weight_in: raw_used.weightIn,
                net_weight: parseFloat(
                  String(raw_used.newWeight).replace(/,/g, "")
                ), // Remove comma then Convert to Number
              },
              {
                transaction,
              }
            );
          } else {
            console.log(
              "No corresponding raw used found for:",
              raw_used.raw_product_id
            );
            console.log(
              "Available raw used ids:",
              Array.from(productionRawUsedsMap.keys())
            );
          }
        }
      }
    }

    await handleUpdateFinishedProduct();

    await transaction.commit();
    res.status(200).json({ message: "Production Updated Successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.route("/updateProductionNew").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      userLoggedID,
      raws,
      productionId,
      finishedProductRows,
      description,
      startDate,
      dateProduce,
      wareHouseID,
      id,
      shift,
      machine,
      materialToDelete,
      consumableId,
      quantity,
      averagePrice,
      total,
      totalQuantity,
      totalProduce,
      consumables,
    } = req.body;

    const roundToTwo = (num) => {
      return Math.round((num + Number.EPSILON) * 100) / 100;
    };

    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: dateProduce },
          },
          {
            to: { [Op.gte]: dateProduce },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;

    if (isPosted) {
      await transaction.rollback();
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const lossQuantity = parseNumber(totalQuantity) - parseNumber(totalProduce);

    const lossPercent = (lossQuantity / parseNumber(totalQuantity)) * 100;

    const isUpdate = await Production.update(
      {
        desc: description === "" ? null : description,
        start_date: startDate,
        date_produce: dateProduce,
        shift: shift,
        machine,
        total_quantity: totalQuantity,
        total_produce: totalProduce,
        loss_percent: lossPercent,
        loss_quantity: lossQuantity,
        // consumable_id: consumableId,
        // quantity: parseNumber(quantity),
        // average_price: parseNumber(averagePrice),
        // total: parseNumber(total),
      },
      {
        where: {
          id: id,
        },
        transaction,
      }
    );

    // --- For Consumable ---
    const returnConsumableStock = async () => {
      const consumablesToReturn = await ProductionConsumableUsed.findAll({
        attributes: ["stock_management_id", "weight_in"],
        where: {
          production_id: id,
          isDeleted: false,
        },
        transaction,
      });

      await Promise.all(
        consumablesToReturn.map((item) =>
          StockManagement.increment("stock", {
            by: item.weight_in,
            where: {
              stock_management_id: item.stock_management_id,
              isDeleted: false,
            },
            transaction,
          })
        )
      );
    };

    const deleteConsumables = async () => {
      const consumableList = await ProductionConsumableUsed.findAll({
        attributes: ["product_id"],
        where: {
          production_id: id,
          isDeleted: false,
        },
        raw: true,
      });

      await Inventory_Report.update(
        {
          isDeleted: true,
        },
        {
          where: {
            product_id: consumableList.map((item) => item.product_id),
            transaction_id: productionId,
            isDeleted: false,
          },
          transaction,
        }
      );

      await ProductionConsumableUsed.update(
        {
          isDeleted: true,
        },
        {
          where: {
            production_id: id,
          },
          transaction,
        }
      );
    };

    const updateConsumable = async () => {
      for (const consumableItems of consumables) {
        let remainingStock = parseNumber(consumableItems.weightIn);
        const consumableProductId = consumableItems.prod_id;
        const consumableUnitPrice =
          parseNumber(consumableItems.prod_price) ?? 0;
        const consumableRecords = [];

        // Find all stockmanagement related with the consumable product
        const consumableStockList = await StockManagement.findAll({
          where: {
            product_id: consumableProductId,
            warehouse_id: wareHouseID,
            isDeleted: false,
            stock: {
              [Op.gt]: 0,
            },
          },
          transaction,
        });

        // Loop through each consumable stock batch and allocate usage for the production
        for (const [index, item] of consumableStockList.entries()) {
          if (remainingStock <= 0) continue; // Skip if the remaining stock is 0 to avoid unnecessary creation of ProductionConsumableUsed

          const amountToDecrement = Math.min(remainingStock, item.stock);

          // Record this consumable usage entry for the production
          consumableRecords.push({
            production_id: id,
            product_id: consumableProductId,
            stock_management_id: item.stock_management_id,
            weight_in: parseNumber(amountToDecrement) ?? 0,
            production_price: consumableUnitPrice,
            costing: parseNumber(amountToDecrement) * consumableUnitPrice,
          });

          remainingStock -= amountToDecrement;
        }

        if (consumableRecords.length > 0) {
          await ProductionConsumableUsed.bulkCreate(consumableRecords, {
            transaction,
          });
        }
      }

      // Immediately decrease stock
      if (consumables.length) {
        const validateConsumableStocks = async (consumableList) => {
          for (const consumableItem of consumableList) {
            const { stock } = await StockManagement.findOne({
              attributes: ["stock"],
              where: {
                stock_management_id: consumableItem.stock_management_id,
                isDeleted: false,
              },
              raw: true,
              transaction,
            });

            if (consumableItem.weight_in <= stock) continue; // Skip if the product has enough stock

            // Total available/remaining stock to be displayed for user information or swal in frontend
            const availableStock = await StockManagement.sum("stock", {
              where: {
                product_id: consumableItem.product_id,
                warehouse_id: wareHouseID,
              },
              transaction,
            });

            const { product_name } = await ProductList.findOne({
              attributes: ["product_name"],
              where: {
                product_id: consumableItem.product_id,
              },
              transaction,
              raw: true,
            });

            return {
              availableStock,
              productName: product_name,
            };
          }

          return null;
        };

        // Get all consumable used from the production
        const consumableList = await ProductionConsumableUsed.findAll({
          where: {
            production_id: id,
            isDeleted: false,
          },
          transaction,
        });

        // To validate consumable stock availability
        const validationError = await validateConsumableStocks(consumableList);

        if (validationError) {
          // Will not proceed to approve transaction if the consumable has insufficient stock
          await transaction.rollback();
          return res.status(409).json({
            message: "Insufficient Consumable stock.",
            ...validationError,
          });
        }

        // If the comsumable has enough stock proceed with the decrementing of stock
        await Promise.all([
          ...consumableList.map((item) =>
            StockManagement.decrement("stock", {
              by: item.weight_in,
              where: {
                stock_management_id: item.stock_management_id,
                isDeleted: false,
              },
              transaction,
            })
          ),
          // Save Record for Inventory Report Product Out
          ...consumableList.map((item) =>
            Inventory_Report.create(
              {
                cut_off_id: findCutoff.id,
                product_id: item.product_id,
                average_price: item.production_price,
                product_out: item.weight_in,
                unit_price: item.production_price,
                from_counting: 0,
                date_in: dateProduce,
                sales_invoice_id: null,
                isDeleted: false,
                transaction_id: productionId,
                module_in_from: "Production",
              },
              { transaction }
            )
          ),
        ]);
      }
    };

    // Return all consumable stock first
    await returnConsumableStock();
    // Delete all Recorded Consumable for the specific production id
    await deleteConsumables();
    // Proceed with New Update for consumable
    await updateConsumable();

    // --- Handle Update For Materials ---
    async function handleUpdateMaterials({
      id,
      productionId,
      raws,
      wareHouseID,
      findCutoff,
      dateProduce,
      materialToDelete,
    }) {
      // Handle Delete Materials
      async function deleteMaterial(data, weightIn) {
        const array_product_id = data.prod_id;
        const vendorId = data.vendor_id;
        let remaining_quantity = roundToTwo(Number(weightIn));
        const usedStockIds = new Set();

        while (remaining_quantity > 0) {
          const inventory = await StockManagement.findOne({
            where: {
              product_id: array_product_id,
              ...(vendorId !== "Any" && vendorId && { vendor_id: vendorId }),
              warehouse_id: wareHouseID,
              stock: { [Op.or]: [{ [Op.gt]: 0 }, { [Op.eq]: 0 }] },
              stock_management_id: { [Op.notIn]: [...usedStockIds] },
              isDeleted: false,
            },
            transaction, // Putting transaction here is necessary to save the changes from adding new stock
            order: [["createdAt", "ASC"]],
          });

          if (!inventory) {
            console.log(
              "Not enough stock available for product:",
              array_product_id
            );
            break;
          }

          const availableStock = Number(inventory.stock);
          const toAddQuantity =
            availableStock < remaining_quantity
              ? Math.max(remaining_quantity, availableStock)
              : Math.min(remaining_quantity, availableStock);

          // await inventory.update(
          //   {
          //     stock: roundToTwo(Number(inventory.stock) + toAddQuantity),
          //   },
          //   {
          //     transaction,
          //   }
          // );

          usedStockIds.add(inventory.stock_management_id);

          remaining_quantity = roundToTwo(remaining_quantity - toAddQuantity);
        }
      }

      for (const material of materialToDelete) {
        await deleteMaterial(material, material.weightIn);

        // Mark existing records as deleted in Production Raw Used and Inventory Report
        await Production_Raw_Used.update(
          {
            isDeleted: true,
          },
          {
            where: {
              production_id: id,
              product_id: material.prod_id,
              isDeleted: false,
            },
            transaction,
          }
        );

        await Inventory_Report.update(
          {
            isDeleted: true,
          },
          {
            where: {
              transaction_id: productionId,
              product_id: material.prod_id,
              isDeleted: false,
            },
            transaction,
          }
        );
      }

      // To be used by Finished Product function
      const productionRawUsedsMap = new Map();

      // Manages stock usage by adding or deducting stock from inventory based on specified actions
      async function handleStockUsage(data, weightIn, action) {
        const array_product_id = data.prod_id;
        const vendorId = data.vendor_id;

        let remaining_quantity =
          action === "Deduct"
            ? Math.abs(roundToTwo(Number(weightIn)))
            : roundToTwo(Number(weightIn));
        const usedStockIds = new Set();
        const stockChanges = [];

        let stockClause = {
          [Op.gt]: 0,
        };

        // if (action === "Add" || action === "Update") {
        //   stockClause = {
        //     [Op.or]: [{ [Op.gt]: 0 }, { [Op.eq]: 0 }],
        //   };
        // } else {
        //   stockClause = {
        //     [Op.gt]: 0,
        //   };
        // }

        while (remaining_quantity > 0) {
          const inventory = await StockManagement.findOne({
            where: {
              product_id: array_product_id,
              ...(vendorId !== "Any" && vendorId && { vendor_id: vendorId }),
              transaction_number: { [Op.ne]: "Product Creation" },
              warehouse_id: wareHouseID,
              stock: stockClause,
              stock_management_id: { [Op.notIn]: [...usedStockIds] },
              isDeleted: false,
            },
            transaction,
            order: [["createdAt", "ASC"]],
          });

          if (!inventory) {
            console.log(
              "Not enough stock available for product:",
              array_product_id
            );
            break;
          }

          const availableStock = Number(inventory.stock);
          const toDeductQuantity = Math.min(remaining_quantity, availableStock);
          // const toDeductQuantity = roundToTwo(
          //   (action === "Add" || action === "Update") &&
          //     availableStock < remaining_quantity
          //     ? Math.max(remaining_quantity, availableStock)
          //     : Math.min(remaining_quantity, availableStock)
          // );

          // if (action === "Create") {
          //   await inventory.update(
          //     {
          //       stock: roundToTwo(Number(inventory.stock) - toDeductQuantity),
          //     },
          //     {
          //       transaction,
          //     }
          //   );
          // }

          // if (action === "Add") {
          //   await inventory.increment("stock", {
          //     by: toDeductQuantity,
          //     transaction,
          //   });
          // }

          // if (action === "Deduct") {
          //   await inventory.decrement("stock", {
          //     by: toDeductQuantity,
          //     transaction,
          //   });
          // }

          usedStockIds.add(inventory.stock_management_id);

          stockChanges.push({
            stock_management_id: inventory.stock_management_id,
            new_stock: roundToTwo(availableStock - toDeductQuantity),
          });

          if (action === "Create" || action === "Update") {
            const productionRawUsed = await Production_Raw_Used.create(
              {
                production_id: id,
                stock_management_id: inventory.stock_management_id,
                product_id: array_product_id,
                vendor_id: data.vendor_id === "Any" ? null : data.vendor_id,
                production_price: data.prod_price,
                weight_in: toDeductQuantity,
                costing: data.cost,
              },
              {
                transaction,
              }
            );

            // Insert to inventory_report table
            await Inventory_Report.create(
              {
                cut_off_id: findCutoff.id,
                product_id: data.prod_id,
                average_price: data.prod_price,
                product_out: toDeductQuantity,
                unit_price: inventory.price,
                from_counting: 0,
                date_in: dateProduce,
                sales_invoice_id: null,
                isDeleted: false,
                transaction_id: productionId,
                module_in_from: "Production",
              },
              {
                transaction,
              }
            );

            productionRawUsedsMap.set(
              String(array_product_id),
              productionRawUsed
            );
          }

          remaining_quantity = roundToTwo(
            remaining_quantity - toDeductQuantity
          );
        }
      }

      // Handle Update and Create Material
      async function processMaterialConsumption(
        data,
        production_id, // Production Transaction id
        wareHouseID,
        findCutoff,
        dateProduce,
        id, // Production id
        action,
        handleStockUsage
      ) {
        // Handle update existing material
        if (action === "Update") {
          // Get the Stock Quantity difference
          const totalExistingWeightInMaterial = await Production_Raw_Used.sum(
            "weight_in",
            {
              where: {
                production_id: id,
                product_id: data.prod_id,
                isDeleted: false,
              },
              transaction,
            }
          );

          const quantityDifference =
            totalExistingWeightInMaterial - data.weightIn;

          // Mark existing records as deleted in Production Raw Used and Inventory Report
          // for the specified production and product, allowing creation of new entries.
          await Production_Raw_Used.update(
            {
              isDeleted: true,
            },
            {
              where: {
                production_id: id,
                product_id: data.prod_id,
                isDeleted: false,
              },
              transaction,
            }
          );

          await Inventory_Report.update(
            {
              isDeleted: true,
            },
            {
              where: {
                transaction_id: production_id,
                product_id: data.prod_id,
                isDeleted: false,
              },
              transaction,
            }
          );

          if (quantityDifference > 0) {
            await handleStockUsage(data, quantityDifference, "Add");
          } else if (quantityDifference < 0) {
            await handleStockUsage(data, quantityDifference, "Deduct");
          }

          await handleStockUsage(data, data.weightIn, action);

          // Handle Create Material
        } else if (action === "Create") {
          await handleStockUsage(data, data.weightIn, action);
        }
      }

      for (const item of raws) {
        // If Material is newly added Create it
        // If its Existing Material Update it
        const action = item.newItem ? "Create" : "Update";
        await processMaterialConsumption(
          item,
          productionId,
          wareHouseID,
          findCutoff,
          dateProduce,
          id,
          action,
          handleStockUsage
        );
      }

      return productionRawUsedsMap;
    }

    const productionRawUsedsMap = await handleUpdateMaterials({
      id,
      productionId,
      raws,
      wareHouseID,
      findCutoff,
      dateProduce,
      materialToDelete,
    });

    // --- Handle Update For Finished Product ---
    async function handleUpdateFinishedProduct() {
      // Delete all Finished Product first within the Production to avoid duplication of data
      await Production_Finish_Product.update(
        {
          isDeleted: true,
        },
        {
          where: {
            production_id: id,
            isDeleted: false,
          },
          transaction,
        }
      );

      // Create finished products
      for (const data of finishedProductRows) {
        const productionFinishProduct = await Production_Finish_Product.create(
          {
            production_id: id,
            product_id: data.prod_id,
            produce: data.produce,
            weight_in: data.weightIn,
            unit_price: data.unit_price,
            costing: data.costing,
          },
          {
            transaction,
          }
        );
      }
    }

    await handleUpdateFinishedProduct();

    await transaction.commit();
    res.status(200).json({ message: "Production Updated Successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.route("/rejectProduction/:id").put(async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const isReject = await Production.update(
      {
        status: "Rejected",
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (isReject) {
      const rawUsed = await Production_Raw_Used.findAll({
        where: {
          production_id: id,
          isDeleted: false,
        },
      });

      // Return raw materials stock
      for (const raw of rawUsed) {
        const stock = await StockManagement.findOne({
          where: { stock_management_id: raw.stock_management_id },
        });

        if (stock) {
          const newStock = parseFloat(stock.stock) + parseFloat(raw.weight_in);

          await StockManagement.update(
            { stock: newStock },
            { where: { stock_management_id: raw.stock_management_id } }
          );
        }
      }

      // Return consumable stocks
      const consumablesToReturn = await ProductionConsumableUsed.findAll({
        attributes: ["stock_management_id", "weight_in"],
        where: {
          production_id: id,
          isDeleted: false,
        },
      });

      await Promise.all(
        consumablesToReturn.map((item) =>
          StockManagement.increment("stock", {
            by: item.weight_in,
            where: {
              stock_management_id: item.stock_management_id,
              isDeleted: false,
            },
          })
        )
      );

      // Delete production consumable
      await ProductionConsumableUsed.update(
        {
          isDeleted: true,
        },
        {
          where: {
            production_id: id,
          },
        }
      );

      // Delete inventory report
      await Inventory_Report.update(
        {
          isDeleted: true,
        },
        {
          where: {
            transaction_id: transactionId,
          },
        }
      );
    }

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});

router.route("/approveProduction/:id").put(async (req, res) => {
  try {
    const { id } = req.params;
    const { raws, finishedProductRows, wareHouseID } = req.body;

    const isApprove = await Production.update(
      {
        status: "Approved",
      },
      {
        where: {
          id: id,
        },
      }
    );

    const getProduction = await Production.findOne({
      where: {
        id: id,
      },
    });

    if (getProduction) {
      for (const finish of finishedProductRows) {
        let totalCost = 0;
        for (const raw_used of finish.raw_used) {
          totalCost += parseFloat(raw_used.costing);
        }

        await StockManagement.create({
          warehouse_id: wareHouseID,
          product_id: finish.prod_id,
          stock: finish.produce,
          price: totalCost / finish.produce,
          vendor_id: null,
          date_in: getProduction.date_produce,
          in: finish.produce,
          price_in: totalCost / finish.produce,
          transaction_number: getProduction.production_id,
          module_in_from: "Production",
        });
      }
    }

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});

router.route("/approveProductionNew/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      raws,
      finishedProductRows,
      wareHouseID,
      selectedConsumable,
      quantity,
      dateProduce,
      productionCode,
      consumables,
    } = req.body;

    // --- For Consumables ---
    // if (consumables.length) {
    //   const findCutoff = await Cutoff.findOne({
    //     where: {
    //       [Op.and]: [
    //         {
    //           from: { [Op.lte]: dateProduce },
    //         },
    //         {
    //           to: { [Op.gte]: dateProduce },
    //         },
    //       ],
    //       isDeleted: false,
    //     },
    //     order: [["createdAt", "DESC"]],
    //   });

    //   const validateConsumableStocks = async (consumableList) => {
    //     for (const consumableItem of consumableList) {
    //       const { stock } = await StockManagement.findOne({
    //         attributes: ["stock"],
    //         where: {
    //           stock_management_id: consumableItem.stock_management_id,
    //           isDeleted: false,
    //         },
    //         raw: true,
    //         transaction,
    //       });

    //       if (consumableItem.weight_in <= stock) continue; // Skip if the product has enough stock

    //       // Total available/remaining stock to be displayed for user information or swal in frontend
    //       const availableStock = await StockManagement.sum("stock", {
    //         where: {
    //           product_id: consumableItem.product_id,
    //           warehouse_id: wareHouseID,
    //         },
    //         transaction,
    //       });

    //       const { product_name } = await ProductList.findOne({
    //         attributes: ["product_name"],
    //         where: {
    //           product_id: consumableItem.product_id,
    //         },
    //         raw: true,
    //       });

    //       return {
    //         availableStock,
    //         productName: product_name,
    //       };
    //     }

    //     return null;
    //   };

    //   // Get all consumable used from the production
    //   const consumableList = await ProductionConsumableUsed.findAll({
    //     where: {
    //       production_id: id,
    //       isDeleted: false,
    //     },
    //   });

    //   // To validate consumable stock availability
    //   const validationError = await validateConsumableStocks(consumableList);

    //   if (validationError) {
    //     // Will not proceed to approve transaction if the consumable has insufficient stock
    //     await transaction.rollback();
    //     return res.status(409).json({
    //       message: "Insufficient Consumable stock.",
    //       ...validationError,
    //     });
    //   }

    //   // If the comsumable has enough stock proceed with the decrementing of stock
    //   await Promise.all([
    //     ...consumableList.map((item) =>
    //       StockManagement.decrement("stock", {
    //         by: item.weight_in,
    //         where: {
    //           stock_management_id: item.stock_management_id,
    //           isDeleted: false,
    //         },
    //         transaction,
    //       })
    //     ),
    //     // Save Record for Inventory Report Product Out
    //     ...consumableList.map((item) =>
    //       Inventory_Report.create(
    //         {
    //           cut_off_id: findCutoff.id,
    //           product_id: item.product_id,
    //           average_price: item.production_price,
    //           product_out: item.weight_in,
    //           unit_price: item.production_price,
    //           from_counting: 0,
    //           date_in: dateProduce,
    //           sales_invoice_id: null,
    //           isDeleted: false,
    //           transaction_id: productionCode,
    //           module_in_from: "Production",
    //         },
    //         { transaction }
    //       )
    //     ),
    //   ]);
    // }

    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));

    // Approve production
    const isApprove = await Production.update(
      {
        status: "Approved",
      },
      {
        where: {
          id: id,
        },
        transaction,
      }
    );

    const getProduction = await Production.findOne({
      where: {
        id: id,
      },
    });

    if (getProduction) {
      // --- Deduct raw materials from stock management ---

      // Get all the raw materials used in the production
      const rawMaterialUsed = await Production_Raw_Used.findAll({
        attributes: [
          [sequelize.col("product_name"), "product_name"],
          "stock_management_id",
          "weight_in",
        ],
        include: [
          {
            model: Production,
            required: true,
            attributes: [],
            where: {
              warehouse_id: wareHouseID,
              isDeleted: false,
            },
          },
          {
            model: ProductList,
            required: true,
            attributes: [],
          },
        ],
        where: {
          production_id: id,
          isDeleted: false,
        },
        raw: true,
        transaction,
      });

      // prettier-ignore
      // Deduct each raw material from stock management
      for (const { product_name, stock_management_id, weight_in } of rawMaterialUsed) {
        const stockManagementWhereClause = {
          stock_management_id,
          isDeleted: false,
        }

        // Get the stock management for quantity validation
        const stockManagement = await StockManagement.findOne({
          attributes: ["stock"],
          where: stockManagementWhereClause,
          raw: true,
          transaction,
        });

        // Validation: ensure there's stock before proceeding
        if ((stockManagement?.stock || 0) < weight_in) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Insufficient stock for product ${product_name}`,
          });
        }

        // Deduct the raw material from stock management
        await StockManagement.decrement("stock", {
          by: weight_in,
          where: stockManagementWhereClause,
          transaction
        })
      }

      // --- Add finished products to stock management ---

      const productionHistorySuffix = [];

      for (const finish of finishedProductRows) {
        // Create production history
        const productionHistory = await Production_History.create(
          {
            production_finish_product_id: finish.prod_finish_raw_id,
            internal_remarks: null,
            isDeleted: false,
          },
          { transaction }
        );

        const productionHistoryId = productionHistory.id;

        // Add new stock for the created finished product
        await StockManagement.create(
          {
            warehouse_id: wareHouseID,
            product_id: finish.prod_id,
            stock: parseNumber(finish.produce),
            price: parseNumber(finish.costing / finish.produce),
            vendor_id: null,
            date_in: getProduction.date_produce,
            in: parseNumber(finish.produce),
            price_in: parseNumber(finish.costing / finish.produce),
            transaction_number: getProduction.production_id,
            module_in_from: "Production",
            production_history_id: productionHistoryId,
          },
          {
            transaction,
          }
        );

        // Build raw materials suffix for production history suffix bulk creation
        for (const item of raws) {
          productionHistorySuffix.push({
            production_history_id: productionHistoryId,
            suffix: item.supplier_code,
            quantity: parseNumber(item.weightIn),
          });
        }
      }

      // Production history suffix bulk creation
      await Production_History_Suffix.bulkCreate(productionHistorySuffix, {
        transaction,
      });

      // --- For inventory journal record ---

      // Raw materials entries
      const rawMaterialOutEntries = await Promise.all(
        raws?.map(async (item) => {
          // To get the final inventory summary for the given product and warehouse
          const inventory = await irService.getInventorySummaryByProduct({
            selectedDate: dateProduce,
            productId: item.prod_id,
            warehouseId: wareHouseID,
            method: "findOne", // Model method
            transaction, // For sequelize.transaction
          });

          const averagePrice = irHelper.getAveragePrice(inventory);

          return {
            module_from: "Production",
            transaction_number: productionCode,
            product_id: item.prod_id,
            unit_price: averagePrice,
            date_in: dateProduce,
            quantity: item.weightIn,
            type: "out",
            warehouse_id: wareHouseID,
          };
        })
      );

      // Finished product entries
      const finishedProductInEntries = finishedProductRows?.map((item) => ({
        module_from: "Production",
        transaction_number: productionCode,
        product_id: item.prod_id,
        unit_price: item.unit_price,
        date_in: dateProduce,
        quantity: item.produce,
        type: "in",
        warehouse_id: wareHouseID,
      }));

      // // Consumable entries
      // const consumableOutEntries = consumables?.map((item) => ({
      //   module_from: "Production",
      //   transaction_number: productionCode,
      //   product_id: item.prod_id,
      //   unit_price: item.prod_price,
      //   date_in: dateProduce,
      //   quantity: item.weightIn,
      //   type: "out",
      //   warehouse_id: wareHouseID,
      // }));
      const consumableOutEntries = await Promise.all(
        consumables
          ?.filter((item) => item.prod_id !== "") // Skip if prod_id is empty
          ?.map(async (item) => {
            // To get the final inventory summary for the given product and warehouse
            const inventory = await irService.getInventorySummaryByProduct({
              selectedDate: dateProduce,
              productId: item.prod_id,
              warehouseId: wareHouseID,
              method: "findOne", // Model method
              transaction, // For sequelize.transaction
            });

            const averagePrice = irHelper.getAveragePrice(inventory);

            return {
              module_from: "Production",
              transaction_number: productionCode,
              product_id: item.prod_id,
              unit_price: averagePrice,
              date_in: dateProduce,
              quantity: item.weightIn,
              type: "out",
              warehouse_id: wareHouseID,
            };
          })
      );

      // Combine all entries
      const journalEntries = [
        ...(rawMaterialOutEntries || []),
        ...(finishedProductInEntries || []),
        ...(consumableOutEntries || []),
      ];

      // Create an inventory journal record (Raw materials, Finished product and Consumables)
      await Inventory_Journal.bulkCreate(journalEntries, { transaction });
    }

    await transaction.commit();
    return res.status(200).json();
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/deleteProduction").delete(async (req, res) => {
  try {
    const { primary_id, date_produce, production_code, status, warehouseId } =
      req.query;

    console.log(req.query);

    const getCutoff = await Cutoff.findOne({
      where: {
        isDeleted: false,
        [Op.and]: [
          {
            from: {
              [Op.lte]: date_produce, // from date is less than or equal to purchase date
            },
          },
          {
            to: {
              [Op.gte]: date_produce, // to date is greater than or equal to purchase date
            },
          },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    // const CutoffFrom = getCutoff.from;

    // const CutoffTo = getCutoff.to;
    const isPosted = getCutoff?.isPosted;
    const CutoffName = getCutoff?.name;

    if (isPosted) {
      return res.status(201).json({
        success: false,
        date_produce: date_produce,
        cutoff_name: CutoffName,
      });
    }

    // Reusable function for soft delete
    const softDelete = async (Model, whereClause) => {
      await Model.update(
        {
          isDeleted: true,
        },
        {
          where: whereClause,
        }
      );
    };

    // For Consumable Deletion
    if (status === "Pending" || status === "Approved") {
      const consumableList = await ProductionConsumableUsed.findAll({
        where: {
          production_id: primary_id,
          isDeleted: false,
        },
      });

      // Add back the stocks
      await Promise.all(
        consumableList.map((item) =>
          StockManagement.increment("stock", {
            by: item.weight_in,
            where: {
              stock_management_id: item.stock_management_id,
              isDeleted: false,
            },
          })
        )
      );
    }

    if (status === "Approved") {
      // Mark all transactions related to the current production as deleted
      await Inventory_Journal.update(
        {
          isDeleted: true,
        },
        {
          where: {
            transaction_number: production_code,
          },
        }
      );

      // Get all production history ids
      const productionHistoryIds = await Production_History.findAll({
        attributes: ["id"],
        include: [
          {
            model: Production_Finish_Product,
            required: true,
            attributes: [],
            where: {
              production_id: primary_id,
              isDeleted: false,
            },
          },
        ],
        where: {
          isDeleted: false,
        },
        raw: true,
      });

      // prettier-ignore
      // Delete production histories related to all finished products inside the production
      for (const { id } of productionHistoryIds) {
        await softDelete(Production_History, { id });
        await softDelete(Production_History_Suffix, { production_history_id: id });
      }

      // --- Return raw materials to inventory ---

      const fetchTODelete = await Production_Raw_Used.findAll({
        where: {
          production_id: primary_id,
          isDeleted: false,
        },
      });

      if (fetchTODelete) {
        for (const dataFetchTODelete of fetchTODelete) {
          const dataFetchTODelete_weight_in = dataFetchTODelete.weight_in;
          const dataFetchTODelete_stock_management_id =
            dataFetchTODelete.stock_management_id;

          StockManagement.increment("stock", {
            by: parseFloat(dataFetchTODelete_weight_in),
            where: {
              stock_management_id: dataFetchTODelete_stock_management_id,
            },
          });
        }
      }

      // // Base properties for inventory journal to avoid duplication
      // const baseProperties = {
      //   module_from: "Production",
      //   transaction_number: production_code,
      //   warehouse_id: warehouseId,
      //   date_in: date_produce,
      // };

      // // Query where clause
      // const whereClause = {
      //   production_id: primary_id,
      //   isDeleted: false,
      // };

      // // Raw Materials: Get all raw materials used
      // const rawMaterials = await Production_Raw_Used.findAll({
      //   attributes: ["product_id", "production_price", "weight_in"],
      //   where: whereClause,
      // });

      // // Raw Materials: Build the raw materials needed to return
      // const materialsToReturn = rawMaterials?.map((item) => ({
      //   ...baseProperties,
      //   product_id: item.product_id,
      //   unit_price: item.production_price,
      //   quantity: item.weight_in,
      //   type: "in",
      // }));

      // // Finished Products: Get all finished product made
      // const finishedProducts = await Production_Finish_Product.findAll({
      //   attributes: ["product_id", "produce", "unit_price"],
      //   where: whereClause,
      // });

      // // Finished Product: Build the finished products needed to return
      // const finishedProductsToReturn = finishedProducts?.map((item) => ({
      //   ...baseProperties,
      //   product_id: item.product_id,
      //   unit_price: item.unit_price,
      //   quantity: item.produce,
      //   type: "out",
      // }));

      // // Consumables: Get all consumables used
      // const consumables = await ProductionConsumableUsed.findAll({
      //   attributes: ["product_id", "production_price", "weight_in"],
      //   where: whereClause,
      // });

      // // Consumables: Build the consumables needed to return
      // const consumablesToReturn = consumables?.map((item) => ({
      //   ...baseProperties,
      //   product_id: item.product_id,
      //   unit_price: item.production_price,
      //   quantity: item.weight_in,
      //   type: "in",
      // }));

      // // Create an inventory journal for all the product
      // await bulkCreate([
      //   ...(materialsToReturn || []),
      //   ...(finishedProductsToReturn || []),
      //   ...(consumablesToReturn || []),
      // ]);
    }

    if (status == "Rejected") {
      await softDelete(Production, { id: primary_id });

      return res.status(200).json();
    }

    const checkPStock = await StockManagement.findAll({
      where: {
        transaction_number: production_code,
        isDeleted: false,
      },
    });

    // console.log("dsad");
    // console.log(checkPStock);

    for (const data of checkPStock) {
      const stock_management_id = data.stock_management_id;

      // --------------------------- first check sa sales --------------------------
      const checkSalesInventory = await SalesInvoiceInventory.findOne({
        where: {
          stock_management_id: stock_management_id,
          isDeleted: false,
        },
        include: [
          {
            model: SalesInvoice,
            required: true,
          },
        ],
      });

      if (checkSalesInventory) {
        return res.status(202).json({
          success: false,
          sales_number: checkSalesInventory.sales_invoice.transaction_id,
        });
      }

      // ---------------------------- Second check sa stock transfer -----------------------
      const checkStockTransferApproved =
        await StockTransferApproveProducts.findOne({
          where: {
            stockmanagement_id: stock_management_id,
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
        });

      if (checkStockTransferApproved) {
        // console.log(`checkStockTransferApproved`);
        // console.log(
        //   checkStockTransferApproved.stock_transfer_product.quantity_to_transfer
        // );
        return res.status(203).json({
          success: false,
          transaction_id:
            checkStockTransferApproved.stock_transfer_product
              .stock_transfer_mother.transaction_id,
        });
      }
    }

    // prettier-ignore
    // Soft delete all production related data across multiple tables
    await Promise.all([
      softDelete(Inventory_Report, { transaction_id: production_code }),
      softDelete(Production, { id: primary_id }),
      softDelete(StockManagement, { transaction_number: production_code }),
    ]);

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
