const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Customer,
  Activity_Log,
  SalesInvoice,
  SalesInvoiceInventory,
  StockManagement,
  ProductList,
} = require("../db/models/associations");
const CustomerCashWallet = require("../db/models/customer_cash_wallet.model");
const session = require("express-session");

// router.route("/getCustomers").get(async (req, res) => {
//   try {
//     const { selectedStatus, selectedType, filterColumn, searchText } =
//       req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     let customerWhereClause = {};
//     const customerTableColumn = [
//       "tin",
//       "customer_name",
//       "company_name",
//       "mobile_no",
//       "email",
//       "country",
//       "type",
//     ];

//     if (!selectedStatus || !selectedType)
//       return res.status(404).json({ message: "Missing Customer Status/Type" });

//     // if (selectedStatus !== undefined && selectedStatus !== "") {
//     //   customerWhereClause["status"] = selectedStatus === "true";
//     // }

//     if (searchText && searchText.trim() !== "") {
//       switch (filterColumn) {
//         case "tin":
//           customerWhereClause["tin"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         case "customer_name":
//           customerWhereClause = {
//             [Op.and]: [
//               sequelize.where(
//                 fn("CONCAT", col("first_name"), " ", col("last_name")),
//                 {
//                   [Op.like]: `%${searchText}%`,
//                 }
//               ),
//             ],
//           };
//           break;
//         case "company":
//           customerWhereClause["company_name"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;
//         case "phone":
//           customerWhereClause["mobile_no"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;
//         case "email":
//           customerWhereClause["email"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;
//         case "country":
//           customerWhereClause["country"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         case "type":
//           customerWhereClause["type"] = {
//             [Op.like]: `%${searchText}%`,
//           };
//           break;

//         default:
//           customerWhereClause = {
//             [Op.or]: customerTableColumn.map((column) => {
//               if (column === "customer_name") {
//                 return sequelize.where(
//                   fn("CONCAT", col("first_name"), " ", col("last_name")),
//                   {
//                     [Op.like]: `%${searchText}%`,
//                   }
//                 );
//               } else {
//                 return {
//                   [column]: {
//                     [Op.like]: `%${searchText}%`,
//                   },
//                 };
//               }
//             }),
//           };
//           break;
//       }
//     }

//     if (selectedType && selectedStatus !== "All") {
//       customerWhereClause["status"] =
//         selectedStatus === "Active" ? true : false;
//     }

//     if (selectedType && selectedType !== "All") {
//       customerWhereClause["type"] = selectedType;
//     }

//     const { count, rows: customers } = await Customer.findAndCountAll({
//       // where: {
//       //   status: {
//       //     [Op.ne]: 0,
//       //   },
//       // },
//       limit: limit,
//       offset: offset,
//       order: [["createdAt", "DESC"]],
//       where: { ...customerWhereClause, isDeleted: false },
//     });

//     if (customers) {
//       return res.json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: customers,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/getCustomers").get(async (req, res) => {
  try {
    // const { selectedStatus, selectedType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: customers } = await Customer.findAndCountAll({
      // where: {
      //   status: {
      //     [Op.ne]: 0,
      //   },
      // },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      where: { isDeleted: false, status: true },
    });

    if (customers) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: customers,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomersByFilter").get(async (req, res) => {
  // console.log("pasok");
  try {
    const { selectedStatus, selectedType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = { isDeleted: false };

    if (selectedStatus !== "All") {
      whereClause["status"] = selectedStatus === "Active" ? true : false;
    }

    if (selectedType !== "All") {
      whereClause["type"] = selectedType;
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      // where: {
      //   status: {
      //     [Op.ne]: 0,
      //   },
      // },
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    if (customers) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: customers,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomersBySearch").get(async (req, res) => {
  try {
    const { selectedStatus, selectedType, filterColumn, searchText } =
      req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    // console.log(selectedStatus);

    let whereClause = {
      isDeleted: false,
      ...(selectedStatus !== "All" && {
        status: selectedStatus === "Active" ? true : false,
      }),
      ...(selectedType !== "All" && { type: selectedType }),
    };

    if (filterColumn !== "all") {
      whereClause[`$${filterColumn}$`] = { [Op.like]: `%${searchText}%` };
    } else {
      whereClause = {
        ...whereClause, // preserve default conditions
        [Op.or]: [
          { tin: { [Op.like]: `%${searchText}%` } },
          { first_name: { [Op.like]: `%${searchText}%` } },
          { last_name: { [Op.like]: `%${searchText}%` } },
          { company_name: { [Op.like]: `%${searchText}%` } },
          { mobile_no: { [Op.like]: `%${searchText}%` } },
          { company_email: { [Op.like]: `%${searchText}%` } },
          { country: { [Op.like]: `%${searchText}%` } },
          { type: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      where: whereClause,
    });

    if (customers) {
      return res.json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: customers,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/create").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      type,
      status,
      firstName,
      lastName,
      email,
      companyAddress,
      country,
      destination,
      civilStatus,
      birthDate,
      gender,
      mobileNumber,
      jobPosition,
      tin,
      companyName,
      companyNature,
      companyEmail,
      notes,
      userLoggedID,
      cashWallet,
    } = req.body;

    const existingCustomerWithFullName = await Customer.findOne({
      where: {
        [Op.and]: [{ first_name: firstName }, { last_name: lastName }],
        isDeleted: false,
      },
    });

    const existingCustomerWithCompanyName = await Customer.findOne({
      where: {
        company_name: companyName,
        isDeleted: false,
      },
    });

    const existingCustomer =
      type === "company"
        ? existingCustomerWithCompanyName
        : existingCustomerWithFullName;

    if (existingCustomer) {
      await transaction.rollback();
      return res.status(201).send("Exist");
    } else {
      const totalBalance = cashWallet.reduce((acc, entry) => {
        console.log("Processing entry:", entry);
        return acc + parseFloat(entry.amount);
      }, 0);

      const newCustomer = await Customer.create(
        {
          type: type,
          status: status,
          first_name: firstName,
          last_name: lastName,
          email: email,
          company_address: companyAddress,
          country: country,
          destination: destination,
          civil_status: civilStatus,
          date_birth: birthDate,
          gender: gender,
          mobile_no: mobileNumber,
          job_position: jobPosition,
          tin: tin,
          company_name: companyName,
          company_nature: companyNature,
          company_email: companyEmail,
          notes: notes,
          balance: totalBalance,
        },
        { transaction }
      );

      if (cashWallet && cashWallet.length > 0) {
        for (const entry of cashWallet) {
          await CustomerCashWallet.create(
            {
              customer_id: newCustomer.customer_id,
              cash_type: entry.type,
              check_number: entry.checkNumber,
              amount: entry.amount,
            },
            { transaction }
          );
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Customers: User created a new customer named ${firstName} ${lastName}`,
      });

      await transaction.commit();
      res.status(200).json(newCustomer);
    }
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

router.route("/getCustomerDetails").get(async (req, res) => {
  try {
    const data = await Customer.findOne({
      where: {
        customer_id: req.query.customerId,
        isDeleted: false,
      },
    });
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/getCustomerCashWallet/:customerId").get(async (req, res) => {
  const { customerId } = req.params;
  try {
    const data = await CustomerCashWallet.findAll({
      where: { customer_id: customerId },
    });

    if (data) {
      return res.json(data);
    } else {
      return res.status(404).json("No data found for this customer");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/updateCustomer/:param_id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const customerId = req.params.param_id;
    let {
      formType,
      status,
      firstName,
      lastName,
      email,
      companyAddress,
      country,
      destination,
      civilStatus,
      birthDate,
      gender,
      mobileNumber,
      jobPosition,
      tin,
      companyName,
      companyNature,
      companyEmail,
      notes,
      cashWallet,
      userLoggedID,
    } = req.body;

    const existingData = await Customer.findOne({
      where: {
        first_name: firstName,
        last_name: lastName,
        customer_id: { [Op.ne]: customerId },
        isDeleted: false,
      },
    });

    const existingCompanyName = await Customer.findOne({
      where: {
        company_name: companyName,
        customer_id: { [Op.ne]: customerId },
        isDeleted: false,
      },
    });

    const existingCustomer =
      formType === "company" ? existingCompanyName : existingData;

    if (existingCustomer) {
      res.status(202).send("Exist");
    } else {
      // const customer = await Customer.findByPk(customerId, { transaction });
      const customer = await Customer.findOne({
        where: {
          customer_id: customerId,
          isDeleted: false,
        },
        transaction,
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      const newBalance = cashWallet.reduce((acc, entry) => {
        return acc + parseFloat(entry.amount);
      }, customer.balance || 0);

      const getData = await Customer.findOne({
        where: { customer_id: customerId, isDeleted: false },
      });

      const data = await Customer.update(
        {
          type: formType,
          status: status,
          first_name: firstName,
          last_name: lastName,
          email: email,
          company_address: companyAddress,
          country: country,
          destination: destination,
          civil_status: civilStatus,
          date_birth: birthDate,
          gender: gender,
          mobile_number: mobileNumber,
          job_position: jobPosition,
          tin: tin,
          company_name: companyName,
          company_nature: companyNature,
          company_email: companyEmail,
          notes: notes,
          balance: newBalance,
        },
        {
          where: { customer_id: customerId },
          returning: true,
          transaction,
        }
      );

      if (cashWallet && cashWallet.length > 0) {
        for (const entry of cashWallet) {
          await CustomerCashWallet.create(
            {
              customer_id: customerId,
              cash_type: entry.type,
              check_number: entry.checkNumber,
              amount: entry.amount,
            },
            { transaction }
          );
        }
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Customer: User updated customer information: \n
          First Name: ${getData.first_name} to ${firstName}
          Last Name: ${getData.last_name} to ${lastName}
          Email: ${getData.email} to ${email}
          Company Address: ${getData.company_address} to ${companyAddress}
          Country: ${getData.country} to ${country}
          Civil Status: ${getData.civilStatus} to ${civilStatus}
          Date_Birth: ${getData.date_birth} to ${birthDate}
          Gender: ${getData.gender} to ${gender}
          Mobile Number: ${getData.mobile_no} to ${mobileNumber}
          Job Position: ${getData.job_position} to ${jobPosition}
          Tin: ${getData.tin} to ${tin}
          Company Name: ${getData.company_name} to ${companyName}
          Company Nature: ${getData.company_nature} to ${companyNature}
          Company Email: ${getData.company_email} to ${companyEmail}
          
        `,
      });

      await transaction.commit();
      res.status(200).json({ message: "Data updated successfully", data });
    }
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

// count customer
router.route("/countCustomers").get(async (req, res) => {
  try {
    // Count customers where customer_id is not null
    const customerCount = await Customer.count({
      where: { customer_id: { [Op.ne]: null } },
    });

    // Send the customer count as a response
    res.json({ totalCustomers: customerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// count customer this month
router.route("/countCustomersWithinMonth").get(async (req, res) => {
  try {
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );

    // Count the customers created between the first and last days of the month
    const customerCount = await Customer.count({
      where: {
        createdAt: {
          [Op.between]: [firstDayOfMonth, lastDayOfMonth],
        },
      },
    });

    res.json({ count: customerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error counting customers");
  }
});

router.route("/customerChangeStatus").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { selectedCustomers, changeToStatus } = req.body;

    const updatedCustomers = await Customer.update(
      {
        status: changeToStatus === "Active" ? true : false,
      },
      {
        where: {
          customer_id: {
            [Op.in]: selectedCustomers,
          },
        },
        transaction,
      }
    );

    if (updatedCustomers) {
      await transaction.commit();
      res
        .status(200)
        .json({ message: "Customer Statuses Updated Successfully." });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/customerSoftDelete/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Prevent deletion if there's no existing Id
    const customer = await Customer.findOne({
      where: {
        customer_id: id,
        isDeleted: false,
      },
    });

    if (!customer) {
      await transaction.rollback();
      return res.status(404).json(`No Customer Id: ${id} found.`);
    }

    // Prevent deletion if customer has related Sales Invoice transaction
    const customerWithTransaction = await SalesInvoice.findOne({
      where: {
        customer_id: id,
        isDeleted: false,
      },
    });

    if (customerWithTransaction) {
      await transaction.rollback();
      return res.status(409).json({
        message:
          "Cannot delete: This customer has an existing Sales Invoice transaction.",
        transaction_id: customerWithTransaction.transaction_id,
      });
    }

    // Customer soft delete
    const deleteCustomer = await Customer.update(
      {
        isDeleted: true,
      },
      {
        where: {
          customer_id: id,
        },
        transaction,
      }
    );

    if (deleteCustomer) {
      await transaction.commit();
      res
        .status(200)
        .json({ message: "Customer has been deleted successfully." });
    }
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error);
  }
});

// Customer bulk soft delete
router.route("/customerBulkSoftDelete").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { selectedCustomers } = req.body;

    // Prevent deletion if atleast one customer has related Sales Invoice transaction
    const customerWithTransaction = await SalesInvoice.findOne({
      include: [
        {
          model: Customer,
          required: true,
        },
      ],
      where: {
        customer_id: {
          [Op.in]: selectedCustomers,
        },
        isDeleted: false,
      },
    });

    if (customerWithTransaction) {
      await transaction.rollback();
      const { customer } = customerWithTransaction;
      return res.status(409).json({
        message:
          "Cannot delete: One of the selected customer has an existing Sales Invoice transaction.",
        company_name: customer.company_name,
        customer_name: customer.first_name + " " + customer.last_name,
        transaction_id: customerWithTransaction.transaction_id,
      });
    }

    // Customer bulk deletion
    const [updatedCount] = await Customer.update(
      {
        isDeleted: true,
      },
      {
        where: {
          customer_id: {
            [Op.in]: selectedCustomers,
          },
        },
        transaction,
      }
    );

    await transaction.commit();
    res.status(200).json({
      message: `${updatedCount} customers deleted successfully.`,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//sold product table route - ADD PAGINATION
router.route("/getSoldProducts/:customerId").get(async (req, res) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get count and paginated data
    const { count, rows: soldProducts } =
      await SalesInvoiceInventory.findAndCountAll({
        include: [
          {
            model: SalesInvoice,
            where: {
              customer_id: customerId,
              isDeleted: false,
              status: "approved",
            },
            required: true,
            attributes: [],
          },
          {
            model: StockManagement,
            required: true,
            attributes: [],
            include: [
              {
                model: ProductList,
                required: true,
                attributes: [
                  "product_code",
                  "product_name",
                  "product_category",
                  "unit_of_measure",
                ],
              },
            ],
          },
        ],
        attributes: [
          "id",
          "unit_price",
          [
            sequelize.col("stock_management->product_list.product_code"),
            "product_code",
          ],
          [
            sequelize.col("stock_management->product_list.product_name"),
            "product_name",
          ],
          [
            sequelize.col("stock_management->product_list.product_category"),
            "category",
          ],
          [
            sequelize.col("stock_management->product_list.unit_of_measure"),
            "unit_of_measure",
          ],
        ],
        subQuery: false,
        raw: true,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

    // Return paginated response
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: soldProducts || [],
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
});

// Remove sold product
router
  .route("/removeSoldProduct/:customerId/:productId")
  .delete(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { customerId, productId } = req.params;

      // Find and delete the sales invoice item
      const deleted = await SalesInvoiceInventory.destroy({
        where: {
          id: productId,
        },
        include: [
          {
            model: SalesInvoice,
            where: {
              customer_id: customerId,
              isDeleted: false,
              status: "approved",
            },
            required: true,
          },
          {
            model: StockManagement,
            where: {
              product_id: productId,
            },
            required: true,
          },
        ],
        transaction,
      });

      if (deleted === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: "Product not found" });
      }

      await transaction.commit();
      res.json({ message: "Product removed successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ message: "Failed to remove product" });
    }
  });

router
  .route("/getCustomerApprovedInvoices/:customerId")
  .get(async (req, res) => {
    try {
      const { customerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Get count and paginated data
      const { count, rows: approvedInvoices } =
        await SalesInvoice.findAndCountAll({
          where: {
            customer_id: customerId,
            isDeleted: false,
            status: {
              [Op.in]: ["Approved", "Partially Collected", "Collected", "Paid"],
            },
          },
          order: [["createdAt", "DESC"]],
          attributes: [
            "sales_invoice_id",
            "client_transaction_id",
            "destination",
            "invoice_date",
            "date_approved",
            "total_amount",
            "createdAt",
          ],
          limit: limit,
          offset: offset,
        });

      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: approvedInvoices || [],
      });
    } catch (err) {
      console.error("Error:", err);
      res
        .status(500)
        .json({ message: "An error occurred", error: err.message });
    }
  });

// router.route("/getCustomerApprovedInvoices/:customerId/search").get(async (req, res) => {
//     try {
//       const { customerId } = req.params;
//       const { searchText, filterColumn = "all" } = req.query;
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const offset = (page - 1) * limit;

//       let whereClause = {
//         customer_id: customerId,
//         isDeleted: false,
//         status: {
//           [Op.in]: ["Approved", "Partially Collected", "Collected", "Paid"],
//         },
//       };

//       // Add search conditions
//       if (searchText && searchText.trim() !== "") {
//         if (filterColumn !== "all") {
//           whereClause[filterColumn] = { [Op.like]: `%${searchText}%` };
//         } else {
//           // Search across multiple fields
//           whereClause = {
//             ...whereClause,
//             [Op.or]: [
//               { client_transaction_id: { [Op.like]: `%${searchText}%` } },
//               { destination: { [Op.like]: `%${searchText}%` } },
//               // Search transaction date (createdAt) - handles both full datetime and date-only
//               sequelize.where(
//                 sequelize.fn("DATE", sequelize.col("createdAt")),
//                 { [Op.like]: `%${searchText}%` }
//               ),
//               // Search invoice date - handles both full datetime and date-only
//               sequelize.where(
//                 sequelize.fn("DATE", sequelize.col("invoice_date")),
//                 { [Op.like]: `%${searchText}%` }
//               ),
//             ],
//           };
//         }
//       }

//       // Get count and paginated data
//       const { count, rows: approvedInvoices } =
//         await SalesInvoice.findAndCountAll({
//           where: whereClause,
//           order: [["createdAt", "DESC"]],
//           attributes: [
//             "sales_invoice_id",
//             "client_transaction_id",
//             "destination",
//             "invoice_date",
//             "date_approved",
//             "total_amount",
//             "createdAt",
//           ],
//           limit: limit,
//           offset: offset,
//         });

//       return res.status(200).json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: approvedInvoices || [],
//       });
//     } catch (err) {
//       console.error("Error:", err);
//       res
//         .status(500)
//         .json({ message: "An error occurred", error: err.message });
//     }
//   });


router
  .route("/getCustomerApprovedInvoices/:customerId/search")
  .get(async (req, res) => {
    try {
      const { customerId } = req.params;
      const { searchText, filterColumn = "all" } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      let invoiceIds = [];

      // If searching by product code or product name, find matching invoice IDs first
      if (searchText && searchText.trim() !== "") {
        const matchingInventories = await SalesInvoiceInventory.findAll({
          include: [
            {
              model: StockManagement,
              required: true,
              attributes: [],
              include: [
                {
                  model: ProductList,
                  required: true,
                  attributes: [],
                  where: {
                    [Op.or]: [
                      {
                        product_code: {
                          [Op.like]: `%${searchText}%`,
                        },
                      },
                      {
                        product_name: {
                          [Op.like]: `%${searchText}%`,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
          attributes: ["sales_invoice_id"],
          raw: true,
        });

        invoiceIds = matchingInventories.map((inv) => inv.sales_invoice_id);
      }

      let whereClause = {
        customer_id: customerId,
        isDeleted: false,
        status: {
          [Op.in]: ["Approved", "Partially Collected", "Collected", "Paid"],
        },
      };

      // Add search conditions
      if (searchText && searchText.trim() !== "") {
        whereClause = {
          ...whereClause,
          [Op.or]: [
            { client_transaction_id: { [Op.like]: `%${searchText}%` } },
            { destination: { [Op.like]: `%${searchText}%` } },
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("createdAt")),
              { [Op.like]: `%${searchText}%` }
            ),
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("invoice_date")),
              { [Op.like]: `%${searchText}%` }
            ),
            // If product search found results, include those invoice IDs
            ...(invoiceIds.length > 0
              ? [{ sales_invoice_id: { [Op.in]: invoiceIds } }]
              : []),
          ],
        };
      }

      // Get count and paginated data
      const { count, rows: approvedInvoices } =
        await SalesInvoice.findAndCountAll({
          where: whereClause,
          order: [["createdAt", "DESC"]],
          attributes: [
            "sales_invoice_id",
            "client_transaction_id",
            "destination",
            "invoice_date",
            "date_approved",
            "total_amount",
            "createdAt",
          ],
          limit: limit,
          offset: offset,
          distinct: true,
        });

      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: approvedInvoices || [],
      });
    } catch (err) {
      console.error("Error:", err);
      res
        .status(500)
        .json({ message: "An error occurred", error: err.message });
    }
  });
module.exports = router;
