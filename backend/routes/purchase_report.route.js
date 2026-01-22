const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  Production,
  StockManagement,
  ProductList,
  Production_Raw_Used,
  Production_Finish_Product,
  Production_finish_raw_used,
  Warehouse,
  Product_Tag_Vendor,
  Payable_Product,
  Payable,
  PayableBulk,
  Vendors,
  Payable_Bulk_Transaction,
  Cutoff,
  Currency,
  Payable_Fees,
} = require("../db/models/associations");
const moment = require("moment-timezone");
const session = require("express-session");
const { isColString } = require("sequelize/lib/utils");
const Payable_Bulk = require("../db/models/payable_bulk.model");
const PayableJournal = require("../db/models/payable_journal.model");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/getProductReport").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  const isFetch = await Payable_Product.findAll({
    attributes: ["moisture", "moisture_type", "unitPrice", "weight"],
    include: [
      {
        model: Product_Tag_Vendor,
        required: true,
        attributes: ["id"],
        include: [
          {
            model: ProductList,
            required: true,
            attributes: ["product_id", "product_code", "product_name"],
          },
        ],
      },
      {
        model: Payable,
        required: true,
        attributes: [
          "rate",
          "discount_value",
          "weighing_fee",
          "isPercent_Discount",
          "status",
          "purchaseDate",
          "isDeleted",
        ],
        include: [
          // {
          //   model: Currency,
          //   required: true,
          // },
          {
            model: Payable_Fees,
            required: false,
            attributes: ["fee_amount"],
          },
        ],
        where: {
          status: { [Op.or]: ["Approved", "Paid"] },
          purchaseDate: {
            [Op.and]: [
              { [Op.gte]: startDate }, // purchaseDate should be greater than or equal to endDate
              { [Op.lte]: endDate }, // purchaseDate should be less than or equal to startDate
            ],
          },
          isDeleted: false,
        },
      },
    ],
  });

  let productIdList = isFetch.map((item) => {
    return item.product_tag_vendor.product_list.product_id;
  }); // Get all Product ID

  let uniqueProduct = new Set(productIdList); // Unique Product ID
  let filteredProductById;
  let productCode;
  let totalWeight;
  let averageUnitPrice;
  let dataTable = [];

  for (const i of uniqueProduct) {
    filteredProductById = isFetch.filter((item) => {
      return item.product_tag_vendor.product_list.product_id === i;
    });

    productCode =
      filteredProductById[0].product_tag_vendor.product_list.product_code; // Product Code

    // Total Net Weight Computation
    totalWeight = filteredProductById.reduce((total, data) => {
      return (
        total +
        (data.moisture_type === "%"
          ? data.weight * (1 - data.moisture / 100)
          : data.weight - data.moisture)
      );
    }, 0);

    // Total Amount Computation
    let totalAmount = filteredProductById.reduce((total, value) => {
      let unitPrice = value.unitPrice * value.weight; // Unit Price
      // Total Moisture
      const moisture =
        value.moisture_type === "%"
          ? parseFloat(
              (value.moisture / 100) * value.unitPrice * value.weight || 0
            )
          : parseFloat(value.moisture || 0);

      // Total Other Fees
      const totalOtherFees = value.payable.payable_other_fees.reduce(
        (acc, data) => acc + parseFloat(data.fee_amount || 0),
        0
      );

      // Total Discout
      const calculateDiscount =
        value.payable.isPercent_Discount === true
          ? (value.payable.discount_value / 100) *
            parseFloat(
              unitPrice - moisture - value.payable.weighing_fee - totalOtherFees
            )
          : value.payable.discount_value;
      return (
        total +
        (unitPrice -
          moisture -
          value.payable.weighing_fee -
          totalOtherFees -
          calculateDiscount) *
          value.payable.rate
      );
    }, 0);

    averageUnitPrice = totalAmount / filteredProductById.length; // Average Unit Price

    dataTable.push({
      productCode,
      productName:
        filteredProductById[0].product_tag_vendor.product_list.product_name, // Product Name
      totalWeight,
      averageUnitPrice,
      totalAmount,
    });
  }

  res.status(200).json(dataTable);
});

router.route("/product/table-pagination").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const isFetch = await Payable_Product.findAll({
      attributes: ["moisture", "moisture_type", "unitPrice", "weight"],
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          attributes: ["id"],
          include: [
            {
              model: ProductList,
              required: true,
              attributes: ["product_id", "product_code", "product_name"],
            },
          ],
        },
        {
          model: Payable,
          required: true,
          attributes: [
            "rate",
            "discount_value",
            "weighing_fee",
            "isPercent_Discount",
            "status",
            "purchaseDate",
            "isDeleted",
          ],
          include: [
            // {
            //   model: Currency,
            //   required: true,
            // },
            {
              model: Payable_Fees,
              required: false,
              attributes: ["fee_amount"],
            },
          ],
          where: {
            status: { [Op.or]: ["Approved", "Paid"] },
            purchaseDate: {
              [Op.and]: [
                { [Op.gte]: startDate }, // purchaseDate should be greater than or equal to endDate
                { [Op.lte]: endDate }, // purchaseDate should be less than or equal to startDate
              ],
            },
            isDeleted: false,
          },
        },
      ],
    });

    let productIdList = isFetch.map((item) => {
      return item.product_tag_vendor.product_list.product_id;
    }); // Get all Product ID

    let uniqueProduct = new Set(productIdList); // Unique Product ID
    let filteredProductById;
    let productCode;
    let totalWeight;
    let averageUnitPrice;
    let dataTable = [];

    for (const i of uniqueProduct) {
      filteredProductById = isFetch.filter((item) => {
        return item.product_tag_vendor.product_list.product_id === i;
      });

      productCode =
        filteredProductById[0].product_tag_vendor.product_list.product_code; // Product Code

      // Total Net Weight Computation
      totalWeight = filteredProductById.reduce((total, data) => {
        return (
          total +
          (data.moisture_type === "%"
            ? data.weight * (1 - data.moisture / 100)
            : data.weight - data.moisture)
        );
      }, 0);

      // Total Amount Computation
      let totalAmount = filteredProductById.reduce((total, value) => {
        let unitPrice = value.unitPrice * value.weight; // Unit Price
        // Total Moisture
        const moisture =
          value.moisture_type === "%"
            ? parseFloat(
                (value.moisture / 100) * value.unitPrice * value.weight || 0
              )
            : parseFloat(value.moisture || 0);

        // Total Other Fees
        const totalOtherFees = value.payable.payable_other_fees.reduce(
          (acc, data) => acc + parseFloat(data.fee_amount || 0),
          0
        );

        // Total Discout
        const calculateDiscount =
          value.payable.isPercent_Discount === true
            ? (value.payable.discount_value / 100) *
              parseFloat(
                unitPrice -
                  moisture -
                  value.payable.weighing_fee -
                  totalOtherFees
              )
            : value.payable.discount_value;
        return (
          total +
          (unitPrice -
            moisture -
            value.payable.weighing_fee -
            totalOtherFees -
            calculateDiscount) *
            value.payable.rate
        );
      }, 0);

      averageUnitPrice = totalAmount / filteredProductById.length; // Average Unit Price

      dataTable.push({
        productCode,
        productName:
          filteredProductById[0].product_tag_vendor.product_list.product_name, // Product Name
        totalWeight,
        averageUnitPrice,
        totalAmount,
      });
    }

    const count = dataTable.length;
    const newDataTable = dataTable.slice(offset, limit * page);

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: newDataTable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Interal Server Error" });
  }
});

// Old route
// router.route("/getSupplierReport").get(async (req, res) => {
//   const { startDate, endDate } = req.query;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;

//   const isFetch = await Payable.findAll({
//     include: [
//       {
//         model: Vendors,
//         required: true,
//       },
//       {
//         model: Payable_Product,
//         required: true,
//       },
//       {
//         model: Payable_Bulk_Transaction,
//         required: false,
//         include: [
//           {
//             model: Payable_Bulk,
//             required: true,
//             include: [
//               {
//                 model: Currency,
//                 required: true,
//               },
//             ],
//             where: {
//               status: "Approved",
//               isDeleted: false,
//             },
//           },
//         ],
//       },
//       {
//         model: Currency,
//         required: true,
//       },
//     ],
//     where: {
//       status: { [Op.or]: ["Approved", "Paid"] },
//       purchaseDate: {
//         [Op.and]: [
//           { [Op.gte]: startDate }, // purchaseDate should be greater than or equal to endDate
//           { [Op.lte]: endDate }, // purchaseDate should be less than or equal to startDate
//         ],
//       },
//       isDeleted: false,
//     },
//   });

//   const fetchPayable = await Payable.findAll({
//     include: [
//       {
//         model: Payable_Bulk_Transaction,
//         required: false,
//         include: [
//           {
//             model: Payable_Bulk,
//             required: true,
//             where: {
//               status: "For-Approval",
//               isDeleted: false,
//             },
//           },
//         ],
//       },
//       {
//         model: Currency,
//         required: true,
//       },
//     ],
//     where: {
//       status: { [Op.or]: ["Approved", "Paid"] },
//       purchaseDate: {
//         [Op.and]: [
//           { [Op.gte]: startDate }, // purchaseDate should be greater than or equal to endDate
//           { [Op.lte]: endDate }, // purchaseDate should be less than or equal to startDate
//         ],
//       },
//       isDeleted: false,
//     },
//   });

//   let vendorNameList = isFetch.map((item) => {
//     return item.vendor.id;
//   }); // Get all Vendor ID

//   let uniqueVendor = new Set(vendorNameList); // Unique Vendor
//   let filteredVendor;
//   let totalNetWeight;
//   let averageUnitPrice;
//   const dataTable = [];

//   const calculateLastAccountBalance = async (i, startDate) => {
//     const data = await Payable.findAll({
//       include: [
//         {
//           model: Currency,
//           required: true,
//         },
//       ],
//       where: {
//         [Op.and]: [
//           { purchaseDate: { [Op.lt]: startDate } },
//           { isPaid: false },
//           // { isAdded: false },
//           { status: "Approved" },
//           { isDeleted: false },
//           { vendor_id: i },
//         ],
//       },
//     });

//     const lastAccountBalance = data.reduce((total, value) => {
//       return total + value.totalPrice * value.rate;
//     }, 0);

//     return lastAccountBalance;
//   };

//   for (const i of uniqueVendor) {
//     filteredVendor = isFetch.filter((item) => {
//       return item.vendor.id === i;
//     });

//     // Total Net Weight
//     totalNetWeight = filteredVendor.reduce((total, value) => {
//       return (
//         total +
//         value.payable_products.reduce((t, v) => {
//           return (
//             t +
//             (v.moisture_type === "%"
//               ? v.weight * (1 - v.moisture / 100)
//               : v.weight - v.moisture)
//           );
//         }, 0)
//       );
//     }, 0);

//     // Total Unit Price Computation
//     // const totalUnitPrice = filteredVendor.reduce((total, value) => {
//     //   return (
//     //     total +
//     //     value.payable_products.reduce((t, v) => {
//     //       return t + v.unitPrice * value.currency.currency_rate;
//     //     }, 0)
//     //   );
//     // }, 0);

//     const lastAccountBalance = await calculateLastAccountBalance(i, startDate);

//     // --- Accounts Paid ---
//     const filteredTransaction = isFetch.filter((item) => {
//       return item.payable_bulk_transactions[0]?.payable_bulk?.vendor_id === i;
//     }); // Filtered Transaction by Vendor ID

//     const transactionNumber = filteredTransaction.map((item) => {
//       return item.payable_bulk_transactions[0]?.payable_bulk
//         ?.transaction_number;
//     }); // List of transaction Number in filteredTransaction

//     let uniqueTransactionNumber = new Set(transactionNumber);
//     let newTransactionNumber = [...uniqueTransactionNumber];

//     const totalAmountsPaid = [];

//     // loop to transaction number to avoid duplicates
//     for (let index = 0; index < newTransactionNumber.length; index++) {
//       let i = filteredTransaction.filter((item) => {
//         return (
//           item.payable_bulk_transactions[0]?.payable_bulk
//             ?.transaction_number === newTransactionNumber[index]
//         );
//       });

//       totalAmountsPaid.push(
//         i[0].payable_bulk_transactions[0]?.payable_bulk?.total_amount *
//           i[0].payable_bulk_transactions[0]?.payable_bulk?.currency
//             ?.currency_rate
//       ); // push total amount
//     }

//     // Total the accounts paid
//     const amountsPaid = totalAmountsPaid.reduce((total, value) => {
//       return total + value;
//     }, 0);

//     // --- Accounts Payable ---
//     const accountsPayableArray = [];
//     const filteredPayable = fetchPayable.filter((item) => {
//       return item.vendor_id === i;
//     }); // Filter by Vendor ID

//     // Filter IsAdded
//     const filteredIsAdded = filteredPayable.filter((item) => {
//       return item.isAdded === false;
//     });
//     let totalIsAdded = filteredIsAdded.reduce((total, value) => {
//       return total + value.totalPrice * value.rate;
//     }, 0);
//     accountsPayableArray.push(totalIsAdded);

//     // Filter For-Approval
//     const filteredApproval = filteredPayable.filter((item) => {
//       return (
//         item?.payable_bulk_transactions[0]?.payable_bulk?.status ===
//         "For-Approval"
//       );
//     });
//     const totalAmountApproval = filteredApproval.reduce((total, value) => {
//       return (
//         total +
//         value.payable_bulk_transactions[0]?.payable_bulk.total_amount *
//           value.rate
//       );
//     }, 0);
//     accountsPayableArray.push(totalAmountApproval);

//     // total the amount
//     let flattendAccountsPayableArray = accountsPayableArray.flat();
//     let totalAccountsPayable = flattendAccountsPayableArray.reduce(
//       (total, value) => {
//         return total + value;
//       },
//       0
//     );

//     let totalAmount = amountsPaid + totalAccountsPayable;

//     averageUnitPrice = totalAmount / totalNetWeight; // Average Unit Price

//     // Create new row to table
//     dataTable.push({
//       companyName: filteredVendor[0].vendor.company_name,
//       vendorName: filteredVendor[0].vendor.fname,
//       vendorId: filteredVendor[0].vendor.id,
//       lastAccountBalance,
//       totalNetWeight,
//       averageUnitPrice: averageUnitPrice || 0,
//       amountsPaid,
//       amount: totalAmount || 0,
//       totalAccountsPayable: totalAccountsPayable || 0,
//     });
//   }

//   const vendorList = await Vendors.findAll();

//   for (const vendor of vendorList) {
//     const lastAccountBalance = await calculateLastAccountBalance(
//       vendor.id,
//       startDate
//     );

//     if (!dataTable.map((item) => item.vendorId).includes(vendor.id)) {
//       dataTable.push({
//         companyName: vendor.company_name,
//         vendorName: vendor.fname,
//         vendorId: vendor.id,
//         lastAccountBalance,
//         totalNetWeight: 0,
//         averageUnitPrice: 0,
//         amountsPaid: 0,
//         amount: 0,
//         totalAccountsPayable: 0,
//       });
//     }
//   }

//   const count = dataTable.length;
//   const newDataTable = dataTable.slice(offset, limit * page);

//   // return res.status(200).json({ data: dataTable });

//   res.json({
//     totalItems: count,
//     totalPages: Math.ceil(count / limit),
//     currentPage: parseInt(page || 1),
//     data: newDataTable,
//   });
// });

router.route("/getSupplierReport").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Step 1: Fetch payable records (Approved & Paid) with Vendor
    const payables = await Payable.findAll({
      attributes: [
        "id",
        "vendor_id",
        "totalPrice",
        "rate",
        "purchaseDate",
        "status",
        "isAdded",
        "isPaid",
      ],
      include: [
        {
          model: Vendors,
          attributes: ["id", "fname", "company_name"],
          required: true,
        },
        {
          model: Payable_Product,
          attributes: ["weight", "moisture", "moisture_type", "unitPrice"],
          required: true,
        },
        {
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: Payable_Bulk,
              attributes: [
                "id",
                "transaction_number",
                "total_amount",
                "vendor_id",
                "status",
              ],
              required: true,
              include: [
                {
                  model: Currency,
                  attributes: ["id", "currency_rate"],
                  required: true,
                },
              ],
              where: { status: "Approved", isDeleted: false },
            },
          ],
        },
        {
          model: Currency,
          attributes: ["id", "currency_rate"],
          required: true,
        },
      ],
      where: {
        status: { [Op.or]: ["Approved", "Paid"] },
        purchaseDate: { [Op.between]: [startDate, endDate] },
        isDeleted: false,
      },
    });

    // Step 2: Fetch For-Approval Payables separately
    const pendingPayables = await Payable.findAll({
      attributes: ["id", "vendor_id", "totalPrice", "rate", "isAdded"],
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: Payable_Bulk,
              attributes: ["id", "total_amount", "status"],
              required: true,
              where: { status: "For-Approval", isDeleted: false },
            },
          ],
        },
        {
          model: Currency,
          attributes: ["id", "currency_rate"],
          required: true,
        },
      ],
      where: {
        status: { [Op.or]: ["Approved", "Paid"] },
        purchaseDate: { [Op.between]: [startDate, endDate] },
        isDeleted: false,
      },
    });

    // Step 3: Vendor map
    const vendorMap = new Map();

    // Helper: Calculate last account balance in one grouped query
    const lastBalances = await Payable.findAll({
      attributes: [
        "vendor_id",
        [
          sequelize.fn("SUM", sequelize.literal("totalPrice * rate")),
          "balance",
        ],
      ],
      include: [{ model: Currency, attributes: [] }],
      where: {
        purchaseDate: { [Op.lt]: startDate },
        isPaid: false,
        status: "Approved",
        isDeleted: false,
      },
      group: ["vendor_id"],
      raw: true,
    });

    const balanceMap = lastBalances.reduce((acc, row) => {
      acc[row.vendor_id] = Number(row.balance) || 0;
      return acc;
    }, {});

    // Step 4: Process main Payables
    for (const p of payables) {
      const vendorId = p.vendor.id;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          companyName: p.vendor.company_name,
          vendorName: p.vendor.fname,
          vendorId,
          lastAccountBalance: balanceMap[vendorId] || 0,
          totalNetWeight: 0,
          amountsPaid: 0,
          totalAccountsPayable: 0,
        });
      }

      const vendorData = vendorMap.get(vendorId);

      // Compute net weight
      const netWeight = p.payable_products.reduce((t, v) => {
        return (
          t +
          (v.moisture_type === "%"
            ? v.weight * (1 - v.moisture / 100)
            : v.weight - v.moisture)
        );
      }, 0);

      vendorData.totalNetWeight += netWeight;

      // Accounts Paid
      if (p.payable_bulk_transactions.length) {
        const bulk = p.payable_bulk_transactions[0]?.payable_bulk;
        if (bulk?.total_amount) {
          vendorData.amountsPaid +=
            bulk.total_amount * (bulk.currency?.currency_rate || 1);
        }
      }
    }

    // Step 5: Accounts Payable (Pending + Not Added)
    for (const p of pendingPayables) {
      const vendorId = p.vendor_id;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          companyName: "",
          vendorName: "",
          vendorId,
          lastAccountBalance: balanceMap[vendorId] || 0,
          totalNetWeight: 0,
          amountsPaid: 0,
          totalAccountsPayable: 0,
        });
      }

      const vendorData = vendorMap.get(vendorId);

      if (p.isAdded === false) {
        vendorData.totalAccountsPayable += p.totalPrice * p.rate;
      }

      if (p.payable_bulk_transactions.length) {
        const bulk = p.payable_bulk_transactions[0]?.payable_bulk;
        if (bulk?.status === "For-Approval") {
          vendorData.totalAccountsPayable += bulk.total_amount * p.rate;
        }
      }
    }

    // Step 6: Finalize table
    const dataTable = Array.from(vendorMap.values()).map((vendor) => {
      const totalAmount = vendor.amountsPaid + vendor.totalAccountsPayable;
      const avgUnitPrice = vendor.totalNetWeight
        ? totalAmount / vendor.totalNetWeight
        : 0;

      return {
        ...vendor,
        averageUnitPrice: avgUnitPrice,
        amount: totalAmount,
      };
    });

    // Step 6.1: Include all vendors (even without payables)
    const allVendors = await Vendors.findAll({
      attributes: ["id", "fname", "company_name"],
    });

    for (const vendor of allVendors) {
      if (!dataTable.some((v) => v.vendorId === vendor.id)) {
        dataTable.push({
          companyName: vendor.company_name,
          vendorName: vendor.fname,
          vendorId: vendor.id,
          lastAccountBalance: balanceMap[vendor.id] || 0,
          totalNetWeight: 0,
          averageUnitPrice: 0,
          amountsPaid: 0,
          amount: 0,
          totalAccountsPayable: 0,
        });
      }
    }

    res.status(200).json({ data: dataTable });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.route("/supplier/table-pagination").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Step 1: Fetch payable records (Approved & Paid) with Vendor
    const payables = await Payable.findAll({
      attributes: [
        "id",
        "vendor_id",
        "totalPrice",
        "rate",
        "purchaseDate",
        "status",
        "isAdded",
        "isPaid",
      ],
      include: [
        {
          model: Vendors,
          attributes: ["id", "fname", "company_name"],
          required: true,
        },
        {
          model: Payable_Product,
          attributes: ["weight", "moisture", "moisture_type", "unitPrice"],
          required: true,
        },
        {
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: Payable_Bulk,
              attributes: [
                "id",
                "transaction_number",
                "total_amount",
                "vendor_id",
                "status",
              ],
              required: true,
              include: [
                {
                  model: Currency,
                  attributes: ["id", "currency_rate"],
                  required: true,
                },
              ],
              where: { status: "Approved", isDeleted: false },
            },
          ],
        },
        {
          model: Currency,
          attributes: ["id", "currency_rate"],
          required: true,
        },
      ],
      where: {
        status: { [Op.or]: ["Approved", "Paid"] },
        purchaseDate: { [Op.between]: [startDate, endDate] },
        isDeleted: false,
      },
    });

    // Step 2: Fetch For-Approval Payables separately
    const pendingPayables = await Payable.findAll({
      attributes: ["id", "vendor_id", "totalPrice", "rate", "isAdded"],
      include: [
        {
          model: Payable_Bulk_Transaction,
          required: false,
          include: [
            {
              model: Payable_Bulk,
              attributes: ["id", "total_amount", "status"],
              required: true,
              where: { status: "For-Approval", isDeleted: false },
            },
          ],
        },
        {
          model: Currency,
          attributes: ["id", "currency_rate"],
          required: true,
        },
      ],
      where: {
        status: { [Op.or]: ["Approved", "Paid"] },
        purchaseDate: { [Op.between]: [startDate, endDate] },
        isDeleted: false,
      },
    });

    // Step 3: Vendor map
    const vendorMap = new Map();

    // Helper: Calculate last account balance in one grouped query
    const lastBalances = await Payable.findAll({
      attributes: [
        "vendor_id",
        [
          sequelize.fn("SUM", sequelize.literal("totalPrice * rate")),
          "balance",
        ],
      ],
      include: [{ model: Currency, attributes: [] }],
      where: {
        purchaseDate: { [Op.lt]: startDate },
        isPaid: false,
        status: "Approved",
        isDeleted: false,
      },
      group: ["vendor_id"],
      raw: true,
    });

    const balanceMap = lastBalances.reduce((acc, row) => {
      acc[row.vendor_id] = Number(row.balance) || 0;
      return acc;
    }, {});

    // Step 4: Process main Payables
    for (const p of payables) {
      const vendorId = p.vendor.id;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          companyName: p.vendor.company_name,
          vendorName: p.vendor.fname,
          vendorId,
          lastAccountBalance: balanceMap[vendorId] || 0,
          totalNetWeight: 0,
          amountsPaid: 0,
          totalAccountsPayable: 0,
        });
      }

      const vendorData = vendorMap.get(vendorId);

      // Compute net weight
      const netWeight = p.payable_products.reduce((t, v) => {
        return (
          t +
          (v.moisture_type === "%"
            ? v.weight * (1 - v.moisture / 100)
            : v.weight - v.moisture)
        );
      }, 0);

      vendorData.totalNetWeight += netWeight;

      // Accounts Paid
      if (p.payable_bulk_transactions.length) {
        const bulk = p.payable_bulk_transactions[0]?.payable_bulk;
        if (bulk?.total_amount) {
          vendorData.amountsPaid +=
            bulk.total_amount * (bulk.currency?.currency_rate || 1);
        }
      }
    }

    // Step 5: Accounts Payable (Pending + Not Added)
    for (const p of pendingPayables) {
      const vendorId = p.vendor_id;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          companyName: "",
          vendorName: "",
          vendorId,
          lastAccountBalance: balanceMap[vendorId] || 0,
          totalNetWeight: 0,
          amountsPaid: 0,
          totalAccountsPayable: 0,
        });
      }

      const vendorData = vendorMap.get(vendorId);

      if (p.isAdded === false) {
        vendorData.totalAccountsPayable += p.totalPrice * p.rate;
      }

      if (p.payable_bulk_transactions.length) {
        const bulk = p.payable_bulk_transactions[0]?.payable_bulk;
        if (bulk?.status === "For-Approval") {
          vendorData.totalAccountsPayable += bulk.total_amount * p.rate;
        }
      }
    }

    // Step 6: Finalize table
    const dataTable = Array.from(vendorMap.values()).map((vendor) => {
      const totalAmount = vendor.amountsPaid + vendor.totalAccountsPayable;
      const avgUnitPrice = vendor.totalNetWeight
        ? totalAmount / vendor.totalNetWeight
        : 0;

      return {
        ...vendor,
        averageUnitPrice: avgUnitPrice,
        amount: totalAmount,
      };
    });

    // Step 6.1: Include all vendors (even without payables)
    const allVendors = await Vendors.findAll({
      attributes: ["id", "fname", "company_name"],
    });

    for (const vendor of allVendors) {
      if (!dataTable.some((v) => v.vendorId === vendor.id)) {
        dataTable.push({
          companyName: vendor.company_name,
          vendorName: vendor.fname,
          vendorId: vendor.id,
          lastAccountBalance: balanceMap[vendor.id] || 0,
          totalNetWeight: 0,
          averageUnitPrice: 0,
          amountsPaid: 0,
          amount: 0,
          totalAccountsPayable: 0,
        });
      }
    }

    // Step 7: Pagination
    const count = dataTable.length;
    const newDataTable = dataTable.slice(offset, offset + limit);

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: newDataTable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
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

router.route("/getPayable").get(async (req, res) => {
  const { startDate, endDate } = req.query;
  const isFetch = await Payable.findAll({
    include: [
      {
        model: Currency,
        required: true,
      },
    ],
    where: {
      status: { [Op.or]: ["Approved", "Paid"] },
      purchaseDate: {
        [Op.and]: [
          { [Op.gte]: startDate }, // purchaseDate should be greater than or equal to endDate
          { [Op.lte]: endDate }, // purchaseDate should be less than or equal to startDate
        ],
      },
      isDeleted: false,
    },
  });
  res.status(200).json(isFetch);
});

// Endpoint for Purchase Breakdown by Product (Table)
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

    // Get product list count
    const count = await ProductList.count({
      attributes: [],
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Product,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                  where: {
                    status: { [Op.in]: ["Approved", "Partially-Paid", "Paid"] },
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
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
          model: Product_Tag_Vendor,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Product,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                  where: {
                    status: { [Op.in]: ["Approved", "Partially-Paid", "Paid"] },
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
                    },
                    isDeleted: false,
                  },
                },
              ],
            },
          ],
        },
      ],
      raw: true,
      subQuery: false,
      limit,
      offset,
    });

    // Main fetching to get the purchase breakdown by product
    const products = await ProductList.findAll({
      // prettier-ignore
      attributes: [
        "product_id",
        "product_code",
        "product_name",
        [sequelize.literal(`SUM(net_weight)`), "purchaseQuantity"],
        [sequelize.literal(`AVG(unitPrice * currency_rate)`), "averageUnitPrice"],
        [sequelize.literal(`SUM(net_weight) * AVG(unitPrice * currency_rate)`), "amount"],
      ],
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Product,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
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
                    status: { [Op.in]: ["Approved", "Partially-Paid", "Paid"] },
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
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

    // Get product list count with search filter
    const count = await ProductList.count({
      attributes: [],
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Product,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                  where: {
                    status: { [Op.in]: ["Approved", "Partially-Paid", "Paid"] },
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
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
          model: Product_Tag_Vendor,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Product,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
                  required: true,
                  attributes: [],
                  where: {
                    status: { [Op.in]: ["Approved", "Partially-Paid", "Paid"] },
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
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
      raw: true,
      subQuery: false,
      limit,
      offset,
    });

    // Main fetching to get the purchase breakdown by product with search
    const products = await ProductList.findAll({
      // prettier-ignore
      attributes: [
        "product_id",
        "product_code",
        "product_name",
        [sequelize.literal(`SUM(net_weight)`), "purchaseQuantity"],
        [sequelize.literal(`AVG(unitPrice * currency_rate)`), "averageUnitPrice"],
        [sequelize.literal(`SUM(net_weight) * AVG(unitPrice * currency_rate)`), "amount"],
      ],
      include: [
        {
          model: Product_Tag_Vendor,
          required: true,
          attributes: [],
          include: [
            {
              model: Payable_Product,
              required: true,
              attributes: [],
              include: [
                {
                  model: Payable,
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
                    status: { [Op.in]: ["Approved", "Partially-Paid", "Paid"] },
                    purchaseDate: {
                      [Op.between]: [startDate, endDate],
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

// Endpoint for Purchase Breakdown by Supplier (Table)
router.route("/suppliers-tab").get(async (req, res) => {
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

    // Get the vendor name
    const vendorName = sequelize.literal(`(
      CASE 
        WHEN company_name IS NULL OR company_name = "" THEN CONCAT(fname, ' ', lname)
        ELSE company_name
      END
    )`);

    // Date condition for accounts paid
    const accountsPaidDateCondition = `date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Sum by payment type (Debit/Credit) and date
    const sumPaymentTypeAmount = (payment_type, dateCondition) =>
      `SUM(
        CASE WHEN payment_type=${sequelize.escape(payment_type)} 
          AND ${dateCondition} THEN total_amount * payable_journals.currency_rate
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
      return sequelize.literal(`${fn}(
        CASE
          WHEN date BETWEEN ${sequelize.escape(startDate)} 
          AND ${sequelize.escape(endDate)}
          AND payment_type = 'Debit'
          THEN ${column}
          ELSE ${elseValue}
        END
      )`)
    }

    // Get all PayableJournal item's count
    const count = await Vendors.count({
      distinct: true,
      col: "id",
    });

    // Get supplier ids with limit and offset
    const supplierIds = await Vendors.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("id")), "vendor_id"],
      ],
      raw: true,
      limit,
      offset,
    });

    // Main fetching to get the purchase breakdown by supplier
    const suppliers = await Vendors.findAll({
      // prettier-ignore
      attributes: [
        [sequelize.literal(`vendors.id`), "vendorId"],
        [vendorName, "vendorName"],
        [netBalance(startDate), 'lastAccountBalance'],
        [netBalance(endDate), 'accountsPayable'],             
        [sequelize.literal(sumPaymentTypeAmount("Credit", accountsPaidDateCondition)),"accountsPaid"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_quantity", startDate, endDate}), "purchaseQuantity"],
        [aggregateBetweenDates({ fn: "AVG", column: "avg_unit_price * payable_journals.currency_rate", startDate, endDate}), "averageUnitPrice"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_amount * payable_journals.currency_rate", startDate, endDate}), "newPurchaseAmount"],
      ],
      include: [
        {
          model: PayableJournal,
          required: false,
          attributes: [],
          where: {
            isDeleted: false,
          },
        },
      ],
      group: ["id"],
      where: {
        id: {
          [Op.in]: supplierIds.map((item) => item.vendor_id),
        },
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: suppliers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/suppliers-tab-search").get(async (req, res) => {
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

    // Build search where clause for vendors
    let vendorWhereClause = {};
    const vendorColumnTable = [
      "company_name",
      "company_nature",
      "company_address",
      "company_city",
      "company_country",
    ];

    if (searchFunction && searchFunction.trim() !== "") {
      switch (filterColumn) {
        case "company_name":
          vendorWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "company_nature":
          vendorWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "company_address":
          vendorWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "company_city":
          vendorWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        case "company_country":
          vendorWhereClause[filterColumn] = {
            [Op.like]: `%${searchFunction}%`,
          };
          break;
        default:
          vendorWhereClause = {
            [Op.or]: vendorColumnTable.map((col) => {
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

    // Get the vendor name
    const vendorName = sequelize.literal(`(
      CASE 
        WHEN company_name IS NULL OR company_name = "" THEN CONCAT(fname, ' ', lname)
        ELSE company_name
      END
    )`);

    // Date condition for accounts paid
    const accountsPaidDateCondition = `date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Sum by payment type (Debit/Credit) and date
    const sumPaymentTypeAmount = (payment_type, dateCondition) =>
      `SUM(
        CASE WHEN payment_type=${sequelize.escape(payment_type)} 
          AND ${dateCondition} THEN total_amount * payable_journals.currency_rate
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
      return sequelize.literal(`${fn}(
        CASE
          WHEN date BETWEEN ${sequelize.escape(startDate)} 
          AND ${sequelize.escape(endDate)}
          AND payment_type = 'Debit'
          THEN ${column}
          ELSE ${elseValue}
        END
      )`)
    }

    // Get vendor count with search filter
    const count = await Vendors.count({
      where: vendorWhereClause,
      distinct: true,
      col: "id",
    });

    // Get supplier ids with search filter
    const supplierIds = await Vendors.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("id")), "vendor_id"],
      ],
      where: vendorWhereClause,
      raw: true,
      limit,
      offset,
    });

    // Main fetching to get the purchase breakdown by supplier with search
    const suppliers = await Vendors.findAll({
      // prettier-ignore
      attributes: [
        [sequelize.literal(`vendors.id`), "vendorId"],
        [vendorName, "vendorName"],
        [netBalance(startDate), 'lastAccountBalance'],
        [netBalance(endDate), 'accountsPayable'],             
        [sequelize.literal(sumPaymentTypeAmount("Credit", accountsPaidDateCondition)),"accountsPaid"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_quantity", startDate, endDate}), "purchaseQuantity"],
        [aggregateBetweenDates({ fn: "AVG", column: "avg_unit_price * payable_journals.currency_rate", startDate, endDate}), "averageUnitPrice"],
        [aggregateBetweenDates({ fn: "SUM", column: "total_amount * payable_journals.currency_rate", startDate, endDate}), "newPurchaseAmount"],
      ],
      include: [
        {
          model: PayableJournal,
          required: false,
          attributes: [],
          where: {
            isDeleted: false,
          },
        },
      ],
      group: ["id"],
      where: {
        [Op.and]: [
          {
            id: {
              [Op.in]: supplierIds.map((item) => item.vendor_id),
            },
          },
          vendorWhereClause,
        ],
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: suppliers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for Purchase report overview summary
router.route("/overview").get(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Where clause for payable
    const payableWhereClause = {
      purchaseDate: {
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

    // Date condition for accounts paid
    const accountsPaidDateCondition = `date BETWEEN ${sequelize.escape(startDate)} AND ${sequelize.escape(endDate)}` // prettier-ignore

    // Find the previous cutoff for previous period purchase
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
      totalPurchase,
      numberOfTransactions,
      lastAccountsPayable,
      accountsPaid,
      accountsPayable,
      prevPeriodPurchase,
    ] = await Promise.all([
      // For Total purchase
      Payable.findOne({
        attributes: [
          [sequelize.literal(`SUM (totalPrice * currency_rate)`), "total"],
        ],
        include: [
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
        where: payableWhereClause,
        raw: true,
      }),
      // For Number of transactions
      Payable.count({
        where: payableWhereClause,
      }),
      // For Last accounts payable
      Payable.findOne({
        attributes: [
          [sequelize.literal(`totalPrice * currency_rate`), "totalPrice"],
        ],
        include: [
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
        where: payableWhereClause,
        order: [["createdAt", "DESC"]],
        raw: true,
      }),
      // For Accounts paid
      PayableJournal.findOne({
        attributes: [
          [
            sequelize.literal(
              sumPaymentTypeAmount("Credit", accountsPaidDateCondition)
            ),
            "total",
          ],
        ],
        raw: true,
        where: {
          isDeleted: false,
        },
      }),
      // For Accounts payable
      PayableJournal.findOne({
        attributes: [
          [
            sequelize.literal(`
              ${sumPaymentTypeAmount("Debit", `date < '${endDate}'`)} -
                ${sumPaymentTypeAmount("Credit", `date < '${endDate}'`)}
            `),
            "total",
          ],
        ],
        raw: true,
        where: {
          isDeleted: false,
        },
      }),
      // For Previous period purchase
      Payable.findOne({
        attributes: [
          [sequelize.literal(`SUM(totalPrice * currency_rate)`), "total"],
        ],
        include: [
          {
            model: Currency,
            required: true,
            attributes: [],
          },
        ],
        where: {
          purchaseDate: {
            [Op.between]: [prevCutoff?.from, prevCutoff?.to],
          },
          isDeleted: false,
        },
        raw: true,
      }),
    ]);

    const totalPurch = normalize(totalPurchase?.total);

    // Get the average purchase amount
    const averagePurchaseValue = () => {
      if (!numberOfTransactions) return 0; // Prevents dividing by 0

      return totalPurch / numberOfTransactions;
    };

    // Get the purchase growth index
    const purchaseGrowthIndex = () => {
      const prevPeriodPurch = normalize(prevPeriodPurchase?.total);

      if (!prevPeriodPurch) return 0; // Prevents dividing by 0

      return ((totalPurch - prevPeriodPurch) / prevPeriodPurch) * 100;
    };

    // Get the accounts payable turnover ratio
    const apTurnOverRatio = () => {
      const lastAp = normalize(lastAccountsPayable?.totalPrice);
      const paid = normalize(accountsPaid?.total);

      const totalObligations = totalPurch + lastAp;

      if (totalObligations === 0) return 0; // Prevents dividing by 0

      return (paid / totalObligations) * 100;
    };

    // prettier-ignore
    res.status(200).json({
      totalPurchase: normalize(totalPurchase?.total),
      numberOfTransactions: normalize(numberOfTransactions),
      averagePurchaseValue: normalize(averagePurchaseValue()),
      lastAccountsPayable: normalize(lastAccountsPayable?.totalPrice),
      accountsPaid: normalize(accountsPaid?.total),
      accountsPayable: normalize(accountsPayable?.total),
      prevPeriodPurchase: normalize(prevPeriodPurchase?.total),
      purchaseGrowthIndex: normalize(purchaseGrowthIndex()), // percentage
      apTurnOverRatio: normalize(apTurnOverRatio()) // percentage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
