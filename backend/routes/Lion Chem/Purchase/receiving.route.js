const express = require("express");
const { Op, Sequelize, col, literal } = require("sequelize");
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
  ReceivingHistory,
  ReceivingProductOrder,
  ReceivingRejectedProduct,
  PackagingImage,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: {
        isDeleted: 0,
        status: "Approved",
      },
      include: [
        {
          model: Vendors,
          as: "po_vendor",
        },

        {
          model: Receiving,
          as: "receiving_po_id",
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
    const { filterVendor, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the where clause for PurchaseOrder
    const poWhereClause = { isDeleted: 0, status: "Approved" };

    // Build the where clause for Receiving (if status filter exists)
    const receivingWhereClause = {};
    if (filterStatus && filterStatus !== "All") {
      receivingWhereClause.status = filterStatus;
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: poWhereClause,
      include: [
        {
          model: Vendors,
          as: "po_vendor",
          where:
            filterVendor && filterVendor !== "All"
              ? { id: filterVendor }
              : undefined,
        },
        {
          model: Receiving,
          as: "receiving_po_id",
          where:
            Object.keys(receivingWhereClause).length > 0
              ? receivingWhereClause
              : undefined,
          required: filterStatus && filterStatus !== "All", // Only require if filtering by status
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
      order: [["createdAt", "ASC"]],
      limit: limit,
      offset: offset,
      distinct: true, // Important for correct counting when using includes with where clauses
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
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

// search fetch
router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus, filterVendor } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Base where clause
    const whereClause = {
      isDeleted: 0,
      status: "Approved",
    };

    // Status filter
    if (filterStatus && filterStatus !== "All") {
      whereClause["$receiving_po_id.status$"] = filterStatus;
    }

    // Vendor filter
    const vendorWhere = {};
    if (filterVendor && filterVendor !== "All") {
      vendorWhere.id = filterVendor;
    }

    // Include configurations
    const include = [
      {
        model: Vendors,
        as: "po_vendor",
        attributes: ["id", "fname", "lname", "company_name"],
        where: Object.keys(vendorWhere).length > 0 ? vendorWhere : undefined,
      },
      {
        model: Receiving,
        as: "receiving_po_id",
        attributes: ["id", "status", "createdAt"],
        required: filterStatus && filterStatus !== "All",
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

    // Search functionality
    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim().toLowerCase();

      if (filterColumn !== "all") {
        switch (filterColumn) {
          case "id":
          case "po_number":
            whereClause.po_number = { [Op.like]: `%${text}%` };
            break;

          case "pr_no":
            include[2].where = { pr_no: { [Op.like]: `%${text}%` } };
            break;

          case "requestedBy":
            whereClause[Op.or] = [
              Sequelize.where(
                Sequelize.fn(
                  "concat",
                  Sequelize.col("po_pr_id->requestor.fname"),
                  " ",
                  Sequelize.col("po_pr_id->requestor.lname")
                ),
                { [Op.like]: `%${text}%` }
              ),
              Sequelize.where(
                Sequelize.fn(
                  "concat",
                  Sequelize.col("po_pr_id->requestor.lname"),
                  " ",
                  Sequelize.col("po_pr_id->requestor.fname")
                ),
                { [Op.like]: `%${text}%` }
              ),
            ];
            break;

          case "date_needed":
            include[2].where = Sequelize.where(
              Sequelize.fn(
                "DATE_FORMAT",
                Sequelize.col("po_pr_id.date_needed"),
                "%Y-%m-%d"
              ),
              { [Op.like]: `%${text}%` }
            );
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          { po_number: { [Op.like]: `%${text}%` } },
          { "$po_vendor.company_name$": { [Op.like]: `%${text}%` } },
          // { "$po_vendor.fname$": { [Op.like]: `%${text}%` } },
          // { "$po_vendor.lname$": { [Op.like]: `%${text}%` } },
          { "$po_pr_id.pr_no$": { [Op.like]: `%${text}%` } },
          { "$po_pr_id.remarks$": { [Op.like]: `%${text}%` } },
          { "$receiving_po_id.status$": { [Op.like]: `%${text}%` } },
          Sequelize.where(
            Sequelize.fn(
              "concat",
              Sequelize.col("po_pr_id->requestor.fname"),
              " ",
              Sequelize.col("po_pr_id->requestor.lname")
            ),
            { [Op.like]: `%${text}%` }
          ),
          Sequelize.where(
            Sequelize.fn(
              "concat",
              Sequelize.col("po_vendor.fname"),
              " ",
              Sequelize.col("po_vendor.lname")
            ),
            { [Op.like]: `%${text}%` }
          ),
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col("po_pr_id.date_needed"),
              "%Y-%m-%d"
            ),
            { [Op.like]: `%${text}%` }
          ),
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

//  viewing
router.route("/fetchPO/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const po = await PurchaseOrder.findOne({
      where: {
        isDeleted: 0,
        status: "Approved",
        id,
      },
      include: [
        {
          model: Vendors,
          as: "po_vendor",
        },
        {
          model: MasterList,
          as: "po_approver",
        },
        {
          model: Receiving,
          as: "receiving_po_id",
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
    });

    if (!po) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: po.get({ plain: true }),
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

//  viewing list
router.route("/fetchPOList/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await PurchaseOrderVendorProduct.findAndCountAll({
      where: { po_id: id },
      include: [
        {
          model: ProductList,
          as: "po_vendor_product_id",
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
          "product_code",
          "ASC",
        ],
      ],
      limit,
      offset,
    });

    const formattedData = rows.map((item) => {
      const poList = item.get({ plain: true });

      if (!poList.po_vendor_product_id) {
        console.error(`Product details missing for item ${poList.id}`);
        throw new Error(`Product details missing for item ${poList.id}`);
      }

      return poList;
    });

    console.log(formattedData, "THIS IS DATA I NEED");

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: formattedData,
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// update receive to change status
router.route("/updateReceive").post(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    console.log("Received submission data:", req.body);

    const {
      po_id,
      product_list,
      duty_custom,
      shipping_fee,
      receivedBy,
      userLoggedID,
    } = req.body;

    // Validate required fields
    if (!po_id || !product_list || !Array.isArray(product_list)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (po_id or product_list)",
      });
    }

    // Enhanced RR number generation with uniqueness check
    const generateUniqueRrNumber = async () => {
      const RR_PREFIX = "RR-"; // Configurable prefix
      const MAX_ATTEMPTS = 5; // Prevent infinite loops
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        // Generate random 3-digit number (100-999)
        const randomNum = Math.floor(100 + Math.random() * 900);

        // Get current datetime in YYYYMMDDHHMMSS format
        const now = new Date();
        const datetimeStr = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
          String(now.getHours()).padStart(2, "0"),
          String(now.getMinutes()).padStart(2, "0"),
          String(now.getSeconds()).padStart(2, "0"),
        ].join("");

        const rr_no = `${RR_PREFIX}${datetimeStr}${randomNum}`;

        // Check for uniqueness
        const existing = await ReceivingHistory.findOne({
          where: { rr_no },
          transaction: t,
        });

        if (!existing) {
          return rr_no;
        }

        attempts++;
      }

      throw new Error(
        "Failed to generate unique RR number after multiple attempts"
      );
    };

    const rr_no = await generateUniqueRrNumber();

    let completedCount = 0;
    const totalProducts = product_list.length;
    const today = new Date();
    const date_received = today.toISOString().split("T")[0];
    const receivedAt = today;

    // Get Receiving record by po_id
    const receivingRecord = await Receiving.findOne({
      where: { po_id },
      include: [
        {
          model: PurchaseOrder,
          as: "receiving_po_id",
          attributes: ["vendor_id", "po_number"], // Only fetch needed attributes
        },
      ],
      transaction: t,
    });

    if (!receivingRecord) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Receiving record not found for the given po_id",
      });
    }

    const receiving_id = receivingRecord.id;

    // Create ReceivingHistory with rr_no
    const receivingHistory = await ReceivingHistory.create(
      {
        receiving_id,
        rr_no,
        duty_custom: parseFloat(duty_custom) || 0,
        shipping_fee: parseFloat(shipping_fee) || 0,
        date_received,
        receivedBy,
        receivedAt,
      },
      { transaction: t }
    );

    const receivingHistoryId = receivingHistory.id;
    let hasValidProducts = false;

    // Process products in parallel for better performance
    await Promise.all(
      product_list.map(async (product) => {
        const totalReceived = parseFloat(product.total_received || 0);
        const orderedQty = parseFloat(product.ordered_quantity || 0);
        const quantityReceived = parseFloat(product.quantity_received || 0); // Good quantity received
        const rejectedQuantity = parseFloat(product.rejected_quantity || 0);
        const newRejectedQuantity = parseFloat(
          product.new_rejected_quantity || 0
        ); // Rejected but still received
        const expiryDate = product.expiry_date || null;
        const lot = product.lot || null;

        const unitQuantity = parseFloat(product.unit_quantity || 1);

        // computed rejected quantity with unitQuantity
        const computedRejectedQuantity = newRejectedQuantity * unitQuantity;

        // Calculate TOTAL quantity received (good + rejected)
        const totalQuantityThisBatch =
          quantityReceived + computedRejectedQuantity;

        // Skip if no quantity received (both good and rejected)
        if (totalQuantityThisBatch === 0) {
          return;
        }

        // Validate required fields for received items (only valid products is needed to have expiry date)
        if (totalQuantityThisBatch && !lot) {
          throw {
            status: 400,
            message: "Validation error",
            errors: {
              [product.id]: {
                message: "LOT is required when a batch is received",
              },
            },
          };
        }

        if (quantityReceived > 0 && !expiryDate) {
          throw {
            status: 400,
            message: "Validation error",
            errors: {
              [product.id]: {
                message: "Expiry date is required when quantity is received",
              },
            },
          };
        }

        // Skip if already fully received and nothing new received
        if (totalReceived >= orderedQty && totalQuantityThisBatch === 0) {
          return;
        }

        hasValidProducts = true;

        console.log("this is the rejectedQuantity", rejectedQuantity);

        console.log("this is the newRejectedQuantity", newRejectedQuantity);

        console.log(
          "this is the computedRejectedQuantity",
          computedRejectedQuantity
        );

        console.log("this is the quantityReceived", quantityReceived);

        console.log(
          "this is the totalQuantityThisBatch",
          totalQuantityThisBatch
        );

        // Calculate new totals - BOTH good and rejected count as "received"
        const computedTotalReceived =
          totalReceived * unitQuantity + totalQuantityThisBatch;

        const newTotalReceived = computedTotalReceived / unitQuantity;

        console.log("this is the computedTotalReceived", computedTotalReceived);
        console.log("this is the newTotalReceived", newTotalReceived);

        const newTotalQuantityThisBatch = totalQuantityThisBatch / unitQuantity;

        console.log(
          "this is the newTotalQuantityThisBatch",
          newTotalQuantityThisBatch
        );

        console.log("################################ /n");

        // for testing
        // return;

        if (newTotalReceived > orderedQty) {
          throw {
            status: 400,
            message: "Quantity Exceeds Purchase Order",
            errors: {
              [product.id]: {
                message: `Cannot receive ${newTotalReceived} units - only ${orderedQty} were ordered. Please adjust the quantity.`,
                productName: product.product_name || "This product",
                ordered: orderedQty,
                previouslyReceived: totalReceived,
                attemptingToReceive: totalQuantityThisBatch,
              },
            },
          };
        }

        // // For rejected_quantity field, we store the CUMULATIVE rejected quantity
        // const existingRejected = parseFloat(
        //   (
        //     await PurchaseOrderVendorProduct.findByPk(product.id, {
        //       transaction: t,
        //     })
        //   )?.rejected_quantity || 0
        // );
        // const newTotalRejected = existingRejected + rejectedQuantity;

        // Determine product status based on TOTAL received (good + rejected)
        const productStatus =
          newTotalReceived >= orderedQty ? "Received" : "Partial-Received";

        if (productStatus === "Received") {
          completedCount++;
        }

        if (newRejectedQuantity > 0) {
          await ReceivingRejectedProduct.create({
            po_vendor_prod_id: product.id,
            rejected_quantity: newRejectedQuantity,
            remarks: product.remarks || "", // Use the remarks from the request
            transaction: t,
          });
        }

        await PurchaseOrderVendorProduct.update(
          {
            total_received: newTotalReceived, // Total received (good + rejected)
            rejected_quantity: rejectedQuantity,
            status: productStatus,
          },
          {
            where: { id: product.id },
            transaction: t,
          }
        ); // Update PurchaseOrderVendorProduct

        // Create ReceivingProductOrder entry for TOTAL quantity received (good + rejected)

        await ReceivingProductOrder.create(
          {
            receiving_id,
            receiving_history_id: receivingHistoryId,
            po_vendor_product_id: product.id,
            quantity_received: newTotalQuantityThisBatch, // Store total (good + rejected)
            rejected_quantity: newRejectedQuantity,
            expiry_date: expiryDate,
            lot, // LOT Number
          },
          { transaction: t }
        );

        // Update stock management ONLY for GOOD quantity (not rejected)
        if (quantityReceived > 0) {
          const poVendorProduct = await PurchaseOrderVendorProduct.findOne({
            where: { id: product.id, po_id: po_id },
            transaction: t,
          });

          if (!poVendorProduct) {
            throw {
              status: 404,
              message: `Product not found with ID: ${product.id}`,
            };
          }

          await StockManagement.create(
            {
              product_id: poVendorProduct.product_id,
              warehouse_id: "11111111-1111-1111-1111-111111111111",
              stock: newTotalQuantityThisBatch, // Only good quantity goes to stock
              in: newTotalQuantityThisBatch,
              price: poVendorProduct.price,
              price_in: poVendorProduct.price,
              vendor_id: receivingRecord.receiving_po_id.vendor_id,
              date_in: date_received,
              transaction_number: receivingRecord.receiving_po_id.po_number,
              module_in_from: "Purchase",
              expiry_date: expiryDate,
              lot: lot, // LOT Number
            },
            { transaction: t }
          );
        }
      })
    );

    // for testing
    // return;

    // Check if any products were actually processed
    if (!hasValidProducts) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "No valid products to process",
        errors: {
          general: {
            message:
              "Products have either been received or no quantity was provided.",
          },
        },
      });
    }

    // Determine overall receiving status
    const poVendorProducts = await PurchaseOrderVendorProduct.findAll({
      where: { po_id },
      transaction: t,
    });

    const allReceived = poVendorProducts.every(
      (product) => product.status === "Received"
    );

    const receivingStatus = allReceived ? "Received" : "Partial-Received";

    // Update Receiving main status
    await Receiving.update(
      { status: receivingStatus },
      { where: { po_id }, transaction: t }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Received items for PO ${receivingRecord.receiving_po_id.po_number} (RR: ${rr_no})`,
    });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Receiving updated successfully",
      data: {
        po_id,
        status: receivingStatus,
        completedCount,
        totalProducts,
        receiving_history_id: receivingHistoryId,
        rr_no,
        completionPercentage: Math.round(
          (completedCount / totalProducts) * 100
        ),
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Update receiving error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        errors: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/cancelReceiving/:id").put(async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const { id } = req.params;
    const { userLoggedID, closeRemarks, isClosed, status } = req.body;

    console.log(status, "I NEED THE STATUS");

    if (status === "For-Receiving") {
      await Receiving.update(
        {
          status: "Cancelled",
          closed_by: userLoggedID,
          closed_remarks: closeRemarks,
          isClosed,
        },
        { where: { po_id: id }, transaction: transaction }
      );

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
            as: "po_pr_id",
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
      const prId = purchaseOrder.po_pr_id?.id;

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
          cancelRemarks: closeRemarks,
          cancelledAt: new Date(),
        },
        {
          where: { id },
          transaction,
        }
      );

      if (updatedCount[0] > 0) {
        // Update the Purchase Request status to "For-PO" only when status is "For-Receiving"
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
    } else {
      // This is for other statuses (not "For-Receiving")
      const receiving = await Receiving.update(
        {
          status: "Received",
          closed_by: userLoggedID,
          closed_remarks: closeRemarks,
          isClosed,
        },
        { where: { po_id: id }, transaction: transaction }
      );

      if (receiving) {
        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Receiving Order with ID of ${id} has been cancelled`,
        });

        await transaction.commit();

        return res.status(200).json({
          success: true,
          message: "Receiving Order cancelled successfully",
          data: receiving,
        });
      }
    }
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Reject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel Receiving",
      error: error.message,
    });
  }
});

// modal po report
router.route("/fetchPOReportTab/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const getReceivingTab = await Receiving.findOne({
      where: {
        po_id: id,
      },
      include: [
        {
          model: ReceivingHistory,
          as: "rh_receiving_id",
          order: [["createdAt", "DESC"]], // Order by date descending
        },
        {
          model: PurchaseOrder,
          as: "receiving_po_id",
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
        },
      ],
    });

    if (!getReceivingTab) {
      return res.status(404).json({
        success: false,
        message: "Receiving record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receiving tab data fetched successfully",
      data: getReceivingTab,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/fetchReceivingData/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const receiving = await Receiving.findOne({
      where: {
        po_id: id,
      },
      include: [
        {
          model: MasterList,
          as: "receiving_closer",
          required: false,
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("receiving_closer.fname"),
                " ",
                sequelize.col("receiving_closer.lname")
              ),
              "fullName",
            ],
          ],
        },
      ],
    });

    if (!receiving) {
      return res.status(404).json({
        success: false,
        message: "Receiving record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receiving status fetched successfully",
      data: receiving,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// helper: normalize Sequelize/JSON Buffer → Base64 data URL
const toBase64Image = (img) => {
  // ensure plain object
  const plain = img.toJSON ? img.toJSON() : img;

  let buffer = plain.packaging_image;

  // Sequelize sometimes returns { type: 'Buffer', data: [...] }
  if (buffer && buffer.data) {
    buffer = Buffer.from(buffer.data);
  } else if (buffer instanceof Uint8Array) {
    buffer = Buffer.from(buffer);
  }

  return {
    id: plain.id,
    mime: plain.mime || "image/png", // fallback
    packaging_image: buffer
      ? `data:${plain.mime || "image/png"};base64,${buffer.toString("base64")}`
      : null,
  };
};

// ==========================
// fetch PO Report Tab Data
// ==========================
router.route("/fetchPOReportTabData/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid receiving history ID" });
    }

    const getReceivingTabData = await ReceivingHistory.findOne({
      where: { id },
      include: [
        {
          model: Receiving,
          as: "rh_receiving_id",
          include: [
            {
              model: PurchaseOrder,
              as: "receiving_po_id",
              include: [
                { model: Vendors, as: "po_vendor" },
                {
                  model: PurchaseRequest,
                  as: "po_pr_id",
                  include: [{ model: MasterList, as: "requestor" }],
                },
              ],
            },
          ],
        },
        { model: MasterList, as: "rh_received_by" },
        {
          model: ReceivingProductOrder,
          as: "rh_receiving_history_id",
          include: [
            {
              model: PurchaseOrderVendorProduct,
              as: "rpo_vendor_product_id",
              include: [
                {
                  model: ProductList,
                  as: "po_vendor_product_id",
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      include: [
                        {
                          model: PackagingImage,
                          as: "images",
                          where: { isSelected: 1 },
                          required: false,
                          attributes: ["id", "mime", "packaging_image"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (getReceivingTabData) {
      // force plain object to break Sequelize references
      const plainData = getReceivingTabData.get({ plain: true });

      plainData.rh_receiving_history_id?.forEach((rpo) => {
        const packaging =
          rpo.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging;
        if (packaging?.images?.length > 0) {
          packaging.images = packaging.images.map(toBase64Image);
        }
      });

      return res.status(200).json({
        success: true,
        message: "Receiving tab data fetched successfully",
        data: plainData,
      });
    }

    return res
      .status(404)
      .json({ success: false, message: "Receiving history not found" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// ==========================
// fetch PO Report Card
// ==========================
router.route("/fetchPOReportCard/:id").get(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid receiving history ID" });
    }

    const getReceivingCard = await ReceivingHistory.findAll({
      where: { receiving_id: id },
      include: [
        {
          model: ReceivingProductOrder,
          as: "rh_receiving_history_id",
          include: [
            {
              model: PurchaseOrderVendorProduct,
              as: "rpo_vendor_product_id",
              include: [
                {
                  model: ProductList,
                  as: "po_vendor_product_id",
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      include: [
                        {
                          model: PackagingImage,
                          as: "images",
                          where: { isSelected: 1 },
                          required: false,
                          attributes: ["id", "mime", "packaging_image"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: MasterList, as: "rh_received_by" },
      ],
      order: [
        ["createdAt", "DESC"],
        [
          { model: ReceivingProductOrder, as: "rh_receiving_history_id" },
          { model: PurchaseOrderVendorProduct, as: "rpo_vendor_product_id" },
          { model: ProductList, as: "po_vendor_product_id" },
          "product_code",
          "ASC",
        ],
      ],
    });

    if (getReceivingCard?.length > 0) {
      const plainCards = getReceivingCard.map((card) => {
        const c = card.get({ plain: true });
        c.rh_receiving_history_id?.forEach((rpo) => {
          const packaging =
            rpo.rpo_vendor_product_id?.po_vendor_product_id?.prod_packaging;
          if (packaging?.images?.length > 0) {
            packaging.images = packaging.images.map(toBase64Image);
          }
        });
        return c;
      });

      return res.status(200).json({
        success: true,
        message: "Receiving card data fetched successfully",
        data: plainCards,
      });
    }

    return res
      .status(404)
      .json({ success: false, message: "Receiving history not found" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/getRejectedProductHistory", async (req, res) => {
  const { po_vendor_prod_id } = req.query;
  try {
    const isFetch = await ReceivingRejectedProduct.findAll({
      where: { po_vendor_prod_id },
      include: [
        {
          model: PurchaseOrderVendorProduct,
          as: "rrp_po_vendor_prod_id",
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

// lot validation if duplicate
// Minimal version - adapt to your actual models
router.get("/validateLot", async (req, res) => {
  try {
    const { lot, productId, receivingId } = req.query;

    if (!lot) {
      return res.json({
        exists: false,
        message: "",
      });
    }

    let exists = false;
    let message = "";

    // Check in StockManagement
    const stockRecord = await StockManagement.findOne({
      where: { lot: lot },
    });

    if (stockRecord) {
      exists = true;
      message = `LOT number "${lot}" already exists in inventory!`;
    }

    // Check in ReceivingHistory (if you have this table)
    if (!exists && productId && receivingId) {
      const receivingRecord = await ReceivingHistory.findOne({
        where: {
          lot: lot,
          product_id: productId,
          receiving_id: receivingId,
        },
      });

      if (receivingRecord) {
        exists = true;
        message = `LOT number "${lot}" is already used for this product in this receiving!`;
      }
    }

    res.json({
      exists: exists,
      message: message,
    });
  } catch (error) {
    console.error("LOT validation error:", error);
    res.status(500).json({
      error: error.message,
      exists: false,
      message: "Error validating LOT. Please try again.",
    });
  }
});
module.exports = router;
