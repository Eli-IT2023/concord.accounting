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
} = require("../db/models/associations");
const {
  accountlist_base_subject,
  accountlist_sub3,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");
const moment = require("moment-timezone");
const sequelize = require("../db/config/sequelize.config");

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
  const currentMonth = `${year}-${month}`;
  try {
    const lastPayCode = await SalesInvoice.findOne({
      where: {
        transaction_id: {
          [Op.like]: `SI-${currentMonth}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });
    let newRefCode;
    if (lastPayCode && lastPayCode.transaction_id) {
      const latestRefCode = lastPayCode.transaction_id;
      const refCodeParts = latestRefCode.split("-");
      if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
        const latestSequence = parseInt(refCodeParts[3], 10);
        const newSequence = String(latestSequence + 1).padStart(5, "0");
        newRefCode = `SI-${currentMonth}-${newSequence}`;
      } else {
        newRefCode = `SI-${currentMonth}-00001`;
      }
    } else {
      console.log("No matching records found, initializing new sequence.");
      newRefCode = `SI-${currentMonth}-00001`;
    }

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
      selectedCustomer,
      selectedMethod,
      selectedDueDate,
      selectedInvoiceDate,
      inputPaymentTerms,
      remarks,
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

    const removeComma = (num) => {
      return num ? parseFloat(String(num).replace(/,/g, "")) : 0;
    };

    const SalesData = await SalesInvoice.create({
      transaction_id: transactionId,
      customer_id: selectedCustomer,
      currency_id: selectedCurrency,
      payment_method: selectedMethod,
      due_date: selectedDueDate,
      invoice_date: selectedInvoiceDate,
      payment_terms: inputPaymentTerms,
      destination: selectedDestination,
      transaction_discount: transactionDiscount,
      item_discount: totalItemDiscount || 0,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      discount_type: transactionDiscountType,
      status: "Pending",
      remarks: remarks,
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
      });

      const stockItems = await StockManagement.findAll({
        where: { stock_management_id: item.stock_management_id },
      });

      // const inventoryReport = await Inventory_Report.create({
      //   // cut_off_id
      //   product_id: item.product_id,
      //   average_price: item.averagePrice,
      //   product_out: item.quantity,
      //   unit_price: item.unitPrice,
      // });

      let remainingQuantity = item.quantity;

      const totalStock = stockItems.reduce(
        (sum, stockItem) => sum + stockItem.stock,
        0
      );

      if (totalStock < remainingQuantity) {
        return res.status(205).json({
          message: `Insufficient stock for stock managament ID: ${item.stock_management_id}`,
        });
      }

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
      selectedCustomer,
      selectedCurrency,
      selectedMethod,
      selectedDueDate,
      selectedInvoiceDate,
      inputPaymentTerms,
      remarks,
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
        },
      }
    );

    if (isUpdate) {
      const existingProducts = await SalesInvoiceInventory.findAll({
        where: { sales_invoice_id: id },
      });

      // Add back the stock for each existing product
      for (const existingProduct of existingProducts) {
        const stockItems = await StockManagement.findAll({
          where: { stock_management_id: existingProduct.stock_management_id },
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
        let quantityToDeduct = item.quantity;

        // Get all stock entries for the product
        const stockItems = await StockManagement.findAll({
          where: { product_id: item.product_id },
          order: [["stock", "DESC"]], // Prioritize stocks with more quantity
        });

        let salesEntries = [];

        for (const stock of stockItems) {
          if (quantityToDeduct === 0) break; // Stop when fully deducted

          let usedQuantity = 0;

          if (stock.stock >= quantityToDeduct) {
            usedQuantity = quantityToDeduct;
            stock.stock -= quantityToDeduct;
            quantityToDeduct = 0;
          } else {
            usedQuantity = stock.stock;
            quantityToDeduct -= stock.stock;
            stock.stock = 0;
          }

          await stock.save();

          console.log(item.moisture, "moisture===========");

          // Store the used stock details for bulk insertion
          salesEntries.push({
            sales_invoice_id: id,
            stock_management_id: stock.stock_management_id, // Use actual stock source
            unit_price: item.unitPrice || 0,
            discount_item: item.discount || 0,
            quantity: usedQuantity,
            moisture: item.moisture == "0" ? 0 : item.moisture,
            net_weight: item.netWeight,
            subtotal: item.subtotal * (usedQuantity / item.quantity), // Adjust subtotal proportionally
            discount_type: item.discountType || "",
            average_price: item.averagePrice || 0,
            sales_profit: item.salesProfit || 0,
          });
        }

        if (quantityToDeduct > 0) {
          console.log(`Not enough stock for Product ID: ${item.product_id}`);
          continue;
        }

        await SalesInvoiceInventory.bulkCreate(salesEntries);
      }

      const getCustomer = await Customer.findOne({
        where: {
          customer_id: selectedCustomer,
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
        { isDeleted: true },
        { where: { sales_invoice_id: id } }
      );

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

router.route("/approveRejectInvoice").post(async (req, res) => {
  try {
    const {
      id,
      status,
      selectedInvoiceDate,
      userLoggedID,
      shipmentFee,
      items,
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
      },
    });

    const {
      from: dateFrom,
      to: dateTo,
      isPosted: postedCutoff,
      name: CutoffName,
    } = getCutoff;

    const getInvoice = await SalesInvoice.findOne({
      where: { sales_invoice_id: id },
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
      },
      {
        where: {
          sales_invoice_id: id,
        },
      }
    );

    if (status == "Approved") {
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
        const inventoryReport = await Inventory_Report.create({
          product_id: item.productId,
          average_price: item.averagePrice,
          product_out: item.quantity,
          unit_price: item.unitPrice,
        });
      }
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
      where: {
        sales_invoice_id: req.query.id,
      },
      include: [
        {
          model: Customer,
          required: true,
        },
        {
          model: Currency,
          required: true,
        },
      ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: data.invoice_date },
          },
          {
            to: { [Op.gte]: data.invoice_date },
          },
        ],
      },
    });

    const isPosted = findCutoff.isPosted;

    const productTag = await SalesInvoiceInventory.findAll({
      where: {
        sales_invoice_id: req.query.id,
      },
      include: [
        {
          model: StockManagement,
          required: true,
          include: [
            {
              model: ProductList,
              required: true,
            },
          ],
        },
      ],
    });

    if (!data) {
      return res.status(204).json();
    }

    // const productIds = productTag.map((inv) => inv.product_id);

    // // Fetch all stock records for these product IDs from StockManagement
    // const stockRecords = await StockManagement.findAll({
    //   where: { product_id: productIds }, // Fetch all related stocks
    // });

    // // Manually sum the stock for each product_id
    // const stockLookup = {};
    // stockRecords.forEach((record) => {
    //   const productId = record.product_id;
    //   if (stockLookup[productId]) {
    //     stockLookup[productId] += record.stock;
    //   } else {
    //     stockLookup[productId] = record.stock;
    //   }
    // });

    // // Aggregate the invoice data with the summed stock values
    // const aggregatedData = {};

    // productTag.forEach((inv) => {
    //   const productId = inv.product_id;

    //   if (!aggregatedData[productId]) {
    //     aggregatedData[productId] = {
    //       stock_management_id: inv.stock_management_id,
    //       product_id: inv.stock_management.product_id,
    //       product_code: inv.stock_management.product_list.product_code,
    //       product_name: inv.stock_management.product_list.product_name,
    //       average_price: inv.average_price,
    //       sales_profit: inv.sales_profit,
    //       discount_item: inv.discount_item,
    //       subtotal: inv.subtotal,
    //       discount_type: inv.discount_type,
    //       total_stock: stockLookup[productId] || 0,
    //       unit_price: inv.unit_price,
    //       quantity: inv.quantity,
    //     };
    //   }
    // });

    // // Convert aggregated data into an array for the response
    // const result = Object.values(aggregatedData).map((product) => ({
    //   stock_management_id: product.stock_management_id,
    //   product_id: product.product_id,
    //   product_code: product.product_code,
    //   product_name: product.product_name,
    //   remaining: product.total_stock, // Summed stock
    //   average_price: product.average_price,
    //   sales_profit: product.sales_profit,
    //   discount_item: product.discount_item,
    //   unit_price: product.unit_price,
    //   subtotal: product.subtotal,
    //   discount_type: product.discount_type,
    //   quantity: product.quantity,
    // }));

    const productIds = productTag
      ?.map((inv) => inv.stock_management?.product_id)
      .filter(Boolean);

    const stockRecords = await StockManagement.findAll({
      where: { product_id: productIds },
    });

    const stockLookup = {};
    stockRecords.forEach((record) => {
      const productId = record.product_id;
      stockLookup[productId] = (stockLookup[productId] || 0) + record.stock; // Ensure summation
    });

    const aggregatedData = {};
    productTag.forEach((inv) => {
      const productId = inv.stock_management?.product_id;
      if (!productId) {
        console.log("No product_id found for this entry:", inv);
        return;
      }

      if (!aggregatedData[productId]) {
        aggregatedData[productId] = {
          stock_management_id: inv.stock_management_id,
          product_id: productId,
          product_code: inv.stock_management.product_list?.product_code || "",
          product_name: inv.stock_management.product_list?.product_name || "",
          average_price: inv.average_price,
          sales_profit: inv.sales_profit,
          discount_item: inv.discount_item,
          subtotal: inv.subtotal,
          discount_type: inv.discount_type,
          unit_price: inv.unit_price,
          quantity: inv.quantity,
          moisture: inv.moisture,
          net_weight: inv.net_weight,
          total_stock: stockLookup[productId] || 0,
        };
      } else {
        aggregatedData[productId].quantity += inv.quantity;
        aggregatedData[productId].subtotal += inv.subtotal;
        aggregatedData[productId].total_stock = stockLookup[productId] || 0;
      }
    });

    const result = Object.values(aggregatedData).map((product) => ({
      stock_management_id: product.stock_management_id,
      product_id: product.product_id,
      product_code: product.product_code,
      product_name: product.product_name,
      remaining: product.total_stock,
      average_price: product.average_price,
      sales_profit: product.sales_profit,
      discount_item: product.discount_item,
      unit_price: product.unit_price,
      subtotal: product.subtotal,
      discount_type: product.discount_type,
      quantity: product.quantity,
      moisture: product.moisture,
      net_weight: product.net_weight,
    }));

    return res.json({ data, result, isPosted });
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

//for creating sales invoice sa pag-select ng mga product
router.route("/getProductInventoryInvoice").get(async (req, res) => {
  try {
    const { warehouse_id } = req.query;

    const whereCondition = {
      // stock: {
      //   [Op.ne]: 0,
      // },
    };

    if (warehouse_id) {
      whereCondition.warehouse_id = warehouse_id;
    }

    const data = await StockManagement.findAll({
      include: [
        {
          model: ProductList,
          required: true,
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
    const { startDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: lastCutoffReceivableQuery } =
      await SalesInvoice.findAndCountAll({
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

router.route("/getSalesData").get(async (req, res) => {
  try {
    const { startDate, endDate, filterColumn, searchTerm } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let salesInvoiceWhereClause = {
      invoice_date: {
        [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
      },
    };
    let customerWhereClause = {};
    let currencyWhereClause = {};
    const salesInvoiceTableColumn = [
      "transaction_id",
      "destination",
      "invoice_date",
      "total_amount",
      "status",
      "container_number",
      "pier",
    ];

    if (searchTerm && searchTerm.trim() !== "") {
      switch (filterColumn) {
        case "transaction_id":
          salesInvoiceWhereClause["transaction_id"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "destination":
          salesInvoiceWhereClause["destination"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "customer":
          customerWhereClause = sequelize.where(
            fn("CONCAT", col("first_name"), " ", col("last_name")),
            {
              [Op.like]: `%${searchTerm}%`,
            }
          );
          break;
        case "invoice_date":
          salesInvoiceWhereClause = {
            [Op.and]: [
              {
                invoice_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              sequelize.where(literal(`CAST (invoice_date AS CHAR)`), {
                [Op.like]: `%${searchTerm}%`,
              }),
            ],
          };
          break;
        case "currency":
          currencyWhereClause["currency_name"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;
        case "totalAmount":
          salesInvoiceWhereClause = {
            [Op.and]: [
              {
                invoice_date: {
                  [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                },
              },
              sequelize.where(literal(`CAST (total_amount AS CHAR)`), {
                [Op.like]: `%${searchTerm}%`,
              }),
            ],
          };
          break;
        case "status":
          salesInvoiceWhereClause["status"] = {
            [Op.like]: `%${searchTerm}%`,
          };
          break;

        default:
          if (filterColumn !== "due_date") {
            salesInvoiceWhereClause = {
              [Op.and]: [
                {
                  invoice_date: {
                    [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
                  },
                },
                {
                  [Op.or]: salesInvoiceTableColumn.map((col) => {
                    if (col === "invoice_date" || col === "total_amount") {
                      return sequelize.where(literal(`CAST (${col} AS CHAR)`), {
                        [Op.like]: `%${searchTerm}%`,
                      });
                    } else if (
                      ["container_number", "pier"].includes(col) &&
                      searchTerm.toLowerCase() == "n/a"
                    ) {
                      return {
                        [col]: null,
                      };
                    } else {
                      return {
                        [col]: {
                          [Op.like]: `%${searchTerm}%`,
                        },
                      };
                    }
                  }),
                },
              ],
            };
          }
          break;
      }
    }

    async function filteredData() {
      const { count, rows: data } = await SalesInvoice.findAndCountAll({
        include: [
          {
            model: Currency,
            required: true,
            where: currencyWhereClause,
          },
          {
            model: Customer,
            required: true,
            where: customerWhereClause,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        where: { ...salesInvoiceWhereClause, isDeleted: false },
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
        const amountInBaseCurrency = value.total_amount * value.rate;
        return total + amountInBaseCurrency;
        // return total + value.total_amount;
      }, 0);

    const currentSalesTotal = data
      .filter((item) => {
        return item.status === "Approved" || item.status === "Collected";
      })
      .reduce((total, value) => {
        const amountInBaseCurrency = value.total_amount * value.rate;
        return total + amountInBaseCurrency;
        // return total + value.total_amount;
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

    const countedIds = new Set();

    const totalCollection = bulkCollectionPayment
      .filter((item) => item.status === "Approved")
      .reduce((total, value) => {
        const amount =
          value.bulk_collection.bulk_collection_transactions.reduce(
            (subtotal, transaction) => {
              const id = transaction.sales_invoice?.transaction_id;
              const salesInvoiceRate = transaction.sales_invoice?.rate || 1;
              const salesInvoiceAmount =
                transaction.sales_invoice?.total_amount;

              // Check if the ID has already been counted
              if (id && !countedIds.has(id)) {
                countedIds.add(id); // Add ID to the Set
                const transactionTotal = salesInvoiceRate * salesInvoiceAmount;
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
        const amountInBaseCurrency = value.total_amount * value.rate;
        return total + amountInBaseCurrency;
        // return total + parseFloat(value.total_amount);
      }, 0);

    // Filter for Due Date
    if (filterColumn === "due_date") {
      const filterForDueDate = data.filter((item) => {
        const modifiedDueDate = `In ${item.daysDifference} Day(s)`;
        return modifiedDueDate.toLowerCase().includes(searchTerm.toLowerCase());
      });

      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page || 1),
        data: {
          data: filterForDueDate,
          lastCutoffReceivable,
          currentSalesTotal,
          currentTotalDiscount,
          totalCollection,
          currentCutoffReceivable,
        },
      });
    }

    if (data.length === 0 && filterColumn === "all") {
      const customerCurrency = ["customer", "currency", "due_date"];

      for (const item of customerCurrency) {
        salesInvoiceWhereClause = {
          invoice_date: {
            [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
          },
        };
        customerWhereClause = {};
        currencyWhereClause = {};

        if (item === "customer") {
          // Handle Filter Customer
          customerWhereClause = sequelize.where(
            fn("CONCAT", col("first_name"), " ", col("last_name")),
            {
              [Op.like]: `%${searchTerm}%`,
            }
          );
        } else if (item === "currency") {
          // Handle Filter Currency
          currencyWhereClause["currency_name"] = {
            [Op.like]: `%${searchTerm}%`,
          };
        } else {
          // Handle Filter Due Date
          let { count, data } = await filteredData();
          data = data?.map((item) => {
            const calculateDaysDifference = (startDate, endDate) => {
              const start = new Date(startDate);
              const end = new Date(endDate);
              const timeDifference = end.getTime() - start.getTime();
              const daysDifference = Math.ceil(
                timeDifference / (1000 * 3600 * 24)
              );
              return daysDifference.toString();
            };

            return {
              ...item.toJSON(),
              daysDifference: calculateDaysDifference(
                item.createdAt,
                item.due_date
              ),
            };
          });
          const filterForDueDate = data?.filter((item) => {
            const modifiedDueDate = `In ${item.daysDifference} Day(s)`;
            return modifiedDueDate
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          });

          return res.status(200).json({
            totalItems: 0,
            totalPages: Math.ceil(0 / limit),
            currentPage: parseInt(page || 1),
            data: {
              data: filterForDueDate,
              lastCutoffReceivable,
              currentSalesTotal,
              currentTotalDiscount,
              totalCollection,
              currentCutoffReceivable,
            },
          });
        }

        let { count, data } = await filteredData();

        if (data.length > 0) {
          return res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || 1),
            data: {
              data,
              lastCutoffReceivable,
              currentSalesTotal,
              currentTotalDiscount,
              totalCollection,
              currentCutoffReceivable,
            },
          });
        }
      }
    }

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: {
        data,
        lastCutoffReceivable,
        currentSalesTotal,
        currentTotalDiscount,
        totalCollection,
        currentCutoffReceivable,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
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

module.exports = router;
