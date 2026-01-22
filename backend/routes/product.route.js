const express = require("express");
const { where, Op, fn, col, literal, Sequelize } = require("sequelize");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Vendors,
  Activity_Log,
  Packaging,
  Source,
  Customer,
  ProductTagCustomer,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");

const session = require("express-session");
const moment = require("moment-timezone");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/lastCode").get(async (req, res) => {
  try {
    const latestProduct = await ProductList.findOne({
      order: [["createdAt", "DESC"]],
    });

    let nextyCode;
    if (latestProduct) {
      const lastCode = latestProduct.product_code;
      const lastNumber = parseInt(lastCode.substring(1), 10);
      nextyCode = (lastNumber + 1).toString().padStart(6, "0");
    } else {
      nextyCode = "000001";
    }

    // let latestNumber =
    //   latestProduct && latestProduct.getDataValue("latestNumber");
    // latestNumber = latestNumber
    //   ? (parseInt(latestNumber, 10) + 1).toString()
    //   : "1";
    return res.json(nextyCode);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//used Module :
// PAYABLE
router.route("/getProductData").get(async (req, res) => {
  try {
    const data = await ProductList.findAll({
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
        },
      ],
      order: [["createdAt", "DESC"]],
      // where: {
      //   status: {
      //     [Op.ne]: "Archive",
      //   },
      // },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductDataLio").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProductList.findAndCountAll({
      attributes: {
        include: [
          [
            fn("AVG", col("product_tag_vendors.product_price")),
            "averageProductPrice",
          ],
        ],
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: true,
        },
        {
          model: Product_Tag_Vendor,
          required: false,
          attributes: [], // Exclude individual vendor data if only avg is needed
        },
      ],
      group: ["product_list.product_id"], // Group by ProductList ID and any included required model's ID
      order: [["createdAt", "DESC"]],
      where: {
        product_category: {
          [Op.ne]: "Finish Product", // Exclude archived products
        },
      },
      limit,
      offset,
      subQuery: false, // Needed when using group + pagination
    });

    res.json({
      totalItems: count.length || 0,
      totalPages: Math.ceil((count.length || 0) / limit),
      currentPage: page,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductDataSearchBarLio").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { searchFunction, filterColumn } = req.query;

    // Base where clause: exclude "Finish Product"
    let productListWhereClause = {
      product_category: {
        [Op.ne]: "Finish Product",
      },
    };

    const productListColumnTable = [
      "product_code",
      "product_name",
      "product_category",
    ];

    let packagingWhereClause = {};

    // Add search filtering if searchFunction exists
    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        case "product_code":
        case "product_name":
        case "product_category":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "packaging_name": // New case for packaging search
          packagingWhereClause = {
            packaging_name: {
              [Op.like]: `%${searchFunction}%`,
            },
          };
          break;
        default:
          // Search across all product columns AND packaging name
          productListWhereClause = {
            ...productListWhereClause,
            [Op.or]: [
              ...productListColumnTable.map((col) => ({
                [col]: {
                  [Op.like]: `%${searchFunction}%`,
                },
              })),
              // Include packaging search in the OR condition
              {
                "$prod_packaging.packaging_name$": {
                  [Op.like]: `%${searchFunction}%`,
                },
              },
            ],
          };
          break;
      }
    }

    // Fetch data with grouping and associations
    const { count, rows } = await ProductList.findAndCountAll({
      attributes: {
        include: [
          [
            fn("AVG", col("product_tag_vendors.product_price")),
            "averageProductPrice",
          ],
        ],
      },
      include: [
        {
          model: Packaging,
          required: true,
          as: "prod_packaging",
          where: packagingWhereClause, // Include packaging filter if specified
        },
        {
          model: Product_Tag_Vendor,
          required: false,
          attributes: [], // exclude individual vendor data if only avg needed
        },
      ],
      group: ["product_list.product_id"],
      order: [["createdAt", "DESC"]],
      where: productListWhereClause,
      limit,
      offset,
      subQuery: false,
    });

    // When using group, count is an array; calculate totalItems accordingly
    const totalItems = Array.isArray(count) ? count.length : count;

    res.json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductDataFilterLio").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let {
      filterPackage = "All",
      selectStatusFilter = "All",
      filterPriceMin,
      filterPriceMax,
    } = req.query;

    const whereClause = {
      product_category: { [Op.ne]: "Finish Product" },
    };

    if (filterPackage !== "All") {
      whereClause.packaging_id = filterPackage;
    }

    if (selectStatusFilter !== "All") {
      whereClause.status = selectStatusFilter;
    }

    // Parse prices to floats, fallback NaN if invalid input
    const priceMin = parseFloat(filterPriceMin);
    const priceMax = parseFloat(filterPriceMax);

    const havingConditions = [];

    // Skip price filter if both min and max are 0 or invalid NaN
    if (!(priceMin === 0 && priceMax === 0)) {
      if (!isNaN(priceMin) && priceMin !== 0) {
        havingConditions.push(
          `AVG(product_tag_vendors.product_price) >= ${priceMin}`
        );
      }
      if (!isNaN(priceMax) && priceMax !== 0) {
        havingConditions.push(
          `AVG(product_tag_vendors.product_price) <= ${priceMax}`
        );
      }
    }

    const havingClause =
      havingConditions.length > 0
        ? literal(havingConditions.join(" AND "))
        : undefined;

    const { count, rows } = await ProductList.findAndCountAll({
      attributes: {
        include: [
          [
            fn("AVG", col("product_tag_vendors.product_price")),
            "averageProductPrice",
          ],
        ],
      },
      include: [
        {
          model: Packaging,
          required: true,
          as: "prod_packaging",
          where: filterPackage !== "All" ? { id: filterPackage } : undefined,
        },
        {
          model: Product_Tag_Vendor,
          required: false,
          attributes: [],
        },
      ],
      group: ["product_list.product_id"],
      order: [["createdAt", "DESC"]],
      where: whereClause,
      having: havingClause,
      limit,
      offset,
      subQuery: false,
    });

    res.json({
      totalItems: count.length || 0,
      totalPages: Math.ceil((count.length || 0) / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.log("Error fetching filtered data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/getPackagingData").get(async (req, res) => {
  try {
    const getData = await Packaging.findAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(getData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// router.route("/getFilteredProductData").get(async (req, res) => {
//   try {
//     const { selectStatusFilter, searchFunction, filterColumn } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     let productListWhereClause = {};
//     let packagingWhereClause = {};

//     const productListColumnTable = [
//       "product_code",
//       "product_name",
//       "product_category",
//       "packaging_id",
//     ];

//     if (searchFunction && searchFunction.trim() !== "") {
//       switch (filterColumn) {
//         // Handle Fitler for Product ID
//         case "product_code":
//           productListWhereClause[filterColumn] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle Filter for Product Name
//         case "product_name":
//           productListWhereClause[filterColumn] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle Filter for Product Category
//         case "product_category":
//           productListWhereClause[filterColumn] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle Filter for Product Unit
//         case "packaging.packaging_name":
//           packagingWhereClause["packaging_name"] = {
//             [Op.like]: `%${searchFunction}%`,
//           };
//           break;
//         // Handle All
//         default:
//           productListWhereClause = {
//             [Op.or]: productListColumnTable.map((col) => {
//               return {
//                 [col]: {
//                   [Op.like]: `%${searchFunction}%`,
//                 },
//               };
//             }),
//           };
//         // // Add search for packaging.packaging_name too
//         // packagingWhereClause = {
//         //   packaging_name: {
//         //     [Op.like]: `%${searchFunction}%`,
//         //   },
//         // };
//         // break;
//       }
//     }

//     // Handle Default Select Status
//     if (selectStatusFilter == "") {
//       productListWhereClause["status"] = {
//         [Op.ne]: "Archive",
//       };
//     }

//     // Handle Status
//     if (selectStatusFilter !== "All Status" && selectStatusFilter !== "") {
//       productListWhereClause["status"] = selectStatusFilter;
//     }

//     const { count, rows: data } = await ProductList.findAndCountAll({
//       include: [
//         {
//           model: Packaging,
//           required: true,
//           // where: packagingWhereClause,
//         },
//         {
//           model: Product_Tag_Vendor,
//           required: false,
//           // include: [
//           //   {
//           //     model: Vendors,
//           //     required: true,
//           //   },
//           // ],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       limit: limit,
//       offset: offset,
//       // where: productListWhereClause,
//     });

//     res.json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: parseInt(page || 1),
//       data: data,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/fetchDataPackaging").get(async (req, res) => {
  try {
    const getPackaging = await Packaging.findAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(getPackaging);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/fetchDataSource").get(async (req, res) => {
  try {
    const getSource = await Source.findAll({
      where: {
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(getSource);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//Vendor tagging sa product
router.route("/getVendors").get(async (req, res) => {
  try {
    const data = await Vendors.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// customer tagging sa product
router.route("/getCustomers").get(async (req, res) => {
  try {
    const data = await Customer.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/createProduct").post(async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction

  try {
    const {
      productCode,
      clientCode,
      productName,
      productCategory,
      packaging_id,
      source_id,
      remarks,
      productThreshold,
      items,
      items2,
      srpAmount,
      userLoggedID,
    } = req.body;

    // Check for existing product code
    const existingProductCode = await ProductList.findOne({
      where: { product_code: productCode },
      transaction,
    });

    if (existingProductCode) {
      await transaction.rollback();
      return res.status(401).json({ message: "Duplicate product code" });
    }

    // Check for existing product name
    const existingProduct = await ProductList.findOne({
      where: {
        product_name: productName,
        product_code: productCode,
      },
      transaction,
    });

    if (existingProduct) {
      await transaction.rollback();
      return res.status(409).json({ message: "Product Name Already Exists." });
    }

    const thresholdValue = productThreshold ?? null;

    const safeSrpAmount =
      srpAmount !== null && srpAmount !== undefined
        ? parseFloat(srpAmount) || 0
        : 0;

    // Create product within transaction
    const newProduct = await ProductList.create(
      {
        product_code: productCode,
        product_name: productName,
        client_code: clientCode,
        packaging_id,
        product_category: productCategory,
        description: remarks,
        threshold: thresholdValue,
        status: "Active",
        masterlist_id: userLoggedID,
        srp_amount: safeSrpAmount,
      },
      { transaction }
    );

    const ProductId = newProduct.product_id;

    if (newProduct) {
      const stockManagement = await StockManagement.create(
        {
          product_id: ProductId,
          warehouse_id: "11111111-1111-1111-1111-111111111111",
          stock: 0,
          in: 0,
          price: safeSrpAmount, // Use safe value (0 if null)
          price_in: safeSrpAmount, // Use safe value (0 if null)
          vendor_id: null,
          date_in: moment().tz("Asia/Manila").format("YYYY-MM-DD"),
          transaction_number: null,
          module_in_from: "Product List",
          isDeleted: 0,
        },
        { transaction }
      );
      if (!stockManagement) {
        await transaction.rollback();
        return res.status(500).json({
          message: "Failed to create stock management record",
        });
      }
      console.log("Stock Management Record Created:", stockManagement);
    }

    // Only create vendor associations if there are vendorIds
    const validVendorItems = items?.filter((item) => item.vendorId) || [];
    if (validVendorItems.length > 0) {
      await Promise.all(
        validVendorItems.map((data) =>
          Product_Tag_Vendor.create(
            {
              product_id: ProductId,
              vendor_id: data.vendorId,
              product_price: data.vendorPrice,
              vendor_product_code: data.vendorProductCode,
              vendor_product_name: data.vendorProductName,
              status: "Active",
            },
            { transaction }
          )
        )
      );
    }

    // Only create customer associations if there are companyIds
    const validCustomerItems = items2?.filter((item) => item.companyId) || [];
    if (validCustomerItems.length > 0) {
      await Promise.all(
        validCustomerItems.map((data) =>
          ProductTagCustomer.create(
            {
              product_id: ProductId,
              customer_id: data.companyId,
              product_price: data.companyPrice,
              customer_product_code: data.companyProductCode,
              customer_product_name: data.companyProductName,
              status: "Active",
            },
            { transaction }
          )
        )
      );
    }

    // Create activity log
    await Activity_Log.create(
      {
        masterlist_id: userLoggedID,
        action_taken: `Product List: User created new product with Product Code ${productCode}`,
      },
      { transaction }
    );

    // Commit transaction if everything succeeds
    await transaction.commit();

    return res.status(200).json(newProduct);
  } catch (err) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error(err);
    return res.status(500).send("An error occurred");
  }
});
router.route("/fetchProductEdit").get(async (req, res) => {
  try {
    const data = await ProductList.findAll({
      where: {
        product_id: req.query.id,
      },
    });

    if (!data) {
      return res.status(204).json();
    }
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/updateProduct").put(async (req, res) => {
  try {
    const {
      id,
      productCode,
      productName,
      productCategory,
      productUnit,
      remarks,
      productThreshold,
      items,
      items2,
      userLoggedID,
      clientCode,
      packaging_id,
      source_id,
      srpAmount,
    } = req.body;

    const existingProductName = await ProductList.findOne({
      where: {
        product_id: {
          [Op.ne]: id,
        },
        product_name: productName,
        product_code: productCode,
      },
    });

    if (existingProductName) {
      return res.status(409).json({ message: "Product Name Already Exists." });
    }

    const getProductData = await ProductList.findOne({
      where: {
        product_id: id,
        product_code: productCode,
      },
    });

    // Get previous vendor list
    const dataToGetPreviousListOfVendors = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: Vendors,
          required: true,
        },
      ],
      where: {
        product_id: id,
      },
    });

    const previousListOfVendors = dataToGetPreviousListOfVendors
      .reverse()
      .map((item) => {
        return `
      Company Name: ${item.vendor.company_name}
      Vendor Price: ${item.product_price}
      `;
      });

    // Get previous customer list
    const dataToGetPreviousListOfCustomers = await ProductTagCustomer.findAll({
      include: [
        {
          model: Customer,
          as: "ptc_customer_id",
          required: true,
        },
      ],
      where: {
        product_id: id,
      },
    });

    const previousListOfCustomers = dataToGetPreviousListOfCustomers
      .reverse()
      .map((item) => {
        return `
      Company Name: ${item.ptc_customer_id.company_name}
      Customer Price: ${item.product_price}
      `;
      });

    const findProduct = await ProductList.findOne({
      where: {
        product_id: { [Op.ne]: id },
        product_code: productCode,
      },
    });

    if (findProduct) {
      res.status(201).send("Exist");
    } else {
      const thresholdValue =
        productThreshold === "" ||
        productThreshold === undefined ||
        productThreshold === null
          ? null
          : Number(productThreshold);

      // Update product details
      await ProductList.update(
        {
          product_code: productCode,
          product_name: productName,
          product_category: productCategory,
          client_code: clientCode,
          packaging_id: packaging_id,
          description: remarks,
          threshold: thresholdValue,
          srp_amount: srpAmount,
        },
        {
          where: { product_id: id },
        }
      );

      // Update vendor associations
      await Product_Tag_Vendor.update(
        {
          status: "Inactive",
        },
        {
          where: {
            product_id: id,
          },
        }
      );

      // Process customer updates
      for (const item2 of items2) {
        const {
          companyId,
          companyPrice,
          companyProductCode,
          companyProductName,
        } = item2;

        const currentProduct = await ProductTagCustomer.findOne({
          where: {
            customer_id: companyId,
            product_id: id,
          },
          attributes: ["product_price"],
        });

        let currentPrice = 0;
        if (currentProduct) {
          currentPrice = currentProduct.product_price;
        }

        if (currentPrice !== companyPrice) {
          await ProductTagCustomer.update(
            {
              previous_price: currentPrice,
              product_price: companyPrice,
              customer_product_code: companyProductCode,
              customer_product_name: companyProductName,
            },
            {
              where: {
                product_id: id,
                customer_id: companyId,
              },
            }
          );
        } else {
          await ProductTagCustomer.update(
            {
              product_price: companyPrice,
              customer_product_code: companyProductCode,
              customer_product_name: companyProductName,
            },
            {
              where: {
                product_id: id,
                customer_id: companyId,
              },
            }
          );
        }

        const findCustomer = await ProductTagCustomer.findAll({
          where: {
            product_id: id,
            customer_id: companyId,
          },
        });

        if (findCustomer.length === 0) {
          await ProductTagCustomer.create({
            product_id: id,
            customer_id: companyId,
            product_price: companyPrice,
            customer_product_code: companyProductCode,
            customer_product_name: companyProductName,
            status: "Active",
          });
        }
      }

      // Process vendor updates
      for (const item of items) {
        const { vendorId, vendorPrice, vendorProductCode, vendorProductName } =
          item;

        const currentProduct = await Product_Tag_Vendor.findOne({
          where: {
            product_id: id,
            vendor_id: vendorId,
          },
          attributes: ["product_price"],
        });

        let currentPrice = 0;
        if (currentProduct) {
          currentPrice = currentProduct.product_price;
        }

        if (currentPrice !== vendorPrice) {
          await Product_Tag_Vendor.update(
            {
              previous_price: currentPrice,
              product_price: vendorPrice,
              vendor_product_code: vendorProductCode,
              vendor_product_name: vendorProductName,
              status: "Active",
            },
            {
              where: {
                product_id: id,
                vendor_id: vendorId,
              },
            }
          );
        } else {
          await Product_Tag_Vendor.update(
            {
              product_price: vendorPrice,
              vendor_product_code: vendorProductCode,
              vendor_product_name: vendorProductName,
              status: "Active",
            },
            {
              where: {
                product_id: id,
                vendor_id: vendorId,
              },
            }
          );
        }

        const findVendor = await Product_Tag_Vendor.findAll({
          where: {
            product_id: id,
            vendor_id: vendorId,
          },
        });

        if (findVendor.length === 0) {
          await Product_Tag_Vendor.create({
            product_id: id,
            vendor_id: vendorId,
            product_price: vendorPrice,
            vendor_product_code: vendorProductCode,
            vendor_product_name: vendorProductName,
            status: "Active",
          });
        }
      }

      // Prepare activity log data
      const currentListOfVendors = items
        .map((item) => {
          return `
        Company Name: ${item.companyName}
        Vendor Price: ${item.vendorPrice}
        `;
        })
        .join("");

      const currentListOfCustomers = items2
        .map((item) => {
          return `
        Company Name: ${item.companyName}
        Customer Price: ${item.companyPrice}
        `;
        })
        .join("");

      // Create activity log
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Product List: User updated information about product list with Product code ${productCode}.
        Product Name: ${getProductData.product_name} to ${productName}
        Product Category: ${
          getProductData.product_category
        } to ${productCategory}
        Unit of Measure: ${getProductData.unit_of_measure} to ${productUnit}
        Description: ${getProductData.description} to ${remarks}
        Product Threshold: ${getProductData.threshold} to ${thresholdValue}

        Vendor List --------
        Previous:
        ${previousListOfVendors.join("")}
        Updated:
        ${currentListOfVendors}

        Customer List --------
        Previous:
        ${previousListOfCustomers.join("")}
        Updated:
        ${currentListOfCustomers}
        `,
      });

      return res.status(200).json();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.route("/statusupdate").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { productIds, status } = req.body;

    const updateData = { status };
    if (status === "Archive") {
      updateData.archive_date = new Date();
    }

    for (const productId of productIds) {
      await ProductList.update(updateData, {
        where: { product_id: productId },
        transaction,
      });

      const customerProducts = await ProductTagCustomer.findAll({
        where: { product_id: productId },
        attributes: ["id"],
        raw: true,
        transaction,
      });

      const allCustomerProductIds = customerProducts.map((p) => p.id);

      if (allCustomerProductIds.length > 0) {
        await ProductTagCustomer.update(
          { status },
          {
            where: {
              id: {
                [Op.in]: allCustomerProductIds,
              },
            },
            transaction,
          }
        );
      }

      const vendorProducts = await Product_Tag_Vendor.findAll({
        where: { product_id: productId },
        attributes: ["id"],
        raw: true,
        transaction,
      });

      const allVendorProductIds = vendorProducts.map((p) => p.id);

      if (allVendorProductIds.length > 0) {
        await Product_Tag_Vendor.update(
          { status },
          {
            where: {
              id: {
                [Op.in]: allVendorProductIds,
              },
            },
            transaction,
          }
        );
      }
    }

    await transaction.commit();
    res.status(200).json({ message: "Products updated successfully" });
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    res.status(500).json({ error: "Internal server error" });
  }
});

router.route("/getProductInventory").get(async (req, res) => {
  try {
    const data = await StockManagement.findAll({
      include: [
        {
          model: ProductList,
          required: true,
          where: {
            product_category: "Finish Product",
          },
        },
      ],
      order: [["createdAt", "DESC"]],
      where: {
        stock: {
          [Op.ne]: 0,
        },
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/fetchProductCode").get(async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product code is required",
      });
    }

    const trimmedCode = id.toString().trim();

    // Find product with this code (regardless of suffix)
    const product = await ProductList.findOne({
      where: {
        product_code: Sequelize.where(
          Sequelize.fn("trim", Sequelize.col("product_code")),
          trimmedCode
        ),
      },
    });

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// New route for checking product code with suffix
router.route("/fetchProductCodeAndSuffix").get(async (req, res) => {
  try {
    const { productCode, suffix } = req.query;

    if (!productCode || !suffix) {
      return res.status(400).json({
        success: false,
        message: "Product code and suffix are required",
      });
    }

    const trimmedCode = productCode.toString().trim();
    const trimmedSuffix = suffix.toString().trim();

    const product = await ProductList.findOne({
      where: {
        product_code: Sequelize.where(
          Sequelize.fn("trim", Sequelize.col("product_code")),
          trimmedCode
        ),
        suffix: Sequelize.where(
          Sequelize.fn("trim", Sequelize.col("suffix")),
          trimmedSuffix
        ),
      },
    });

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product with suffix:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.route("/fetchClientCode").get(async (req, res) => {
  try {
    const product = await ProductList.findOne({
      where: {
        client_code: req.query.id, // Ensure this matches your DB column
      },
    });

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/fetchProductNameAndSuffix", async (req, res) => {
  try {
    const { id, productName, suffix, isUpdate } = req.query;
    const isUpdateBool = isUpdate === "true";

    if (!productName || !suffix) {
      return res.status(400).json({
        success: false,
        message: "Both productName and suffix are required",
      });
    }

    const whereConditions = {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("product_name")),
          "=",
          productName.toLowerCase().trim()
        ),
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("suffix")),
          "=",
          suffix.toLowerCase().trim()
        ),
      ],
    };

    // For update, exclude current product
    if (isUpdateBool && id) {
      whereConditions[Op.and].push({
        product_id: { [Op.ne]: id },
      });
    }

    const product = await ProductList.findOne({
      where: whereConditions,
    });

    return res.json({
      success: true,
      exists: !!product,
      data: product || null,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
