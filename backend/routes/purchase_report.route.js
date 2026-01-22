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
    include: [
      {
        model: Product_Tag_Vendor,
        required: true,
        include: [{ model: ProductList, required: true }],
      },
      {
        model: Payable,
        required: true,
        include: [
          // {
          //   model: Currency,
          //   required: true,
          // },
          {
            model: Payable_Fees,
            required: false,
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

router.route("/getSupplierReport").get(async (req, res) => {
  console.log("------------------pAsok");
  const { startDate, endDate } = req.query;
  console.log(startDate);
  console.log(endDate, "end=============");
  const isFetch = await Payable.findAll({
    include: [
      {
        model: Vendors,
        required: true,
      },
      {
        model: Payable_Product,
        required: true,
      },
      {
        model: Payable_Bulk_Transaction,
        required: false,
        include: [
          {
            model: Payable_Bulk,
            required: true,
            include: [
              {
                model: Currency,
                required: true,
              },
            ],
            where: {
              status: "Approved",
            },
          },
        ],
      },
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
    },
  });

  const fetchPayable = await Payable.findAll({
    include: [
      {
        model: Payable_Bulk_Transaction,
        required: false,
        include: [
          {
            model: Payable_Bulk,
            required: true,
            where: {
              status: "For-Approval",
            },
          },
        ],
      },
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
    },
  });

  let vendorNameList = isFetch.map((item) => {
    return item.vendor.id;
  }); // Get all Vendor ID

  let uniqueVendor = new Set(vendorNameList); // Unique Vendor
  let filteredVendor;
  let totalNetWeight;
  let averageUnitPrice;
  const dataTable = [];

  const calculateLastAccountBalance = async (i, startDate) => {
    const data = await Payable.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
      ],
      where: {
        [Op.and]: [
          { purchaseDate: { [Op.lt]: startDate } },
          { isPaid: false },
          // { isAdded: false },
          { status: "Approved" },
          { vendor_id: i },
        ],
      },
    });

    const lastAccountBalance = data.reduce((total, value) => {
      return total + value.totalPrice * value.rate;
    }, 0);

    return lastAccountBalance;
  };

  for (const i of uniqueVendor) {
    filteredVendor = isFetch.filter((item) => {
      return item.vendor.id === i;
    });

    // Total Net Weight
    totalNetWeight = filteredVendor.reduce((total, value) => {
      return (
        total +
        value.payable_products.reduce((t, v) => {
          return (
            t +
            (v.moisture_type === "%"
              ? v.weight * (1 - v.moisture / 100)
              : v.weight - v.moisture)
          );
        }, 0)
      );
    }, 0);

    // Total Unit Price Computation
    // const totalUnitPrice = filteredVendor.reduce((total, value) => {
    //   return (
    //     total +
    //     value.payable_products.reduce((t, v) => {
    //       return t + v.unitPrice * value.currency.currency_rate;
    //     }, 0)
    //   );
    // }, 0);

    const lastAccountBalance = await calculateLastAccountBalance(i, startDate);

    // --- Accounts Paid ---
    const filteredTransaction = isFetch.filter((item) => {
      return item.payable_bulk_transactions[0]?.payable_bulk?.vendor_id === i;
    }); // Filtered Transaction by Vendor ID

    const transactionNumber = filteredTransaction.map((item) => {
      return item.payable_bulk_transactions[0]?.payable_bulk
        ?.transaction_number;
    }); // List of transaction Number in filteredTransaction

    let uniqueTransactionNumber = new Set(transactionNumber);
    let newTransactionNumber = [...uniqueTransactionNumber];

    const totalAmountsPaid = [];

    // loop to transaction number to avoid duplicates
    for (let index = 0; index < newTransactionNumber.length; index++) {
      let i = filteredTransaction.filter((item) => {
        return (
          item.payable_bulk_transactions[0]?.payable_bulk
            ?.transaction_number === newTransactionNumber[index]
        );
      });

      totalAmountsPaid.push(
        i[0].payable_bulk_transactions[0]?.payable_bulk?.total_amount *
          i[0].payable_bulk_transactions[0]?.payable_bulk?.currency
            ?.currency_rate
      ); // push total amount
    }

    // Total the accounts paid
    const amountsPaid = totalAmountsPaid.reduce((total, value) => {
      return total + value;
    }, 0);

    // --- Accounts Payable ---
    const accountsPayableArray = [];
    const filteredPayable = fetchPayable.filter((item) => {
      return item.vendor_id === i;
    }); // Filter by Vendor ID

    // Filter IsAdded
    const filteredIsAdded = filteredPayable.filter((item) => {
      return item.isAdded === false;
    });
    let totalIsAdded = filteredIsAdded.reduce((total, value) => {
      return total + value.totalPrice * value.rate;
    }, 0);
    accountsPayableArray.push(totalIsAdded);

    // Filter For-Approval
    const filteredApproval = filteredPayable.filter((item) => {
      return (
        item?.payable_bulk_transactions[0]?.payable_bulk?.status ===
        "For-Approval"
      );
    });
    const totalAmountApproval = filteredApproval.reduce((total, value) => {
      return (
        total +
        value.payable_bulk_transactions[0]?.payable_bulk.total_amount *
          value.rate
      );
    }, 0);
    accountsPayableArray.push(totalAmountApproval);

    // total the amount
    let flattendAccountsPayableArray = accountsPayableArray.flat();
    let totalAccountsPayable = flattendAccountsPayableArray.reduce(
      (total, value) => {
        return total + value;
      },
      0
    );

    let totalAmount = amountsPaid + totalAccountsPayable;

    averageUnitPrice = totalAmount / totalNetWeight; // Average Unit Price

    // Create new row to table
    dataTable.push({
      companyName: filteredVendor[0].vendor.company_name,
      vendorName: filteredVendor[0].vendor.fname,
      vendorId: filteredVendor[0].vendor.id,
      lastAccountBalance,
      totalNetWeight,
      averageUnitPrice: averageUnitPrice || 0,
      amountsPaid,
      amount: totalAmount || 0,
      totalAccountsPayable: totalAccountsPayable || 0,
    });
  }

  const vendorList = await Vendors.findAll();

  for (const vendor of vendorList) {
    const lastAccountBalance = await calculateLastAccountBalance(
      vendor.id,
      startDate
    );

    if (!dataTable.map((item) => item.vendorId).includes(vendor.id)) {
      dataTable.push({
        companyName: vendor.company_name,
        vendorName: vendor.fname,
        vendorId: vendor.id,
        lastAccountBalance,
        totalNetWeight: 0,
        averageUnitPrice: 0,
        amountsPaid: 0,
        amount: 0,
        totalAccountsPayable: 0,
      });
    }
  }

  console.log("------------------lalabs");
  return res.status(200).json(dataTable);
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
    },
  });
  res.status(200).json(isFetch);
});

module.exports = router;
