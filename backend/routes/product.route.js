const express = require("express");
const { where, Op } = require("sequelize");
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
  ProductImages,
  Inventory_Journal,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const sharp = require("sharp");

const session = require("express-session");

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
      order: [["product_code", "DESC"]],
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

// router.route("/lastCode").get(async (req, res) => {
//   try {
//     // Fetch latest product by numeric portion (works if codes are zero-padded)
//     const latestProduct = await ProductList.findOne({
//       attributes: ["product_code"],
//       order: [["product_code", "DESC"]],
//     });

//     let nextCode = "000001";

//     if (latestProduct && latestProduct.product_code) {
//       const lastCode = latestProduct.product_code.trim();
//       // Match optional prefix + digits at end
//       const match = lastCode.match(/^(.*?)(\d+)$/);
//       if (match) {
//         const prefix = match[1]; // '' if no prefix
//         const numberPart = match[2]; // e.g. 000001
//         const nextNumber = (parseInt(numberPart, 10) + 1)
//           .toString()
//           .padStart(numberPart.length, "0");
//         nextCode = `${prefix}${nextNumber}`;
//       } else {
//         // If no digits, start fresh
//         nextCode = "000001";
//       }
//     }

//     return res.json(nextCode); // Frontend expects plain string
//   } catch (err) {
//     console.error("Error generating lastCode:", err);
//     res.status(500).json("Error");
//   }
// });
//used Module :
// PAYABLE
router.route("/getProductData").get(async (req, res) => {
  try {
    const data = await ProductList.findAll({
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

router.route("/getFilteredProductData").get(async (req, res) => {
  try {
    const {
      selectStatusFilter: selectStatusFilter = "Active",
      searchFunction,
      filterColumn,
      seletedCategory,
    } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(seletedCategory);

    let productListWhereClause = {};
    const productListColumnTable = [
      "product_code",
      "product_name",
      "product_category",
      "unit_of_measure",
    ];

    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        // Handle Fitler for Product ID
        case "product_code":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        // Handle Filter for Product Name
        case "product_name":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        // Handle Filter for Product Category
        case "product_category":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        // Handle Filter for Product Unit
        case "unit_of_measure":
          productListWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        // Handle All
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

    // Handle Default Select Status
    if (selectStatusFilter === "") {
      productListWhereClause["status"] = {
        [Op.ne]: "Archive",
      };
    }

    if (seletedCategory && seletedCategory.length > 0) {
      productListWhereClause.product_category = {
        [Op.in]: seletedCategory.map((item) => item.value),
      };
    }

    // Handle Status
    if (selectStatusFilter !== "All Status" && selectStatusFilter !== "") {
      productListWhereClause["status"] = selectStatusFilter;
    }

    const { count, rows: data } = await ProductList.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: productListWhereClause,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//Vendor tagging sa product
router.route("/getVendors").get(async (req, res) => {
  try {
    const data = await Vendors.findAll({
      order: [["createdAt", "DESC"]],
      where: {
        isArchive: false,
        status: "Active",
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.post("/createProduct", upload.array("images"), async (req, res) => {
  try {
    const {
      tagAllVendor,
      productCode,
      productName,
      productCategory,
      productUnit,
      remarks,
      productThreshold,
      items,
      userLoggedID,
    } = req.body;

    let parsedItems = items;
    if (typeof items === "string") {
      parsedItems = JSON.parse(items);
    }

    const existingProduct = await ProductList.findOne({
      where: {
        [Op.or]: [{ product_name: productName }, { product_code: productCode }],
      },
    });

    if (existingProduct) {
      res.status(409).json({ message: "Product Name Already Exists." });
    } else {
      const newProduct = await ProductList.create({
        product_code: productCode,
        product_name: productName,
        product_category: productCategory,
        unit_of_measure: productUnit,
        description: remarks,
        threshold: productThreshold,
        status: "Active",
      });

      const ProductId = newProduct.product_id;

      await Promise.all(
        parsedItems.map(async (data) => {
          if (data.vendorId && data.vendorPrice) {
            await Product_Tag_Vendor.create({
              product_id: ProductId,
              vendor_id: data.vendorId,
              product_price: data.vendorPrice,
              status: "Active",
            });
          }
        })
      );

      // // Save images as BLOB
      // if (req.files && req.files.length > 0) {
      //   await Promise.all(
      //     req.files.map((file) =>
      //       ProductImages.create({
      //         product_id: ProductId,
      //         product_image: file.buffer, // <-- BLOB data
      //       })
      //     )
      //   );
      // }

      // Compress images before saving as BLOB
      if (req.files && req.files.length > 0) {
        // Compress each image using sharp
        const compressedFiles = await Promise.all(
          req.files.map(async (file) => {
            if (!file.mimetype.startsWith("image/")) return file;
            console.log(
              `[IMAGE] Received "${file.originalname}" size: ${file.size} bytes`
            );
            const compressedBuffer = await sharp(file.buffer)
              .resize({ width: 1920, withoutEnlargement: true }) // Optional: resize
              .jpeg({ quality: 80 }) // Adjust for PNG: .png({ quality: 80 })
              .toBuffer();
            console.log(
              `[IMAGE] Compressed "${file.originalname}" size: ${compressedBuffer.length} bytes`
            );
            return {
              ...file,
              buffer: compressedBuffer,
              size: compressedBuffer.length,
            };
          })
        );

        // Save compressed images as BLOB
        await Promise.all(
          compressedFiles.map((file) =>
            ProductImages.create({
              product_id: ProductId,
              product_image: file.buffer,
            })
          )
        );
      }

      // --- For Tagging All Vendor to selected Product ---
      if (tagAllVendor === "true") {
        const vendorList = await Vendors.findAll({
          attributes: ["id"],
        });

        // Exclude all selected Vendors created from Frontend to avoid duplication
        const filteredVendor = vendorList.filter(
          (vendor) =>
            !parsedItems?.map((item) => item.vendorId).includes(vendor.id)
        );

        // Prepare data to tag all vendors with the selected product (for bulk insertion)
        const createProductTagVendor = filteredVendor.map((item) => ({
          product_id: ProductId,
          vendor_id: item.id,
          product_price: 1,
          status: "Active",
        }));

        await Product_Tag_Vendor.bulkCreate(createProductTagVendor);
      }

      // const mainWarehouse = await Warehouse.findOne({
      //   where: {
      //     branch_type: "Main",
      //   },
      // });

      // if (!mainWarehouse) {
      //   return res.status(404).send("Main warehouse not found");
      // }

      // const stocktManagement = await StockManagement.create({
      //   product_id: newProduct.product_id,
      //   warehouse_id: mainWarehouse.warehouse_id,
      //   stock: 0,
      //   total_value: 0,
      // });

      // await Promise.all(
      //   items.map(async (data) => {
      //     return await StockManagementProductTagVendor.create({
      //       stock_management_id: stocktManagement.stock_management_id,
      //       vendor_id: data.vendorId,
      //       quantity: 0,
      //       price: data.vendorPrice,
      //     });
      //   })
      // );

      Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Product List: User created new product with Product Code ${productCode}`,
      });

      StockManagement.create({
        product_id: ProductId,
        warehouse_id: "11111111-1111-1111-1111-111111111111",
        stock: 0,
        in: 0,
        price: 0,
        price_in: 0,
        vendor_id: null,
        date_in: newProduct.createdAt,
        transaction_number: "Product Creation",
        module_in_from: "Product List",
        isDeleted: false,
      });

      Inventory_Journal.create({
        module_from: "Product List",
        transaction_number: "Product Creation",
        product_id: ProductId,
        unit_price: 0,
        date_in: newProduct.createdAt,
        quantity: 0,
        type: "in",
        warehouse_id: "11111111-1111-1111-1111-111111111111",
      });

      return res.status(200).json(newProduct);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.get("/product-images/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await ProductImages.findAll({
      where: { product_id: productId },
      attributes: ["id", "product_image"],
    });
    // Convert Buffer to base64 for frontend
    res.json(
      images.map((img) => ({
        id: img.id,
        product_image: img.product_image
          ? img.product_image.toString("base64")
          : null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Error fetching images" });
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

router.put("/updateProduct", upload.array("images"), async (req, res) => {
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
      userLoggedID,
      removeImageIds,
      deletedVendorIdList,
    } = req.body;

    let parsedItems = items;
    if (typeof parsedItems === "string") {
      parsedItems = JSON.parse(parsedItems);
    }

    // Remove selected images if requested
    if (removeImageIds) {
      const idsToRemove = Array.isArray(removeImageIds)
        ? removeImageIds
        : JSON.parse(removeImageIds);
      await ProductImages.destroy({
        where: {
          id: { [Op.in]: idsToRemove },
          product_id: id,
        },
      });
    }

    // // Save new images as BLOB
    // if (req.files && req.files.length > 0) {
    //   await Promise.all(
    //     req.files.map((file) =>
    //       ProductImages.create({
    //         product_id: id,
    //         product_image: file.buffer,
    //       })
    //     )
    //   );
    // }

    if (req.files && req.files.length > 0) {
      const compressedFiles = await Promise.all(
        req.files.map(async (file) => {
          if (!file.mimetype.startsWith("image/")) return file;
          console.log(
            `[IMAGE] Received "${file.originalname}" size: ${file.size} bytes`
          );
          const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          console.log(
            `[IMAGE] Compressed "${file.originalname}" size: ${compressedBuffer.length} bytes`
          );
          return {
            ...file,
            buffer: compressedBuffer,
            size: compressedBuffer.length,
          };
        })
      );

      await Promise.all(
        compressedFiles.map((file) =>
          ProductImages.create({
            product_id: id,
            product_image: file.buffer,
          })
        )
      );
    }

    const existingProductName = await ProductList.findOne({
      where: {
        product_id: {
          [Op.ne]: id,
        },
        product_name: productName,
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

    // --- Update product and product tag vendor ---
    await ProductList.update(
      {
        product_code: productCode,
        product_name: productName,
        product_category: productCategory,
        unit_of_measure: productUnit,
        description: remarks,
        threshold: productThreshold,
      },
      {
        where: { product_id: id },
      }
    );

    // Only Include new vendors for creation of Product_Tag_Vendor
    const newVendors = parsedItems.filter((item) => item.newVendor);

    if (newVendors.length) {
      // If the vendor is existing update it, otherwise create it to avoid duplication of product-vendor relationship
      await Promise.all(
        newVendors.map(async (item) => {
          const [record, isCreated] = await Product_Tag_Vendor.findOrCreate({
            where: {
              product_id: id,
              vendor_id: item.vendorId,
            },
            defaults: {
              product_id: id,
              vendor_id: item.vendorId,
              product_price: item.vendorPrice,
              status: "Active",
            },
          });

          if (!isCreated) {
            const updateProductTagVendor = await Product_Tag_Vendor.update(
              {
                product_price: item.vendorPrice,
                status: "Active",
              },
              {
                where: {
                  product_id: id,
                  vendor_id: item.vendorId,
                },
              }
            );
          }
        })
      );
    }

    // Update as Inactive to all deleted vendors
    if (deletedVendorIdList.length) {
      // Remove any IDs that are still present in newVendors to prevent double update.
      const filteredVendorIdList = deletedVendorIdList
        .split(",")
        .filter(
          (deletedId) =>
            !newVendors.map((vendor) => vendor.vendorId).includes(deletedId)
        );

      await Product_Tag_Vendor.update(
        {
          status: "Inactive",
        },
        {
          where: {
            product_id: id,
            vendor_id: {
              [Op.in]: filteredVendorIdList,
            },
          },
        }
      );
    }

    const currentListOfVendors = parsedItems
      .map((item) => {
        return `
        Company Name: ${item.companyName}
        Vendor Price: ${item.vendorPrice}
        `;
      })
      .join("");

    Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Product List: User updated information about product list with Product code ${productCode}.
        Product Name: ${getProductData.product_name} to ${productName}
        Product Category: ${getProductData.product_category} to ${productCategory}
        Unit of Measure: ${getProductData.unit_of_measure} to ${productUnit}
        Description: ${getProductData.description} to ${remarks}
        Product Threshold: ${getProductData.threshold} to ${productThreshold}

        Vendor List --------
        ${previousListOfVendors}
        to
        ${currentListOfVendors}
        `,
    });

    return res.status(200).json();
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.route("/statusupdate").put(async (req, res) => {
  try {
    const { productIds, status } = req.body;

    const updateData = { status: status };

    if (status === "Archive") {
      updateData.archive_date = new Date();
    }
    for (const productId of productIds) {
      const productdata = await ProductList.findOne({
        where: { product_id: productId },
      });

      const updateStatus = await ProductList.update(updateData, {
        where: { product_id: productId },
      });
    }

    res.status(200).json({ message: "Products updated successfully" });
  } catch (error) {
    console.error(error);
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

router.route("/addProduct").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { productList } = req.body;

    const dateToday = new Date().toISOString().split("T")[0];

    // Bulk creation of product
    await StockManagement.bulkCreate(
      productList.map(
        (product) => ({
          product_id: product.value,
          warehouse_id: "11111111-1111-1111-1111-111111111111",
          stock: 0,
          in: 0,
          price: 0,
          price_in: 0,
          vendor_id: null,
          date_in: dateToday,
          transaction_number: "added lang namin",
          module_in_from: "added lang namin",
          isDeleted: false,
        }),
        {
          transaction,
        }
      )
    );

    await transaction.commit();
    res.status(200).json({ message: "Product/s successfully created." });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
