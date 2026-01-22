const express = require("express");
const { Op, Sequelize, col, literal, where } = require("sequelize");
const router = express.Router();

const {
  ProductList,
  Product_Tag_Vendor,
  Vendors,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Activity_Log,
  PurchaseRequest,
  PurchaseRequestOrderItem,
  TaxSettings,
  PurchaseOrder,
  PurchaseOrderVendorProduct,
  Receiving,
  Packaging,
  CompanyProfile,
  TaxReport,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment");
const nodemailer = require("nodemailer");
const emailConfig = require("../../../db/config/mailer.config");
const session = require("express-session");
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// create PO
router.post("/createPO", async (req, res) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    console.log("Incoming PO Data:", JSON.stringify(req.body, null, 2)); // Debug log

    const { poData, productTotals } = req.body;

    if (!Array.isArray(poData)) {
      throw new Error("Invalid format: 'poData' should be an array");
    }

    // First update PurchaseRequestOrderItems
    if (productTotals && productTotals.length > 0) {
      console.log("Updating PurchaseRequestOrderItems...");

      for (const product of productTotals) {
        const { productId, prId, orderedQuantity } = product;

        if (!productId || !prId || typeof orderedQuantity !== "number") {
          console.error("Invalid product data:", product);
          continue;
        }

        console.log(
          `Fetching current item for product ${productId} in PR ${prId}...`
        );

        // Fetch current PurchaseRequestOrderItem
        const existingItem = await PurchaseRequestOrderItem.findOne({
          where: {
            product_id: productId,
            pr_id: prId,
          },
          transaction: t,
        });

        if (!existingItem) {
          console.warn(
            `Item not found for product_id: ${productId}, pr_id: ${prId}`
          );
          continue;
        }

        const currentNewQuantity = parseFloat(existingItem.new_quantity) || 0;
        const originalQuantity = parseFloat(existingItem.quantity) || 0;
        const totalOrdered = currentNewQuantity + orderedQuantity;

        let status = "Pending";
        if (totalOrdered >= originalQuantity) {
          status = "Ordered";
        } else if (totalOrdered > 0 && totalOrdered < originalQuantity) {
          status = "Partial Order";
        }

        console.log(
          `Updating item: product_id=${productId}, pr_id=${prId}, totalOrdered=${totalOrdered}, original=${originalQuantity}, status=${status}`
        );

        await PurchaseRequestOrderItem.update(
          {
            new_quantity: totalOrdered,
            status: status,
            updatedAt: new Date(),
          },
          {
            where: {
              product_id: productId,
              pr_id: prId,
            },
            transaction: t,
          }
        );
      }
    }

    // Then process the POs
    for (const [index, po] of poData.entries()) {
      console.log(`Processing PO ${index + 1}/${poData.length}`);

      // Validate required fields
      if (!po.products || !Array.isArray(po.products)) {
        throw new Error(`PO ${index} has invalid products array`);
      }

      const requiredFields = [
        "poNumber",
        "vendorId",
        "vendorName",
        "deliveryDate",
        "products",
        "preparedBy",
        "prId",
      ];

      for (const field of requiredFields) {
        if (!po[field]) {
          throw new Error(`Missing required field ${field} in PO ${index}`);
        }
      }

      const {
        poNumber,
        vendorId,
        vendorName,
        vendorAddress,
        deliveryDate,
        purchaseOrderDate,
        withholdingTaxId,
        withholdingTaxRate,
        shippingMethod,
        paymentTerm,
        shipTo,
        vatRate,
        subtotal,
        vatAmount,
        withholdingTax,
        total,
        products,
        preparedBy,
        prId,
      } = po;

      let poStatus = "For-Approval";
      let paymentStatus = "Unpaid";

      // 1. Create Purchase Order
      console.log(`Creating PO ${poNumber}...`);
      const purchaseOrder = await PurchaseOrder.create(
        {
          vendor_id: vendorId,
          pr_id: prId,
          warehouse_id: shipTo,
          tax_id: withholdingTaxId,
          po_number: poNumber,
          delivery_date: deliveryDate,
          po_date: purchaseOrderDate || new Date(),
          shipping_method: shippingMethod,
          payment_term: paymentTerm,
          tax_rate: withholdingTaxRate,
          vat_rate: vatRate,
          subtotal: subtotal,
          vat_amount: vatAmount,
          tax_amount: withholdingTax,
          total_amount: total,
          status: poStatus,
          preparedBy: preparedBy,
          payment_status: paymentStatus,
        },
        { transaction: t }
      );

      // 2. Create Products for this PO
      console.log(`Adding ${products.length} products to PO ${poNumber}...`);
      for (const product of products) {
        if (!product.productId) {
          console.error("Product missing ID:", product);
          throw new Error("Product missing required ID field");
        }

        const { productId, productOriginalQuantity, quantity, price, remarks } =
          product;
        const productTotal = price * quantity;

        // get the po order items to get the unit_quantity
        const getOrderItems = await PurchaseRequestOrderItem.findOne({
          where: {
            pr_id: prId,
            product_id: productId,
          },
          transaction: t,
        });

        if (!getOrderItems) {
          throw new Error(`Order item not found for product ID: ${productId}`);
        }

        await PurchaseOrderVendorProduct.create(
          {
            po_id: purchaseOrder.id,
            pr_id: prId,
            product_id: productId,
            original_quantity: productOriginalQuantity,
            quantity,
            unit_quantity: getOrderItems.unit_quantity,
            price,
            total: productTotal,
            remarks,
          },
          { transaction: t }
        );
      }

      // 3. Log the PO creation
      await Activity_Log.create(
        {
          action_taken: `Created Purchase Order ${poNumber} for Vendor ${vendorName}`,
          masterlist_id: preparedBy,
        },
        { transaction: t }
      );

      // 4. Update PurchaseRequest to mark isPO as 1
      await PurchaseRequest.update(
        {
          isPO: 1,
          preparedBy: preparedBy,
        },
        {
          where: { id: prId },
          transaction: t,
        }
      );

      // for tax report
      if (withholdingTaxId) {
        const transaction_amount = subtotal + vatAmount;
        const findTax = await TaxSettings.findOne({
          where: { id: withholdingTaxId },
          transaction: t,
        });

        const createTaxReport = await TaxReport.create(
          {
            module_id: purchaseOrder.id,
            module_name: "Purchase Order",
            transaction_number: poNumber,
            transaction_user: vendorId,
            tax_id: withholdingTaxId,
            tax_name: findTax ? findTax.name : null,
            tax_rate: findTax ? findTax.rate : null,
            tax_type: findTax ? findTax.applicability : null,
            transaction_amount: transaction_amount,
            tax_amount: withholdingTax,
            transaction_date: purchaseOrderDate || new Date(),
            transaction_status: "Unpaid",
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    console.log("Transaction committed successfully");

    res.status(200).json({
      success: true,
      message: "Purchase Orders created successfully",
      data: poData,
    });
  } catch (error) {
    await t.rollback();
    console.error("Transaction rolled back due to error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create Purchase Orders",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      details: {
        receivedData: req.body,
        errorType: error.name,
      },
    });
  }
});

// pr list view
router.route("/prRequestList/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: { id },
      include: [
        {
          model: MasterList,
          as: "prepared_by",
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("fname"),
                " ",
                sequelize.col("lname")
              ),
              "full_name",
            ],
          ],
        },
      ],
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: "Purchase request not found",
      });
    }

    const formattedData = purchaseRequest.get({ plain: true });

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching purchase request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch product for table
// get product list data for update/view with pagination
router.route("/getOrderListData/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // console.log(`[GET] Fetching order items for Purchase Request ID: ${id}`);
    // console.log(
    //   `Pagination - Page: ${page}, Limit: ${limit}, Offset: ${offset}`
    // );

    const { count, rows } = await PurchaseRequestOrderItem.findAndCountAll({
      where: { pr_id: id, isDeleted: false },
      include: [
        {
          model: ProductList,
          as: "product_list",
          attributes: ["product_id", "product_code", "product_name"],
          required: true,
        },
      ],
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
    });

    // console.log(
    //   `Found ${count} total order items (showing ${rows.length}) for PR ID ${id}:`
    // );

    const formattedData = rows.map((item) => {
      const plainItem = item.get({ plain: true });

      if (!plainItem.product_list) {
        console.error(`Product details missing for item ${plainItem.id}`);
        throw new Error(`Product details missing for item ${plainItem.id}`);
      }

      return {
        id: plainItem.id,
        product_code: plainItem.product_list.product_code,
        product_name: plainItem.product_list.product_name,
        quantity: plainItem.quantity,
        new_quantity: plainItem.new_quantity,
        remarks: plainItem.remarks,
        status: plainItem.status,
        product_id: plainItem.product_list.product_id,
      };
    });

    // console.log(
    //   "Sample formatted item:",
    //   formattedData.length > 0 ? formattedData[0] : "No items"
    // );

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: formattedData,
    });
  } catch (error) {
    console.error("\n[ERROR] Fetching order items failed:");
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order items",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// fetch po card
router.route("/getPurchaseOrderCards/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(`Fetching purchase order cards for PR ID: ${id}`);

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { pr_id: id },
      include: [
        // Include Vendor data
        {
          model: Vendors,
          as: "po_vendor",
          attributes: [
            "id",
            "fname",
            "lname",
            "company_name",
            "company_address",
            "vat",
          ],
        },
        // Include PreparedBy user data
        {
          model: MasterList,
          as: "po_prepared",
          attributes: ["id", "fname", "lname"],
        },
        // Include Tax data
        {
          model: TaxSettings,
          as: "po_tax_id",
          attributes: ["id", "name", "rate"],
        },
        // Include Warehouse data
        {
          model: Warehouse,
          as: "po_warehouse_id",
          attributes: ["warehouse_id", "name"],
        },
        // Include Products
        {
          model: PurchaseOrderVendorProduct,
          as: "po_order_item",
          include: [
            {
              model: ProductList,
              as: "po_vendor_product_id",
              attributes: ["product_id", "product_code", "product_name"],
              include: [
                {
                  model: Packaging,
                  as: "prod_packaging",
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          { model: PurchaseOrderVendorProduct, as: "po_order_item" },
          "createdAt",
          "DESC",
        ],
      ],
      // order: [["createdAt", "ASC"]],
    });

    // // Log the raw output for debugging
    // console.log(
    //   "Raw purchase order data:",
    //   JSON.stringify(purchaseOrders, null, 2)
    // );

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return res.status(404).json({
        success: false,
        // message: "No purchase orders found for this PR",
      });
    }

    // Format the response data
    const formattedData = purchaseOrders.map((po) => {
      const plainPo = po.get({ plain: true });

      let vendorName = "";
      if (plainPo.po_vendor) {
        const individualName = `${plainPo.po_vendor.fname || ""} ${
          plainPo.po_vendor.lname || ""
        }`.trim();
        vendorName = individualName || plainPo.po_vendor.company_name;
      }

      let preparedByName = "";
      if (plainPo.po_prepared) {
        preparedByName = `${plainPo.po_prepared.fname} ${plainPo.po_prepared.lname}`;
      }

      const products = (plainPo.po_order_item || []).map((item) => {
        const product = item.po_vendor_product_id || {};
        const uom = product.prod_packaging || {};

        // Get unit_quantity from PurchaseOrderVendorProduct (not from packaging)
        const unit_quantity = parseFloat(item.unit_quantity) || 1;

        // Format UOM string
        const uomString = uom.packaging_name
          ? `${uom.packaging_name} - (${uom.unit_quantity || ""}${
              uom.unit || ""
            })`
          : "";

        return {
          id: item.id,
          product_id: product.product_id,
          product_code: product.product_code,
          product_name: product.product_name,
          uom: uomString,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          remarks: item.remarks,
          original_quantity: item.original_quantity,
          unit_quantity: unit_quantity,
        };
      });

      return {
        id: plainPo.id,
        po_number: plainPo.po_number,
        vendor_id: plainPo.vendor_id,
        vendor_name: vendorName,
        vendor_address: plainPo.po_vendor?.company_address,
        vat_rate: plainPo.vat_rate || 0,
        delivery_date: plainPo.delivery_date,
        po_date: plainPo.po_date,
        shipping_method: plainPo.shipping_method,
        payment_term: plainPo.payment_term,
        prepared_by: preparedByName,
        withholding_tax_id: plainPo.tax_id,
        withholding_tax_name: plainPo.po_tax_id?.name || "",
        withholding_tax_rate: plainPo.tax_rate || 0,
        subtotal: plainPo.subtotal,
        vat_amount: plainPo.vat_amount,
        withholding_tax: plainPo.tax_amount,
        total_amount: plainPo.total_amount,
        status: plainPo.status,
        products,
        createdAt: plainPo.createdAt,
      };
    });

    // console.log(
    //   "Formatted purchase order data:",
    //   JSON.stringify(formattedData, null, 2)
    // );

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching purchase order cards:", error);
    return res.status(500).json({
      success: false,
    });
  }
});

router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: {
        isDeleted: 0,
      },
      include: [
        {
          model: Vendors,
          as: "po_vendor",
        },
        {
          model: PurchaseRequest,
          as: "po_pr_id",
          include: [
            {
              model: MasterList,
              as: "requestor",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// pdf view po
router.route("/getVendorPO/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const getVendor = await PurchaseOrder.findAll({
      where: {
        isDeleted: 0,
        id,
      },
      include: [
        {
          model: Vendors,
          as: "po_vendor",
        },
        {
          model: PurchaseRequest,
          as: "po_pr_id",
          include: [
            {
              model: MasterList,
              as: "requestor",
            },
          ],
        },
        {
          model: MasterList,
          as: "po_prepared",
        },
        {
          model: MasterList,
          as: "po_approver",
        },
        {
          model: Warehouse,
          as: "po_warehouse_id",
        },
      ],
    });

    if (getVendor) {
      return res.status(200).json(getVendor);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/getVendorProduct/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const vendorProduct = await PurchaseOrderVendorProduct.findAll({
      where: {
        po_id: id,
      },
      include: [
        {
          model: ProductList,
          as: "po_vendor_product_id", // match your alias
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [
        [
          { model: ProductList, as: "po_vendor_product_id" },
          "product_name",
          "ASC",
        ],
      ],
    });

    if (vendorProduct) {
      return res.status(200).json(vendorProduct);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// approve PO
router.route("/approvePO/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a transaction
  try {
    const { id } = req.params;
    const { userLoggedID, approveRemarks } = req.body;

    // 1. First update the current PO status to Approved
    const [updatedCount] = await PurchaseOrder.update(
      {
        status: "Approved",
        approvedBy: userLoggedID,
        approveRemarks,
        approvedAt: new Date(),
      },
      {
        where: { id },
        transaction,
      }
    );

    if (updatedCount === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    // 2. Get the updated PO to find its related PR
    const updatedPO = await PurchaseOrder.findOne({
      where: { id },
      include: [
        {
          model: PurchaseRequest,
          as: "po_pr_id",
        },
      ],
      transaction,
    });

    // 3. Get all Uncacalled POs related to the same PR
    const allUncancelledPOs = await PurchaseOrder.findAll({
      where: {
        "$po_pr_id.id$": updatedPO.po_pr_id.id,
        status: { [Op.ne]: "Cancelled" },
      },
      include: [
        {
          model: PurchaseRequest,
          as: "po_pr_id",
          attributes: [],
        },
      ],
      transaction,
    });

    // 4. Check if all POs are now approved
    const allApproved = allUncancelledPOs.every(
      (po) => po.status === "Approved"
    );

    if (allApproved) {
      console.log("All POs for PR", updatedPO.po_pr_id.id, "are now approved!");

      // 5. Get all PurchaseRequestOrderItems for this PR
      const allOrderItems = await PurchaseRequestOrderItem.findAll({
        where: { pr_id: updatedPO.po_pr_id.id },
        transaction,
      });

      // 6. Check if all order items are 'Ordered'
      const allItemsOrdered = allOrderItems.every(
        (item) => item.status === "Ordered"
      );

      if (allItemsOrdered) {
        console.log("All items ordered - updating PR status to Completed");

        // 7. Update PurchaseRequest status to Completed
        await PurchaseRequest.update(
          { status: "Completed" },
          {
            where: { id: updatedPO.po_pr_id.id },
            transaction,
          }
        );
      }
    }

    // 8. add receiving
    await Receiving.create(
      {
        po_id: id,
        status: "For-Receiving",
      },
      { transaction }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Purchase Order with ID of ${id} has been approved`,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Purchase Order approved successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Approval error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve Purchase Order",
      error: error.message,
    });
  }
});

// reject PO
router.route("/rejectPO/:id").put(async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { id } = req.params;
    const { userLoggedID, rejectRemarks } = req.body;

    // First fetch the purchase order with vendor products
    const purchaseOrder = await PurchaseOrder.findOne({
      where: { id },
      include: [
        {
          model: PurchaseOrderVendorProduct,
          as: "po_order_item",
        },
      ],
      transaction,
    });

    if (!purchaseOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    }

    const poOrderItems = purchaseOrder.po_order_item;

    // Process each vendor product
    for (const vendorProduct of poOrderItems) {
      // console.log(`Vendor Product ID:`, vendorProduct.id);
      // console.log("Product ID:", vendorProduct.product_id);
      // console.log("PO Quantity:", vendorProduct.quantity);

      // Now fetch the associated purchase request order item for this product
      const requestOrderItem = await PurchaseRequestOrderItem.findOne({
        where: {
          product_id: vendorProduct.product_id,
          // Add any other necessary conditions to match the correct record
          // For example: purchase_request_id: someValue
        },
        transaction,
      });

      if (!requestOrderItem) {
        console.warn(
          `No request order item found for product ${vendorProduct.product_id}`
        );
        continue;
      }

      // console.log("Current New Quantity:", requestOrderItem.new_quantity);

      // Calculate the new quantity
      const updatedQuantity =
        requestOrderItem.new_quantity - vendorProduct.quantity;

      let newStatus;

      if (updatedQuantity <= 0) {
        newStatus = "In Progress";
      } else if (updatedQuantity >= requestOrderItem.quantity) {
        newStatus = "Ordered";
      } else {
        newStatus = "Partial Order";
      }

      // Update the purchase request order item
      await requestOrderItem.update(
        {
          new_quantity: updatedQuantity,
          status: newStatus,
        },
        { transaction }
      );
    }

    // Update the purchase order status
    const updatedCount = await PurchaseOrder.update(
      {
        status: "Declined",
        rejectedBy: userLoggedID,
        rejectRemarks,
        rejectedAt: new Date(),
      },
      {
        where: { id },
        transaction,
      }
    );

    if (updatedCount[0] > 0) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Purchase Order with ID of ${id} has been declined`,
      });

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Purchase Order declined successfully",
        data: purchaseOrder,
      });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Reject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject Purchase Order",
      error: error.message,
    });
  }
});

// filter
router.route("/getVendor/").get(async (req, res) => {
  try {
    const vendors = await Vendors.findAll({
      where: {
        status: "Active",
      },
    });

    return res.status(200).json({
      success: true,
      data: vendors, // Send the actual array of vendors
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendors",
    });
  }
});

router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterVendor, filterStatus, filterPaymentStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the where clause dynamically
    const whereClause = { isDeleted: 0 };

    if (filterVendor && filterVendor !== "All") {
      whereClause.vendor_id = filterVendor;
    }

    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    if (filterPaymentStatus && filterPaymentStatus !== "All") {
      whereClause.payment_status = filterPaymentStatus;
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      include: [
        {
          model: Vendors,
          as: "po_vendor",
          attributes: ["id", "fname", "lname", "company_name"],
        },
        {
          model: PurchaseRequest,
          as: "po_pr_id",
          include: [
            {
              model: MasterList,
              as: "requestor",
              attributes: ["id", "fname", "lname"], // Use correct column name
            },
          ],
        },
        {
          model: MasterList,
          as: "po_prepared",
          attributes: ["id", "fname", "lname"], // Use correct column name
        },
        {
          model: MasterList,
          as: "po_approver",
          attributes: ["id", "fname", "lname"], // Use correct column name
        },
        {
          model: Warehouse,
          as: "po_warehouse_id",
          attributes: ["warehouse_id", "name"],
        },
      ],
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows,
      filters: {
        vendor: filterVendor,
        status: filterStatus,
        payment_status: filterPaymentStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              sql: error.sql,
            }
          : undefined,
    });
  }
});

// search fetch
router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = { isDeleted: 0 };

    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    const include = [
      {
        model: Vendors,
        as: "po_vendor",
        attributes: ["id", "fname", "lname", "company_name"],
      },
      {
        model: PurchaseRequest,
        as: "po_pr_id",
        include: [
          {
            model: MasterList,
            as: "requestor",
            attributes: ["id", "fname", "lname"],
          },
        ],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (filterColumn !== "all") {
        switch (filterColumn) {
          case "id":
          case "po_number":
            whereClause.po_number = { [Op.like]: `%${text}%` };
            break;

          case "pr_no":
            include[1].where = { pr_no: { [Op.like]: `%${text}%` } };
            break;

          case "requestedBy":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.literal(
                `CONCAT(\`po_pr_id->requestor\`.fname, ' ', \`po_pr_id->requestor\`.lname)`
              ),
              {
                [Op.like]: `%${text}%`,
              }
            );
            break;

          case "date_needed":
            whereClause[Op.and] = Sequelize.where(
              Sequelize.literal(
                `DATE_FORMAT(\`po_pr_id\`.date_needed, '%M %d, %Y')`
              ),
              {
                [Op.like]: `%${text}%`,
              }
            );
            break;
          case "net_payable":
            // Handle numeric search for net payable (total_amount)
            const cleanText = text.replace(/,/g, "");
            const searchNumber = parseFloat(cleanText);

            if (!isNaN(searchNumber)) {
              // If input ends with comma (like "120,"), search for numbers starting with those digits
              if (text.endsWith(",")) {
                whereClause.total_amount = {
                  [Op.gte]: searchNumber,
                  [Op.lt]: searchNumber + 1,
                };
              }
              // If input is a complete number (with or without commas)
              else {
                whereClause.total_amount = {
                  [Op.between]: [searchNumber - 0.0001, searchNumber + 0.0001],
                };
              }
            } else {
              // Fallback to more flexible string search options
              whereClause[Op.or] = [
                // Search the raw numeric value (handles cases like "120" matching 120000)
                Sequelize.where(
                  Sequelize.fn(
                    "REPLACE",
                    Sequelize.fn("FORMAT", Sequelize.col("total_amount"), 0),
                    ",",
                    ""
                  ),
                  {
                    [Op.like]: `%${cleanText}%`,
                  }
                ),

                // Search the formatted string representation (handles cases like "120,000")
                Sequelize.where(
                  Sequelize.fn("FORMAT", Sequelize.col("total_amount"), 0),
                  {
                    [Op.like]: `%${text}%`,
                  }
                ),

                // Original string search as fallback
                Sequelize.where(
                  Sequelize.literal(`CAST(total_amount AS CHAR)`),
                  {
                    [Op.like]: `%${text}%`,
                  }
                ),
              ];
            }
            break;
          case "vendor":
            whereClause[Op.or] = [
              // Search concatenated vendor first and last name
              Sequelize.where(
                Sequelize.literal(
                  `CONCAT(\`po_vendor\`.\`fname\`, ' ', \`po_vendor\`.\`lname\`)`
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),

              // Search vendor company name
              { "$po_vendor.company_name$": { [Op.like]: `%${text}%` } },

              // Additional fallback options if needed:
              // Search first name alone
              { "$po_vendor.fname$": { [Op.like]: `%${text}%` } },

              // Search last name alone
              { "$po_vendor.lname$": { [Op.like]: `%${text}%` } },
            ];
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          { po_number: { [Op.like]: `%${text}%` } },
          ...createDateTimeSearchConditions("po_pr_id", text, "date_needed"),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`po_pr_id->requestor\`.fname, ' ', \`po_pr_id->requestor\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          Sequelize.where(col("po_pr_id.pr_no"), {
            [Op.like]: `%${text}%`,
          }),
          { payment_status: { [Op.like]: `%${text}%` } },
          { status: { [Op.like]: `%${text}%` } },
          {
            [Op.or]: [
              // Try to parse the search text as a number with different formats
              (() => {
                // Remove all commas and try to parse as number
                const cleanText = text.replace(/,/g, "");
                const searchNumber = parseFloat(cleanText);

                if (!isNaN(searchNumber)) {
                  // If the original text ends with comma (like "120,"), search for numbers starting with 120
                  if (text.endsWith(",")) {
                    return {
                      total_amount: {
                        [Op.between]: [searchNumber, searchNumber + 1],
                      },
                    };
                  }
                  // Otherwise do exact number match with tolerance
                  return {
                    total_amount: {
                      [Op.between]: [
                        searchNumber - 0.0001,
                        searchNumber + 0.0001,
                      ],
                    },
                  };
                }
                return null;
              })(),

              // Handle comma-formatted numbers by checking both raw and formatted versions
              Sequelize.where(
                Sequelize.fn(
                  "REPLACE",
                  Sequelize.fn("FORMAT", Sequelize.col("total_amount"), 0),
                  ",",
                  ""
                ),
                {
                  [Op.like]: `%${text.replace(/,/g, "")}%`,
                }
              ),

              // Original string pattern match as fallback
              Sequelize.where(Sequelize.literal(`CAST(total_amount AS CHAR)`), {
                [Op.like]: `%${text}%`,
              }),
            ].filter((condition) => condition !== null),
          },

          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`po_vendor\`.fname, ' ', \`po_vendor\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          { "$po_vendor.company_name$": { [Op.like]: `%${text}%` } },
        ];
      }
    }
    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// receiving count
router.route("/forReceivingCount").get(async (req, res) => {
  try {
    // Assuming you have a PurchaseOrder model with a status field

    const count = await Receiving.count({
      where: {
        status: {
          [Op.ne]: "Cancelled",
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: count,
    });
  } catch (error) {
    console.error("Count error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// total payable
router.route("/totalPayable").get(async (req, res) => {
  try {
    // Sum the 'total_amount' column with optional conditions
    const total = await PurchaseOrder.sum("total_amount", {
      where: {
        status: "Approved",
      },
    });

    // Convert to number (in case Sequelize returns a string)
    const totalPayable = Number(total) || 0;

    return res.status(200).json({
      success: true,
      data: totalPayable,
    });
  } catch (error) {
    console.error("Total payable calculation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/logPDF/:id").put(async (req, res) => {
  try {
    const { id } = req.params;
    const { userLoggedID } = req.body;

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Purchase Order with ID of ${id} has been exported`,
    });

    return res.status(200).json({
      success: true,
      message: "Purchase Order exported successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Reject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject Purchase Order",
      error: error.message,
    });
  }
});

router.route("/cancelPO/:id").put(async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { id } = req.params;
    const { userLoggedID, cancelRemarks } = req.body;

    const isPoForReceiving = await Receiving.findOne({
      where: { po_id: id },
      transaction,
    });

    if (isPoForReceiving) {
      if (isPoForReceiving.status !== "For-Receiving") {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `This Purchase Order is already ${isPoForReceiving.status} and cannot be cancelled`,
        });
      }
      await isPoForReceiving.update({ status: "Cancelled" }, { transaction });
    }

    // First fetch the purchase order with vendor products and include PR
    const purchaseOrder = await PurchaseOrder.findOne({
      where: { id },
      include: [
        {
          model: PurchaseOrderVendorProduct,
          as: "po_order_item",
        },
        {
          model: PurchaseRequest,
          as: "po_pr_id", // Include the related PR
        },
      ],
      transaction,
    });

    if (!purchaseOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    }

    const poOrderItems = purchaseOrder.po_order_item;
    const prId = purchaseOrder.po_pr_id?.id; // Get the PR ID

    // Process each vendor product
    for (const vendorProduct of poOrderItems) {
      // Now fetch the associated purchase request order item for this product
      const requestOrderItem = await PurchaseRequestOrderItem.findOne({
        where: {
          product_id: vendorProduct.product_id,
          pr_id: prId, // Add PR ID to ensure we're updating the correct item
        },
        transaction,
      });

      if (!requestOrderItem) {
        console.warn(
          `No request order item found for product ${vendorProduct.product_id} and PR ${prId}`
        );
        continue;
      }

      // Calculate the new quantity
      const updatedQuantity =
        requestOrderItem.new_quantity - vendorProduct.quantity;

      let newStatus;

      if (updatedQuantity <= 0) {
        newStatus = "In Progress";
      } else if (updatedQuantity >= requestOrderItem.quantity) {
        newStatus = "Ordered";
      } else {
        newStatus = "Partial Order";
      }

      // Update the purchase request order item
      await requestOrderItem.update(
        {
          new_quantity: updatedQuantity,
          status: newStatus,
        },
        { transaction }
      );
    }

    // Update the purchase order status
    const updatedCount = await PurchaseOrder.update(
      {
        status: "Cancelled",
        cancelledBy: userLoggedID,
        cancelRemarks,
        cancelledAt: new Date(),
      },
      {
        where: { id },
        transaction,
      }
    );

    if (updatedCount[0] > 0) {
      // Update the Purchase Request status to "For-PO"
      if (prId) {
        await PurchaseRequest.update(
          { status: "For-PO" },
          {
            where: { id: prId },
            transaction,
          }
        );
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Purchase Order with ID of ${id} has been cancelled`,
      });

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Purchase Order cancelled successfully",
        data: purchaseOrder,
      });
    }
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Reject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel Purchase Order",
      error: error.message,
    });
  }
});

// send email button
router.post("/sendEmail/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get PurchaseOrder + Supplier details
    const po = await PurchaseOrder.findOne({
      where: { id },
      include: [
        {
          model: Vendors,
          as: "po_vendor",
        },
        {
          model: MasterList,
          as: "po_prepared",
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("po_prepared.fname"),
                " ",
                sequelize.col("po_prepared.lname")
              ),
              "full_name",
            ],
          ],
        },
      ],
    });

    if (!po || !po.po_vendor) {
      return res
        .status(404)
        .json({ message: "Purchase Order or Vendors not found" });
    }

    const cp = await CompanyProfile.findOne({
      where: { id: "11111111-1111-1111-1111-111111111111" },
    });

    const supplierEmail = po.po_vendor.company_email;
    const subject = `Purchase Order #${po.po_number}`;
    const body = `
      Dear ${po.po_vendor.company_name},

      Please find attached the Purchase Order #${po.po_number}.
      
      Regards,
      ${cp.company_name || po.po_prepared.full_name}
    `;

    // Email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password,
      },
    });

    // Mail options
    const mailOptions = {
      from: emailConfig.email,
      to: supplierEmail,
      subject,
      text: body,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending e-mail:", error);
        return res
          .status(500)
          .json({ message: "Failed to send e-mail", error });
      } else {
        console.log("E-mail Sent:", info.response);
        return res.status(200).json({
          message: "E-mail sent successfully",
          info: info.response,
        });
      }
    });
  } catch (error) {
    console.error("Send Email Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
