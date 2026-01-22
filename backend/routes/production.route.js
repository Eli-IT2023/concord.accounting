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
} = require("../db/models/associations");
const moment = require("moment-timezone");
const session = require("express-session");
const Production_Raw = require("../db/models/production_raw_used.model");
const Production_Finished_Product = require("../db/models/production_finish_product.model");

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
            include: [
              {
                model: Production_finish_raw_used,
                required: true,
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

//USED MODULE:
// Production
router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await Production.findOne({
      where: {
        production_id: {
          [Op.like]: `PROD-${currentMonth}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`Query Result:`, lastPayCode);

    let newRefCode;
    if (lastPayCode && lastPayCode.production_id) {
      // console.log(`Last Pay Code: ${lastPayCode.production_id}`);
      const latestRefCode = lastPayCode.production_id;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `PROD-${currentMonth}-${newSequence}`;
      } else {
        // If the refCode doesn't split correctly or sequence is not a number
        newRefCode = `PROD-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `PROD-${currentMonth}-00001`;
    }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//USED MODULE:
// Production
router.route("/getRawProd").get(async (req, res) => {
  const { selectedWarehouse } = req.query;
  try {
    const rawProducts = await StockManagement.findAll({
      where: {
        warehouse_id: selectedWarehouse,
        stock: { [Op.gt]: 0 },
      },
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
            product_category: { [Op.in]: ["Raw Materials", "Consumables"] },
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
        product_category: "Finish Product",
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
      },
    });

    const isPosted = findCutoff.isPosted;

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

router.get("/getProductionRawUsed/:id", async (req, res) => {
  const { id } = req.params;
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

router.route("/updateProduction").put(async (req, res) => {
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
    } = req.body;

    console.log("finish", finishedProductRows);
    console.log("Finish Raws", finishedProductRows[0].raw_used);
    console.log("raws", raws);

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
      },
    });

    const isPosted = findCutoff.isPosted;

    if (isPosted) {
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
      }
    );

    const usedStockIds = new Set();
    const productionRawUsedsMap = new Map();

    if (isUpdate) {
      const existingProductionRawUsed = await Production_Raw_Used.findAll({
        where: {
          production_id: id,
        },
      });

      for (const existingRaw of existingProductionRawUsed) {
        console.log("ID TO DELETE", existingRaw.id);
        const stockItem = await StockManagement.findOne({
          where: {
            stock_management_id: existingRaw.stock_management_id,
            product_id: existingRaw.product_id,
            warehouse_id: wareHouseID,
          },
        });

        if (stockItem) {
          stockItem.stock += existingRaw.weight_in;
          await stockItem.save();
        }

        // await Production_finish_raw_used.destroy({
        //   where: { production_raw_used_id: existingRaw.id },
        // });
        await Production_finish_raw_used.update(
          { isDeleted: true },
          {
            where: { production_raw_used_id: existingRaw.id, isDeleted: false },
          }
        );
      }

      // await Production_Raw_Used.destroy({ where: { production_id: id } });
      await Production_Raw_Used.update(
        { isDeleted: true },
        { where: { production_id: id, isDeleted: false } }
      );
      // await Production_Finished_Product.destroy({
      //   where: { production_id: id },
      // });

      await Production_Finished_Product.update(
        { isDeleted: true },
        {
          where: { production_id: id, isDeleted: false },
        }
      );
      for (const data of raws) {
        const array_product_id = data.prod_id;
        let remaining_quantity = roundToTwo(Number(data.weightIn));

        const stockChanges = [];

        while (remaining_quantity > 0) {
          const inventory = await StockManagement.findOne({
            where: {
              product_id: array_product_id,
              warehouse_id: wareHouseID,
              stock: { [Op.gt]: 0 },
              stock_management_id: { [Op.notIn]: [...usedStockIds] },
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

          await inventory.update({
            stock: roundToTwo(Number(inventory.stock) - toDeductQuantity),
          });

          usedStockIds.add(inventory.stock_management_id);

          stockChanges.push({
            stock_management_id: inventory.stock_management_id,
            new_stock: roundToTwo(availableStock - toDeductQuantity),
          });

          const productionRawUsed = await Production_Raw_Used.create({
            production_id: id,
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
          production_id: id,
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

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});

router.route("/rejectProduction/:id").put(async (req, res) => {
  try {
    const { id } = req.params;

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

router.route("/deleteProduction").delete(async (req, res) => {
  try {
    const { primary_id, date_produce, production_code, status } = req.query;

    console.log(req.query);

    const getCutoff = await Cutoff.findOne({
      where: {
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
    });

    // const CutoffFrom = getCutoff.from;

    // const CutoffTo = getCutoff.to;
    const isPosted = getCutoff.isPosted;
    const CutoffName = getCutoff.name;

    if (isPosted) {
      return res.status(201).json({
        success: false,
        date_produce: date_produce,
        cutoff_name: CutoffName,
      });
    }

    if (status == "Rejected") {
      // const prodDel = await Production.destroy({
      //   where: {
      //     id: primary_id,
      //   },
      // });

      const prodDel = await Production.update(
        {
          isDeleted: true,
        },
        {
          where: {
            id: primary_id,
          },
        }
      );

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

    const fetchTODelete = await Production_Raw_Used.findAll({
      where: {
        // stock_management_id: stock_management_id,
        production_id: primary_id,
        isDeleted: false,
      },
    });

    if (fetchTODelete) {
      for (const dataFetchTODelete of fetchTODelete) {
        console.log(dataFetchTODelete.production_price);
        const dataFetchTODelete_weight_in = dataFetchTODelete.weight_in;
        const dataFetchTODelete_stock_management_id =
          dataFetchTODelete.stock_management_id;

        console.log(
          dataFetchTODelete_weight_in,
          dataFetchTODelete_stock_management_id
        );

        StockManagement.increment("stock", {
          by: parseFloat(dataFetchTODelete_weight_in),
          where: {
            stock_management_id: dataFetchTODelete_stock_management_id,
          },
        });
      }
    }

    // await Production.destroy({
    //   where: {
    //     id: primary_id,
    //   },
    // });
    await Production.update(
      { isDeleted: true },
      {
        where: {
          id: primary_id,
        },
      }
    );

    // await StockManagement.destroy({
    //   where: {
    //     transaction_number: production_code,
    //   },
    // });
    await StockManagement.update(
      { isDeleted: true },
      {
        where: {
          transaction_number: production_code,
        },
      }
    );

    return res.status(200).json();
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
