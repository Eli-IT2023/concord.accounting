const router = require("express").Router();
const { Op, fn, col, where } = require("sequelize");
const {
  Payable,
  Payable_Product,
  Warehouse,
  Vendors,
  Payable_Fees,
  ProductList,
  Product_Tag_Vendor,
  MasterList,
  Currency,
  Activity_Log,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");
const { route } = require("./vendors.route");
const { Fn } = require("sequelize/lib/utils");

// fetch
// Used MOdule:
// -- Payable Purchase
//-- Create FIxed Asset
router.get("/fetchVendors", async (req, res) => {
  try {
    const { limit, search } = req.query;

    const vendors = await Vendors.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        isArchive: false,
        status: "Active",
        ...(search && {
          [Op.or]: [
            { company_name: { [Op.like]: `%${search}%` } },
            sequelize.where(fn("CONCAT", col("fname"), " ", col("lname")), {
              [Op.like]: `%${search}%`,
            }),
          ],
        }),
      },
      ...(limit && { limit: parseInt(limit) }), // only add limit if provided
    });
    res.json(vendors);
    // console.log(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/fetchVendorsedit", async (req, res) => {
  const { id } = req.query;
  try {
    const vendors = await Vendors.findAll({
      where: {
        id: id,
        isArchive: false,
      },
    });
    res.json(vendors);
    // console.log(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add
router.post("/addVendors", async (req, res) => {
  try {
    const {
      tagAllProduct,
      companyName,
      companyNature,
      emailAddress,
      companyAddress,
      city,
      country,
      designation,
      fname,
      mname,
      lname,
      civilStatus,
      dob,
      gender,
      contactNo,
      contactNo2,
      tin,
      position,
      currencyID,
      supplierCode,
      userLoggedID,
    } = req.body;

    const isExist = await Vendors.findOne({
      where: {
        company_name: companyName,
        company_nature: companyNature,
        company_email: emailAddress,
        isArchive: false,
      },
    });
    if (isExist) {
      console.log(`------------`);
      res.status(201).json();
    } else {
      console.log(`------------dsd`);
      const vendors = await Vendors.create({
        company_name: companyName,
        company_nature: companyNature,
        company_email: emailAddress,
        company_address: companyAddress,
        company_city: city,
        company_country: country,
        company_designation: designation,
        fname: fname,
        mname: mname,
        lname: lname,
        civil_status: civilStatus,
        dob: dob,
        gender: gender,
        contact: contactNo,
        contact2: contactNo2,
        tin_number: tin,
        position: position,
        status: "Active",
        currency_id: currencyID,
        supplier_code: supplierCode,
      });

      // For Tagging All Product to the created vendor
      if (vendors && tagAllProduct) {
        const productList = await ProductList.findAll({
          attributes: ["product_id"],
        });

        const bulkProduct = productList.map((item) => ({
          product_id: item.product_id,
          vendor_id: vendors.id,
          product_price: 1,
          status: "Active",
        }));

        await Product_Tag_Vendor.bulkCreate(bulkProduct);
      }

      // To record Activity_Log
      if (vendors) {
        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Vendor: User created a new vendor with company named ${companyName} with contact information named ${fname} ${lname}`,
        });
        res.status(200).json(vendors);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// update
router.post("/updateVendors", async (req, res) => {
  try {
    const {
      companyName,
      companyNature,
      emailAddress,
      companyAddress,
      city,
      country,
      designation,
      fname,
      mname,
      lname,
      civilStatus,
      dob,
      gender,
      contactNo,
      contactNo2,
      tin,
      position,
      id,
      productFetch,
      currencyID,
      userLoggedID,
      status,
      supplierCode,
      limit,
      offset,
    } = req.body;

    const isExist = await Vendors.findOne({
      where: {
        company_name: companyName,
        company_nature: companyNature,
        company_email: emailAddress,
        id: {
          [Op.ne]: id, // Exclude the current record
        },
      },
    });

    if (isExist) {
      // If a duplicate record is found, respond with 201 (Created)
      res
        .status(201)
        .json({ message: "Vendors with the same details already exists." });
    } else {
      const getData = await Vendors.findOne({
        include: [
          {
            model: Currency,
            attributes: ["currency_name"],
          },
        ],
        where: {
          id: id,
        },
      });

      const getProductVendor = await Product_Tag_Vendor.findAll({
        include: [
          {
            model: ProductList,
            attributes: ["product_name"],
          },
        ],
        where: {
          vendor_id: id,
        },
        limit,
        offset,
      });

      // Perform the update
      const updatedVendors = await Vendors.update(
        {
          company_name: companyName,
          company_nature: companyNature,
          company_email: emailAddress,
          company_address: companyAddress,
          company_city: city,
          company_country: country,
          company_designation: designation,
          fname: fname,
          mname: mname,
          lname: lname,
          civil_status: civilStatus,
          dob: dob,
          gender: gender,
          contact: contactNo,
          contact2: contactNo2,
          tin_number: tin,
          position: position,
          currency_id: currencyID,
          supplier_code: supplierCode,
          status: status ? "Active" : "Inactive",
        },
        {
          where: {
            id: id,
          },
        }
      );
      let getUpdatedProductVendor;
      if (updatedVendors) {
        if (productFetch && productFetch.length > 0) {
          for (const data of productFetch) {
            // Use for...of instead of forEach
            if (data.prod_id === "") {
              continue;
            }

            const final_price =
              data.vendor_prod_price === "" ? 0 : data.vendor_prod_price;

            if (data.type === "old") {
              await Product_Tag_Vendor.update(
                {
                  product_id: data.prod_id,
                  product_price: final_price,
                  status: data.vendor_prod_status,
                },
                {
                  where: {
                    product_id: data.prod_id,
                    vendor_id: id,
                  },
                }
              );
            } else {
              await Product_Tag_Vendor.create({
                product_id: data.prod_id,
                vendor_id: id,
                product_price: final_price,
                status: data.vendor_prod_status,
              });
            }
          }

          getUpdatedProductVendor = await Product_Tag_Vendor.findAll({
            include: [
              {
                model: ProductList,
                attributes: ["product_name"],
              },
            ],
            where: {
              vendor_id: id,
            },
            limit,
            offset,
          });
        }

        const getCurr = await Currency.findOne({
          where: {
            id: currencyID,
          },
        });

        const productVendor = getProductVendor
          .map((record) => record.product_list?.product_name)
          .join(", ");

        console.log(getUpdatedProductVendor, "updated");
        let getUpdatedProductVendorfinal;

        if (getUpdatedProductVendor) {
          getUpdatedProductVendorfinal = getUpdatedProductVendor
            .map((record) => record.product_list?.product_name)
            .join(", ");
        } else {
          getUpdatedProductVendorfinal = null;
        }

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Vendor: User updated vendor information \n
         Company Name: ${getData.company_name} to ${companyName}
         Company Nature: ${getData.company_nature} to ${companyNature}
         Company Email: ${getData.company_email} to ${emailAddress}
         Company Address: ${getData.company_address} to ${companyAddress}
         Company City: ${getData.company_city} to ${city}
         Company Country: ${getData.company_country} to ${country}
         Company Designation: ${getData.company_designation} to ${designation}         Supplier Code: ${getData.supplier_code} to ${supplierCode}
         First Name: ${getData.fname} to ${fname}
         Middle Name: ${getData.mname} to ${mname}
         Last Name: ${getData.lname} to ${lname}
         Civil Status: ${getData.civil_status} to ${civilStatus}
         Date of Birth: ${getData.dob} to ${dob}
         Gender: ${getData.gender} to ${gender}
         Contact No: ${getData.contact} to ${contactNo}
         Alternate Contact No: ${getData.contact2} to ${contactNo2}
         TIN Number: ${getData.tin_number} to ${tin}
         Position: ${getData.position} to ${position}
         Currency: ${getData.currency.currency_name} to ${getCurr.currency_name}
         Product Tag: [${productVendor}] to [${getUpdatedProductVendorfinal}]
          `,
        });

        // If update is successful, respond with 200 (OK) and the updated Vendors object
        res.status(200).json(updatedVendors);
      } else {
        // Handle the case where no currency was updated
        res.status(404).json({ message: "Vendors not found." });
      }
    }
  } catch (error) {
    // Handle server errors
    console.error("Error updating vendors:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put("/deleteVendor/:id", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Validation if id exists
    const findId = await Vendors.findOne({
      where: {
        id: id,
      },
    });

    if (!findId) {
      return res
        .status(404)
        .json({ message: `No Vendor Found with id: ${id}` });
    }

    // Validate if there's an existing payable transaction with this vendor
    const vendorPayableTransaction = await Payable.findOne({
      where: {
        vendor_id: id,
        isDeleted: false,
      },
    });

    if (vendorPayableTransaction) {
      return res.status(409).json({
        message:
          "Cannot delete: This vendor has an existing Payable transaction.",
        transaction_id: vendorPayableTransaction.transaction_id,
      });
    }

    // Soft delete / Archive
    await Vendors.update(
      {
        isArchive: 1,
      },
      {
        where: {
          id: id,
        },
        transaction,
      }
    );

    await transaction.commit();
    res.status(200).json({ message: "Vendor Successfully deleted." });
  } catch (error) {
    console.error(error);
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//filter vendors
router.get("/filterSearchVendors", async (req, res) => {
  const { filterStatus, filterDesignation, filterColumn, searchText } =
    req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  // console.log(req.query.filterStatus);
  let whereClause = {};
  const vendorTableColumn = [
    "company_name",
    "company_nature",
    "company_email",
    "company_city",
    "company_country",
    "contact",
  ];

  if (searchText && searchText.trim() !== "") {
    switch (filterColumn) {
      case "company_name":
        whereClause["company_name"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      case "company_nature":
        whereClause["company_nature"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;

      case "company_email":
        whereClause["company_email"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;

      case "company_city":
        whereClause["company_city"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;

      case "company_country":
        whereClause["company_country"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      case "contact_person":
        whereClause = sequelize.where(
          fn("CONCAT", col("fname"), " ", col("lname")),
          {
            [Op.like]: `%${searchText}%`,
          }
        );
        break;
      case "contact":
        whereClause["contact"] = {
          [Op.like]: `%${searchText}%`,
        };
        break;
      default:
        whereClause = {
          [Op.or]: [
            ...vendorTableColumn.map((col) => {
              return {
                [col]: {
                  [Op.like]: `%${searchText}%`,
                },
              };
            }),
            sequelize.where(fn("CONCAT", col("fname"), " ", col("lname")), {
              [Op.like]: `%${searchText}%`,
            }),
          ],
        };
        break;
    }
  }
  if (filterStatus !== "All" && filterStatus) {
    whereClause["$vendors.status$"] = filterStatus;
  }

  if (filterDesignation !== "All" && filterDesignation) {
    whereClause["$vendors.company_designation$"] = filterDesignation;
  }

  const { count, rows: vendors } = await Vendors.findAndCountAll({
    include: [
      {
        model: Currency,
        required: true,
      },
    ],
    where: { ...whereClause, isArchive: 0 },
    order: [["createdAt", "DESC"]],
    subQuery: false,
    limit: limit,
    offset: offset,
  });

  if (vendors) {
    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: vendors,
    });
  }
});

// fetch Vendors with update
router.get("/filterVendors", async (req, res) => {
  const { id } = req.query;
  try {
    const isFetch = await Vendors.findOne({
      where: { id: id },
    });
    // console.log(isFetch);
    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.log(error);
  }
});

// fetch product
router.get("/fetchProduct", async (req, res) => {
  const { id } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    const { count, rows: isFetch } = await Product_Tag_Vendor.findAndCountAll({
      where: { vendor_id: id },
      include: [
        {
          model: ProductList,
          required: true,
        },
      ],
      limit,
      offset,
    });
    // console.log(isFetch);
    if (isFetch) {
      res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: isFetch,
      });
    }
  } catch (error) {
    console.log(error);
  }
});
router.route("/product-tag-vendor").get(async (req, res) => {
  try {
    const { id } = req.query;
    const productTagVendor = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: ProductList,
          required: true,
        },
      ],
      where: {
        vendor_id: id,
      },
    });

    res.status(200).json(productTagVendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// remove vendor product

router.post("/removeVendorProduct", async (req, res) => {
  const { productVendorID, productVendorStatus, userLoggedID } = req.query;
  try {
    const isUpdate = await Product_Tag_Vendor.update(
      {
        status: productVendorStatus === "Active" ? "Inactive" : "Active",
      },
      {
        where: {
          id: productVendorID,
        },
      }
    );

    const getProdct = await Product_Tag_Vendor.findOne({
      include: [
        {
          model: ProductList,
          attributes: ["product_name"],
        },
      ],
      where: {
        id: productVendorID,
      },
    });

    const stats = productVendorStatus === "Active" ? "inactive" : "active";

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Vendor: User ${stats} a product named ${getProdct.product_list.product_name}`,
    });
    if (isUpdate) {
      return res.status(200).json();
    } else {
      return res.status(400).json();
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/fetchVendorCurrency", async (req, res) => {
  try {
    const { vendorId } = req.query;

    if (!vendorId) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    const vendorData = await Vendors.findOne({
      where: {
        id: vendorId,
      },
    });

    res.status(200).json(vendorData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Vendor Change Status route
router.route("/vendorChangeStatus").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { selectedVendor, changeToStatus } = req.body;

    const updateVendorStatus = await Vendors.update(
      {
        status: changeToStatus,
      },
      {
        where: {
          id: {
            [Op.in]: selectedVendor,
          },
        },
        transaction,
      }
    );

    if (updateVendorStatus) {
      await transaction.commit();
      res.status(200).json("Vendor Statuses Updated Successfully");
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Vendor Bulk Deletion route
router.route("/vendorBulkSoftDelete").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { selectedVendor } = req.body;

    // Prevent deletion if the vendor has related Payable Transaction
    const vendorWithTransaction = await Payable.findOne({
      include: [
        {
          model: Vendors,
          required: true,
        },
      ],
      where: {
        vendor_id: {
          [Op.in]: selectedVendor,
        },
        isDeleted: false,
      },
      transaction,
    });

    if (vendorWithTransaction) {
      await transaction.rollback();
      return res.status(409).json({
        message:
          "Cannot delete: One of the selected vendor has an existing Sales Invoice transaction.",
        company_name: vendorWithTransaction.vendor.company_name,
        transaction_id: vendorWithTransaction.transaction_id,
      });
    }

    // Vendor Soft Delete
    const [updatedCount] = await Vendors.update(
      {
        isArchive: 1,
      },
      {
        where: {
          id: {
            [Op.in]: selectedVendor,
          },
        },
        transaction,
      }
    );

    await transaction.commit();
    res.status(200).json({
      message: `${updatedCount} vendors deleted successfully.`,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Vendor fetching for Local/Overseas Purchase module
router.route("/payable-vendor").get(async (req, res) => {
  try {
    const { foreign } = req.query;
    const payableVendor = await Vendors.findAll({
      include: [
        {
          model: Payable,
          required: true,
          where: {
            domestic_type: foreign,
            status: "Approved",
            isAdded: false,
            isDeleted: false,
          },
        },
      ],
      where: {
        status: "Active",
        isArchive: false,
      },
    });

    res.status(200).json(payableVendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//pagination getvendors
// router.get("/getVendorsData", async (req, res) => {
//   const { filterStatus, filterDesignation, filterColumn, searchText } =
//     req.query;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;
//   // console.log(req.query.filterStatus);
//   let whereClause = {};
//   const vendorTableColumn = [
//     "company_name",
//     "company_nature",
//     "company_email",
//     "company_city",
//     "company_country",
//     "contact",
//   ];

//   if (searchText && searchText.trim() !== "") {
//     switch (filterColumn) {
//       case "company_name":
//         whereClause["company_name"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       case "company_nature":
//         whereClause["company_nature"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;

//       case "company_email":
//         whereClause["company_email"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;

//       case "company_city":
//         whereClause["company_city"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;

//       case "company_country":
//         whereClause["company_country"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       case "contact_person":
//         whereClause = sequelize.where(
//           fn("CONCAT", col("fname"), " ", col("lname")),
//           {
//             [Op.like]: `%${searchText}%`,
//           }
//         );
//         break;
//       case "contact":
//         whereClause["contact"] = {
//           [Op.like]: `%${searchText}%`,
//         };
//         break;
//       default:
//         whereClause = {
//           [Op.or]: [
//             ...vendorTableColumn.map((col) => {
//               return {
//                 [col]: {
//                   [Op.like]: `%${searchText}%`,
//                 },
//               };
//             }),
//             sequelize.where(fn("CONCAT", col("fname"), " ", col("lname")), {
//               [Op.like]: `%${searchText}%`,
//             }),
//           ],
//         };
//         break;
//     }
//   }
//   if (filterStatus !== "All" && filterStatus) {
//     whereClause["$vendors.status$"] = filterStatus;
//   }

//   if (filterDesignation !== "All" && filterDesignation) {
//     whereClause["$vendors.company_designation$"] = filterDesignation;
//   }

//   const { count, rows: vendors } = await Vendors.findAndCountAll({
//     include: [
//       {
//         model: Currency,
//         required: true,
//       },
//     ],
//     where: { ...whereClause, isArchive: 0 },
//     order: [["createdAt", "DESC"]],
//     subQuery: false,
//     limit: limit,
//     offset: offset,
//   });

//   if (vendors) {
//     return res.json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: parseInt(page || 1),
//       data: vendors,
//     });
//   }
// });

router.get("/getVendorsData", async (req, res) => {
  // console.log("getVendorsData called");
  // const { filterStatus, filterDesignation, filterColumn, searchText } =
  //   req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { count, rows: vendors } = await Vendors.findAndCountAll({
    include: [
      {
        model: Currency,
        required: true,
      },
    ],
    where: { isArchive: 0, status: "Active" },
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
  });

  if (vendors) {
    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: vendors,
    });
  }
});

router.get("/getVendorsData-filter", async (req, res) => {
  // console.log("getVendorsData called");
  const { filterStatus, filterDesignation } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = { isArchive: 0 };

  if (filterStatus !== "All") {
    whereClause["status"] = filterStatus;
  }

  if (filterDesignation !== "All") {
    whereClause["company_designation"] = filterDesignation;
  }

  const { count, rows: vendors } = await Vendors.findAndCountAll({
    include: [
      {
        model: Currency,
        required: true,
      },
    ],
    where: whereClause,
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
  });

  if (vendors) {
    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: vendors,
    });
  }
});

router.get("/getVendorsData-search", async (req, res) => {
  // console.log("getVendorsData called");
  const { filterStatus, filterDesignation, searchText, filterColumn } =
    req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = {
    isArchive: 0,
    ...(filterStatus !== "All" && {
      status: filterStatus,
    }),
    ...(filterDesignation !== "All" && {
      company_designation: filterDesignation,
    }),
  };

  if (filterColumn !== "all") {
    whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
  } else {
    whereClause = {
      ...whereClause, // preserve default conditions
      [Op.or]: [
        { company_name: { [Op.like]: `%${searchText}%` } },
        { company_nature: { [Op.like]: `%${searchText}%` } },
        { company_email: { [Op.like]: `%${searchText}%` } },
        { supplier_code: { [Op.like]: `%${searchText}%` } },
        { company_city: { [Op.like]: `%${searchText}%` } },
        { company_country: { [Op.like]: `%${searchText}%` } },
        { fname: { [Op.like]: `%${searchText}%` } },
        { lname: { [Op.like]: `%${searchText}%` } },
        { contact: { [Op.like]: `%${searchText}%` } },
        { contact2: { [Op.like]: `%${searchText}%` } },
      ],
    };
  }

  const { count, rows: vendors } = await Vendors.findAndCountAll({
    include: [
      {
        model: Currency,
        required: true,
      },
    ],
    where: whereClause,
    order: [["createdAt", "DESC"]],
    limit: limit,
    offset: offset,
  });

  if (vendors) {
    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: vendors,
    });
  }
});

// Get all vendors with supplier code
router.route("/supplier-code").get(async (req, res) => {
  try {
    const vendorsWithSupplierCode = await Vendors.findAll({
      attributes: [[sequelize.col("id"), "vendor_id"], "supplier_code"],
      where: {
        supplier_code: {
          [Op.ne]: null,
          [Op.ne]: "",
        },
        isArchive: false,
      },
      raw: true,
    });

    res.status(200).json(vendorsWithSupplierCode);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
