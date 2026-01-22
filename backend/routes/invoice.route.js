const getAccurateDate = require("../utils/accurate_date_time_today");
const router = require("express").Router();
const { Op, where, literal, fn, col } = require("sequelize");
const {
  Customer,
  SalesInvoice,
  StockManagement,
  SalesInvoiceInventory,
  Currency,
  ProductList,
  Cutoff,
  BulkCollectionPayment,
  BulkCollection,
  Activity_Log,
  BulkCollectionTransaction,
  Warehouse,
  Inventory_Report,
  Inventory_Journal,
} = require("../db/models/associations");
const {
  accountlist_base_subject,
  accountlist_sub3,
  accountlist_transaction_subject,
  CashFlow,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
const sequelize = require("../db/config/sequelize.config");
const { Fn } = require("sequelize/lib/utils");
const {
  dynamicConcatFilter,
  opLike,
  likeFilter,
  dateFormatFilter,
  castFilter,
} = require("../utils/filters/sequelizeSearchFilter");
const SalesJournal = require("../db/models/sales_journal.model");
const CheckJournal = require("../db/models/check_journal.model");
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

router.route("/getCutoffForDisplay").get(async (req, res) => {
  try {
    const latestData = await Cutoff.findAll({
      order: [["from", "DESC"]],
      where: {
        isDeleted: false,
      },
    });
    res.json(latestData);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getSubject3").get(async (req, res) => {
  try {
    const { selectedCurrency } = req.query;

    const mainSubject = await accountlist_base_subject.findOne({
      where: {
        subject_name: "Prepaid Expenses",
        module_type: "Liabilities Account",
      },
    });

    const mainSubjId = mainSubject.id;
    console.log(mainSubjId);
    const data = await accountlist_sub3.findAll({
      where: {
        account_list_base_sub_id: mainSubjId,
        currency_id: selectedCurrency,
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getWarehouse").get(async (req, res) => {
  try {
    const data = await Warehouse.findAll({
      where: {
        isDeleted: false,
        status: 1,
      },
      order: [["name", "ASC"]],
    });

    if (data) {
      return res.json(data);
    } else {
      res.status(400);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCutoffPosted").get(async (req, res) => {
  try {
    const data = await Cutoff.findAll({
      where: {
        isPosted: 1,
        isDeleted: false,
      },
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//for display widget ng total collection
router.route("/getBulkCollectionPayment").get(async (req, res) => {
  try {
    const data = await BulkCollectionPayment.findAll({
      where: {
        status: {
          [Op.or]: ["Approved", "Claimed"],
        },
      },
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/transactionSalesId").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}${month}`;

  const generateTwoNum = Math.floor(10 + Math.random() * 90);
  const time = new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  try {
    // const lastPayCode = await SalesInvoice.findOne({
    //   where: {
    //     transaction_id: {
    //       [Op.like]: `SI-${currentMonth}${time}${generateTwoNum}%`,
    //     },
    //   },
    //   order: [["createdAt", "DESC"]],
    // });

    let newRefCode = `SI-${currentMonth}${time}${generateTwoNum}`;
    // if (lastPayCode && lastPayCode.transaction_id) {
    //   const latestRefCode = lastPayCode.transaction_id;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `SI-${currentMonth}-${newSequence}`;
    //   } else {
    //     newRefCode = `SI-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `SI-${currentMonth}-00001`;
    // }

    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/create").post(async (req, res) => {
  try {
    const {
      transactionId,
      clientTransactionId,
      selectedCustomer,
      selectedMethod,
      selectedDueDate,
      selectedInvoiceDate,
      inputPaymentTerms,
      remarks,
      drNumber,
      poNumber,
      containerNumber,
      pier,
      userLoggedID,
      selectedDestination,
      selectedCurrency,
      items,
      totalAmount,
      transactionDiscount,
      transactionDiscountType,
      shippingFee,
      totalItemDiscount,
      currencyRate,
      selectedWarehouse,
      selectedSubject3,
      shipAmountFormat,
      amount,
      qty,
    } = req.body;

    //checker for stocks if enough
    for (const item of items) {
      const stockItems = await StockManagement.findAll({
        where: {
          product_id: item.product_id,
          warehouse_id: selectedWarehouse,
        },
      });
      let remainingQuantity = item.quantity;

      const totalStock = stockItems.reduce(
        (sum, stockItem) => sum + stockItem.stock,
        0
      );

      if (totalStock < remainingQuantity) {
        return res.status(205).json({
          message: `Insufficient stock for stock managament ID: ${item.product_id}`,
        });
      }
    }

    // Client transaction Id duplicate validation
    const existingClientTransactionId = await SalesInvoice.findOne({
      where: {
        client_transaction_id: clientTransactionId,
        isDeleted: false,
      },
    });

    if (existingClientTransactionId) {
      return res.status(409).json({ error: "Transaction Id Already Exists." });
    }

    const removeComma = (num) => {
      return num ? parseFloat(String(num).replace(/,/g, "")) : 0;
    };

    const SalesData = await SalesInvoice.create({
      transaction_id: transactionId,
      client_transaction_id: clientTransactionId,
      customer_id: selectedCustomer,
      currency_id: selectedCurrency,
      payment_method: selectedMethod,
      due_date: selectedDueDate || null,
      invoice_date: selectedInvoiceDate,
      payment_terms: inputPaymentTerms || null,
      destination: selectedDestination,
      transaction_discount: transactionDiscount,
      item_discount: totalItemDiscount || 0,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      discount_type: transactionDiscountType,
      status: "Pending",
      remarks: remarks,
      dr_number: drNumber,
      po_number: poNumber,
      container_number: containerNumber,
      pier: pier,
      created_by: userLoggedID,
      rate: currencyRate,
      account_list_sub3_id: selectedSubject3 || null,
      liability_amount: shipAmountFormat || 0,
      warehouse_id: selectedWarehouse,
      amount: removeComma(amount) || 0,
      quantity: removeComma(qty) || 0,
    });

    const salesId = SalesData.sales_invoice_id;
    for (const item of items) {
      const stockItems = await StockManagement.findAll({
        where: {
          product_id: item.product_id,
          warehouse_id: selectedWarehouse,
        },
      });

      // const inventoryReport = await Inventory_Report.create({
      //   // cut_off_id
      //   product_id: item.product_id,
      //   average_price: item.averagePrice,
      //   product_out: item.quantity,
      //   unit_price: item.unitPrice,
      // });

      let remainingQuantity = item.quantity;

      // const totalStock = stockItems.reduce(
      //   (sum, stockItem) => sum + stockItem.stock,
      //   0
      // );

      // if (totalStock < remainingQuantity) {
      //   return res.status(205).json({
      //     message: `Insufficient stock for stock managament ID: ${item.stock_management_id}`,
      //   });
      // }

      const InsertSalesInvoice = await SalesInvoiceInventory.create({
        sales_invoice_id: salesId,
        stock_management_id: item.stock_management_id,
        unit_price: item.unitPrice,
        discount_item: item.discount || 0,
        quantity: item.quantity,
        subtotal: item.subtotal,
        discount_type: item.discountType || "",
        average_price: item.averagePrice || 0,
        sales_profit: item.salesProfit || 0,
        moisture: item.moisture || 0,
        net_weight: item.netWeight || 0,
        static_net_weight: item.netWeight || 0,
      });

      for (const stockEntry of stockItems) {
        if (remainingQuantity === 0) break;

        if (stockEntry.stock >= remainingQuantity) {
          // If ang stock entry can fully accommodate ang remaining quantity
          stockEntry.stock -= remainingQuantity;
          remainingQuantity = 0; // All quantity processed
        } else {
          // If ang stock entry can only partially accommodate
          remainingQuantity -= stockEntry.stock;
          stockEntry.stock = 0; // Use up all stock in this entry
        }
        await stockEntry.save();
      }
    }

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Invoices: User created new invoice with transaction number ${transactionId}`,
    });
    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/update").post(async (req, res) => {
  try {
    const {
      id,
      transactionId,
      clientTransactionId,
      selectedCustomer,
      selectedCurrency,
      selectedMethod,
      selectedDueDate,
      selectedInvoiceDate,
      inputPaymentTerms,
      remarks,
      drNumber,
      poNumber,
      containerNumber,
      pier,
      selectedDestination,
      totalAmount,
      transactionDiscount,
      transactionDiscountType,
      shippingFee,
      totalItemDiscount,
      payload,
      currencyRate,
      userLoggedID,
      selectedSubject3,
      shipAmountFormat,
      amount,
      qty,
    } = req.body;

    // const isPosted = await Cutoff.findOne({
    //   where: {
    //     [Op.and]: [
    //       { from: { [Op.lte]: selectedDueDate } },
    //       { to: { [Op.gte]: selectedDueDate } },
    //     ],
    //     isPosted: true,
    //   },
    // });

    // if (isPosted) {
    //   return res.status(201).json({ message: "Cutoff already posted" });
    // }

    // Client Transaction Id duplicate validation
    const existingClientTransactionId = await SalesInvoice.findOne({
      where: {
        sales_invoice_id: {
          [Op.ne]: id,
        },
        client_transaction_id: clientTransactionId,
        isDeleted: false,
      },
    });

    if (existingClientTransactionId) {
      return res.status(409).json({ error: "Transction Id Already Exists." });
    }

    const getData = await SalesInvoice.findOne({
      include: [
        {
          model: Currency,
          attributes: ["currency_name"],
        },
        {
          model: Customer,
          attributes: ["first_name", "last_name"],
        },
      ],
      where: {
        sales_invoice_id: id,
      },
    });

    const getDataInventory = await SalesInvoiceInventory.findAll({
      include: [
        {
          model: StockManagement,
          include: [
            {
              model: ProductList,
              attributes: ["product_name"],
            },
          ],
          attributes: ["product_id"],
        },
      ],
      where: {
        sales_invoice_id: id,
      },
    });

    const removeComma = (num) => {
      return num ? parseFloat(String(num).replace(/,/g, "")) : 0;
    };

    const isUpdate = await SalesInvoice.update(
      {
        transaction_id: transactionId,
        client_transaction_id: clientTransactionId,
        customer_id: selectedCustomer,
        currency_id: selectedCurrency,
        payment_method: selectedMethod,
        due_date: selectedDueDate,
        invoice_date: selectedInvoiceDate,
        payment_terms: inputPaymentTerms,
        destination: selectedDestination,
        transaction_discount: transactionDiscount,
        item_discount: totalItemDiscount || 0,
        shipping_fee: shippingFee || 0,
        total_amount: totalAmount || 0,
        discount_type: transactionDiscountType,
        remarks: remarks,
        dr_number: drNumber,
        po_number: poNumber,
        container_number: containerNumber,
        pier: pier,
        rate: currencyRate,
        account_list_sub3_id: selectedSubject3,
        liability_amount: shipAmountFormat,
        amount: removeComma(amount),
        quantity: removeComma(qty),
      },
      {
        where: {
          sales_invoice_id: id,
          isDeleted: false,
        },
      }
    );

    if (isUpdate) {
      const existingProducts = await SalesInvoiceInventory.findAll({
        where: { sales_invoice_id: id, isDeleted: false },
      });

      // Add back the stock for each existing product
      for (const existingProduct of existingProducts) {
        const stockItems = await StockManagement.findAll({
          where: {
            stock_management_id: existingProduct.stock_management_id,
            isDeleted: false,
          },
        });

        // Return quantity to stock
        let quantityToAdd = existingProduct.quantity;
        for (const stock of stockItems) {
          if (quantityToAdd === 0) break;
          stock.stock += quantityToAdd;
          await stock.save();
          quantityToAdd = 0;
        }
      }

      await SalesInvoiceInventory.destroy({ where: { sales_invoice_id: id } });

      for (const item of payload.items) {
        // Simply create ONE record per item - NO distribution
        await SalesInvoiceInventory.create({
          sales_invoice_id: id,
          stock_management_id: item.stock_management_id, // Use the stock ID directly
          unit_price: item.unitPrice || 0,
          discount_item: item.discount || 0,
          quantity: item.quantity, // Keep full quantity
          moisture: item.moisture == "0" ? 0 : item.moisture,
          net_weight: item.netWeight,
          subtotal: item.subtotal,
          discount_type: item.discountType || "",
          average_price: item.averagePrice || 0,
          sales_profit: item.salesProfit || 0,
          static_net_weight: item.netWeight || 0,
        });

        // Still need to update stock
        const stockEntry = await StockManagement.findOne({
          where: {
            stock_management_id: item.stock_management_id,
            isDeleted: false,
          },
        });

        if (stockEntry) {
          stockEntry.stock -= item.quantity;
          await stockEntry.save();
        }
      }
      const getCustomer = await Customer.findOne({
        where: {
          customer_id: selectedCustomer,
          isDeleted: false,
        },
      });

      const getUpdatedDataInventory = await SalesInvoiceInventory.findAll({
        include: [
          {
            model: StockManagement,
            include: [
              {
                model: ProductList,
                attributes: ["product_name"],
              },
            ],
            attributes: ["product_id"],
          },
        ],
        where: {
          sales_invoice_id: id,
        },
      });

      const dataInventory = getDataInventory
        .map((item) => item.stock_management.product_list.product_name)
        .join(", ");

      const updatedDataInventory = getUpdatedDataInventory
        .map((item) => item.stock_management.product_list.product_name)
        .join(", ");

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Invoices: User updated invoice information with transaction ID ${transactionId} \n
        Customer: ${getData.customer.first_name} ${getData.customer.last_name} to ${getCustomer.first_name} ${getCustomer.last_name}
        Payment Method: ${getData.payment_method} to ${selectedMethod}
        Due Date: ${getData.due_date} tot ${selectedDueDate}
        Invoice Date: ${getData.invoice_date} to ${selectedInvoiceDate}
        Payment Terms: ${getData.payment_terms} to ${inputPaymentTerms}
        Destination: ${getData.destination} to ${selectedDestination}
        Container Number: ${getData.container_number} to ${containerNumber}
        Pier: ${getData.pier} to ${pier}
        Transaction Discount: ${getData.transaction_discount} to ${transactionDiscount}
        Shipping Fee: ${getData.shippingFee} to ${shippingFee}
        Total Amount : ${getData.total_amount} to ${totalAmount}
        Item Discount: ${getData.item_discount} to ${totalItemDiscount}
        Discount Type: ${getData.discount_type} to ${transactionDiscountType}
        Remarks: ${getData.remarks} to ${remarks}
        Products: [${dataInventory}] to [${updatedDataInventory}]
        `,
      });
      // for (const item of payload.items) {
      //   const existingProduct = await SalesInvoiceInventory.findAll({
      //     where: {
      //       sales_invoice_id: id,
      //     },
      //   });

      //   // If it exists, add stock using quantity and delete the existing
      //   if (existingProduct) {
      //     const stockItem = await StockManagement.findAll({
      //       where: {
      //         product_id: item.product_id,
      //       },
      //       order: ["stock_management_id", "ASC"],
      //     });

      //     if (stockItem) {
      //       stockItem.stock += existingProduct.quantity;

      //       await stockItem.save();

      //       await SalesInvoiceInventory.destroy({
      //         where: {
      //           sales_invoice_id: id,
      //         },
      //       });
      //     }
      //   }

      //   // Create the new entry after deletion
      //   const createNew = await SalesInvoiceInventory.create({
      //     sales_invoice_id: id,
      //     product_id: item.product_id,
      //     unit_price: item.unitPrice || 0,
      //     discount_item: item.discount || 0,
      //     quantity: item.quantity,
      //     subtotal: item.subtotal,
      //     discount_type: item.discountType || "",
      //     average_price: item.averagePrice || 0,
      //     sales_profit: item.salesProfit || 0,
      //   });

      //   if (createNew) {
      //     const newStockItem = await StockManagement.findOne({
      //       where: {
      //         product_id: item.product_id,
      //       },
      //     });

      //     if (newStockItem) {
      //       newStockItem.stock -= item.quantity;

      //       await newStockItem.save();
      //     }
      //   }
      // }
      return res.status(200).json({
        message: "Invoice approved and inventory updated successfully.",
      });
    } else {
      return res.status(400).json({ message: "Failed to update invoice." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router
  .route("/deleteInvoice/:invoiceId/:invoice_date")
  .delete(async (req, res) => {
    try {
      const id = req.params.invoiceId;
      const invoice_date = req.params.invoice_date;

      const { userLoggedID, rowData } = req.body;
      const transactionNumber = rowData.transaction_id;

      if (!id) return res.status(400).json({ error: "Id is required." });

      const getCutoff = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: invoice_date, // from date is less than or equal to purchase date
              },
            },
            {
              to: {
                [Op.gte]: invoice_date, // to date is greater than or equal to purchase date
              },
            },
          ],
          isDeleted: false,
        },
      });

      const {
        from: dateFrom,
        to: dateTo,
        isPosted: postedCutoff,
        name: CutoffName,
      } = getCutoff;

      const getInvoice = await SalesInvoice.findOne({
        where: { sales_invoice_id: id, isDeleted: false },
      });

      const invoiceDate = new Date(getInvoice.invoice_date);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (invoiceDate >= cutoffFrom && invoiceDate <= cutoffTo) {
          return res.status(202).json({
            success: false,
            invoiceDate: getInvoice.invoice_date,
            CutoffName: CutoffName,
          });
        }
      }

      const checkTransaction = await BulkCollectionTransaction.findOne({
        where: { sales_invoice_id: id, isDeleted: false },
        include: [{ model: BulkCollection, required: true }],
      });

      if (checkTransaction) {
        const transactionNumber =
          checkTransaction.bulk_collection.transaction_number;
        const moduleType = checkTransaction.bulk_collection.module_from;
        return res.status(203).json({
          success: false,
          transactionNumber,
          moduleType,
        });
      }

      await accountlist_sub3.decrement(
        { amount: rowData.liability_amount },
        { where: { id: rowData.account_list_sub3_id } }
      );

      const getData = await SalesInvoice.findOne({
        attributes: ["transaction_id"],
        where: { sales_invoice_id: id, isDeleted: false },
      });

      const getProducts = await SalesInvoiceInventory.findAll({
        where: { sales_invoice_id: id },
        attributes: ["stock_management_id", "quantity"],
      });

      if (getProducts.length > 0) {
        for (const product of getProducts) {
          const { stock_management_id, quantity } = product;

          await StockManagement.increment(
            { stock: quantity }, // Increase stock back
            { where: { stock_management_id } }
          );
        }
      }

      // Mark all products related to the transaction as deleted
      const softDeleteByTransaction = async (Model, whereClause) => {
        await Model.update(
          {
            isDeleted: true,
          },
          {
            where: whereClause,
          }
        );
      };

      // Where clauses for soft delete
      const whereClauses = {
        byTransactionNumber: { transaction_number: transactionNumber },
        bySalesInvoiceId: { sales_invoice_id: id },
      };

      // prettier-ignore
      await Promise.all([
        softDeleteByTransaction(SalesInvoiceInventory, whereClauses.bySalesInvoiceId),
        softDeleteByTransaction(SalesInvoice, whereClauses.bySalesInvoiceId),
        softDeleteByTransaction(Inventory_Report, whereClauses.bySalesInvoiceId),
        softDeleteByTransaction(SalesJournal, whereClauses.byTransactionNumber),
        softDeleteByTransaction(Inventory_Journal, whereClauses.byTransactionNumber)
      ]);

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Invoice: User deleted an invoice with transaction number ${getData.transaction_id}`,
      });

      return res.status(200).json({
        success: true,
        message:
          "Invoice deleted successfully, stock restored, and records cleared.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

router
  .route("/returnInvoice/:invoiceId/:invoice_date")
  .delete(async (req, res) => {
    try {
      const id = req.params.invoiceId;
      const invoice_date = req.params.invoice_date;

      const { userLoggedID, rowData } = req.body;

      const getCutoff = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: invoice_date, // from date is less than or equal to purchase date
              },
            },
            {
              to: {
                [Op.gte]: invoice_date, // to date is greater than or equal to purchase date
              },
            },
          ],
          isDeleted: false,
        },
      });

      const {
        from: dateFrom,
        to: dateTo,
        isPosted: postedCutoff,
        name: CutoffName,
      } = getCutoff;

      const getInvoice = await SalesInvoice.findOne({
        where: { sales_invoice_id: id, isDeleted: false },
      });

      const invoiceDate = new Date(getInvoice.invoice_date);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (invoiceDate >= cutoffFrom && invoiceDate <= cutoffTo) {
          return res.status(202).json({
            success: false,
            invoiceDate: getInvoice.invoice_date,
            CutoffName: CutoffName,
          });
        }
      }

      const checkTransaction = await BulkCollectionTransaction.findOne({
        where: { sales_invoice_id: id, isDeleted: false },
        include: [{ model: BulkCollection, required: true }],
      });

      if (checkTransaction) {
        const transactionNumber =
          checkTransaction.bulk_collection.transaction_number;
        const moduleType = checkTransaction.bulk_collection.module_from;
        return res.status(203).json({
          success: false,
          transactionNumber,
          moduleType,
        });
      }

      await accountlist_sub3.decrement(
        { amount: rowData.liability_amount },
        { where: { id: rowData.account_list_sub3_id } }
      );

      const getProducts = await SalesInvoiceInventory.findAll({
        where: { sales_invoice_id: id },
        attributes: ["stock_management_id", "quantity"],
      });

      if (getProducts.length > 0) {
        for (const product of getProducts) {
          const { stock_management_id, quantity } = product;

          await StockManagement.increment(
            { stock: quantity }, // Increase stock back
            { where: { stock_management_id } }
          );
        }
      }

      // await SalesInvoiceInventory.destroy({ where: { sales_invoice_id: id } });
      await SalesInvoiceInventory.update(
        {
          isDeleted: true,
        },
        { where: { sales_invoice_id: id } }
      );

      const getData = await SalesInvoice.findOne({
        attributes: ["transaction_id"],
        where: { sales_invoice_id: id, isDeleted: false },
      });

      // await SalesInvoice.destroy({ where: { sales_invoice_id: id } });
      await SalesInvoice.update(
        { isDeleted: true, isReturn: true, status: "Returned" },
        { where: { sales_invoice_id: id } }
      );

      await Inventory_Report.update(
        {
          isDeleted: true,
        },
        {
          where: {
            sales_invoice_id: id,
          },
        }
      );

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Invoice: User returned an invoice with transaction number ${getData.transaction_id}`,
      });

      return res.status(200).json({
        success: true,
        message:
          "Invoice returned successfully, stock restored, and records cleared.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

router.route("/approveRejectInvoice").post(async (req, res) => {
  try {
    const {
      id,
      status,
      selectedInvoiceDate,
      selectedWarehouse,
      userLoggedID,
      shipmentFee,
      items,
      transactionId,
      salesJournal: {
        customerId,
        date,
        totalAmount,
        totalQuantity,
        averageUnitPrice,
        paymentType,
        currencyName,
        currencyRate,
      },
    } = req.body;

    const getCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: {
              [Op.lte]: selectedInvoiceDate,
            },
          },
          {
            to: {
              [Op.gte]: selectedInvoiceDate,
            },
          },
        ],
        isDeleted: false,
      },
    });

    const {
      from: dateFrom,
      to: dateTo,
      isPosted: postedCutoff,
      name: CutoffName,
    } = getCutoff;

    const getInvoice = await SalesInvoice.findOne({
      where: { sales_invoice_id: id, isDeleted: false },
    });
    const selectedSubject3 = getInvoice.account_list_sub3_id;
    const invoiceDate = new Date(getInvoice.invoice_date);
    const cutoffFrom = new Date(dateFrom);
    const cutoffTo = new Date(dateTo);

    if (postedCutoff == true) {
      if (invoiceDate >= cutoffFrom && invoiceDate <= cutoffTo) {
        return res.status(202).json({
          success: false,
          invoiceDate: getInvoice.invoice_date,
          CutoffName: CutoffName,
          status: status,
        });
      }
    }

    const forapprovalInvoice = await SalesInvoice.update(
      {
        status: status,
        approved_by: userLoggedID,
        date_approved: await getAccurateDate(),
      },
      {
        where: {
          sales_invoice_id: id,
        },
      }
    );

    if (status === "Approved") {
      const getSubject3 = await accountlist_sub3.findOne({
        where: {
          id: selectedSubject3,
        },
      });

      if (getSubject3) {
        const subjectAmount = getSubject3.amount || 0;
        const newAmount = subjectAmount + shipmentFee;

        await accountlist_sub3.update(
          {
            amount: newAmount,
          },
          {
            where: {
              id: selectedSubject3,
            },
          }
        );
      }

      console.log(
        "******************************************** items : ",
        items
      );

      for (const item of items) {
        await Inventory_Report.create({
          product_id: item.productId,
          average_price: item.averagePrice,
          product_out: item.quantity,
          unit_price: item.unitPrice,
          date_in: selectedInvoiceDate,
          sales_invoice_id: id,
        });

        // Get the current cutoff based on selected invoice date
        const currentCutoff = await Cutoff.findOne({
          attributes: ["from", "to"],
          where: {
            from: {
              [Op.lte]: selectedInvoiceDate,
            },
            to: {
              [Op.gte]: selectedInvoiceDate,
            },
            isDeleted: false,
          },
          raw: true,
        });

        const [
          inventory, // Inventory summary
          inventoryCounting, // Get the latest inventory counting numbers
          hasInventoryCounting, // Check if there's an inventory counting transaction within the cutoff range
        ] = await Promise.all([
          irService.getInventorySummaryByProduct({
            selectedDate: selectedInvoiceDate,
            productId: item.productId,
            warehouseId: selectedWarehouse,
            method: "findOne", // Model method
            transaction: null, // For sequelize.transaction
          }),
          irService.getLatestInventoryCounting(
            item.productId,
            selectedWarehouse
          ),
          Inventory_Journal.findOne({
            attributes: ["createdAt"],
            where: {
              date_in: {
                [Op.between]: [currentCutoff.from, currentCutoff.to],
              },
              product_id: item.productId,
              warehouse_id: selectedWarehouse,
              module_from: "Inventory Counting",
              isDeleted: false,
            },
            raw: true,
          }),
        ]);

        // Get the total "in" after the latest inventory counting transaction
        const totalIncoming = await irService.getTotalIncoming({
          productId: item.productId,
          warehouseId: selectedWarehouse,
          createdAt: inventoryCounting.createdAt,
        });

        // Get the average price
        const averagePrice = hasInventoryCounting
          ? // After inventory counting
            irHelper.getAveragePriceAfterCounting(
              inventoryCounting,
              totalIncoming
            )
          : // Before inventory counting
            irHelper.getAveragePrice(inventory);

        // Create an inventory journal "out" entry for inventory report
        await Inventory_Journal.create({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: averagePrice,
          date_in: selectedInvoiceDate,
          type: "out",
          isDeleted: false,
          module_from: "Invoice",
          transaction_number: transactionId,
          warehouse_id: selectedWarehouse,
        });
      }

      // Make a sales journal record for sales report
      await SalesJournal.create({
        customer_id: customerId,
        transaction_number: transactionId,
        date,
        total_amount: totalAmount,
        total_quantity: totalQuantity,
        avg_unit_price: averageUnitPrice,
        payment_type: paymentType,
        currency_name: currencyName,
        currency_rate: currencyRate,
      });
    }

    const actStatus = status == "Approved" ? "approved" : "rejected";

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Invoice: User ${actStatus} an invoice with transaction ID ${getInvoice.transaction_id}`,
    });
    if (forapprovalInvoice) {
      return res.status(200).json({ message: "Updates successful" });
    }
    // const updateInvoice = await SalesInvoice.update({
    //   transaction_id: transactionId,
    //   customer_id: selectedCustomer,
    //   currency_id: selectedCurrency,
    //   payment_method: selectedMethod,
    //   due_date: selectedDueDate,
    //   payment_terms: inputPaymentTerms,
    //   destination: selectedDestination,
    //   transaction_discount: transactionDiscount,
    //   item_discount: totalItemDiscount || 0,
    //   shipping_fee: shippingFee || 0,
    //   total_amount: totalAmount || 0,
    //   discount_type: transactionDiscountType,
    //   status: status,
    // }, {
    //   where: {
    //     sales_invoice_id: id
    //   }
    // })

    // if (updateInvoice) {
    //   for (const item of payload.items) {
    //     const checkProduct = await SalesInvoiceInventory.findOne({
    //       where: {
    //         sales_invoice_id: id,
    //         stock_management_id: item.stock_management_id
    //       }
    //     });

    //     // If the product does not exist, create yung hindi pa exist
    //     if (!checkProduct) {
    //       await SalesInvoiceInventory.create({
    //         sales_invoice_id: id,
    //         stock_management_id: item.stock_management_id,
    //         unit_price: item.unitPrice || 0,
    //         discount_item: item.discount || 0,
    //         quantity: item.quantity,
    //         subtotal: item.subtotal,
    //         discount_type: item.discountType
    //       });
    //     } else {
    //       // If it exists, update na lang ang important fields para sa playsafe
    //       await SalesInvoiceInventory.update({
    //         unit_price: item.unitPrice || 0,
    //         discount_item: item.discount || 0,
    //         quantity: item.quantity,
    //         subtotal: item.subtotal,
    //         discount_type: item.discountType
    //       }, {
    //         where: {
    //           sales_invoice_id: id,
    //           stock_management_id: item.stock_management_id
    //         }
    //       });
    //     }
    //   }
    //   return res.status(200).json({ message: "Invoice approved and inventory updated successfully." });
    // } else {
    //   return res.status(400).json({ message: "Failed to update invoice." });
    // }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSpecificInvoice").get(async (req, res) => {
  try {
    const data = await SalesInvoice.findOne({
      where: { sales_invoice_id: req.query.id },
      include: [
        { model: Customer, required: true },
        { model: Currency, required: true },
        { model: Warehouse, required: true },
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          { from: { [Op.lte]: data.invoice_date } },
          { to: { [Op.gte]: data.invoice_date } },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;
    const cutoffExists = findCutoff;

    const productTag = await SalesInvoiceInventory.findAll({
      where: { sales_invoice_id: req.query.id },
      include: [
        {
          model: StockManagement,
          required: true,
          include: [{ model: ProductList, required: true }],
        },
      ],
    });

    if (!data) {
      return res.status(204).json();
    }

    // Get stock lookup
    const productIds = productTag
      ?.map((inv) => inv.stock_management?.product_id)
      .filter(Boolean);

    const stockRecords = await StockManagement.findAll({
      where: { product_id: productIds, isDeleted: false },
    });

    const stockLookup = {};
    stockRecords.forEach((record) => {
      const productId = record.product_id;
      stockLookup[productId] = (stockLookup[productId] || 0) + record.stock;
    });

    // ✅ MAP EACH ITEM DIRECTLY - NO AGGREGATION
    const result = productTag.map((inv) => {
      const productId = inv.stock_management?.product_id;
      return {
        stock_management_id: inv.stock_management_id,
        product_id: productId,
        product_code: inv.stock_management.product_list?.product_code || "",
        product_name: inv.stock_management.product_list?.product_name || "",
        unit_of_measure:
          inv.stock_management.product_list?.unit_of_measure || "",
        average_price: inv.average_price,
        sales_profit: inv.sales_profit,
        discount_item: inv.discount_item,
        subtotal: inv.subtotal,
        discount_type: inv.discount_type,
        unit_price: inv.unit_price,
        quantity: inv.quantity,
        moisture: inv.moisture,
        net_weight: inv.net_weight,
        static_net_weight: inv.static_net_weight,
        remaining: stockLookup[productId] || 0,
      };
    });

    return res.json({ data, result, isPosted, cutoffExists });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//for creating sales invoice sa pag-tag ng customer
router.route("/getCustomersData").get(async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: {
        status: {
          [Op.ne]: 0,
        },
        isDeleted: false,
      },
    });

    if (customers) {
      return res.json(customers);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getCustomersDataPDF").get(async (req, res) => {
  try {
    const customers = await Customer.findAll();

    if (customers) {
      return res.json(customers);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// router.route("/getCustomersDataBySearch").get(async (req, res) => {
//   try {
//     const { customerSearchValue } = req.query;
//     const customers = await Customer.findAll({
//       where: {
//         [Op.and]: [
//           {
//             status: {
//               [Op.ne]: 0,
//             },
//           },
//           {
//             isDeleted: false,
//           },
//           customerSearchValue && {
//             [Op.or]: [
//               dynamicConcatFilter(
//                 customerSearchValue,
//                 "first_name",
//                 "last_name",
//                 " "
//               ),
//               sequelize.where(
//                 fn("LOWER", fn("TRIM", col("company_name"))),
//                 opLike(customerSearchValue)
//               ),
//             ],
//           },
//         ],
//       },
//       limit: 5,
//     });

//     if (customers) {
//       return res.json(customers);
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

//for creating sales invoice sa pag-select ng mga product

router.route("/getCustomersDataBySearch").get(async (req, res) => {
  try {
    const { customerSearchValue } = req.query;
    
    const whereClause = {
      status: {
        [Op.ne]: 0,
      },
      isDeleted: false,
    };

    // Only add search filter if customerSearchValue exists
    if (customerSearchValue) {
      whereClause[Op.or] = [
        dynamicConcatFilter(
          customerSearchValue,
          "first_name",
          "last_name",
          " "
        ),
        sequelize.where(
          fn("LOWER", fn("TRIM", col("company_name"))),
          opLike(customerSearchValue)
        ),
      ];
    }

    const customers = await Customer.findAll({
      where: whereClause,
      limit: customerSearchValue ? 5 : 100, // More results when not searching
      order: [["company_name", "ASC"]],
    });

    if (customers) {
      return res.json(customers);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/getProductInventoryInvoice").get(async (req, res) => {
  try {
    const { warehouse_id } = req.query;

    const whereCondition = {
      // stock: {
      //   [Op.ne]: 0,
      // },
      isDeleted: false,
    };

    if (warehouse_id) {
      whereCondition.warehouse_id = warehouse_id;
    }

    const data = await StockManagement.findAll({
      include: [
        {
          model: ProductList,
          required: true,
          where: {
            status: "Active",
          },
        },
      ],
      order: [["createdAt", "ASC"]],
      where: whereCondition,
    });
    // Group by product_id and aggregate
    const aggregatedData = {};

    data.forEach((inv) => {
      const productId = inv.product_id;

      if (!aggregatedData[productId]) {
        aggregatedData[productId] = {
          product_id: productId,
          product_code: inv.product_list.product_code,
          product_name: inv.product_list.product_name,
          total_stock: 0,
          total_price: 0,
          count: 0,
          stock_details: [],
        };
      }

      aggregatedData[productId].total_stock += inv.stock;
      aggregatedData[productId].total_price += inv.price;
      aggregatedData[productId].count += 1;

      // Store stock_management_id details
      aggregatedData[productId].stock_details.push({
        stock_management_id: inv.stock_management_id,
        stock: inv.stock,
        price: inv.price,
      });
    });

    // Calculate average price
    const result = Object.values(aggregatedData).map((item) => ({
      ...item,
      average_price: item.total_price / item.count,
    }));
    // const aggregatedData = {};
    // data.forEach((inv) => {
    //   const productId = inv.product_id;

    //   if (!aggregatedData[productId]) {
    //     aggregatedData[productId] = {
    //       stock_management_id: inv.stock_management_id,
    //       product_id: productId,
    //       product_code: inv.product_list.product_code,
    //       product_name: inv.product_list.product_name,
    //       total_stock: 0,
    //       total_price: 0,
    //       count: 0,
    //     };
    //   }

    //   aggregatedData[productId].total_stock += inv.stock;
    //   aggregatedData[productId].total_price += inv.price;
    //   aggregatedData[productId].count += 1;
    // });

    // // Calculate average SRP
    // const result = Object.values(aggregatedData).map((product) => ({
    //   stock_management_id: product.stock_management_id,
    //   product_id: product.product_id,
    //   product_code: product.product_code,
    //   product_name: product.product_name,
    //   stock: product.total_stock,
    //   average_price: product.total_price / product.count,
    // }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/fetchLastCutoffModal").get(async (req, res) => {
  try {
    const { startDate, currencyId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!startDate)
      return res.status(400).json({ error: "startDate is required." });

    const { count, rows: lastCutoffReceivableQuery } =
      await SalesInvoice.findAndCountAll({
        include: [
          {
            model: Currency,
            required: true,
            where: {
              ...(currencyId !== "All" && { id: currencyId }),
            },
          },
          {
            model: Customer,
            required: true,
          },
        ],
        subQuery: false,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
        where: {
          [Op.and]: [
            {
              status: "Approved",
            },
            {
              invoice_date: {
                [Op.lt]: startDate,
              },
            },
            // {
            //   payAdded: 0,
            // },
          ],
          isDeleted: false,
        },
      });
    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: lastCutoffReceivableQuery,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// router.route("/getSalesData").get(async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       filterColumn,
//       status,
//       currencyId,
//       selectedCustomer,
//     } = req.query;
//     let { searchTerm } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     if (!startDate || !endDate)
//       return res
//         .status(400)
//         .json({ error: "startDate and endDate are required." });

//     const numericText = searchTerm?.replace(/,/g, "");
//     if (!isNaN(numericText)) {
//       searchTerm = numericText;
//     }

//     let salesInvoiceWhereClause = {
//       invoice_date: {
//         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//       },
//       ...(status !== "All" && { status }),
//     };

//     let customerWhereClause = {
//       ...(selectedCustomer && {
//         customer_id: {
//           [Op.in]: selectedCustomer.map((item) => item.value),
//         },
//       }),
//     };

//     let currencyWhereClause = {
//       ...(currencyId !== "All" && { id: currencyId }),
//     };

//     const salesInvoiceTableColumn = [
//       "transaction_id",
//       "destination",
//       "invoice_date",
//       "total_amount",
//       // "status",
//       "dr_number",
//       "po_number",
//       "container_number",
//       "pier",
//     ];

//     if (searchTerm && searchTerm.trim() !== "") {
//       switch (filterColumn) {
//         case "transaction_id":
//           salesInvoiceWhereClause["transaction_id"] = {
//             [Op.like]: `%${searchTerm}%`,
//           };
//           break;
//         case "destination":
//           salesInvoiceWhereClause["destination"] = {
//             [Op.like]: `%${searchTerm}%`,
//           };
//           break;
//         // case "customer":
//         //   customerWhereClause = sequelize.literal(`
//         //     LOWER(
//         //       COALESCE(
//         //         NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), ''),
//         //         company_name
//         //       )
//         //     ) LIKE '%${searchTerm.toLowerCase()}%'
//         //   `);
//         //   break;
//         case "invoice_date":
//           salesInvoiceWhereClause = {
//             [Op.and]: [
//               {
//                 invoice_date: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               status !== "All" && { status }, // Include 'status' only when status is not "All"
//               sequelize.where(
//                 sequelize.fn(
//                   "DATE_FORMAT",
//                   sequelize.col("invoice_date"),
//                   "%b/%d/%Y"
//                 ),
//                 { [Op.like]: `%${searchTerm}%` }
//               ),
//             ],
//           };
//           break;
//         case "dr_number":
//         case "po_number":
//           salesInvoiceWhereClause[filterColumn] = {
//             [Op.like]: `%${searchTerm}%`,
//           };
//           break;
//         // case "currency":
//         //   currencyWhereClause["currency_name"] = {
//         //     [Op.like]: `%${searchTerm}%`,
//         //   };
//         //   break;
//         case "totalAmount":
//           salesInvoiceWhereClause = {
//             [Op.and]: [
//               {
//                 invoice_date: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               status !== "All" && { status }, // Include 'status' only when it's not "All"
//               sequelize.where(sequelize.literal("total_amount"), {
//                 [Op.like]: `%${searchTerm}%`,
//               }),
//             ],
//           };
//           break;
//         // case "status":
//         //   salesInvoiceWhereClause["status"] = {
//         //     [Op.like]: `%${searchTerm}%`,
//         //   };
//         //   break;

//         case "all":
//           salesInvoiceWhereClause = {
//             [Op.and]: [
//               {
//                 invoice_date: {
//                   [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//                 },
//               },
//               status !== "All" && { status }, // Include 'status' only when it's not "All"
//               {
//                 [Op.or]: salesInvoiceTableColumn.map((col) => {
//                   if (col === "invoice_date") {
//                     return sequelize.where(literal(`CAST (${col} AS CHAR)`), {
//                       [Op.like]: `%${searchTerm}%`,
//                     });
//                   } else if (
//                     ["container_number", "pier"].includes(col) &&
//                     searchTerm.toLowerCase() == "n/a"
//                   ) {
//                     return {
//                       [col]: null || "",
//                     };
//                   } else if (col === "total_amount") {
//                     return sequelize.where(sequelize.literal("total_amount"), {
//                       [Op.like]: `%${searchTerm}%`,
//                     });
//                   } else {
//                     return {
//                       [col]: {
//                         [Op.like]: `%${searchTerm}%`,
//                       },
//                     };
//                   }
//                 }),
//               },
//             ],
//           };
//           break;
//       }
//     }

//     async function filteredData() {
//       const { count, rows: data } = await SalesInvoice.findAndCountAll({
//         include: [
//           {
//             model: Currency,
//             required: true,
//             where: currencyWhereClause,
//           },
//           {
//             model: Customer,
//             required: true,
//             where: customerWhereClause,
//           },
//         ],
//         order: [["createdAt", "DESC"]],
//         limit: limit,
//         offset: offset,
//         where: {
//           ...salesInvoiceWhereClause,
//           [Op.or]: [
//             { isDeleted: false },
//             {
//               [Op.and]: [{ isDeleted: true }, { isReturn: true }],
//             },
//           ],
//         },
//       });

//       return { count, data };
//     }

//     let { count, data } = await filteredData();

//     data = data?.map((item) => {
//       const calculateDaysDifference = (startDate, endDate) => {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         const timeDifference = end.getTime() - start.getTime();
//         const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
//         return daysDifference.toString();
//       };

//       return {
//         ...item.toJSON(),
//         daysDifference: calculateDaysDifference(item.createdAt, item.due_date),
//       };
//     });

//     // Filter for Due Date
//     if (filterColumn === "due_date") {
//       const filterForDueDate = data.filter((item) => {
//         const modifiedDueDate = `In ${item.daysDifference} Day(s)`;
//         return modifiedDueDate.toLowerCase().includes(searchTerm.toLowerCase());
//       });

//       return res.status(200).json({
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page || 1),
//         data: {
//           data: filterForDueDate,
//         },
//       });
//     }

//     if (data?.length === 0 && filterColumn === "all" && status === "All") {
//       const customerCurrency = [
//         // "customer",
//         //  "currency",
//         "due_date",
//       ];

//       for (const item of customerCurrency) {
//         salesInvoiceWhereClause = {
//           invoice_date: {
//             [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//           },
//         };
//         if (status !== "All") {
//           salesInvoiceWhereClause["status"] = status;
//         }

//         customerWhereClause = {
//           ...(selectedCustomer && {
//             customer_id: {
//               [Op.in]: selectedCustomer.map((item) => item.value),
//             },
//           }),
//         };

//         currencyWhereClause = {
//           ...(currencyId !== "All" && { id: currencyId }),
//         };

//         if (item === "customer") {
//           // Handle Filter Customer
//           customerWhereClause = sequelize.literal(`
//             LOWER(
//               COALESCE(
//                 NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), ''),
//                 company_name
//               )
//             ) LIKE '%${searchTerm.toLowerCase()}%'
//           `);
//         } else if (item === "currency") {
//           // Handle Filter Currency
//           currencyWhereClause["currency_name"] = {
//             [Op.like]: `%${searchTerm}%`,
//           };
//         } else {
//           // Handle Filter Due Date
//           let { count, data } = await filteredData();
//           data = data?.map((item) => {
//             const calculateDaysDifference = (startDate, endDate) => {
//               const start = new Date(startDate);
//               const end = new Date(endDate);
//               const timeDifference = end.getTime() - start.getTime();
//               const daysDifference = Math.ceil(
//                 timeDifference / (1000 * 3600 * 24)
//               );
//               return daysDifference.toString();
//             };

//             return {
//               ...item.toJSON(),
//               daysDifference: calculateDaysDifference(
//                 item.createdAt,
//                 item.due_date
//               ),
//             };
//           });
//           const filterForDueDate = data?.filter((item) => {
//             const modifiedDueDate = `In ${item.daysDifference} Day(s)`;
//             return modifiedDueDate
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase());
//           });

//           return res.status(200).json({
//             totalItems: 0,
//             totalPages: Math.ceil(0 / limit),
//             currentPage: parseInt(page || 1),
//             data: {
//               data: filterForDueDate,
//             },
//           });
//         }

//         let { count, data } = await filteredData();

//         if (data?.length > 0) {
//           return res.status(200).json({
//             totalItems: count,
//             totalPages: Math.ceil(count / limit),
//             currentPage: parseInt(page || 1),
//             data: {
//               data,
//             },
//           });
//         }
//       }
//     }

//     res.json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: parseInt(page || 1),
//       data: {
//         data,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json("Error");
//   }
// });

router.route("/getSalesData").get(async (req, res) => {
  try {
    const { startDate, endDate, status, currencyId } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "startDate and endDate are required." });

    const salesInvoiceStatus = Array.isArray(status)
      ? { [Op.in]: status }
      : status;

    const salesWhereClause = {
      invoice_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
      status: salesInvoiceStatus,
      ...(currencyId !== "All" && { ["$currency.id$"]: currencyId }),
    };

    const { count, rows: data } = await SalesInvoice.findAndCountAll({
      attributes: [
        "sales_invoice_id",
        "transaction_id",
        "client_transaction_id",
        "account_list_sub3_id",
        "container_number",
        "pier",
        "destination",
        "dr_number",
        "po_number",
        "total_amount",
        "invoice_date",
        "status",
        "date_approved",
        [
          sequelize.literal(
            `CONCAT('In ', DATEDIFF(due_date, sales_invoice.createdAt), ' Day(s)')`
          ),
          "daysDifference",
        ],
      ],
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      order: [["date_approved", "DESC"]],
      limit: limit,
      offset: offset,
      where: {
        ...salesWhereClause,
        [Op.or]: [
          { isDeleted: false },
          {
            [Op.and]: [{ isDeleted: true }, { isReturn: true }],
          },
        ],
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.route("/getSalesData/search").get(async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       filterColumn,
//       status,
//       currencyId,
//       selectedCustomer,
//     } = req.query;
//     let { searchTerm } = req.query;

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const numericText = searchTerm?.replace(/,/g, "");
//     if (!isNaN(numericText)) {
//       searchTerm = numericText;
//     }

//     if (!startDate || !endDate)
//       return res
//         .status(400)
//         .json({ error: "startDate and endDate are required." });

//     const salesInvoiceStatus = Array.isArray(status)
//       ? { [Op.in]: status }
//       : status;

//     let salesWhereClause = {
//       invoice_date: {
//         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
//       },
//       status: salesInvoiceStatus,
//       ...(selectedCustomer && {
//         ["$customer.customer_id$"]: {
//           [Op.in]: selectedCustomer.map((item) => item.value),
//         },
//       }),
//       ...(currencyId !== "All" && { ["$currency.id$"]: currencyId }),
//     };

//     const daysDifferenceFilter = (text, field) => {
//       return sequelize.where(
//         sequelize.literal(
//           `CONCAT('In ', DATEDIFF(${field}, sales_invoice.createdAt), ' Day(s)')`
//         ),
//         opLike(text)
//       );
//     };

//     // --- For search filter ---
//     if (filterColumn !== "all") {
//       switch (filterColumn) {
//         case "total_amount":
//           salesWhereClause = {
//             ...salesWhereClause,
//             ...castFilter(searchTerm, filterColumn),
//           };
//           break;
//         case "invoice_date":
//           salesWhereClause = {
//             ...salesWhereClause,
//             ...dateFormatFilter(searchTerm, filterColumn),
//           };
//           break;
//         case "due_date":
//           salesWhereClause = {
//             ...salesWhereClause,
//             [Op.or]: daysDifferenceFilter(searchTerm, filterColumn),
//           };
//           break;
//         default:
//           salesWhereClause = {
//             ...salesWhereClause,
//             ...likeFilter(searchTerm, filterColumn),
//           };
//       }
//     } else {
//       salesWhereClause = {
//         ...salesWhereClause,
//         [Op.or]: [
//           likeFilter(searchTerm, "client_transaction_id"),
//           likeFilter(searchTerm, "sales_invoice.destination"),
//           likeFilter(searchTerm, "dr_number"),
//           likeFilter(searchTerm, "po_number"),
//           castFilter(searchTerm, "total_amount"),
//           dateFormatFilter(searchTerm, "invoice_date"),
//           daysDifferenceFilter(searchTerm, "due_date"),
//         ],
//       };
//     }

//     const { count, rows: data } = await SalesInvoice.findAndCountAll({
//       attributes: [
//         "sales_invoice_id",
//         "client_transaction_id",
//         "account_list_sub3_id",
//         "container_number",
//         "pier",
//         "destination",
//         "dr_number",
//         "po_number",
//         "total_amount",
//         "invoice_date",
//         "status",
//         [
//           sequelize.literal(
//             `CONCAT('In ', DATEDIFF(due_date, sales_invoice.createdAt), ' Day(s)')`
//           ),
//           "daysDifference",
//         ],
//       ],
//       include: [
//         {
//           model: Currency,
//           required: true,
//         },
//         {
//           model: Customer,
//           required: true,
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//       limit: limit,
//       offset: offset,
//       where: {
//         [Op.and]: [
//           { ...salesWhereClause },
//           {
//             [Op.or]: [
//               { isDeleted: false },
//               {
//                 [Op.and]: [{ isDeleted: true }, { isReturn: true }],
//               },
//             ],
//           },
//         ],
//       },
//     });

//     res.json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: parseInt(page || 1),
//       data,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/getSalesData/search").get(async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      filterColumn,
      status,
      currencyId,
      selectedCustomer,
    } = req.query;
    let { searchTerm } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const numericText = searchTerm?.replace(/,/g, "");
    if (!isNaN(numericText)) {
      searchTerm = numericText;
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required." });
    }

    const salesInvoiceStatus = Array.isArray(status)
      ? { [Op.in]: status }
      : status;

    let salesWhereClause = {
      invoice_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
      status: salesInvoiceStatus,
      ...(selectedCustomer && {
        ["$customer.customer_id$"]: {
          [Op.in]: selectedCustomer.map((item) => item.value),
        },
      }),
      ...(currencyId !== "All" && { ["$currency.id$"]: currencyId }),
    };

    const daysDifferenceFilter = (text, field) => {
      // existing code
    };

    // --- For search filter ---
    if (filterColumn !== "all") {
      switch (filterColumn) {
        case "client_transaction_id":
          salesWhereClause["client_transaction_id"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "destination":
          salesWhereClause["destination"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "invoice_date":
          salesWhereClause = {
            ...salesWhereClause,
            invoice_date: sequelize.where(
              sequelize.fn(
                "DATE_FORMAT",
                sequelize.col("invoice_date"),
                "%b/%d/%Y"
              ),
              { [Op.like]: `%${searchTerm}%` }
            ),
          };
          break;
        case "due_date":
          // Handle due date filter
          break;
        case "dr_number":
        case "po_number":
          salesWhereClause[filterColumn] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "total_amount":
          salesWhereClause["total_amount"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "product_name":
        case "product_code":
          // Will be handled in the query with includes
          break;
      }
    } else {
      // For "all" search, include all columns
      salesWhereClause = {
        ...salesWhereClause,
        [Op.or]: [
          { client_transaction_id: { [Op.like]: `%${searchTerm}%` } },
          { destination: { [Op.like]: `%${searchTerm}%` } },
          { dr_number: { [Op.like]: `%${searchTerm}%` } },
          { po_number: { [Op.like]: `%${searchTerm}%` } },
          { total_amount: { [Op.like]: `%${searchTerm}%` } },
          {
            "$sales_invoice_tag_inventories.stock_management.product_list.product_name$":
              {
                [Op.like]: `%${searchTerm}%`,
              },
          },
          {
            "$sales_invoice_tag_inventories.stock_management.product_list.product_code$":
              {
                [Op.like]: `%${searchTerm}%`,
              },
          },
        ],
      };
    }

    // Handle specific product search
    if (filterColumn === "product_name") {
      salesWhereClause = {
        ...salesWhereClause,
        "$sales_invoice_tag_inventories.stock_management.product_list.product_name$":
          {
            [Op.like]: `%${searchTerm}%`,
          },
      };
    } else if (filterColumn === "product_code") {
      salesWhereClause = {
        ...salesWhereClause,
        "$sales_invoice_tag_inventories.stock_management.product_list.product_code$":
          {
            [Op.like]: `%${searchTerm}%`,
          },
      };
    }

    const { count, rows: data } = await SalesInvoice.findAndCountAll({
      attributes: [
        "sales_invoice_id",
        "transaction_id",
        "client_transaction_id",
        "account_list_sub3_id",
        "container_number",
        "pier",
        "destination",
        "dr_number",
        "po_number",
        "total_amount",
        "invoice_date",
        "status",
        [
          sequelize.literal(
            `CONCAT('In ', DATEDIFF(due_date, sales_invoice.createdAt), ' Day(s)')`
          ),
          "daysDifference",
        ],
      ],
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
        {
          model: SalesInvoiceInventory,
          required:
            filterColumn === "product_name" ||
            filterColumn === "product_code" ||
            filterColumn === "all",
          attributes: [],
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
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: {
        [Op.and]: [
          { ...salesWhereClause },
          {
            [Op.or]: [
              { isDeleted: false },
              {
                [Op.and]: [{ isDeleted: true }, { isReturn: true }],
              },
            ],
          },
        ],
      },
      subQuery: false,
      distinct: true,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.route("/getSalesData/customer-filter").get(async (req, res) => {
  try {
    const { startDate, endDate, status, currencyId, selectedCustomer } =
      req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "startDate and endDate are required." });

    const salesInvoiceStatus = Array.isArray(status)
      ? { [Op.in]: status }
      : status;

    const salesWhereClause = {
      invoice_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
      status: salesInvoiceStatus,
      ...(selectedCustomer && {
        ["$customer.customer_id$"]: {
          [Op.in]: selectedCustomer.map((item) => item.value),
        },
      }),
      ...(currencyId !== "All" && { ["$currency.id$"]: currencyId }),
    };

    const { count, rows: data } = await SalesInvoice.findAndCountAll({
      attributes: [
        "sales_invoice_id",
        "transaction_id",
        "client_transaction_id",
        "account_list_sub3_id",
        "container_number",
        "pier",
        "destination",
        "dr_number",
        "po_number",
        "total_amount",
        "invoice_date",
        "status",
        [
          sequelize.literal(
            `CONCAT('In ', DATEDIFF(due_date, sales_invoice.createdAt), ' Day(s)')`
          ),
          "daysDifference",
        ],
      ],
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      where: {
        ...salesWhereClause,
        [Op.or]: [
          { isDeleted: false },
          {
            [Op.and]: [{ isDeleted: true }, { isReturn: true }],
          },
        ],
      },
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/fetchSalesInvoiceWidgets").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;
    async function filteredData() {
      const { count, rows: data } = await SalesInvoice.findAndCountAll({
        include: [
          {
            model: Currency,
            required: true,
            where: {
              ...(currencyId === "All" ? {} : { id: currencyId }),
            },
          },
          {
            model: Customer,
            required: true,
          },
        ],
        order: [["createdAt", "DESC"]],
        where: {
          invoice_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
          isDeleted: false,
        },
      });

      return { count, data };
    }

    let { count, data } = await filteredData();

    data = data?.map((item) => {
      const calculateDaysDifference = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDifference = end.getTime() - start.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        return daysDifference.toString();
      };

      return {
        ...item.toJSON(),
        daysDifference: calculateDaysDifference(item.createdAt, item.due_date),
      };
    });

    const lastCutoffReceivableQuery = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          required: true,
          where: {
            ...(currencyId === "All" ? {} : { id: currencyId }),
          },
        },
        {
          model: Customer,
          required: true,
        },
      ],
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const bulkCollectionPayment = await BulkCollectionPayment.findAll({
      where: {
        status: {
          [Op.or]: ["Approved", "Claimed"],
        },
        isDeleted: false,
        date_issued: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
      },
      include: [
        {
          model: BulkCollection,
          required: true,
          include: [
            {
              model: BulkCollectionTransaction,
              required: true,
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  include: [
                    {
                      model: Currency,
                      required: true,
                      where: {
                        ...(currencyId === "All" ? {} : { id: currencyId }),
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const lastCutoffReceivable = lastCutoffReceivableQuery
      .filter((item) => {
        return (
          item.status == "Approved" && item.invoice_date < startDate
          // item.payAdded == 0
        );
      })
      .reduce((total, value) => {
        const amount = value.total_amount;
        const amountInBaseCurrency =
          value.total_amount * value.currency.currency_rate;
        return total + (currencyId === "All" ? amountInBaseCurrency : amount);
        // return total + value.total_amount;
      }, 0);

    const currentSalesTotal = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        const amount = value.total_amount;
        const amountInBaseCurrency =
          value.total_amount * value.currency.currency_rate;
        return total + (currencyId === "All" ? amountInBaseCurrency : amount);
        // return total + value.total_amount;
      }, 0);

    const currentTotalDiscount = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        const transactionDiscount = parseFloat(value.transaction_discount);
        const itemDiscount = parseFloat(value.item_discount);
        const currencyRate = value.currency.currency_rate;
        const totalDiscount = transactionDiscount + itemDiscount;
        const totalDiscountInBaseCurrency =
          (transactionDiscount + itemDiscount) * currencyRate;
        return (
          total +
          (currencyId === "All" ? totalDiscountInBaseCurrency : totalDiscount)
        );
      }, 0);

    const countedIds = new Set();

    const totalCollection = bulkCollectionPayment
      .filter((item) => item.status === "Approved")
      .reduce((total, value) => {
        const amount =
          value.bulk_collection.bulk_collection_transactions.reduce(
            (subtotal, transaction) => {
              const id = transaction.sales_invoice?.transaction_id;
              const salesInvoiceRate =
                transaction.sales_invoice?.currency.currency_rate || 1;
              const salesInvoiceAmount =
                transaction.sales_invoice?.total_amount;

              // Check if the ID has already been counted
              if (id && !countedIds.has(id)) {
                countedIds.add(id); // Add ID to the Set
                const transactionTotal =
                  currencyId === "All"
                    ? salesInvoiceRate * salesInvoiceAmount
                    : salesInvoiceAmount;
                return subtotal + transactionTotal;
              }

              return subtotal;
            },
            0
          );

        return total + amount;
      }, 0);

    const currentCutoffReceivable = data
      .filter((item) => {
        return item.status === "Approved";
      })
      .reduce((total, value) => {
        const amount = value.total_amount;
        const amountInBaseCurrency =
          value.total_amount * value.currency.currency_rate;
        return total + (currencyId === "All" ? amountInBaseCurrency : amount);
        // return total + parseFloat(value.total_amount);
      }, 0);

    res.status(200).json({
      lastCutoffReceivable,
      currentSalesTotal,
      currentTotalDiscount,
      totalCollection,
      currentCutoffReceivable,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Collection widget for sales invoice
router.route("/summary/collection").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;

    const summary = await BulkCollectionPayment.findOne({
      attributes: [
        [
          sequelize.literal(`SUM(
            CASE
              WHEN ${currencyId !== "All"} THEN bulk_collection_payment.amount
              ELSE bulk_collection_payment.amount * currency_rate
            END
          )`),
          "collection",
        ],
      ],
      include: [
        {
          model: BulkCollection,
          required: true,
          attributes: [],
          include: [
            {
              model: BulkCollectionTransaction,
              required: true,
              attributes: [],
              include: [
                {
                  model: SalesInvoice,
                  required: true,
                  attributes: [],
                  where: {
                    invoice_date: {
                      [Op.between]: [startDate, endDate],
                    },
                    ...(currencyId !== "All" && { currency_id: currencyId }),
                    isDeleted: false,
                  },
                },
              ],
            },
            {
              model: Currency,
              required: true,
              attributes: [],
            },
          ],
          where: {
            status: {
              [Op.in]: ["Approved", "Partially Collected", "Collected"],
            },
            isDeleted: false,
          },
        },
      ],
      where: {
        status: "Approved",
        isDeleted: false,
      },
      subQuery: false,
      raw: true,
    });

    res.status(200).json(summary.collection || 0);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/fetchPreviousSalesKilo").get(async (req, res) => {
  try {
    const { startDate, currencyId } = req.query;

    // Validate query param
    if (!startDate) {
      return res.status(400).json({ message: "Missing startDate query param" });
    }

    // Get the previous cutoff
    const previousCutoffDate = await Cutoff.findOne({
      where: {
        from: {
          [Op.lt]: startDate,
        },
        isDeleted: false,
      },
      order: [["from", "DESC"]],
    });

    // If there's no previous cutoff date return 0
    if (!previousCutoffDate) {
      return res.status(200).json({ previousSalesKilo: 0 });
    }

    // Sum all quantity from previous cutoff
    const previousSalesKilo = await SalesInvoiceInventory.findOne({
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.col("sales_invoice_tag_inventory.net_weight")
          ),
          "previousSalesKilo",
        ],
      ],
      include: [
        {
          model: SalesInvoice,
          required: true,
          attributes: [],
          where: {
            invoice_date: {
              [Op.between]: [previousCutoffDate.from, previousCutoffDate.to],
            },
            ...(currencyId === "All" ? {} : { currency_id: currencyId }), // Conditional filter by currency_id
            status: {
              [Op.in]: ["Approved", "Partially Collected", "Collected"],
            },
            isDeleted: false,
          },
        },
      ],
      raw: true,
    });

    res.status(200).json(previousSalesKilo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/fetchCurrentSalesKilo").get(async (req, res) => {
  try {
    const { startDate, endDate, currencyId } = req.query;

    // Validate query param
    if (!startDate) {
      return res.status(400).json({ message: "Missing startDate query param" });
    }

    if (!endDate) {
      return res.status(400).json({ message: "Missing endDate query param" });
    }

    // Sum all quantity from current cutoff
    const currentSalesKilo = await SalesInvoiceInventory.findOne({
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.col("sales_invoice_tag_inventory.net_weight")
          ),
          "currentSalesKilo",
        ],
      ],
      include: [
        {
          model: SalesInvoice,
          required: true,
          attributes: [],
          where: {
            invoice_date: {
              [Op.between]: [startDate, endDate],
            },
            ...(currencyId === "All" ? {} : { currency_id: currencyId }), // Conditional filter by currency_id
            status: {
              [Op.in]: ["Approved", "Partially Collected", "Collected"],
            },
            isDeleted: false,
          },
        },
      ],
      raw: true,
    });

    res.status(200).json(currentSalesKilo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//para 'to sa pag-redirect ng user sa specific na data nung na-click ang notification
router.route("/getSalesDataNotification").get(async (req, res) => {
  const { startDate, endDate, id } = req.query;
  try {
    const data = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      where: {
        invoice_date: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
        sales_invoice_id: id,
      },
    });

    const lastCutoffReceivableQuery = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const bulkCollectionPayment = await BulkCollectionPayment.findAll({
      where: {
        status: {
          [Op.or]: ["Approved", "Claimed"],
        },
        date_issued: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
      },
    });

    const lastCutoffReceivable = lastCutoffReceivableQuery
      .filter((item) => {
        return (
          item.status == "Approved" &&
          item.invoice_date < startDate &&
          item.payAdded == 0
        );
      })
      .reduce((total, value) => {
        return total + value.total_amount;
      }, 0);

    const currentSalesTotal = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        return total + value.total_amount;
      }, 0);

    const currentTotalDiscount = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        return (
          total +
          parseFloat(value.transaction_discount) +
          parseFloat(value.item_discount)
        );
      }, 0);

    const totalCollection = bulkCollectionPayment
      .filter((item) => {
        return item.status === "Approved";
      })
      .reduce((total, value) => {
        return total + parseFloat(value.amount);
      }, 0);

    const currentCutoffReceivable = data
      .filter((item) => {
        return item.status === "Approved";
      })
      .reduce((total, value) => {
        return total + parseFloat(value.total_amount);
      }, 0);

    res.json({
      data,
      lastCutoffReceivable,
      currentSalesTotal,
      currentTotalDiscount,
      totalCollection,
      currentCutoffReceivable,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

router.route("/searchSalesData").get(async (req, res) => {
  const { query, filterColumn } = req.query;

  try {
    const whereCondition = {};

    if (filterColumn) {
      // Handle specific column filtering
      switch (filterColumn) {
        case "transaction_id":
          whereCondition.transaction_id = { [Op.like]: `%${query}%` };
          break;
        case "destination":
          whereCondition.destination = { [Op.like]: `%${query}%` };
          break;
        case "customer":
          whereCondition[Op.or] = [
            { "$customer.first_name$": { [Op.like]: `%${query}%` } },
            { "$customer.last_name$": { [Op.like]: `%${query}%` } },
          ];
          break;
        case "invoice_date":
          whereCondition.invoice_date = { [Op.like]: `%${query}%` };
          break;
        case "due_date":
          whereCondition.due_date = { [Op.like]: `%${query}%` };
          break;
        case "currency":
          whereCondition["$currency.currency_name$"] = {
            [Op.like]: `%${query}%`,
          };
          break;
        case "totalAmount":
          whereCondition.total_amount = { [Op.like]: `%${query}%` };
          break;
        case "status":
          whereCondition.status = { [Op.like]: `%${query}%` };
          break;
        default:
          // If no specific column or invalid column, search all fields
          whereCondition[Op.or] = [
            { transaction_id: { [Op.like]: `%${query}%` } },
            { destination: { [Op.like]: `%${query}%` } },
            { "$customer.first_name$": { [Op.like]: `%${query}%` } },
            { "$customer.last_name$": { [Op.like]: `%${query}%` } },
            { invoice_date: { [Op.like]: `%${query}%` } },
            { due_date: { [Op.like]: `%${query}%` } },
            { "$currency.currency_name$": { [Op.like]: `%${query}%` } },
            { status: { [Op.like]: `%${query}%` } },
          ];
      }
    } else {
      // If no filterColumn specified, search all fields
      whereCondition[Op.or] = [
        { transaction_id: { [Op.like]: `%${query}%` } },
        { destination: { [Op.like]: `%${query}%` } },
        { "$customer.first_name$": { [Op.like]: `%${query}%` } },
        { "$customer.last_name$": { [Op.like]: `%${query}%` } },
        { invoice_date: { [Op.like]: `%${query}%` } },
        { due_date: { [Op.like]: `%${query}%` } },
        { "$currency.currency_name$": { [Op.like]: `%${query}%` } },
        { status: { [Op.like]: `%${query}%` } },
      ];
    }

    const data = await SalesInvoice.findAll({
      include: [
        {
          model: Currency,
          required: true,
        },
        {
          model: Customer,
          required: true,
        },
      ],
      where: whereCondition,
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

// Endpoint for the list of customers with their remaining balance (Transaction List Modal)
router.route("/transaction-list/customers").get(async (req, res) => {
  try {
    const { domestic_type } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic type

    // Get customer count
    const count = await Customer.count({
      attributes: [],
      include: [
        {
          model: BulkCollection,
          required: true,
          attributes: [],
          where: {
            type,
            isDeleted: false,
          },
        },
      ],
      distinct: true,
    });

    // Get customer ids
    const customerIds = await Customer.findAll({
      attributes: [
        [sequelize.literal("DISTINCT `customer`.`customer_id`"), "customer_id"],
      ],
      include: [
        {
          model: BulkCollection,
          required: true,
          attributes: [],
          where: {
            type,
            isDeleted: false,
          },
        },
      ],
      limit,
      offset,
      raw: true,
      subQuery: false,
    });

    // Main fetching to get customer lists with their remaining balance
    const customerList = await Customer.findAll({
      attributes: [
        [
          sequelize.literal(`
            CASE
              WHEN (company_name IS NULL OR company_name = "") THEN CONCAT(COALESCE(first_name, "")," ",COALESCE(last_name, ""))
              ELSE company_name
            END
          `),
          "customerName",
        ],
        // Compute remaining balance per customer
        // Query 1: Sum of total_amount from BulkCollection
        // Query 2: Sum of amount from BulkCollectionPayment (joined with BulkCollection)
        // Remaining Balance = (Total Amount) - (Total Payment)
        [
          sequelize.literal(`
            (SELECT COALESCE(SUM(bc1.total_amount), 0) 
            FROM bulk_collections bc1
            WHERE bc1.customer_id = customer.customer_id
            AND bc1.isDeleted = false
            AND bc1.type = ${sequelize.escape(type)})
            - 
            (SELECT COALESCE(SUM(bcp.amount), 0)
            FROM bulk_collection_payments bcp
            INNER JOIN bulk_collections bc2
            ON bcp.bulk_collection_id = bc2.id
            WHERE bc2.customer_id = customer.customer_id
            AND bc2.type = ${sequelize.escape(type)}
            AND bcp.isDeleted = false
            AND bc2.isDeleted = false
            AND bc2.status != "For Approval"
            AND bcp.status = "Claimed")`),
          "remainingBalance",
        ],
        "country",
        "customer_id",
      ],
      where: {
        customer_id: customerIds.map((item) => item.customer_id),
      },
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: customerList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handle customer search from transaction list
router.route("/transaction-list/customers/search").get(async (req, res) => {
  try {
    const { searchText, domestic_type } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic type

    // Get customer count
    const count = await Customer.count({
      attributes: [],
      include: [
        {
          model: BulkCollection,
          required: true,
          attributes: [],
          where: {
            type,
            isDeleted: false,
          },
        },
      ],
      where: {
        [Op.or]: [
          likeFilter(searchText, "company_name"),
          dynamicConcatFilter(searchText, "first_name", "last_name", " "),
        ],
      },
      distinct: true,
    });

    // Get customer ids
    const customerIds = await Customer.findAll({
      attributes: [
        [sequelize.literal("DISTINCT `customer`.`customer_id`"), "customer_id"],
      ],
      include: [
        {
          model: BulkCollection,
          required: true,
          attributes: [],
          where: {
            type,
            isDeleted: false,
          },
        },
      ],
      where: {
        [Op.or]: [
          likeFilter(searchText, "company_name"),
          dynamicConcatFilter(searchText, "first_name", "last_name", " "),
        ],
      },
      limit,
      offset,
      raw: true,
      subQuery: false,
    });

    // Main fetching to get customer lists with their remaining balance
    const customerList = await Customer.findAll({
      attributes: [
        [
          sequelize.literal(`
            CASE
              WHEN (company_name IS NULL OR company_name = "") THEN CONCAT(COALESCE(first_name, "")," ",COALESCE(last_name, ""))
              ELSE company_name
            END
          `),
          "customerName",
        ],
        // Compute remaining balance per customer
        // Query 1: Sum of total_amount from BulkCollection
        // Query 2: Sum of amount from BulkCollectionPayment (joined with BulkCollection)
        // Remaining Balance = (Total Amount) - (Total Payment)
        [
          sequelize.literal(`
            (SELECT COALESCE(SUM(bc1.total_amount), 0) 
            FROM bulk_collections bc1
            WHERE bc1.customer_id = customer.customer_id
            AND bc1.isDeleted = false
            AND bc1.type = ${sequelize.escape(type)})
            - 
            (SELECT COALESCE(SUM(bcp.amount), 0)
            FROM bulk_collection_payments bcp
            INNER JOIN bulk_collections bc2
            ON bcp.bulk_collection_id = bc2.id
            WHERE bc2.customer_id = customer.customer_id
            AND bc2.type = ${sequelize.escape(type)}
            AND bcp.isDeleted = false
            AND bc2.isDeleted = false
            AND bc2.status != "For Approval"
            AND bcp.status = "Claimed")`),
          "remainingBalance",
        ],
        "country",
        "customer_id",
      ],
      where: {
        customer_id: customerIds.map((item) => item.customer_id),
      },
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: customerList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Customer's transactions from the Transaction List Modal dropdown
router.route("/transaction-list/transactions").get(async (req, res) => {
  try {
    const { customer_id, domestic_type } = req.query;
    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic type

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get bulk collection total count
    const count = await BulkCollection.count({
      attributes: [],
      where: {
        customer_id,
        type,
        isDeleted: false,
      },
      limit,
      offset,
    });

    // Get bulk collection ids
    const bulkCollectionsIds = await BulkCollection.findAll({
      attributes: ["id"],
      where: {
        customer_id,
        type,
        isDeleted: false,
      },
      limit,
      offset,
      raw: true,
    });

    // Main fetching to get bulk collection transactions with the specific customer
    const bulkCollections = await BulkCollection.findAll({
      attributes: [
        "id",
        "collection_date",
        "transaction_number",
        "status",
        "createdAt",
        [
          sequelize.literal(`
            COALESCE(SUM(DISTINCT total_amount), 0)
            - COALESCE(SUM(${sequelize.escape(
              sequelize.col("bulk_collection_payments.amount")
            )}), 0)
          `),
          "remainingBalance",
        ],
      ],
      include: [
        {
          model: BulkCollectionPayment,
          required: false,
          attributes: [],
          where: {
            isDeleted: false,
          },
        },
      ],
      where: {
        id: {
          [Op.in]: bulkCollectionsIds.map((item) => item.id),
        },
      },
      group: ["id"],
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: bulkCollections,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// For total receivable widget
router.route("/summary/total-receivable").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;
    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic type

    const receivableSummary = await BulkCollection.findOne({
      attributes: [
        [
          sequelize.literal(`
          SUM(
            CASE
              WHEN ${currencyId !== "All"} THEN total_amount
              ELSE total_amount * currency_rate
            END
          )
        `),
          "totalReceivable",
        ],
      ],
      include: [
        {
          model: Currency,
          required: true,
          attributes: [],
        },
      ],
      where: {
        ...(currencyId !== "All" && { currency_id: currencyId }),
        type,
        isDeleted: false,
        collection_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
    });

    const paymentSummary = await BulkCollectionPayment.findOne({
      attributes: [
        [
          sequelize.literal(`
        SUM(
          CASE
            WHEN ${currencyId !== "All"} THEN amount
            ELSE amount * currency_rate
          END
        )`),
          "totalClaimed",
        ],
      ],
      include: [
        {
          model: BulkCollection,
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
            ...(currencyId !== "All" && { currency_id: currencyId }),
            type,
            isDeleted: false,
          },
        },
      ],
      where: {
        date_issued: {
          [Op.between]: [startDate, endDate],
        },
        isDeleted: false,
        status: "Claimed",
      },
      raw: true,
    });

    const totalReceivable =
      (receivableSummary.totalReceivable || 0) -
      (paymentSummary.totalClaimed || 0);

    res.status(200).json(totalReceivable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// For total claimed widget
router.route("/summary/total-claimed").get(async (req, res) => {
  try {
    const { startDate, endDate, domestic_type, currencyId } = req.query;
    const type = domestic_type.charAt(0).toUpperCase() + domestic_type.slice(1); // Capitalize domestic type

    const paymentSummary = await BulkCollectionPayment.findOne({
      attributes: [
        [
          sequelize.literal(`
        SUM(
          CASE
            WHEN ${currencyId !== "All"} THEN amount
            ELSE amount * currency_rate
          END
        )`),
          "totalClaimed",
        ],
        //use this if need sa widget mag minus ang galing sa liability
        // [
        //   sequelize.literal(`
        // SUM(
        //   CASE
        //     WHEN ${currencyId !== "All"} THEN bulk_collection_payment.amount
        //     ELSE bulk_collection_payment.amount * currency_rate
        //   END
        // )`),
        //   "totalClaimed",
        // ],
      ],
      include: [
        {
          model: BulkCollection,
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
            ...(currencyId !== "All" && { currency_id: currencyId }),
            type,
            isDeleted: false,
          },
        },
        //use this if need sa widget mag minus ang galing sa liability
        // {
        //   model: accountlist_sub3,
        //   required: true,
        //   attributes: [],
        //   include: [
        //     {
        //       model: accountlist_base_subject,
        //       required: true,
        //       attributes: ["module_type"],
        //       where: {
        //         module_type: { [Op.ne]: "Liabilities Account" },
        //       },
        //     },
        //   ],
        // },
      ],
      where: {
        date_issued: {
          [Op.between]: [startDate, endDate],
        },
        isDeleted: false,
        status: "Claimed",
      },
      raw: true,
    });

    res.status(200).json(paymentSummary.totalClaimed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Allow adding payment after BulkCollection is approved
router.route("/payment").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      bulkCollectionId,
      newPayment: {
        subject3,
        paymentMethod,
        checkNumber,
        refNumber,
        amount,
        issuedDate,
        checkOrOnline,
      },
      transactionNumber,
      userLoggedID,
      module,
    } = req.body;

    const isPaymentCash = paymentMethod === "Cash";
    const isLocal = module === "Local";
    const moduleType = isLocal ? "Local Collection" : "Overseas Collection";

    // Handles creation of both "Bank" and "Cash" payment
    await BulkCollectionPayment.create(
      {
        bulk_collection_id: bulkCollectionId,
        account_list_sub3_id: subject3,
        payment_type: paymentMethod,
        check_number: checkNumber,
        ref_number: refNumber,
        amount,
        date_issued: issuedDate,
        check_or_online: checkOrOnline,
        status: "Pending",
        // ...(isPaymentCash && { collected_by: userLoggedID }),
      },
      {
        transaction,
      }
    );

    // Handle cash payments
    // if (isPaymentCash) {
    //   // Increment the cash account (record the received amount)
    //   await accountlist_sub3.increment("amount", {
    //     by: amount,
    //     where: { id: subject3 },
    //     transaction,
    //   });

    //   // Record the transaction in account list (debit entry)
    //   await accountlist_transaction_subject.create(
    //     {
    //       account_list_sub3_id_transacted: subject3,
    //       payment_method: paymentMethod,
    //       amount: amount,
    //       date: issuedDate,
    //       check_or_remarks: checkNumber || refNumber,
    //       type: "Debit",
    //       module_from: moduleType,
    //       transaction_number: transactionNumber,
    //     },
    //     {
    //       transaction,
    //     }
    //   );

    //   // Log the transaction in Cash Flow
    //   await CashFlow.create(
    //     {
    //       account_list_id_cash_to: subject3,
    //       transaction_date: issuedDate,
    //       transaction_number: transactionNumber,
    //       module_from: moduleType,
    //       description: "Collection",
    //       amount: amount,
    //       status: "Collected",
    //     },
    //     { transaction }
    //   );
    // }

    // --- Determine if the status of "BulkCollection" and "SalesInvoice" is "Partially Collected" or "Claimed/Collected" --- //
    // const [receivable, claimedAmount, payments] = await Promise.all([
    //   // Find Total receivable and total claimed payment
    //   BulkCollection.findOne({
    //     attributes: ["total_amount"],
    //     where: {
    //       id: bulkCollectionId,
    //       isDeleted: false,
    //     },
    //     transaction,
    //     raw: true,
    //   }),
    //   BulkCollectionPayment.sum("amount", {
    //     where: {
    //       bulk_collection_id: bulkCollectionId,
    //       status: "Claimed",
    //       isDeleted: false,
    //     },
    //     transaction,
    //   }),
    //   // Get all payments
    //   BulkCollectionPayment.findAll({
    //     attributes: ["payment_type"],
    //     where: {
    //       bulk_collection_id: bulkCollectionId,
    //       isDeleted: false,
    //     },
    //     transaction,
    //     raw: true,
    //   }),
    // ]);

    // // Check payments
    // const isAllCash = payments.every((item) => item.payment_type === "Cash");
    // const isAllBank = payments.every((item) => item.payment_type === "Bank");
    // const allClaimed = receivable.total_amount === claimedAmount; // All payment claimed
    // const isCollected = allClaimed && isAllCash; // All payment claimed and All payment is cash

    // // Determines the final payment status
    // const getStatus = (isAllBank, condition) => {
    //   const statusMap = {
    //     true: "Approved", // If all payment is bank return "Approved"
    //     false: condition, // if all payment is cash return "Claimed/Collected", if both bank and cash exist in payment return "Partially Collected"
    //   };

    //   return statusMap[isAllBank];
    // };

    // // --- Handles "SalesInvoice" & "BulkCollection" status update to "Partially Collected" or "Claimed/Collected" ---
    // const bulkCollectionTransaction = await BulkCollectionTransaction.findAll({
    //   attributes: ["sales_invoice_id"],
    //   where: {
    //     bulk_collection_id: bulkCollectionId,
    //     isDeleted: false,
    //   },
    //   transaction,
    //   raw: true,
    // });

    // await SalesInvoice.update(
    //   {
    //     status: getStatus(
    //       isAllBank,
    //       isCollected || allClaimed ? "Collected" : "Partially Collected"
    //     ),
    //   },
    //   {
    //     where: {
    //       sales_invoice_id: {
    //         [Op.in]: bulkCollectionTransaction.map(
    //           (item) => item.sales_invoice_id
    //         ),
    //       },
    //       isDeleted: false,
    //     },
    //     transaction,
    //   }
    // );

    // await BulkCollection.update(
    //   {
    //     status: getStatus(
    //       isAllBank,
    //       isCollected || allClaimed ? "Claimed" : "Partially Collected"
    //     ),
    //   },
    //   {
    //     where: {
    //       id: bulkCollectionId,
    //       isDeleted: false,
    //     },
    //     transaction,
    //   }
    // );

    await transaction.commit();
    res.sendStatus(201);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for approving a payment from the table action
router.route("/payment/:id/approve").put(async (req, res) => {
  const transaction = await sequelize.transaction(); // sequelize transaction for all or nothing
  try {
    const { id } = req.params;
    const {
      paymentType,
      subject3, // id of account_list_sub3
      amount,
      issuedDate,
      checkNumber,
      refNumber,
      moduleType,
      transactionNumber,
      bulkCollectionId,
      transactionDate,
      customerId,
      currencyName,
      currencyRate,
    } = req.body;

    // Payment service
    const PaymentApprovalService = {
      // Approve payment from bulk collection
      updatePaymentStatus: async ({ id, isCash, transaction }) => {
        const [updatedCount] = await BulkCollectionPayment.update(
          {
            status: isCash ? "Claimed" : "Approved",
          },
          {
            where: {
              id,
            },
            transaction,
          }
        );
        return updatedCount;
      },
      // Handle creation of check journal "Debit" entry for trial balance
      createCheckJournal: async ({
        moduleType,
        transactionNumber,
        transactionDate,
        issuedDate,
        checkNumber,
        currencyName,
        currencyRate,
        transaction,
      }) => {
        await CheckJournal.create(
          {
            module_from: moduleType,
            transaction_number: transactionNumber,
            transaction_date: transactionDate,
            issued_date: issuedDate,
            type: "Debit",
            amount,
            check_number: checkNumber,
            currency_name: currencyName,
            currency_rate: currencyRate,
          },
          { transaction }
        );
      },
      handleCashPayment: async ({
        subject3,
        amount,
        issuedDate,
        checkNumber,
        refNumber,
        moduleType,
        transactionNumber,
        transaction,
      }) => {
        const getSub1 = await accountlist_sub3.findOne({
          where: {
            id: subject3,
          },
          include: [
            {
              model: accountlist_base_subject,
              required: true,
            },
          ],
        });

        const sub3_AccountType = getSub1.account_list_base_sub.module_type;
        await Promise.all([
          sub3_AccountType === "Liabilities Account"
            ? // Increment the cash account (record the received amount)
              accountlist_sub3.decrement("amount", {
                by: amount,
                where: { id: subject3 },
                transaction,
              })
            : // Increment the cash account (record the received amount)
              accountlist_sub3.increment("amount", {
                by: amount,
                where: { id: subject3 },
                transaction,
              }),
          // Record the transaction in account list
          accountlist_transaction_subject.create(
            {
              account_list_sub3_id_transacted: subject3,
              payment_method: "Cash",
              amount: amount,
              date: issuedDate,
              check_or_remarks: checkNumber || refNumber,
              type:
                sub3_AccountType === "Liabilities Account" ? "Credit" : "Debit",
              module_from: moduleType,
              transaction_number: transactionNumber,
              rate: currencyRate
            },
            {
              transaction,
            }
          ),
          // Log the transaction in Cash Flow
          CashFlow.create(
            {
              account_list_id_cash_to: subject3,
              transaction_date: issuedDate,
              transaction_number: transactionNumber,
              module_from: moduleType,
              description:
                sub3_AccountType === "Liabilities Account"
                  ? "Collected but recorded as Deduction"
                  : "Collection",
              amount: amount,
              status: "Collected",
            },
            { transaction }
          ),
          // Make a sales journal record for sales report
          SalesJournal.create(
            {
              customer_id: customerId,
              transaction_number: transactionNumber,
              date: issuedDate,
              total_amount: amount,
              total_quantity: 0,
              avg_unit_price: 0,
              payment_type: "Credit",
              currency_name: currencyName,
              currency_rate: currencyRate,
            },
            {
              transaction,
            }
          ),
        ]);
      },
      // Check payments
      paymentSummary: async ({ bulkCollectionId, transaction }) => {
        const [receivable, claimedAmount = 0] = await Promise.all([
          // Find Total receivable and total claimed payment
          BulkCollection.findOne({
            attributes: ["total_amount"],
            where: {
              id: bulkCollectionId,
              isDeleted: false,
            },
            transaction,
            raw: true,
          }),
          BulkCollectionPayment.sum("amount", {
            where: {
              bulk_collection_id: bulkCollectionId,
              status: "Claimed",
              isDeleted: false,
            },
            transaction,
          }),
        ]);

        return {
          totalReceivable: receivable?.total_amount || 0,
          claimedAmount,
        };
      },
      // Determine the status if its "Paid" or "Partially Collected"
      getStatus: ({ totalReceivable, claimedAmount, model }) => {
        const fullStatus = {
          BulkCollection: "Claimed",
          SalesInvoice: "Collected",
        };
        const allClaimed = totalReceivable === claimedAmount; // All payment claimed
        const isCollected = allClaimed ? fullStatus[model] : "Partially Collected"; // prettier-ignore

        return isCollected;
      },
      // Get all sales invoice within the bulk collection
      getSalesInvoiceIds: async ({ bulkCollectionId, transaction }) => {
        const bulkCollectionTransaction =
          await BulkCollectionTransaction.findAll({
            attributes: ["sales_invoice_id"],
            where: {
              bulk_collection_id: bulkCollectionId,
              isDeleted: false,
            },
            transaction,
            raw: true,
          });

        return bulkCollectionTransaction.map((item) => item.sales_invoice_id);
      },
      // Update sales invoice status
      updateSalesInvoice: async ({ status, salesInvoiceIds, transaction }) => {
        await SalesInvoice.update(
          {
            status,
          },
          {
            where: {
              sales_invoice_id: {
                [Op.in]: salesInvoiceIds,
              },
              isDeleted: false,
            },
            transaction,
          }
        );
      },
      // Update bulk collection status
      updateBulkCollection: async ({
        status,
        bulkCollectionId,
        transaction,
      }) => {
        await BulkCollection.update(
          {
            status,
          },
          {
            where: {
              id: bulkCollectionId,
              isDeleted: false,
            },
            transaction,
          }
        );
      },
    };

    // --- Payment approval work flow ---

    const isCash = paymentType === "Cash";

    // 1. Update payment status
    const updatedCount = await PaymentApprovalService.updatePaymentStatus({
      id,
      isCash,
      transaction,
    });

    // 1.1 Validation: Return 404 if no payment record was updated (invalid or non-existent ID)
    if (updatedCount === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: "Payment not found." });
    }

    // 2. Process payment type

    // 2.1 (Only if the payment is cash) Distribute payment to cash flow
    if (isCash) {
      await PaymentApprovalService.handleCashPayment({
        subject3,
        amount,
        issuedDate,
        checkNumber,
        refNumber,
        moduleType,
        transactionNumber,
        transaction,
      });
    }

    // 2.2 (Only if the payment includes a check number) Create a check journal "Debit" entry
    if (checkNumber) {
      await PaymentApprovalService.createCheckJournal({
        moduleType,
        transactionNumber,
        transactionDate,
        issuedDate,
        checkNumber,
        currencyName,
        currencyRate,
        transaction,
      });
    }

    // 3. Check payments and determine status for Sales/BulkCollection
    const { totalReceivable, claimedAmount } =
      await PaymentApprovalService.paymentSummary({
        bulkCollectionId,
        transaction,
      });
    const bulkStatus = PaymentApprovalService.getStatus({
      totalReceivable,
      claimedAmount,
      model: "BulkCollection",
    });
    const salesStatus = PaymentApprovalService.getStatus({
      totalReceivable,
      claimedAmount,
      model: "SalesInvoice",
    });

    // 4. Update sales invoice and bulk collection status to "Collected" or "Partially Collected"
    const salesInvoiceIds = await PaymentApprovalService.getSalesInvoiceIds({
      bulkCollectionId,
      transaction,
    });
    await PaymentApprovalService.updateSalesInvoice({
      status: salesStatus,
      salesInvoiceIds,
      transaction,
    });
    await PaymentApprovalService.updateBulkCollection({
      status: bulkStatus,
      bulkCollectionId,
      transaction,
    });

    await transaction.commit();
    res.status(200).json({
      success: "Payment has been successfully approved.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get items to return from backload sales invoice
router.route("/backload/items-to-return").get(async (req, res) => {
  try {
    const { salesInvoiceId, salesTransactionNumber } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!salesInvoiceId) {
      return res.status(400).json({ error: "salesInvoiceId is required" });
    }

    const { count, rows: data } = await SalesInvoiceInventory.findAndCountAll({
      include: [
        {
          model: SalesInvoice,
          required: true,
          attributes: ["transaction_id", "client_transaction_id"],
          where: {
            sales_invoice_id: salesInvoiceId,
            isDeleted: false,
          },
        },
        {
          model: StockManagement,
          required: true,
          include: [
            {
              model: ProductList,
              required: true,
              attributes: ["product_id", "product_name", "product_code"],
            },
          ],
        },
      ],
      where: {
        sales_invoice_id: salesInvoiceId,
        isDeleted: false,
      },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Return product from backload sales invoice
router.route("/backload/return-product").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { product } = req.body;
    const {
      salesInvoiceId,
      salesTransactionNumber,
      productId,
      quantityToReturn,
      calculatedQuantity,
      calculatedNetWeight,
      unitPrice,
    } = product;

    const salesInvoice = await SalesInvoice.findOne({
      where: { sales_invoice_id: salesInvoiceId },
      attributes: ["warehouse_id", "client_transaction_id", "total_amount"],
      transaction,
    });

    if (!salesInvoice) {
      await transaction.rollback();
      return res.status(404).json({ error: "Sales invoice not found" });
    }

    // Get the original stock management record to get the price, vendor_id, AND date_in
    const originalStockRecord = await StockManagement.findOne({
      where: {
        product_id: productId,
        warehouse_id: salesInvoice.warehouse_id,
        isDeleted: false,
      },
      attributes: ["price", "vendor_id", "date_in"],
      order: [["createdAt", "DESC"]],
      transaction,
    });

    // Validate return quantity doesn't exceed sold quantity
    const soldQuantity = await SalesInvoiceInventory.sum("quantity", {
      where: {
        sales_invoice_id: salesInvoiceId,
        "$stock_management.product_id$": productId,
        isDeleted: false,
      },
      include: [
        {
          model: StockManagement,
          attributes: [],
        },
      ],
      transaction,
    });

    if (quantityToReturn > soldQuantity) {
      await transaction.rollback();
      return res.status(409).json({
        error: "Return quantity exceeds sold quantity",
        soldQuantity,
      });
    }

    // Create new stock management record for returned items
    await StockManagement.create(
      {
        product_id: productId,
        warehouse_id: salesInvoice.warehouse_id,
        stock: quantityToReturn,
        in: quantityToReturn,
        price: originalStockRecord?.price || 0,
        price_in: originalStockRecord?.price || 0,
        vendor_id: originalStockRecord?.vendor_id || null,
        date_in: originalStockRecord?.date_in || new Date(),
        transaction_number: salesInvoice.client_transaction_id,
        module_in_from: "Backload Sales",
        isDeleted: false,
      },
      { transaction }
    );

    // Get the original net weight to calculate the return amount correctly
    const originalInvoiceItem = await SalesInvoiceInventory.findOne({
      include: [
        {
          model: StockManagement,
          where: {
            product_id: productId,
          },
          attributes: ["stock_management_id"],
        },
      ],
      where: {
        sales_invoice_id: salesInvoiceId,
        isDeleted: false,
      },
      transaction,
    });

    if (!originalInvoiceItem) {
      await transaction.rollback();
      return res.status(404).json({ error: "Original invoice item not found" });
    }

    // Calculate the amount to subtract from total (returned net weight × unit price)
    const originalNetWeight = originalInvoiceItem.net_weight;
    const returnNetWeight =
      quantityToReturn * (1 - (originalInvoiceItem.moisture || 0) / 100);
    const returnAmount = returnNetWeight * unitPrice;

    const newSubtotal = calculatedNetWeight * unitPrice;

    await SalesInvoiceInventory.update(
      {
        quantity: calculatedQuantity,
        net_weight: calculatedNetWeight,
        subtotal: newSubtotal,
      },
      {
        where: {
          id: originalInvoiceItem.id,
        },
        transaction,
      }
    );

    // Update the total_amount in sales_invoice table
    const newTotalAmount = salesInvoice.total_amount - returnAmount;

    await SalesInvoice.update(
      {
        total_amount: newTotalAmount,
      },
      {
        where: {
          sales_invoice_id: salesInvoiceId,
        },
        transaction,
      }
    );

    // Create sales journal entry for the return
    const updatedSalesInvoice = await SalesInvoice.findOne({
      where: { sales_invoice_id: salesInvoiceId },
      include: [
        {
          model: Currency,
          required: true,
          attributes: ["currency_name", "currency_rate"],
        },
      ],
      transaction,
    });

    // Get all remaining items to calculate total net quantity
    const remainingItems = await SalesInvoiceInventory.findAll({
      where: {
        sales_invoice_id: salesInvoiceId,
        isDeleted: false,
      },
      transaction,
    });

    const totalNetQuantity = remainingItems.reduce((sum, item) => {
      return sum + (item.net_weight || 0);
    }, 0);

    const totalUnitPrice = remainingItems.reduce((sum, item) => {
      return sum + (item.unit_price || 0);
    }, 0);

    const averageUnitPrice =
      remainingItems.length > 0 ? totalUnitPrice / remainingItems.length : 0;

    await SalesJournal.create(
      {
        customer_id: updatedSalesInvoice.customer_id,
        transaction_number: salesTransactionNumber,
        date: updatedSalesInvoice.invoice_date,
        total_amount: returnAmount,
        // total_quantity: returnNetWeight,
        total_quantity: quantityToReturn,
        avg_unit_price: unitPrice,
        payment_type: "Credit",
        currency_name: updatedSalesInvoice.currency.currency_name,
        currency_rate: updatedSalesInvoice.currency.currency_rate,
      },
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({ message: "Product returned successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error returning product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to validate cutoff before payment approval
router.route("/payment/:id/cutoff-validation").get(async (req, res) => {
  try {
    const { id } = req.params;

    // Get the payment record to find the payment date
    const payment = await BulkCollectionPayment.findOne({
      where: {
        id: id,
        isDeleted: false,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Check if cutoff exists for the payment date
    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: payment.date_issued },
          },
          {
            to: { [Op.gte]: payment.date_issued },
          },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    const isPosted = findCutoff?.isPosted || false;
    const cutoffExists = findCutoff;

    res.json({
      isPosted,
      cutoffExists,
      paymentDate: payment.date_issued,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
