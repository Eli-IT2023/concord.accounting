const router = require("express").Router();
const { Op, fn, col, where } = require("sequelize");
const {
  Payable,
  Payable_Product,
  Vendors,
  Product_Tag_Vendor,
  Customer,
  SalesInvoice,
  SalesInvoiceInventory,
  ProductList,
  StockManagement,
  Expenses1,
  Inventory_Journal,
  InventoryCountingItemList,
  Production_Raw_Used,
  Production,
  Production_Finish_Product,
  Cutoff,
  Inventory_Report,
  Expenses2,
  Expenses,
  OtherIncome,
  Other_Income_Payment,
  AccountListBaseSub,
  Account_Transaction,
  FixedAsset,
  FixedAssetForecast,
  PayableJournal,
  SalesJournal,
  ExpenseJournal,
} = require("../db/models/associations");
const sequelize = require("../db/config/sequelize.config");
const {
  accountlist_sub3,
  accountlist_transaction_subject,
  currency_sub,
} = require("../db/models/ModelsBySubject/associations_sub");

const { initializeDefaults } = require("../utils/initializeMigrationDefault");
const getAccurateDateandTime = require("../utils/accurate_date_time_today");
const {
  dynamicConcatFilter,
  opLike,
} = require("../utils/filters/sequelizeSearchFilter");

router.post("/vendor_data_migrate", async (req, res) => {
  let counter = 1;
  try {
    const { data, lastDate } = req.body;
    const { product_migrate_id, Liasub2_id, Assetsub2_id } =
      await initializeDefaults();
    const date_time = await getAccurateDateandTime();

    const parsedRows = data.map((row) => {
      const Asset_Amount = row["Asset Amount"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return {
          currency,
          amount: parseFloat(amountStr) || 0,
        };
      });

      const Liability_Amount = row["Liability Amount"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return {
          currency,
          amount: parseFloat(amountStr) || 0,
        };
      });

      const payableAmounts = row["Payable Amount/s"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return {
          currency,
          amount: parseFloat(amountStr) || 0,
        };
      });

      return {
        supplierName: row["Supplier Name"],
        payableAmounts,
        Asset_Amount,
        Liability_Amount,
      };
    });

    for (const data of parsedRows) {
      const Supplier_name = data.supplierName.trim();

      for (const entry of data.Asset_Amount) {
        const entry_currency =
          entry.currency === "USD"
            ? "22222222-2222-2222-2222-222222222222"
            : "11111111-1111-1111-1111-111111111111";
        const entry_amount = entry.amount;

        const getValueRate = await currency_sub.findOne({
          where: { id: entry_currency },
        });

        if (entry_amount !== 0) {
          const create_sub3_asset = await accountlist_sub3.create({
            account_list_base_sub_id: Assetsub2_id,
            account_name: Supplier_name,
            amount: entry_amount,
            currency_id: entry_currency,
            created_by: "11111111-1111-1111-1111-111111111111",
          });

          await accountlist_transaction_subject.create({
            account_list_sub3_id_transacted: create_sub3_asset.id,
            payment_method: "--",
            amount: entry_amount,
            date: date_time,
            check_or_remarks: "Migration",
            type: "Debit",
            module_from: "Migration",
            rate: getValueRate ? getValueRate.currency_rate : 1,
          });
        }
      }

      for (const entry of data.Liability_Amount) {
        const entry_currency =
          entry.currency === "USD"
            ? "22222222-2222-2222-2222-222222222222"
            : "11111111-1111-1111-1111-111111111111";
        const entry_amount = entry.amount;

        const getValueRate = await currency_sub.findOne({
          where: { id: entry_currency },
        });

        if (entry_amount !== 0) {
          const create_sub3_liability = await accountlist_sub3.create({
            account_list_base_sub_id: Liasub2_id,
            account_name: Supplier_name,
            amount: entry_amount,
            currency_id: entry_currency,
            created_by: "11111111-1111-1111-1111-111111111111",
          });

          await accountlist_transaction_subject.create({
            account_list_sub3_id_transacted: create_sub3_liability.id,
            payment_method: "--",
            amount: entry_amount,
            date: date_time,
            check_or_remarks: "Migration",
            type: "Debit",
            module_from: "Migration",
            rate: getValueRate ? getValueRate.currency_rate : 1,
          });
        }
      }

      const isExistVendor = await Vendors.findOne({
        where: {
          company_name: Supplier_name,
        },
      });

      let vendor_id = "";
      if (!isExistVendor) {
        const created_vendor = await Vendors.create({
          company_name: Supplier_name,
          currency_id: "11111111-1111-1111-1111-111111111111",
          status: "Active",
        });

        vendor_id = created_vendor.id;
      } else {
        vendor_id = isExistVendor.id;
      }

      for (const entry of data.payableAmounts) {
        const entry_currency =
          entry.currency === "USD"
            ? "22222222-2222-2222-2222-222222222222"
            : "11111111-1111-1111-1111-111111111111";
        const entry_amount = entry.amount;
        let client_transaction_id = `PO-Migration000${counter++}`;

        if (entry_amount) {
          const prod_tag_supp = await Product_Tag_Vendor.create({
            product_id: product_migrate_id,
            vendor_id: vendor_id,
            product_price: 0,
            status: "Inactive",
          });

          const create_payable = await Payable.create({
            transaction_id: client_transaction_id,
            client_transaction_id: client_transaction_id,
            warehouse_id: "11111111-1111-1111-1111-111111111111",
            vendor_id: vendor_id,
            domestic_type: "local",
            isPercent_Discount: 0,
            discount_value: 0,
            weighing_fee: 0,
            status: "Approved",
            totalPrice: entry_amount,
            purchaseDate: lastDate,
            currencyId: entry_currency,
            isAdded: false,
            description: "Migration",
            created_by: "11111111-1111-1111-1111-111111111111",
            rate: 1,
            due_date: lastDate,
            approved_by: "11111111-1111-1111-1111-111111111111",
          });

          if (create_payable) {
            await Payable_Product.create({
              payable_id: create_payable.id,
              product_vendor_id: prod_tag_supp.id,
              moisture: 0,
              moisture_type: "%",
              weight: 1,
              net_weight: 1,
              unitPrice: entry_amount,
            });
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Data parsed and transformed", data: parsedRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/customer_data_migrate", async (req, res) => {
  try {
    let counter = 1;
    const { data, lastDate } = req.body;
    const { product_migrate_id, Liasub2_id, Assetsub2_id } =
      await initializeDefaults();
    const date_time = await getAccurateDateandTime();

    const parsedRows = data.map((row) => {
      const Asset_Amount = row["Asset Amount"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return { currency, amount: parseFloat(amountStr) || 0 };
      });

      const Liability_Amount = row["Liability Amount"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return { currency, amount: parseFloat(amountStr) || 0 };
      });

      const payableAmounts = row["Receivable Amount/s"]
        .split(",")
        .map((val) => {
          const [currency, amountStr] = val.trim().split("~");
          return { currency, amount: parseFloat(amountStr) };
        });

      return {
        customerName: row["Customer Name"],
        payableAmounts,
        Asset_Amount,
        Liability_Amount,
      };
    });

    for (const data of parsedRows) {
      const Customer_name = data.customerName.trim();

      // Handle Asset
      for (const entry of data.Asset_Amount) {
        const entry_currency =
          entry.currency === "USD"
            ? "22222222-2222-2222-2222-222222222222"
            : "11111111-1111-1111-1111-111111111111";
        const entry_amount = entry.amount;

        const getValueRate = await currency_sub.findOne({
          where: { id: entry_currency },
        });

        if (entry_amount !== 0) {
          const create_sub3_asset = await accountlist_sub3.create({
            account_list_base_sub_id: Assetsub2_id,
            account_name: Customer_name,
            amount: entry_amount,
            currency_id: entry_currency,
            created_by: "11111111-1111-1111-1111-111111111111",
          });

          await accountlist_transaction_subject.create({
            account_list_sub3_id_transacted: create_sub3_asset.id,
            payment_method: "--",
            amount: entry_amount,
            date: date_time,
            check_or_remarks: "Migration",
            type: "Debit",
            module_from: "Migration",
            rate: getValueRate ? getValueRate.currency_rate : 1,
          });
        }
      }

      // Handle Liability
      for (const entry of data.Liability_Amount) {
        const entry_currency =
          entry.currency === "USD"
            ? "22222222-2222-2222-2222-222222222222"
            : "11111111-1111-1111-1111-111111111111";
        const entry_amount = entry.amount;

        const getValueRate = await currency_sub.findOne({
          where: { id: entry_currency },
        });

        if (entry_amount !== 0) {
          const create_sub3_liability = await accountlist_sub3.create({
            account_list_base_sub_id: Liasub2_id,
            account_name: Customer_name,
            amount: entry_amount,
            currency_id: entry_currency,
            created_by: "11111111-1111-1111-1111-111111111111",
          });

          await accountlist_transaction_subject.create({
            account_list_sub3_id_transacted: create_sub3_liability.id,
            payment_method: "--",
            amount: entry_amount,
            date: date_time,
            check_or_remarks: "Migration",
            type: "Debit",
            module_from: "Migration",
            rate: getValueRate ? getValueRate.currency_rate : 1,
          });
        }
      }

      // Check if customer exists or create
      let customer = await Customer.findOne({
        where: { company_name: Customer_name },
      });

      let customer_id = "";
      if (!customer) {
        const created_customer = await Customer.create({
          company_name: Customer_name,
          status: true,
        });
        customer_id = created_customer.customer_id;
      } else {
        customer_id = customer.customer_id;
      }

      // Handle Receivable/Invoice
      for (const entry of data.payableAmounts) {
        const entry_currency =
          entry.currency === "USD"
            ? "22222222-2222-2222-2222-222222222222"
            : "11111111-1111-1111-1111-111111111111";
        const entry_amount = entry.amount;

        if (entry_amount) {
          let client_transaction_id = `PO-Migration000${counter++}`;
          const createInvoice = await SalesInvoice.create({
            transaction_id: client_transaction_id,
            client_transaction_id: client_transaction_id,
            customer_id: customer_id,
            currency_id: entry_currency,
            warehouse_id: "11111111-1111-1111-1111-111111111111",
            payment_method: "Cash",
            invoice_date: lastDate,
            due_date: lastDate,
            payment_terms: "--",
            destination: "Local",
            transaction_discount: 0,
            item_discount: 0,
            shipping_fee: 0,
            total_amount: entry_amount,
            status: "Approved",
            payAdded: false,
            remarks: "Migration",
            notification: false,
            created_by: "11111111-1111-1111-1111-111111111111",
            approved_by: "11111111-1111-1111-1111-111111111111",
            rate: 1,
            amount: 0,
            quantity: 0,
            isDeleted: false,
          });

          if (createInvoice) {
            await SalesInvoiceInventory.create({
              sales_invoice_id: createInvoice.sales_invoice_id,
              stock_management_id: "11111111-1111-1111-1111-111111111111",
              average_price: entry_amount,
              unitPrice: entry_amount,
              sales_profit: 0,
              discount_item: 0,
              quantity: 1,
              moisture: 0,
              net_weight: 1,
              subtotal: entry_amount,
              totalPrice: entry_amount,
              discount_type: "percentage",
              isDeleted: false,
            });
          }
        }
      }
    }

    return res.status(200).json({
      message: "Data parsed and transformed",
      data: parsedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/expenses_data_migrate", async (req, res) => {
  try {
    const { data, lastDate } = req.body;
    let counter = 1;
    const parsedRows = data.map((row) => {
      const payableAmounts = row["Amount"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return { currency, amount: parseFloat(amountStr) };
      });

      return {
        expenses_type: row["Expenses Type"],
        expenses_sub_type: row["Expenses Sub-Type"],
        payableAmounts,
      };
    });

    // register first the expenses 1
    const uniqueTypesArray = Array.from(
      new Set(parsedRows.map((data) => data.expenses_type.trim()))
    );
    for (const item of uniqueTypesArray) {
      const [record, created] = await Expenses1.findOrCreate({
        where: { expenses_type_one: item },
        defaults: {
          expenses_type_one: item,
          description: "Migration",
          isArchive: false,
        },
      });

      // console.log(created ? "Created:" : "Found:", record);
    }

    // get unique sub1 and 2 to register in the ssystem
    for (const data of parsedRows) {
      const expenses_type = data.expenses_type.trim();
      const expenses_sub_type = data.expenses_sub_type.trim();

      const getExpenses1 = await Expenses1.findOne({
        where: {
          expenses_type_one: expenses_type,
        },
      });

      if (getExpenses1) {
        const expenses2 = await Expenses2.create({
          expenses_type: getExpenses1.expenses_one_id,
          sub_type: expenses_sub_type,
          description: "Migration",
          isArchive: false,
        });

        for (const entry of data.payableAmounts) {
          const entry_currency =
            entry.currency === "USD"
              ? "22222222-2222-2222-2222-222222222222"
              : "11111111-1111-1111-1111-111111111111";
          const entry_amount = entry.amount;
          const transactionNumber = counter++;
          await Expenses.create({
            client_transaction_id: `EXP-Migration000${transactionNumber}`,
            transaction_id: `EXP-Migration000${transactionNumber}`,
            foreign: "Local",
            currency_id: entry_currency,
            expenses2_id: expenses2.id,
            totalAmount: entry_amount,
            desc: "Migration",
            expenses_date: lastDate,
            status: "Approved",
            due_date: lastDate,
            rate: "1",
            created_by: "11111111-1111-1111-1111-111111111111",
            approved_by: "11111111-1111-1111-1111-111111111111",
          });
          await ExpenseJournal.create({
            expenses2_id: expenses2.id,
            date: lastDate,
            total_amount: entry_amount,
            payment_type: "Debit",
            currency_name: "PHP",
            currency_rate: "1",
          });
        }
      }
    }

    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/product_data_migrate", async (req, res) => {
  let counter = 1;
  let product_created;
  try {
    const { data, lastDate } = req.body;

    for (const items of data) {
      const productCode = items["Product Code"].trim();
      const productName = items["Product Name"].trim();
      const productCategory = items["Product Category"].trim();
      const productThreshold = parseFloat(items["Product Threshold"]) || 0;
      const inventoryStock =
        parseFloat(items["Inventory Stock / Quantity"]) || 0;
      const productPrice = parseFloat(items["Product Price"]) || 0;
      const unitOfMeasure = items["Unit of Measure"];

      // console.log(
      //   `Processing product: ${productName}, Category: ${productCategory}, Threshold: ${productThreshold}, Stock: ${inventoryStock}, Price: ${productPrice}`
      // );

      // return;

      // Check if product already exists
      const existingProduct = await ProductList.findOne({
        where: { product_name: productName },
      });

      if (!existingProduct) {
        // Create new product if it doesn't exist
        const _created = await ProductList.create({
          product_code: productCode,
          product_name: productName,
          product_category: productCategory,
          unit_of_measure: unitOfMeasure,
          description: "Migration",
          status: "Active",
          threshold: productThreshold,
        });

        product_created = _created.product_id;
      } else {
        product_created = existingProduct.product_id;
      }

      await StockManagement.create({
        product_id: product_created,
        warehouse_id: "11111111-1111-1111-1111-111111111111",
        stock: inventoryStock,
        in: inventoryStock,
        price: productPrice,
        price_in: productPrice,
        vendor_id: null,
        date_in: lastDate,
        transaction_number: "Migration",
        module_in_from: "Migration",
        isDeleted: false,
      });

      await Inventory_Journal.create({
        module_from: "Migration",
        transaction_number: "Migration",
        product_id: product_created,
        unit_price: productPrice,
        quantity: inventoryStock,
        date_in: lastDate,
        type: "in",
        warehouse_id: "11111111-1111-1111-1111-111111111111",
      });
    }
    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/otherIncome_data_migrate", async (req, res) => {
  let counter = 1;
  const { migrate_id_Account3 } = await initializeDefaults();
  try {
    const { data, lastDate } = req.body;

    for (const items of data) {
      const incomeType = items["Income Type"].trim();
      const desc = items["Description"].trim();
      const Amount = parseFloat(items["Amount"]) || 0;

      const existing = await OtherIncome.findOne({
        where: { incomeType: incomeType, desc: desc, totalAmount: Amount },
      });

      if (!existing) {
        const OI = await OtherIncome.create({
          transaction_id: `OI-Migration000${counter++}`,
          desc: desc,
          income_date: lastDate,
          incomeType: incomeType,
          totalAmount: Amount,
          status: "Approved",
          isDeleted: false,
          created_by: "11111111-1111-1111-1111-111111111111",
          approved_by: "11111111-1111-1111-1111-111111111111",
        });

        await Other_Income_Payment.create({
          other_income_id: OI.id,
          account_list_sub3_id: migrate_id_Account3,
          payment_type: "Migration",
          check_number: "Migration",
          amount: Amount,
          date_issued: lastDate,
        });
      }
    }
    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/accounts_data_migrate", async (req, res) => {
  try {
    const { data, lastDate } = req.body;
    let counter = 1;
    const parsedRows = data.map((row) => {
      const payableAmounts = row["Amount"].split(",").map((val) => {
        const [currency, amountStr] = val.trim().split("~");
        return { currency, amount: parseFloat(amountStr) };
      });

      return {
        sub_1:
          row["Subject 1"] === "Owner/s Equity Account"
            ? "Owner's Equity Account"
            : row["Subject 1"],
        sub_2: row["Subject 2"],
        sub_3: row["Subject 3"],
        acc_type: row["Account Type"],
        payableAmounts,
      };
    });

    // register first the expenses 1
    const uniqueTypesArray = Array.from(
      new Set(
        parsedRows.map(
          (data) =>
            `${data.sub_1.trim()}|${data.sub_2.trim()}|${data.acc_type.trim()}`
        )
      )
    ).map((str) => {
      const [sub1, sub2, type] = str.split("|");
      return { sub_1: sub1, sub_2: sub2, sub_type: type };
    });

    for (const item of uniqueTypesArray) {
      if (item) {
        const [record, created] = await AccountListBaseSub.findOrCreate({
          where: { subject_name: item.sub_2, module_type: item.sub_1 },
          defaults: {
            subject_name: item.sub_2,
            subject_type: item.sub_type,
            module_type: item.sub_1,
            isDeleted: false,
          },
        });
      }

      // console.log(created ? "Created:" : "Found:", record);
    }

    // get unique sub1 and 2 to register in the ssystem
    for (const data of parsedRows) {
      const sub_1 = data.sub_1.trim();
      const sub_2 = data.sub_2.trim();
      const sub_3 = data.sub_3.trim();
      const amountData = data.payableAmounts;

      const checkSub2 = await AccountListBaseSub.findOne({
        where: {
          subject_name: sub_2,
          module_type: sub_1,
        },
      });

      if (checkSub2) {
        for (const entry of amountData) {
          const entry_currency =
            entry.currency === "USD"
              ? "22222222-2222-2222-2222-222222222222"
              : "11111111-1111-1111-1111-111111111111";
          const entry_amount = entry.amount;

          const getValueRate = await currency_sub.findOne({
            where: { id: entry_currency },
          });

          const createSub3 = await accountlist_sub3.create({
            account_list_base_sub_id: checkSub2.id,
            account_name: sub_3,
            amount: entry_amount,
            currency_id: entry_currency,
            investment_amount:
              sub_1 === "Owner's Equity Account" ? entry_amount : 0,
            created_by: "11111111-1111-1111-1111-111111111111",
            isDeleted: false,
          });

          await accountlist_transaction_subject.create({
            account_list_sub3_id_transacted: createSub3.id,
            sub_3_to: null,
            payment_method: "Migration",
            amount: entry_amount,
            date: lastDate,
            check_or_remarks: "Migration",
            type: "Debit",
            isTransferOnly: false,
            module_from: "Migration",
            transaction_number: "Migration",
            transferred_by: "11111111-1111-1111-1111-111111111111",
            account_balance: entry_amount,
            isDeleted: false,
            rate: getValueRate ? getValueRate.currency_rate : 1,
          });
        }
      }
    }

    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/sales-data-migrate").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { data, lastDate } = req.body;
    const { product_migrate_id } = await initializeDefaults();

    const invoices = [];
    const sales_journal = [];

    // Helper functions
    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));
    const textTrim = (str) => str.trim();

    const createCustomer = async (customerName) => {
      const customer = await Customer.create(
        {
          type: "company",
          status: true,
          company_name: textTrim(customerName),
          isDeleted: false,
        },
        {
          transaction,
        }
      );

      return customer;
    };

    // For Creation of Sales Invoice per customer
    for (item of data) {
      let customerId = null;
      const customerName = item["Customer Name"];
      const receivableAmount = item["Receivable Amount/s"];
      const transactionDate = item["Transaction Date (mm/dd/yyyy)"];
      const transactionNumber = item["Transaction Number"];
      // Find existing customer
      const existingCustomer = await Customer.findOne({
        attributes: ["customer_id", "company_name"],
        where: {
          [Op.or]: [
            dynamicConcatFilter(customerName, "first_name", "last_name", " "),
            dynamicConcatFilter(customerName, "first_name", "last_name", "-"),
            sequelize.where(
              fn("LOWER", fn("TRIM", col("company_name"))),
              opLike(customerName)
            ),
          ],
        },
        raw: true,
        transaction,
      });

      // If no existing customer, create one
      if (!existingCustomer) {
        const newCustomer = await createCustomer(customerName);
        customerId = newCustomer.customer_id;
      } else {
        customerId = existingCustomer?.customer_id;
      }

      invoices.push({
        transaction_id: `SI-${transactionNumber}`,
        client_transaction_id: transactionNumber,
        customer_id: customerId,
        currency_id: "11111111-1111-1111-1111-111111111111",
        warehouse_id: "11111111-1111-1111-1111-111111111111",
        account_list_sub3_id: null,
        liability_amount: 0,
        payment_method: "Bank",
        due_date: null,
        invoice_date: transactionDate,
        payment_terms: null,
        destination: "Local",
        transaction_discount: 0,
        item_discount: 0,
        shipping_fee: 0,
        total_amount: parseNumber(receivableAmount),
        discount_type: "fixed",
        status: "Approved",
        payAdded: true,
        remarks: "",
        notification: false,
        container_number: "",
        pier: "",
        created_by: "11111111-1111-1111-1111-111111111111",
        approved_by: "11111111-1111-1111-1111-111111111111",
        rate: 1,
        amount: 0,
        quantity: 0,
        isDeleted: false,
        dr_number: "",
        po_number: "",
        isReturn: false,
      });

      sales_journal.push({
        customer_id: customerId,
        transaction_number: `SI-${transactionNumber}`,
        date: transactionDate,
        total_amount: parseNumber(receivableAmount),
        total_quantity: "1",
        avg_unit_price: parseNumber(receivableAmount),
        payment_type: "Debit",
        currency_name: "PHP",
        currency_rate: "1",
      });
    }

    const createSalesInvoice = await SalesInvoice.bulkCreate(invoices, {
      validate: true,
      returning: true,
      transaction,
    });

    await SalesJournal.bulkCreate(sales_journal, {
      validate: true,
      returning: true,
      transaction,
    });

    // For Creation of Sales Invoice Inventory per Sales Invoice
    const inventories = createSalesInvoice.map((item) => {
      const receivableAmount = item.total_amount;
      return {
        sales_invoice_id: item.sales_invoice_id,
        stock_management_id: product_migrate_id,
        average_price: receivableAmount,
        unit_price: receivableAmount,
        sales_profit: 0,
        discount_item: 0,
        quantity: 1,
        moisture: 0,
        net_weight: 1,
        subtotal: receivableAmount,
        discount_type: "percentage",
        isDeleted: false,
      };
    });

    const createSalesInvoiceInventory = await SalesInvoiceInventory.bulkCreate(
      inventories,
      {
        validate: true,
        transaction,
      }
    );

    await transaction.commit();
    res.sendStatus(200);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/payable-data-migrate").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { data, lastDate } = req.body;
    const { product_migrate_id } = await initializeDefaults();
    const payable = [];
    const payableJournal = [];

    // Helper functions
    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));
    const textTrim = (str) => str.trim();

    // --- For Bulk Creation of Payable ---
    for (const item of data) {
      const vendorName = item["Supplier Name"];
      const payableAmounts = item["Payable Amount/s"];
      const transactionDate = item["Transaction Date (mm/dd/yyyy)"];
      const transactionNumber = item["Transaction Number"];

      // Find existing vendor: if no existing vendor, create one
      const [vendor, createdVendor] = await Vendors.findOrCreate({
        where: {
          [Op.or]: [
            dynamicConcatFilter(vendorName, "fname", "lname", " "),
            dynamicConcatFilter(vendorName, "fname", "lname", "-"),
            sequelize.where(
              fn("LOWER", fn("TRIM", col("company_name"))),
              opLike(vendorName)
            ),
          ],
        },
        defaults: {
          company_name: textTrim(vendorName),
          company_country: "Philippines",
          company_designation: "Local",
          currency_id: "11111111-1111-1111-1111-111111111111",
          status: "Active",
        },
        transaction,
      });

      // Ensure product-vendor relationship exists or create it
      const [tagVendor, createdTagVendor] =
        await Product_Tag_Vendor.findOrCreate({
          where: {
            product_id: product_migrate_id,
            vendor_id: vendor.id,
          },
          defaults: {
            product_id: product_migrate_id,
            vendor_id: vendor.id,
            product_price: 1,
            status: "Active",
          },
          transaction,
        });

      // Data to be Created for Payable
      payable.push({
        transaction_id: `PO-${transactionNumber}`,
        client_transaction_id: transactionNumber,
        warehouse_id: "11111111-1111-1111-1111-111111111111",
        vendor_id: vendor.id,
        MOP: "Cash",
        domestic_type: "local",
        isPercent_Discount: false,
        discount_value: 0,
        weighing_fee: 0,
        isPaid: false,
        status: "Approved",
        isAdded: false,
        totalPrice: parseNumber(payableAmounts),
        purchaseDate: transactionDate,
        currencyId: "11111111-1111-1111-1111-111111111111",
        created_by: "11111111-1111-1111-1111-111111111111",
        approved_by: "11111111-1111-1111-1111-111111111111",
        rate: 1,
        isDeleted: false,
      });

      payableJournal.push({
        vendor_id: vendor.id,
        transaction_number: `PO-${transactionNumber}`,
        date: transactionDate,
        total_amount: parseNumber(payableAmounts),
        total_quantity: "1",
        avg_unit_price: parseNumber(payableAmounts),
        payment_type: "Debit",
        currency_name: "PHP",
        currency_rate: "1",
      });
    }

    const createPayable = await Payable.bulkCreate(payable, {
      validate: true,
      returning: true,
      transaction,
    });

    await PayableJournal.bulkCreate(payableJournal, {
      validate: true,
      returning: true,
      transaction,
    });

    // --- For Bulk Creation of Payable Product ---
    const payableProductList = await Promise.all(
      createPayable.map(async (item) => {
        const tagVendor = await Product_Tag_Vendor.findOne({
          attributes: ["id"],
          where: {
            product_id: product_migrate_id,
            vendor_id: item.vendor_id,
          },
          raw: true,
          transaction,
        });

        return {
          payable_id: item.id,
          product_vendor_id: tagVendor.id,
          moisture: 0,
          moisture_type: "%",
          weight: 1,
          net_weight: 1,
          unitPrice: item.totalPrice,
        };
      })
    );

    const createPayableProduct = await Payable_Product.bulkCreate(
      payableProductList,
      {
        validate: true,
        transaction,
      }
    );

    await transaction.commit();
    res.sendStatus(200);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fixed-asset/data-migrate").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { data, lastDate } = req.body;

    const forecast = [];

    // Duplicate File content Validation
    const duplicateChecks = await Promise.all(
      data.map(async (item) => {
        const fixedAssetName = item["Fixed Asset Name"];
        const existingFixedAsset = await FixedAsset.findOne({
          where: {
            product_name: fixedAssetName,
          },
        });

        return !!existingFixedAsset;
      })
    );

    const allDuplicated = duplicateChecks.every(Boolean);

    if (allDuplicated) {
      await transaction.rollback();
      return res.status(409).json({ message: "All items are duplicates" });
    }

    // Helper functions
    const parseNumber = (num) => parseFloat(String(num || 0).replace(/,/g, ""));
    const formatToISO = (dateStr) => {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month}-${day}`;
    };

    // Handles Months to Pay with decimals, applying remainder only on the last forecast item
    const getForecastAmount = ({
      index,
      month,
      remainingCost,
      depreciationAmount,
    }) => {
      const lastItem = parseNumber(month.integer) === index;
      if (month.decimal && lastItem) {
        return parseNumber(depreciationAmount * Number(`0.${month.decimal}`));
      }

      return Math.min(remainingCost, depreciationAmount);
    };

    // To avoid mutable date
    const formatDate = (startDate, offset) => {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + offset);
      return d.toISOString().split("T")[0];
    };

    // --- For Creation of Fixed Asset and Forecast ---
    for (const item of data) {
      // Fixed Asset variables
      const fixedAssetName = item["Fixed Asset Name"];
      const quantity = parseNumber(item["Quantity"]);
      const totalCost = parseNumber(item["Total Cost"]);
      const monthsToPay = parseNumber(item["Months to Pay"]);
      const depreciationAmount = parseNumber(item["Depreciation Amount"]);
      const roundedMonthsToPay = Math.ceil(monthsToPay); // Rounded off Months to pay
      const [monthInteger, monthDecimal] = String(monthsToPay).split("."); // For Months to Pay with decimal

      // Forecast variables
      const forecastDate = new Date(formatToISO(item["Forecast Start Date"])); // convert 24/09/2025 to 2025-09-24
      const startDate = forecastDate.toISOString().split("T")[0]; // ex. 2025-09-24
      const paidForecast = parseNumber(item["Number of Paid Forecast"]) ?? 0;

      // If Fixed asset already exist skip creation
      const existingFixedAsset = await FixedAsset.findOne({
        where: {
          product_name: fixedAssetName,
        },
        transaction,
      });

      if (existingFixedAsset) {
        console.warn("Existing/Duplicate Fixed Asset:", existingFixedAsset.id);
        continue;
      }

      // Ensure there's Fixed Asset or create it
      const fixedAsset = await FixedAsset.create(
        {
          transaction_code: "Migration",
          product_name: fixedAssetName,
          currency_id: "11111111-1111-1111-1111-111111111111",
          date_depreciated: lastDate,
          cost_per_unit: totalCost / quantity,
          quantity: quantity,
          total_cost: totalCost,
          static_months_to_pay: monthsToPay,
          depreciation_amount: depreciationAmount,
          remarks: "",
          status: "Approved",
          created_by: "11111111-1111-1111-1111-111111111111",
          approved_by: "11111111-1111-1111-1111-111111111111",
        },
        { transaction }
      );

      // Data to be Created for Fixed Asset Forecast
      for (let i = 0; i < roundedMonthsToPay; i++) {
        const remainingCost = Math.max(totalCost - depreciationAmount * i);

        const forecastInfo = {
          index: i,
          month: { integer: monthInteger, decimal: monthDecimal },
          remainingCost,
          depreciationAmount,
        };

        const forecastAmount = getForecastAmount(forecastInfo);

        forecast.push({
          fixed_asset_id: fixedAsset.id,
          date: formatDate(startDate, i),
          amount: parseNumber(forecastAmount),
          isPaid: i < paidForecast,
          status: "Pending",
        });
      }
    }

    // --- For Creation of Fixed Asset Forecast ---
    const createFixedAsset = await FixedAssetForecast.bulkCreate(forecast, {
      validate: true,
      transaction,
    });

    await transaction.commit();
    res.sendStatus(200);
    console.log("Fixed Asset migration completed.");
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/syncInventoryJournal").post(async (req, res) => {
  try {
    const checkPayableProducts = await Payable_Product.findAll({
      include: [
        {
          model: Payable,
          required: true,
          where: {
            [Op.or]: [{ status: "Paid" }, { status: "Approved" }],
            isDeleted: false,
          },
        },
        {
          model: Product_Tag_Vendor,
          required: true,
        },
      ],
    });

    if (checkPayableProducts) {
      for (const payableProduct of checkPayableProducts) {
        const { transaction_id, purchaseDate } = payableProduct.payable;

        const { product_id } = payableProduct.product_tag_vendor;

        const { unitPrice, net_weight } = payableProduct;

        const createInventoryJournal = await Inventory_Journal.create({
          module_from: "Payable",
          transaction_number: transaction_id,
          product_id: product_id,
          unit_price: unitPrice,
          quantity: net_weight,
          date_in: purchaseDate,
          type: "in",
          warehouse_id: "11111111-1111-1111-1111-111111111111",
        });
      }
    }

    const getInventorySales = await SalesInvoiceInventory.findAll({
      include: [
        {
          model: SalesInvoice,
          required: true,
          where: {
            // [Op.or]: [{ status: "Paid" }, { status: "Approved" }],
            isDeleted: false,
          },
        },
        {
          model: StockManagement,
          required: true,
        },
      ],
    });

    if (getInventorySales) {
      for (const salessInventory of getInventorySales) {
        const { transaction_id, invoice_date } = salessInventory.sales_invoice;
        const { unit_price, net_weight } = salessInventory;
        const { product_id } = salessInventory.stock_management;

        const createInventoryJournal = await Inventory_Journal.create({
          module_from: "Sales Invoice",
          transaction_number: transaction_id,
          product_id: product_id,
          unit_price: unit_price,
          quantity: net_weight,
          date_in: invoice_date,
          type: "out",
          warehouse_id: "11111111-1111-1111-1111-111111111111",
        });
      }
    }

    const getProductionRaw_Used = await Production_Raw_Used.findAll({
      include: [
        {
          model: Production,
          required: true,
          where: {
            [Op.or]: [{ status: "Pending" }, { status: "Approved" }],
            isDeleted: false,
          },
        },
      ],
    });

    if (getProductionRaw_Used) {
      for (const productionRawUsed of getProductionRaw_Used) {
        const { production_id, date_produce } = productionRawUsed.production;

        const { product_id, weight_in, production_price } = productionRawUsed;

        const createInventoryJournal = await Inventory_Journal.create({
          module_from: "Production",
          transaction_number: production_id,
          product_id: product_id,
          unit_price: production_price,
          quantity: weight_in,
          date_in: date_produce,
          type: "out",
          warehouse_id: "11111111-1111-1111-1111-111111111111",
        });
      }
    }

    const getProductionFInishProduce = await Production_Finish_Product.findAll({
      include: [
        {
          model: Production,
          required: true,
          where: {
            status: "Approved",
            isDeleted: false,
          },
        },
      ],
    });

    if (getProductionRaw_Used) {
      for (const productionFInishProduce of getProductionFInishProduce) {
        const { production_id, date_produce } =
          productionFInishProduce.production;

        const { product_id, produce } = productionFInishProduce;

        const createInventoryJournal = await Inventory_Journal.create({
          module_from: "Production",
          transaction_number: production_id,
          product_id: product_id,
          unit_price: null,
          quantity: produce,
          date_in: date_produce,
          type: "in",
          warehouse_id: "11111111-1111-1111-1111-111111111111",
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/syncInventoryReport").post(async (req, res) => {
  try {
    const retrackInventoryReport = await Inventory_Report.findAll({
      where: {
        isDeleted: false,
        from_counting: true,
      },
      include: [
        {
          model: Cutoff,
          required: true,
        },
      ],
    });

    if (retrackInventoryReport) {
      for (const report of retrackInventoryReport) {
        const { from, to } = report.cutoff;

        const { id } = report;

        await Inventory_Report.update(
          {
            date_in: to,
            module_in_from: "Inventory Counting",
          },
          {
            where: {
              id: id,
            },
          }
        );
      }
    }

    const getRawUsedProduction = await Production_Raw_Used.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: Production,
          required: true,
          where: {
            [Op.or]: [{ status: "Pending" }, { status: "Approved" }],
            isDeleted: false,
          },
        },
      ],
    });

    if (getRawUsedProduction) {
      for (const rawUsed of getRawUsedProduction) {
        const { date_produce, production_id } = rawUsed.production;
        const { product_id, weight_in, production_price } = rawUsed;

        const getCutoff_id = await Cutoff.findOne({
          where: {
            from: { [Op.lte]: date_produce },
            to: { [Op.gte]: date_produce },
            isDeleted: false,
          },
        });

        const cutoff_id = getCutoff_id.id;

        const createInventoryReport = await Inventory_Report.create({
          cut_off_id: cutoff_id,
          product_id: product_id,
          average_price: production_price,
          product_out: weight_in,
          unit_price: production_price,
          from_counting: false,
          date_in: date_produce,
          sales_invoice_id: null,
          isDeleted: false,
          transaction_id: production_id,
          module_in_from: "Production",
        });
      }
    }

    const product_to_balance = [
      // RAW MATS
      {
        // 000003 P-G Green bottles
        product_id: "11111111-1111-1111-1111-111111111114",
        stock: 0,
        stock_in: 0.2650000000003274,
        price: 10,
        price_in: 10,
        date_in: "2025-05-31",
      },
      {
        // 000001  P-W White bottles
        product_id: "11111111-1111-1111-1111-111111111112",
        stock: 0,
        stock_in: 4915.1774,
        price: 0,
        price_in: 0,
        date_in: "2025-05-31",
      },
      {
        // 000004 P-YG Yellow Green bottles
        product_id: "11111111-1111-1111-1111-111111111115",
        stock: 0,
        stock_in: 0.005,
        price: 0,
        price_in: 0,
        date_in: "2025-05-31",
      },
      {
        // 000002 P-WB Bluish bottles
        product_id: "11111111-1111-1111-1111-111111111113",
        stock: 0,
        stock_in: 195906.01,
        price: 0,
        price_in: 0,
        date_in: "2025-05-31",
      },
      // FINISH PRODUCTS
      {
        // 000056 F-G-2A+N Green flakes-2A+ NEW
        product_id: "11111111-1111-1111-1111-111111111167",
        stock: 0,
        stock_in: 5928,
        price: 14.18,
        price_in: 15.528,
        date_in: "2025-05-31",
      },

      {
        // 000056 F-G-2A+N Green flakes-2A+ NEW
        product_id: "11111111-1111-1111-1111-111111111166",
        stock: 0,
        stock_in: 4350,
        price: 15.528,
        price_in: 15.528,
        date_in: "2025-05-31",
      },
      {
        // 000088 HWW1AS HW WHITE 1A SHEET
        product_id: "11111111-1111-1111-1111-111111111199",
        stock: 0,
        stock_in: 645,
        price: 36.087,
        price_in: 36.087,
        date_in: "2025-05-31",
      },
    ];

    for (const data of product_to_balance) {
      const { product_id, stock, stock_in, price, price_in, date_in } = data;

      await StockManagement.create({
        product_id,
        warehouse_id: "11111111-1111-1111-1111-111111111111",
        stock,
        in: stock_in,
        price,
        price_in,
        vendor_id: null,
        date_in,
        transaction_number: "added chester para mag balance",
        module_in_from: "added chester para mag balance",
      });
    }

    const toUpdateDateIn = [
      {
        stock_management_id: "64bd7c9e-3db3-4966-b5ff-84e27476ec4d",
        date_in: "2025-05-01",
      },
      {
        stock_management_id: "b08436c5-951b-4e55-b6bc-b1a180de784f",
        date_in: "2025-05-14",
      },
      {
        stock_management_id: "c156dae3-430b-4b0b-bf01-e68cd49202ba",
        date_in: "2025-05-01",
      },
      {
        stock_management_id: "420abcb9-8ca1-4215-9a7a-54d60946b749",
        date_in: "2025-05-01",
      },
      {
        stock_management_id: "a2d6e321-afe1-4871-acb5-3eee21da0375",
        date_in: "2025-05-14",
      },
      {
        stock_management_id: "d0f2b293-9d56-4aee-bc9c-e2abb763b671",
        date_in: "2025-05-15",
      },
    ];

    for (const data of toUpdateDateIn) {
      const { stock_management_id, date_in } = data;

      await StockManagement.update(
        {
          date_in,
        },
        {
          where: {
            stock_management_id,
          },
        }
      );
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/tagALLVendor", async (req, res) => {
  try {
    // Fetch all vendors
    const vendors = await Vendors.findAll({
      where: { status: "Active" },
      attributes: ["id"],
    });

    // Fetch all products
    const products = await ProductList.findAll({
      where: { status: "Active" },
      attributes: ["product_id"],
    });

    if (!vendors.length || !products.length) {
      return res.status(404).json({ message: "No vendors or products found" });
    }

    // Generate product-vendor combinations
    const records = [];

    for (const product of products) {
      for (const vendor of vendors) {
        records.push({
          product_id: product.product_id,
          vendor_id: vendor.id,
          product_price: 1,
          status: "Active",
        });
      }
    }

    // Bulk insert into ProductVendor table
    await Product_Tag_Vendor.bulkCreate(records);

    res.status(201).json({
      message: "Tagged all products to all vendors",
      totalInserted: records.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
