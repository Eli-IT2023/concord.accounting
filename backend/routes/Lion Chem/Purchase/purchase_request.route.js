const express = require("express");
const { where, Sequelize, Op } = require("sequelize");
const moment = require("moment");
const router = express.Router();
const {
  ProductList,
  Product_Tag_Vendor,
  Vendors,
  Packaging,
  Warehouse,
  StockManagement,
  StockManagementProductTagVendor,
  MasterList,
  Activity_Log,
  PurchaseRequest,
  PurchaseRequestOrderItem,
  TaxSettings,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");
const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// create .
router.route("/create").post(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // Destructure the data from request body
    const { userLoggedID, pr_no, date_needed, remarks, items, request_name } =
      req.body;

    // Set default statuses
    const requestStatus = "For-Approval";
    const itemStatus = "In Progress";

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Create the PurchaseRequest record
    const purchaseRequest = await PurchaseRequest.create(
      {
        pr_no: pr_no,
        date_needed: date_needed,
        remarks: remarks,
        status: requestStatus,
        requestedBy: userLoggedID,
        request_name: request_name,
      },
      { transaction }
    );

    // Get the ID of the newly created PurchaseRequest
    const prId = purchaseRequest.id;

    // Prepare items for bulk creation with calculated quantity
    const orderItems = items.map((item) => {
      // Calculate the final quantity: item.quantity / item.unit_quantity
      const quantity = parseFloat(item.quantity);
      const unitQuantity = parseFloat(item.unit_quantity);

      // Validate that unit_quantity is not zero to avoid division by zero
      if (unitQuantity === 0) {
        throw new Error(
          `Unit quantity cannot be zero for product ${
            item.product_name || item.product_id
          }`
        );
      }

      const finalQuantity = quantity / unitQuantity;

      return {
        pr_id: prId,
        product_id: item.product_id,
        quantity: finalQuantity, // Use the calculated quantity
        unit_quantity: item.unit_quantity,
        price: 0,
        remarks: item.remarks,
        status: itemStatus,
        uom: item.uom,
      };
    });

    // Create all order items in a single operation
    await PurchaseRequestOrderItem.bulkCreate(orderItems, { transaction });

    // Log the activity
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Created PR: ${pr_no} with ID ${prId}`,
    });

    // Commit the transaction
    await transaction.commit();

    // Log success
    // console.log(`Created Purchase Request ${prId} with ${items.length} items`);

    res.status(200).json({
      success: true,
      message: "Purchase request created successfully",
      data: {
        pr_id: prId,
        pr_no: pr_no,
        status: requestStatus,
        item_count: items.length,
      },
    });
  } catch (error) {
    // Rollback transaction if error occurs
    await transaction.rollback();

    console.error("Error creating purchase request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create purchase request",
      error: error.message,
    });
  }
});

// fetch data
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where: {
        isDeleted: 0,
      },
      include: [
        {
          model: MasterList,
          as: "requestor",
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
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    // console.log("Fetched Purchase Requests:", formattedData);

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

// filtered fetch data
router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterStatus, searchName } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the PurchaseRequest where clause
    const whereClause = { isDeleted: 0 };
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    // Build the MasterList (requestor) where clause
    const requestorWhereClause = {};
    if (searchName) {
      requestorWhereClause[Op.or] = [
        { fname: { [Op.like]: `%${searchName}%` } },
        { lname: { [Op.like]: `%${searchName}%` } },
      ];
    }

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MasterList,
          as: "requestor",
          where: requestorWhereClause,
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
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const formattedData = rows.map((row) => row.get({ plain: true }));

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: formattedData,
      filters: {
        status: filterStatus,
        searchName,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// search filter
router.route("/fetchSearchData").get(async (req, res) => {
  try {
    let { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Initialize where clauses
    const whereClause = { isDeleted: 0 };
    const requestorWhereClause = {};

    // Apply status filter if specified
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    // Handle search text if provided
    if (searchText) {
      searchText = searchText.trim(); // Clean the input

      if (filterColumn && filterColumn !== "all") {
        console.log("Search Format = Specific Database Column");

        // Specific column search
        switch (filterColumn) {
          case "requestor":
            // Use the same approach as in Purchase Order route
            whereClause[Op.and] = Sequelize.where(
              Sequelize.literal(
                `CONCAT(\`requestor\`.fname, ' ', \`requestor\`.lname)`
              ),
              {
                [Op.like]: `%${searchText}%`,
              }
            );
            break;

          case "pr_no":
            // Focused PR number search
            whereClause.pr_no = {
              [Op.like]: `%${searchText}%`,
            };
            break;

          case "remarks":
            whereClause.remarks = {
              [Op.like]: `%${searchText}%`,
            };
            break;

          case "date_needed":
            // Normalize input: remove commas and trim
            const cleanedText = searchText.replace(/,/g, "").trim();

            // Try to parse known formats first
            let parsedDate = moment(
              cleanedText,
              [
                "MMM D YYYY",
                "MMMM D YYYY",
                "MMM D, YYYY",
                "MMMM D, YYYY",
                "YYYY-MM-DD",
              ],
              true
            );

            if (parsedDate.isValid()) {
              const formattedDate = parsedDate.format("YYYY-MM-DD");
              whereClause.date_needed = {
                [Op.like]: `%${formattedDate}%`,
              };
            } else {
              console.log("Invalid date format, searching as string");

              // Split the cleaned input into tokens like ["jun", "03", "2025"]
              const tokens = cleanedText.split(/\s+/).filter(Boolean);

              // Each token must be found in any of the date parts
              whereClause[Op.and] = tokens.map((token) => ({
                [Op.or]: [
                  { date_needed: { [Op.like]: `%${token}%` } },
                  sequelize.where(
                    sequelize.fn(
                      "date_format",
                      sequelize.col("date_needed"),
                      "%b"
                    ),
                    { [Op.like]: `%${token}%` }
                  ),
                  sequelize.where(
                    sequelize.fn(
                      "date_format",
                      sequelize.col("date_needed"),
                      "%M"
                    ),
                    { [Op.like]: `%${token}%` }
                  ),
                  sequelize.where(
                    sequelize.fn(
                      "date_format",
                      sequelize.col("date_needed"),
                      "%d"
                    ),
                    { [Op.like]: `%${token}%` }
                  ),
                  sequelize.where(
                    sequelize.fn(
                      "date_format",
                      sequelize.col("date_needed"),
                      "%Y"
                    ),
                    { [Op.like]: `%${token}%` }
                  ),
                ],
              }));
            }
            break;

          case "status":
            whereClause.status = {
              [Op.like]: `%${searchText}%`,
            };
            break;

          default:
            return res.status(400).json({
              success: false,
              message: "Invalid filter column specified",
            });
        }
      } else {
        console.log("Search Format = All");
        // Search all columns when no specific filterColumn is specified
        whereClause[Op.or] = [
          { pr_no: { [Op.like]: `%${searchText}%` } },
          { request_name: { [Op.like]: `%${searchText}%` } },
          { status: { [Op.like]: `%${searchText}%` } },
          { remarks: { [Op.like]: `%${searchText}%` } },
          ...createDateTimeSearchConditions(
            "purchase_request",
            searchText,
            "date_needed"
          ),

          Sequelize.where(
            Sequelize.literal(`DATE_FORMAT(date_needed, '%M %d, %Y')`),
            {
              [Op.like]: `%${searchText}%`,
            }
          ),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`requestor\`.fname, ' ', \`requestor\`.lname)`
            ),
            {
              [Op.like]: `%${searchText}%`,
            }
          ),
        ];
      }
    }
    // Execute the query - modified to ensure we get PRs even if requestor doesn't match
    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MasterList,
          as: "requestor",
          where:
            Object.keys(requestorWhereClause).length > 0
              ? requestorWhereClause
              : {},
          attributes: [
            "id",
            "fname",
            "lname",
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
          required: filterColumn === "requestor", // Only require match if specifically searching by requestor
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      distinct: true, // Important for correct counting when using includes
    });

    // Format the response
    const formattedData = rows.map((row) => ({
      ...row.get({ plain: true }),
      requestor: row.requestor
        ? {
            id: row.requestor.id,
            full_name: row.requestor.getDataValue("full_name"), // Use getDataValue
          }
        : null,
    }));

    console.log(formattedData, "Eto ang filtered data");

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedData,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// get data for update/view
router.route("/getData/:id").get(async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findOne({
      where: { id },
      include: [
        {
          model: MasterList,
          as: "requestor",
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
          required: true,
          include: [
            {
              model: Packaging,
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [
        [{ model: ProductList, as: "product_list" }, "product_code", "ASC"],
      ],
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
        category: plainItem.product_list.product_category,
        quantity: plainItem.quantity,
        remarks: plainItem.remarks,
        status: plainItem.status,
        product_id: plainItem.product_list.product_id,
        ordered_quantity: plainItem.new_quantity,
        prod_packaging: plainItem.product_list.prod_packaging,
        unit_quantity: plainItem.unit_quantity,
        uom: plainItem.uom,
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

// purchase request rejection
router.route("/reject/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { rejectRemarks, rejectedBy, userLoggedID } = req.body;

    const updated = await PurchaseRequest.update(
      {
        status: "Declined",
        rejectRemarks,
        rejectedBy,
        rejectedAt: new Date(),
      },
      {
        where: { id },
        transaction,
      }
    );

    // Log the activity
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Rejected PR with a PR ID of ${id}`,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Purchase request declined successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Rejection failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to decline purchase request",
      error: error.message,
    });
  }
});

// product list delete
router.route("/deleteProductList/:product_id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { product_id } = req.params;

    const updated = await PurchaseRequestOrderItem.update(
      {
        isDeleted: 1,
      },
      {
        where: { id: product_id },
        transaction,
      }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Purchase order item deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Deletion failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order item",
      error: error.message,
    });
  }
});

// purchase request update
router.route("/update/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      request_name,
      date_needed,
      remarks,
      updatedBy,
      orderItems,
      userLoggedID,
    } = req.body;

    // Update main purchase request
    await PurchaseRequest.update(
      {
        request_name,
        date_needed,
        remarks,
        updatedBy,
      },
      {
        where: { id },
        transaction,
      }
    );

    // Update order items
    await Promise.all(
      orderItems.map((item) => {
        if (item.isUpdate === false) {
          return PurchaseRequestOrderItem.update(
            {
              quantity: item.quantity,
              remarks: item.remarks,
              isDeleted: 1,
            },
            {
              where: { id: item.id },
              transaction,
            }
          );
        } else {
          return PurchaseRequestOrderItem.update(
            {
              quantity: item.quantity,
              remarks: item.remarks,
            },
            {
              where: { id: item.id },
              transaction,
            }
          );
        }
      })
    );

    // Log the activity
    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Updated PR with a PR ID of ${id}`,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Purchase request updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Update failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update purchase request",
      error: error.message,
    });
  }
});

// purchase request rejection
router.route("/approve/:id").put(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { approvedBy, approveRemarks, userLoggedID } = req.body;

    const updated = await PurchaseRequest.update(
      {
        status: "For-PO",
        approvedAt: new Date(),
        approveRemarks,
        approvedBy,
      },
      {
        where: { id },
        transaction,
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Approved PR with a PR ID of ${id}`,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Purchase request approved successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Approve failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve purchase request",
      error: error.message,
    });
  }
});

// fetch vendor
router.route("/getVendorsByProduct/:product_id").get(async (req, res) => {
  try {
    const { product_id } = req.params;
    console.log(`Fetching vendors for product ID: ${product_id}`);

    const vendors = await Product_Tag_Vendor.findAll({
      where: {
        product_id: product_id,
      },
      include: [
        {
          model: Vendors,
          required: true,
        },
      ],
      order: [[{ model: Vendors }, "company_name", "ASC"]],
    });

    if (!vendors || vendors.length === 0) {
      // console.log(`No vendors found for product ID: ${product_id}`);
      // return res.status(404).json({
      //   success: false,
      //   message: "No vendors found for this product",
      // });
    } else {
      console.log("not empty proceed");
    }

    // console.log("Final vendors data:", vendors);

    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message,
    });
  }
});

// withholding tax
router.route("/getTax/").get(async (req, res) => {
  try {
    const getTax = await TaxSettings.findAll({
      where: {
        status: "active",
        applicability: "Purchase",
      },
    });
    if (getTax) {
      return res.json(getTax);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json();
  }
});

// get prepared by
router.route("/getVendor/").get(async (req, res) => {
  try {
    const fetchVendor = await Vendors.findAll({
      where: {
        status: "Active",
      },
    });

    return res.status(200).json({
      success: true,
      data: fetchVendor, // Make sure to send the actual data
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendors",
    });
  }
});

module.exports = router;
