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
  Packaging,
  VendorsProductPriceHistory,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");

// fetch
// Used MOdule:
// -- Payable Purchase
//-- Create FIxed Asset
router.get("/fetchVendors", async (req, res) => {
  try {
    const vendors = await Vendors.findAll({
      order: [["company_name", "ASC"]],
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
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
      userLoggedID,
      vat,
    } = req.body;

    const isExist = await Vendors.findOne({
      where: {
        company_name: companyName,
        company_nature: companyNature,
        company_email: emailAddress,
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
        vat,
      });
      if (vendors) {
        console.log(`------------fgadwad`);
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
      vat,
      status,
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
          vat,
          status,
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

            const clientCode = data.vendor_prod_code;
            const clientProdName = data.vendor_prod_name;

            if (data.type === "old") {
              const getProductTagVendor = await Product_Tag_Vendor.findOne({
                where: {
                  product_id: data.prod_id,
                  vendor_id: id,
                },
              });

              await Product_Tag_Vendor.update(
                {
                  vendor_product_code: clientCode,
                  vendor_product_name: clientProdName,
                },
                {
                  where: {
                    product_id: data.prod_id,
                    vendor_id: id,
                  },
                }
              );

              if (getProductTagVendor.product_price === final_price) {
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
                await Product_Tag_Vendor.update(
                  {
                    previous_price: getProductTagVendor.product_price,
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

                await VendorsProductPriceHistory.create({
                  vendor_id: id,
                  product_id: data.prod_id,
                  previous_amount: getProductTagVendor.product_price,
                });
              }
            } else {
              await Product_Tag_Vendor.create({
                product_id: data.prod_id,
                vendor_id: id,
                vendor_product_code: clientCode,
                vendor_product_name: clientProdName,
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
         Company Designation: ${getData.company_designation} to ${designation}
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

// fetch vendors
router.get("/fetchPaginatedVendors", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: vendors } = await Vendors.findAndCountAll({
      include: [
        {
          model: Currency,
          required: true,
          attributes: ["currency_name"], // Only fetch the currency name
        },
      ],
      attributes: [
        "id",
        "company_name",
        "company_nature",
        "company_email",
        "company_designation",
        "company_city",
        "company_country",
        "fname",
        "lname",
        "contact",
        "status",
      ],
      order: [["company_name", "ASC"]],
      limit: limit,
      offset: offset,
    });

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//filter vendors
router.get("/filterSearchVendors", async (req, res) => {
  const {
    filterStatus,
    filterDesignation,
    filterColumn,
    searchText,
    filterCurrency,
  } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let whereClause = {};
  const vendorTableColumn = [
    "company_name",
    "company_nature",
    "company_email",
    "company_designation",
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
      case "company_designation":
        whereClause["company_designation"] = {
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
      case "currency":
        whereClause["$currency.currency_name$"] = {
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
            {
              "$currency.currency_name$": {
                [Op.like]: `%${searchText}%`,
              },
            },
          ],
        };
        break;
    }
  }

  if (
    filterCurrency &&
    filterCurrency !== "All" &&
    filterCurrency.trim() !== ""
  ) {
    whereClause["$currency.currency_name$"] = filterCurrency;
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
        where:
          (filterColumn === "currency" && searchText) || filterCurrency
            ? {
                currency_name: filterCurrency
                  ? filterCurrency
                  : { [Op.like]: `%${searchText}%` },
              }
            : {},
      },
    ],
    where: whereClause,
    order: [["company_name", "ASC"]],
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
  try {
    const isFetch = await Product_Tag_Vendor.findAll({
      where: { vendor_id: id },
      include: [
        {
          model: ProductList,

          required: true,
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [[{ model: ProductList }, "product_code", "ASC"]],
    });
    console.log(isFetch, "FETCH DATA PRODUCT");
    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.log(error);
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

// get vendor product history data
router.get("/getVendorHistory", async (req, res) => {
  const { vendor_id, product_id } = req.query;
  try {
    const isFetch = await VendorsProductPriceHistory.findAll({
      where: { vendor_id, product_id },
      include: [
        {
          model: ProductList,
          as: "price_history_product_id",
          required: true,
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
        {
          model: Vendors,
          as: "price_history_vendor_id",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    // console.log(isFetch);
    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
