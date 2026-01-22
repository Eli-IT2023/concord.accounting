const express = require("express");
const { Op, Sequelize, col, literal } = require("sequelize");
const {
  createDateTimeSearchConditions,
} = require("../../../utils/dateTimeSearchConditions");
const router = express.Router();
const {
  Mixer,
  SalesInvoice,
  Customer,
  SalesInvoiceTagProduct,
  ProductList,
  Finish_Raw_Material,
  Packaging,
  Product_Tag_Vendor,
  BatchEntryMain,
  BatchEntryMixer,
  BatchEntryInvoice,
  BatchEntryRawMaterials,
  Vendors,
  MasterList,
  PostProduction,
  PostProductionProduct,
} = require("../../../db/models/associations");
const sequelize = require("../../../db/config/sequelize.config");
const moment = require("moment");
const session = require("express-session");
const BatchEntryCost = require("../../../db/models/LionChem/Batch Entry/batchEntryCost.model");
const BatchEntryReprint = require("../../../db/models/LionChem/Batch Entry/batchEntryReprint.model");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/mixerForBatchEntry").get(async (req, res) => {
  try {
    const data = await Mixer.findAll({
      where: {
        status: "Active",
      },
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching mixer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/salesDRForBatchEntry").get(async (req, res) => {
  try {
    const batchEntryId = req.query.batchEntryId;

    let baseWhere = {
      isAdded: 0,
      [Op.or]: [
        {
          [Op.and]: [
            { sales_invoice: { [Op.ne]: null } },
            { sales_invoice: { [Op.ne]: "" } },
            { delivery_number: { [Op.ne]: null } },
            { delivery_number: { [Op.ne]: "" } },
          ],
        },
        {
          [Op.and]: [
            { is_only_deliver_number: true },
            { delivery_number: { [Op.ne]: null } },
            { delivery_number: { [Op.ne]: "" } },
          ],
        },
      ],
    };

    // If update, include already used invoices for that batch
    let includeSalesInvoiceIds = [];
    if (batchEntryId) {
      const entry = await BatchEntryMain.findOne({
        where: { id: batchEntryId },
        include: [
          {
            model: BatchEntryInvoice,
            include: [{ model: SalesInvoice }],
          },
        ],
      });

      includeSalesInvoiceIds = entry.batch_entry_tag_invoices.map(
        (inv) => inv.sales_invoice.sales_invoice_id
      );

      baseWhere = {
        [Op.or]: [
          { ...baseWhere },
          { sales_invoice_id: { [Op.in]: includeSalesInvoiceIds } },
        ],
      };
    }

    const data = await SalesInvoice.findAll({
      where: baseWhere,
      include: [
        {
          model: Customer,
          required: true,
        },
      ],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching sales invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/productSalesForBatchEntry").get(async (req, res) => {
  try {
    const data = await SalesInvoiceTagProduct.findAll({
      where: {
        sales_invoice_id: req.query.salesInvoiceId,
      },
      include: [
        {
          model: ProductList,
          required: true,
          attributes: [
            "product_id",
            "product_code",
            "client_code",
            "product_name",
            "product_category",
          ],
        },
      ],
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching sales invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/productRawMaterials").get(async (req, res) => {
  try {
    const data = await Finish_Raw_Material.findAll({
      where: {
        product_id: req.query.prodId,
      },
      include: [
        {
          model: Product_Tag_Vendor,
          include: [
            {
              model: ProductList,
              required: true,
              attributes: [
                "product_id",
                "product_code",
                "client_code",
                "product_name",
                "product_category",
                "reserved",
                "packaging_id",
              ],
              include: [
                {
                  model: Packaging,
                  required: true,
                  as: "prod_packaging",
                  attributes: ["id", "packaging_name", "status"],
                },
              ],
            },
            {
              model: Vendors,
              attributes: ["id", "company_name"],
            },
          ],
        },
      ],
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getRawMaterialsForBatchEntry").get(async (req, res) => {
  try {
    const data = await Product_Tag_Vendor.findAll({
      include: [
        {
          model: ProductList,
          where: {
            product_category: {
              [Op.or]: ["Raw Materials", "Consumable"],
            },
            status: "Active",
          },
          attributes: [
            "product_id",
            "product_code",
            "client_code",
            "product_name",
            "product_category",
          ],
          include: [
            {
              model: Packaging,
              required: true,
              as: "prod_packaging",
            },
          ],
        },
        {
          model: Vendors,
          attributes: ["id", "company_name"],
        },
      ],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/createBatchEntry").post(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      transaction_id,
      batch_name,
      batch_status,
      batch_remarks,
      start_date,
      end_date,
      mixer_ids,
      sales_invoice_ids,
      rawMaterials,
      cost_items,
      userLoggedID,
    } = req.body;

    // Normalize sales_invoice_ids from { value } to UUID strings
    const invoiceIds = sales_invoice_ids.map((inv) => inv.value || inv);

    // 1. Create main batch entry
    const newBatch = await BatchEntryMain.create(
      {
        batch_transaction_number: transaction_id,
        batch_name,
        batch_remarks,
        start_date,
        end_date,
        status: batch_status,
        created_by: userLoggedID,
      },
      { transaction }
    );

    if (!newBatch) throw new Error("Failed to create batch entry");

    // 2. Create post production entry
    const postProduction = await PostProduction.create(
      {
        batch_entry_id: newBatch.id,
        status: "In Progress",
      },
      { transaction }
    );

    // 3. Loop through each invoice and insert related PostProductionProduct entries
    await Promise.all(
      invoiceIds.map(async (invoiceId) => {
        const taggedProducts = await SalesInvoiceTagProduct.findAll({
          where: { sales_invoice_id: invoiceId },
          include: [
            {
              model: ProductList,
              attributes: ["product_id", "weight"],
            },
          ],
          transaction,
        });

        return Promise.all(
          taggedProducts.map((tagged) => {
            const product = tagged["product_list"]; // ✅ no alias used

            if (!product) {
              throw new Error(
                `No product_list found for sales_invoice_tag_product ID ${tagged.id}`
              );
            }

            return PostProductionProduct.create(
              {
                post_production_id: postProduction.id,
                batch_entry_id: newBatch.id,
                sales_invoice_id: invoiceId,
                product_id: product.product_id,
                weight: product.weight,
              },
              { transaction }
            );
          })
        );
      })
    );

    // 4. Add mixer associations
    await Promise.all(
      mixer_ids.map((mix) =>
        BatchEntryMixer.create(
          {
            batch_entry_id: newBatch.id,
            mixer_id: mix.value || mix,
            isDeleted: false,
          },
          { transaction }
        )
      )
    );

    // 5. Add invoice associations
    await Promise.all(
      invoiceIds.map((invoiceId) =>
        BatchEntryInvoice.create(
          {
            batch_entry_id: newBatch.id,
            sales_invoice_id: invoiceId,
            isDeleted: false,
          },
          { transaction }
        )
      )
    );

    // 6. Update SalesInvoice isAdded flag
    await SalesInvoice.update(
      { isAdded: true },
      {
        where: { sales_invoice_id: invoiceIds },
        transaction,
      }
    );

    // 7. Add raw materials
    await Promise.all(
      rawMaterials.map((material) =>
        BatchEntryRawMaterials.create(
          {
            batch_entry_id: newBatch.id,
            original_product_tag_vendor_id:
              material.original_product_tag_vendor_id,
            replacement_product_tag_vendor_id:
              material.replacement_product_tag_vendor_id,
            quantity_required: material.quantity_required,
            is_replacement: material.is_replacement,
            status: material.status,
            isDeleted: false,
          },
          { transaction }
        )
      )
    );

    // 8. Add cost items
    await Promise.all(
      cost_items.map((cost) =>
        BatchEntryCost.create(
          {
            batch_entry_id: newBatch.id,
            cost_type: cost.cost_type,
            cost_amount: cost.amount,
            remarks: cost.remarks,
            isDeleted: false,
          },
          { transaction }
        )
      )
    );

    // 9. Commit everything
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Batch entry created successfully",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error("Error creating batch entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create batch entry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/updateBatchEntry").post(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      transaction_id,
      batch_name,
      batch_status,
      batch_remarks,
      start_date,
      end_date,
      mixer_ids,
      sales_invoice_ids,
      rawMaterials,
      cost_items,
      production_status,
      id,
    } = req.body;

    const updateBatch = await BatchEntryMain.update(
      {
        batch_transaction_number: transaction_id,
        batch_name: batch_name,
        batch_remarks: batch_remarks,
        start_date: start_date,
        end_date: end_date,
        status: batch_status,
      },
      {
        where: { id: id },
        transaction,
      }
    );

    if (updateBatch) {
      // post production
      await PostProduction.update(
        {
          status: production_status,
        },
        {
          where: {
            batch_entry_id: id,
          },
        }
      );

      await BatchEntryMixer.update(
        {
          isDeleted: true,
        },
        {
          where: { batch_entry_id: id },
          transaction,
        }
      );

      const processedMixers = new Set();

      await Promise.all(
        mixer_ids.map(async (mix) => {
          const mixerKey = `${mix.value}`;

          if (processedMixers.has(mixerKey)) {
            console.warn(`Duplicate mixer detected: ${mixerKey}, skipping...`);
            return;
          }
          processedMixers.add(mixerKey);

          if (mix.tag_id) {
            const updateResult = await BatchEntryMixer.update(
              {
                mixer_id: mix.value,
                isDeleted: false,
              },
              {
                where: { id: mix.tag_id },
                transaction,
              }
            );

            if (updateResult[0] === 0) {
              console.warn(
                `Mixer tag_id ${mix.tag_id} not found, will create new record`
              );
            } else {
              console.log(
                `Updated existing mixer record with tag_id: ${mix.tag_id}`
              );
              return;
            }
          }

          const existingRecord = await BatchEntryMixer.findOne({
            where: {
              batch_entry_id: id,
              mixer_id: mix.value,
              isDeleted: true,
            },
            transaction,
          });

          if (existingRecord) {
            await BatchEntryMixer.update(
              {
                isDeleted: false,
              },
              {
                where: { id: existingRecord.id },
                transaction,
              }
            );
            console.log(
              `Reactivated existing mixer record ID: ${existingRecord.id}`
            );
          } else {
            await BatchEntryMixer.create(
              {
                batch_entry_id: id,
                mixer_id: mix.value,
                isDeleted: false,
              },
              { transaction }
            );
            console.log(`Created new mixer record for: ${mixerKey}`);
          }
        })
      );

      await BatchEntryInvoice.update(
        {
          isDeleted: true,
        },
        {
          where: {
            batch_entry_id: id,
          },
          transaction,
        }
      );

      const allSalesInvoiceIds = sales_invoice_ids.map(
        (invoice) => invoice.value
      );
      await SalesInvoice.update(
        { isAdded: false },
        { where: { sales_invoice_id: allSalesInvoiceIds }, transaction }
      );

      const processedInvoices = new Set();

      await Promise.all(
        sales_invoice_ids.map(async (invoice) => {
          const invoiceKey = `${invoice.value}`;

          if (processedInvoices.has(invoiceKey)) {
            console.warn(
              `Duplicate invoice detected: ${invoiceKey}, skipping...`
            );
            return;
          }
          processedInvoices.add(invoiceKey);

          if (invoice.tag_id) {
            const updateResult = await BatchEntryInvoice.update(
              {
                sales_invoice_id: invoice.value,
                isDeleted: false,
              },
              {
                where: { id: invoice.tag_id },
                transaction,
              }
            );

            if (updateResult[0] === 0) {
              console.warn(
                `Invoice tag_id ${invoice.tag_id} not found, will create new record`
              );
            } else {
              console.log(
                `Updated existing invoice record with tag_id: ${invoice.tag_id}`
              );
              return;
            }
          }

          const existingRecord = await BatchEntryInvoice.findOne({
            where: {
              batch_entry_id: id,
              sales_invoice_id: invoice.value,
              isDeleted: true,
            },
            transaction,
          });

          if (existingRecord) {
            await BatchEntryInvoice.update(
              {
                isDeleted: false,
              },
              {
                where: { id: existingRecord.id },
                transaction,
              }
            );
            console.log(
              `Reactivated existing invoice record ID: ${existingRecord.id}`
            );
          } else {
            await BatchEntryInvoice.create(
              {
                batch_entry_id: id,
                sales_invoice_id: invoice.value,
                isDeleted: false,
              },
              { transaction }
            );
            console.log(`Created new invoice record for: ${invoiceKey}`);
          }
        })
      );

      const finalSalesInvoiceIds = sales_invoice_ids.map(
        (invoice) => invoice.value
      );
      await SalesInvoice.update(
        { isAdded: true },
        { where: { sales_invoice_id: finalSalesInvoiceIds }, transaction }
      );

      await BatchEntryRawMaterials.update(
        {
          isDeleted: true,
        },
        {
          where: { batch_entry_id: id },
          transaction,
        }
      );

      const processedMaterials = new Set();

      await Promise.all(
        rawMaterials.map(async (material, index) => {
          const materialKey = `${material.original_product_tag_vendor_id}_${
            material.replacement_product_tag_vendor_id || "NULL"
          }`;

          if (processedMaterials.has(materialKey)) {
            console.warn(
              `Duplicate material detected: ${materialKey}, skipping...`
            );
            return;
          }
          processedMaterials.add(materialKey);

          if (material.tag_id) {
            // Try to update existing record
            const updateResult = await BatchEntryRawMaterials.update(
              {
                original_product_tag_vendor_id:
                  material.original_product_tag_vendor_id,
                replacement_product_tag_vendor_id:
                  material.replacement_product_tag_vendor_id,
                quantity_required: material.quantity_required,
                is_replacement: material.is_replacement,
                status: material.status,
                isDeleted: false,
              },
              {
                where: { id: material.tag_id },
                transaction,
              }
            );

            if (updateResult[0] === 0) {
              console.warn(
                `Material tag_id ${material.tag_id} not found, will create new record`
              );
            } else {
              console.log(
                `Updated existing material record with tag_id: ${material.tag_id}`
              );
              return;
            }
          }

          const existingRecord = await BatchEntryRawMaterials.findOne({
            where: {
              batch_entry_id: id,
              original_product_tag_vendor_id:
                material.original_product_tag_vendor_id,
              replacement_product_tag_vendor_id:
                material.replacement_product_tag_vendor_id || null,
              isDeleted: true,
            },
            transaction,
          });

          if (existingRecord) {
            await BatchEntryRawMaterials.update(
              {
                quantity_required: material.quantity_required,
                is_replacement: material.is_replacement,
                status: material.status,
                isDeleted: false,
              },
              {
                where: { id: existingRecord.id },
                transaction,
              }
            );
            console.log(
              `Reactivated existing material record ID: ${existingRecord.id}`
            );
          } else {
            // Create new record
            await BatchEntryRawMaterials.create(
              {
                batch_entry_id: id,
                original_product_tag_vendor_id:
                  material.original_product_tag_vendor_id,
                replacement_product_tag_vendor_id:
                  material.replacement_product_tag_vendor_id,
                quantity_required: material.quantity_required,
                is_replacement: material.is_replacement,
                status: material.status,
                isDeleted: false,
              },
              { transaction }
            );
            console.log(`Created new material record for: ${materialKey}`);
          }
        })
      );

      await BatchEntryCost.update(
        {
          isDeleted: true,
        },
        {
          where: {
            batch_entry_id: id,
          },
          transaction,
        }
      );

      const processedCosts = new Set();

      await Promise.all(
        cost_items.map(async (cost, index) => {
          const costKey = `${cost.cost_type}_${cost.amount}_${
            cost.remarks || ""
          }`;

          if (processedCosts.has(costKey)) {
            console.warn(`Duplicate cost detected: ${costKey}, skipping...`);
            return;
          }
          processedCosts.add(costKey);

          if (cost.tag_id) {
            // Try to update existing record
            const updateResult = await BatchEntryCost.update(
              {
                cost_type: cost.cost_type,
                cost_amount: cost.amount,
                remarks: cost.remarks,
                isDeleted: false,
              },
              {
                where: { id: cost.tag_id },
                transaction,
              }
            );

            if (updateResult[0] === 0) {
              console.warn(
                `Cost tag_id ${cost.tag_id} not found, will create new record`
              );
            } else {
              console.log(
                `Updated existing cost record with tag_id: ${cost.tag_id}`
              );
              return;
            }
          }

          const existingRecord = await BatchEntryCost.findOne({
            where: {
              batch_entry_id: id,
              cost_type: cost.cost_type,
              cost_amount: cost.amount,
              remarks: cost.remarks || null,
              isDeleted: true,
            },
            transaction,
          });

          if (existingRecord) {
            await BatchEntryCost.update(
              {
                isDeleted: false,
              },
              {
                where: { id: existingRecord.id },
                transaction,
              }
            );
            console.log(
              `Reactivated existing cost record ID: ${existingRecord.id}`
            );
          } else {
            // Create new record
            await BatchEntryCost.create(
              {
                batch_entry_id: id,
                cost_type: cost.cost_type,
                cost_amount: cost.amount,
                remarks: cost.remarks,
                isDeleted: false,
              },
              { transaction }
            );
            console.log(`Created new cost record for: ${costKey}`);
          }
        })
      );

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Batch entry updated successfully",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating batch entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getBatchEntryData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { fromDate, toDate, status } = req.query;

    let whereClause = {};

    if (fromDate || toDate) {
      whereClause.createdAt = {};

      if (fromDate) {
        const startDate = new Date(fromDate + " 00:00:00");
        whereClause.createdAt[Op.gte] = startDate;
        console.log("Start date filter:", startDate);
      }

      if (toDate) {
        const endDate = new Date(toDate + " 23:59:59");
        whereClause.createdAt[Op.lte] = endDate;
        console.log("End date filter:", endDate);
      }
    }

    if (status && status.trim() !== "") {
      whereClause.status = status;
      console.log("Status filter:", status);
    }

    const { count, rows } = await BatchEntryMain.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MasterList,
          required: true,
          attributes: ["id", "fname", "mname", "lname"],
        },
        {
          model: BatchEntryMixer,
          where: {
            isDeleted: false,
          },
          include: [
            {
              model: Mixer,
              required: false,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: BatchEntryReprint,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    console.log(`Found ${count} records matching filters`);

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
      appliedFilters: {
        fromDate,
        toDate,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching batch entry data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getBatchEntryBySearch").get(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const searchCategory = req.query.searchCategory || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let searchCondition = {};
    let masterListCondition = {};

    if (searchText) {
      switch (searchCategory) {
        case "batch_no":
          searchCondition = {
            batch_transaction_number: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "start_date":
          const startDateConditions = createDateTimeSearchConditions(
            "batch_entry_main",
            searchText,
            "start_date"
          );
          searchCondition = {
            [Op.or]: startDateConditions,
          };
          break;
        case "end_date":
          const endDateConditions = createDateTimeSearchConditions(
            "batch_entry_main",
            searchText,
            "end_date"
          );

          searchCondition = {
            [Op.or]: endDateConditions,
          };
          break;
        case "status":
          searchCondition = {
            status: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "created_by":
          masterListCondition = {
            [Op.or]: [
              { fname: { [Op.like]: `%${searchText}%` } },
              { mname: { [Op.like]: `%${searchText}%` } },
              { lname: { [Op.like]: `%${searchText}%` } },
            ],
          };
          break;
        case "mixer":
          searchCondition = {
            "$batch_entry_tag_mixers.mixer.name$": {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        default:
          searchCondition = {
            [Op.or]: [
              { batch_transaction_number: { [Op.like]: `%${searchText}%` } },
              ...createDateTimeSearchConditions(
                "batch_entry_main",
                searchText,
                "start_date"
              ),
              ...createDateTimeSearchConditions(
                "batch_entry_main",
                searchText,
                "end_date"
              ),
              ...createDateTimeSearchConditions(
                "batch_entry_main",
                searchText,
                "createdAt"
              ),
              { status: { [Op.like]: `%${searchText}%` } },
              { "$masterlist.fname$": { [Op.like]: `%${searchText}%` } },
              { "$masterlist.mname$": { [Op.like]: `%${searchText}%` } },
              { "$masterlist.lname$": { [Op.like]: `%${searchText}%` } },
              {
                "$batch_entry_tag_mixers.mixer.name$": {
                  [Op.like]: `%${searchText}%`,
                },
              },
            ],
          };
      }
    }

    const includeOptions = [
      {
        model: MasterList,
        required: true,
        attributes: ["fname", "mname", "lname"],
        where: Object.keys(masterListCondition).length
          ? masterListCondition
          : {},
      },
      {
        model: BatchEntryMixer,
        where: {
          isDeleted: false,
        },
        required: false,
        include: [
          {
            model: Mixer,
            required: false,
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: BatchEntryReprint,
        required: false,
      },
    ];

    const queryOptions = {
      where: searchCondition,
      include: includeOptions,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      subQuery: false,
    };

    if (searchCategory === "mixer" && searchText) {
      queryOptions.include[1].required = true;
      queryOptions.include[1].include[0].required = true;
    }

    const { count, rows } = await BatchEntryMain.findAndCountAll(queryOptions);

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error in batch entry search:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getCounts").get(async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    let whereClause = {};

    if (fromDate && toDate) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(fromDate + " 00:00:00"),
          new Date(toDate + " 23:59:59"),
        ],
      };
    } else if (fromDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(fromDate + " 00:00:00"),
      };
    } else if (toDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(toDate + " 23:59:59"),
      };
    }

    const forPrintingCount = await BatchEntryMain.count({
      where: {
        ...whereClause,
        status: "For-Printing",
      },
    });

    const printedCount = await BatchEntryMain.count({
      where: {
        ...whereClause,
        status: "Printed",
      },
    });

    const totalCount = await BatchEntryMain.count({
      where: whereClause,
    });

    return res.status(200).json({
      forPrinting: forPrintingCount,
      printed: printedCount,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getSpecificBatchEntry").get(async (req, res) => {
  try {
    const batchSpecificData = await BatchEntryMain.findOne({
      where: {
        id: req.query.id,
      },
      include: [
        {
          model: BatchEntryMixer,
          include: [
            {
              model: Mixer,
              required: false,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: BatchEntryInvoice,
          include: [
            {
              model: SalesInvoice,
              required: false,
              include: [
                {
                  model: SalesInvoiceTagProduct,
                  include: [
                    {
                      model: ProductList,
                      attributes: [
                        "product_id",
                        "product_code",
                        "client_code",
                        "product_name",
                        "product_category",
                        "reserved",
                      ],
                      include: [
                        {
                          model: Packaging,
                          as: "prod_packaging",
                          attributes: ["id", "packaging_name"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: BatchEntryRawMaterials,
          include: [
            {
              model: Product_Tag_Vendor,
              as: "original_material",
              include: [
                {
                  model: ProductList,
                  attributes: [
                    "product_id",
                    "product_code",
                    "client_code",
                    "product_name",
                    "product_category",
                  ],
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      attributes: ["id", "packaging_name"],
                    },
                  ],
                },
                {
                  model: Vendors,

                  attributes: ["id", "company_name"],
                },
              ],
            },
            {
              model: Product_Tag_Vendor,
              as: "replacement_material",
              include: [
                {
                  model: ProductList,
                  attributes: [
                    "product_id",
                    "product_code",
                    "client_code",
                    "product_name",
                    "product_category",
                  ],
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      attributes: ["id", "packaging_name"],
                    },
                  ],
                },
                {
                  model: Vendors,
                  attributes: ["id", "company_name"],
                },
              ],
            },
          ],
        },
        { model: BatchEntryCost },
      ],
    });
    return res.status(200).json(batchSpecificData);
  } catch (error) {
    console.error("Error on getting the specific batch entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/requestCreateReprint").post(async (req, res) => {
  try {
    const { ids, userLoggedID, remarks } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid IDs array",
      });
    }

    const validIds = ids.filter(
      (id) => id !== null && id !== undefined && id !== ""
    );
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid IDs provided",
      });
    }

    const reprintRequests = [];

    for (const id of validIds) {
      const reprintRequest = await BatchEntryReprint.create({
        batch_entry_id: id,
        requestor: userLoggedID,
        approver: null,
        date_requested: new Date(),
        date_approved: null,
        remarks: remarks,
        status: "For-Approval",
      });

      reprintRequests.push(reprintRequest);
    }

    return res.status(200).json({
      success: true,
      message: `Reprint requests created successfully for ${validIds.length} item(s)`,
      data: {
        processedIds: validIds,
        requestCount: validIds.length,
        createdRequests: reprintRequests,
      },
    });
  } catch (error) {
    console.error("Error on creation of reprint:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getReprintData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { fromDate, toDate, status } = req.query;

    let whereClause = {};

    // Helper function to check if a value is meaningful
    const isValidValue = (value) => {
      return (
        value &&
        value !== "undefined" &&
        value !== "null" &&
        value.toString().trim() !== ""
      );
    };

    // Check for fromDate
    if (isValidValue(fromDate)) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      whereClause.date_requested = {
        ...(whereClause.date_requested || {}),
        [Op.gte]: startDate,
      };
    }

    // Check for toDate
    if (isValidValue(toDate)) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      whereClause.date_requested = {
        ...(whereClause.date_requested || {}),
        [Op.lte]: endDate,
      };
    }

    if (isValidValue(status)) {
      whereClause.status = status;
    }

    console.log("Applied where clause:", whereClause);
    console.log("Query params:", { fromDate, toDate, status });

    const { count, rows } = await BatchEntryReprint.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: BatchEntryMain,
          required: false,
        },
        {
          model: MasterList,
          attributes: ["id", "fname", "mname", "lname"],
          as: "batch_requested_by",
        },
        {
          model: MasterList,
          attributes: ["id", "fname", "mname", "lname"],
          as: "batch_approved_by",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
      appliedFilters: {
        fromDate,
        toDate,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching batch entry data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getReprintBySearch").get(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const searchCategory = req.query.searchCategory || "all";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let searchCondition = {};
    let batchEntryMainCondition = {};
    let requestorCondition = {};
    let approverCondition = {};

    if (searchText) {
      switch (searchCategory) {
        case "batch_no":
          batchEntryMainCondition = {
            batch_transaction_number: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "start_date":
          searchCondition = {
            [Op.and]: [
              sequelize.where(
                sequelize.fn(
                  "DATE_FORMAT",
                  sequelize.col("date_requested"),
                  "%Y-%m-%d"
                ),
                { [Op.like]: `%${searchText}%` }
              ),
            ],
          };
          break;
        case "end_date":
          searchCondition = {
            [Op.and]: [
              sequelize.where(
                sequelize.fn(
                  "DATE_FORMAT",
                  sequelize.col("date_approved"),
                  "%Y-%m-%d"
                ),
                { [Op.like]: `%${searchText}%` }
              ),
            ],
          };
          break;
        case "status":
          searchCondition = {
            status: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "requestor":
          requestorCondition = {
            [Op.or]: [
              { fname: { [Op.like]: `%${searchText}%` } },
              { mname: { [Op.like]: `%${searchText}%` } },
              { lname: { [Op.like]: `%${searchText}%` } },
            ],
          };
          break;
        case "approver":
          approverCondition = {
            [Op.or]: [
              { fname: { [Op.like]: `%${searchText}%` } },
              { mname: { [Op.like]: `%${searchText}%` } },
              { lname: { [Op.like]: `%${searchText}%` } },
            ],
          };
          break;
        default:
          // Global search across all fields
          searchCondition = {
            [Op.or]: [
              sequelize.where(
                sequelize.fn(
                  "DATE_FORMAT",
                  sequelize.col("date_requested"),
                  "%Y-%m-%d"
                ),
                { [Op.like]: `%${searchText}%` }
              ),
              sequelize.where(
                sequelize.fn(
                  "DATE_FORMAT",
                  sequelize.col("date_approved"),
                  "%Y-%m-%d"
                ),
                { [Op.like]: `%${searchText}%` }
              ),
              { status: { [Op.like]: `%${searchText}%` } },
              {
                "$batch_entry_main.batch_transaction_number$": {
                  [Op.like]: `%${searchText}%`,
                },
              },
              {
                "$batch_requested_by.fname$": { [Op.like]: `%${searchText}%` },
              },
              {
                "$batch_requested_by.mname$": { [Op.like]: `%${searchText}%` },
              },
              {
                "$batch_requested_by.lname$": { [Op.like]: `%${searchText}%` },
              },
              { "$batch_approved_by.fname$": { [Op.like]: `%${searchText}%` } },
              { "$batch_approved_by.mname$": { [Op.like]: `%${searchText}%` } },
              { "$batch_approved_by.lname$": { [Op.like]: `%${searchText}%` } },
            ],
          };
      }
    }

    const includeOptions = [
      {
        model: BatchEntryMain,
        required: false,
        where: Object.keys(batchEntryMainCondition).length
          ? batchEntryMainCondition
          : {},
      },
      {
        model: MasterList,
        attributes: ["id", "fname", "mname", "lname"],
        as: "batch_requested_by",
        required: false,
        where: Object.keys(requestorCondition).length ? requestorCondition : {},
      },
      {
        model: MasterList,
        attributes: ["id", "fname", "mname", "lname"],
        as: "batch_approved_by",
        required: false,
        where: Object.keys(approverCondition).length ? approverCondition : {},
      },
    ];

    const queryOptions = {
      where: searchCondition,
      include: includeOptions,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      subQuery: false,
    };

    const { count, rows } = await BatchEntryReprint.findAndCountAll(
      queryOptions
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
      appliedFilters: {
        searchText,
        searchCategory,
      },
    });
  } catch (error) {
    console.error("Error in batch entry search:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/approveRejectBatch").post(async (req, res) => {
  try {
    const { batch_ids, status, action, userLoggedID, remarks } = req.body;

    // Validation remains the same
    if (!batch_ids || !Array.isArray(batch_ids) || batch_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "batch_ids is required and must be a non-empty array",
      });
    }

    if (!status || !["Approved", "Declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "status is required and must be either 'Approved' or 'Declined'",
      });
    }

    if (!action || !["approve", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action is required and must be either 'approve' or 'decline'",
      });
    }

    // Check existing batches
    const existingBatches = await BatchEntryReprint.findAll({
      where: {
        id: batch_ids,
      },
      attributes: ["id", "status"],
    });

    if (existingBatches.length !== batch_ids.length) {
      const foundIds = existingBatches.map((batch) => batch.id);
      const missingIds = batch_ids.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        success: false,
        message: `Some batch entries were not found`,
        missing_ids: missingIds,
      });
    }

    const invalidStatusBatches = existingBatches.filter(
      (batch) => batch.status !== "For-Approval"
    );
    if (invalidStatusBatches.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Some selected batches are not in 'For-Approval' status and cannot be processed",
        invalid_batches: invalidStatusBatches.map((batch) => ({
          id: batch.id,
          current_status: batch.status,
        })),
      });
    }

    // Prepare update data based on status
    const updateData = {
      status: status,
    };

    if (status === "Approved") {
      updateData.approved_remarks = remarks;
      updateData.approver = userLoggedID;
      updateData.date_approved = new Date();
    } else if (status === "Declined") {
      updateData.declinedRemarks = remarks;
      updateData.declinedBy = userLoggedID;
      updateData.declinedAt = new Date();
    }

    const updateResult = await BatchEntryReprint.update(updateData, {
      where: {
        id: batch_ids,
      },
    });

    const [affectedRowsCount] = updateResult;
    if (affectedRowsCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No records were updated",
      });
    }

    const updatedBatches = await BatchEntryReprint.findAll({
      where: {
        id: batch_ids,
      },
      attributes: ["id", "status", "date_approved", "declinedAt"],
    });

    return res.status(200).json({
      success: true,
      message: `Successfully ${action}d ${affectedRowsCount} batch ${
        affectedRowsCount === 1 ? "entry" : "entries"
      }`,
      data: {
        action: action,
        status: status,
        affected_count: affectedRowsCount,
        updated_batches: updatedBatches,
      },
    });
  } catch (error) {
    console.error("Error approve or decline batch:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    if (error.name === "SequelizeDatabaseError") {
      return res.status(500).json({
        success: false,
        message: "Database error occurred",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.route("/getBatchTicketData").get(async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "No IDs provided",
      });
    }

    const selectedIds = ids.split(",").map((id) => id.trim());

    const batchEntries = await BatchEntryMain.findAll({
      where: {
        id: selectedIds,
      },
      include: [
        {
          model: BatchEntryMixer,
          include: [
            {
              model: Mixer,
              required: false,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: BatchEntryInvoice,
          include: [
            {
              model: SalesInvoice,
              required: false,
              include: [
                {
                  model: SalesInvoiceTagProduct,
                  include: [
                    {
                      model: ProductList,
                      attributes: [
                        "product_id",
                        "product_code",
                        "client_code",
                        "product_name",
                        "product_category",
                        "reserved",
                      ],
                      include: [
                        {
                          model: Packaging,
                          as: "prod_packaging",
                          attributes: ["id", "packaging_name"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: BatchEntryRawMaterials,
          include: [
            {
              model: Product_Tag_Vendor,
              as: "original_material",
              include: [
                {
                  model: ProductList,
                  attributes: [
                    "product_id",
                    "product_code",
                    "client_code",
                    "product_name",
                    "product_category",
                  ],
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      attributes: ["id", "packaging_name"],
                    },
                  ],
                },
                {
                  model: Vendors,
                  attributes: ["id", "company_name"],
                },
              ],
            },
            {
              model: Product_Tag_Vendor,
              as: "replacement_material",
              include: [
                {
                  model: ProductList,
                  attributes: [
                    "product_id",
                    "product_code",
                    "client_code",
                    "product_name",
                    "product_category",
                  ],
                  include: [
                    {
                      model: Packaging,
                      as: "prod_packaging",
                      attributes: ["id", "packaging_name"],
                    },
                  ],
                },
                {
                  model: Vendors,
                  attributes: ["id", "company_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    const serializeSequelizeObject = (obj) => {
      if (!obj) return null;
      if (Array.isArray(obj)) {
        return obj.map(serializeSequelizeObject);
      }
      if (obj.toJSON && typeof obj.toJSON === "function") {
        return obj.toJSON();
      }
      if (typeof obj === "object") {
        const serialized = {};
        for (const key in obj) {
          if (
            obj.hasOwnProperty(key) &&
            key !== "include" &&
            key !== "parent"
          ) {
            serialized[key] = serializeSequelizeObject(obj[key]);
          }
        }
        return serialized;
      }
      return obj;
    };

    const ticketPages = [];

    for (const batchEntry of batchEntries) {
      const serializedBatchEntry = serializeSequelizeObject(batchEntry);
      const allProducts = [];

      if (serializedBatchEntry.batch_entry_tag_invoices) {
        for (const invoiceTag of serializedBatchEntry.batch_entry_tag_invoices) {
          if (
            invoiceTag.sales_invoice &&
            invoiceTag.sales_invoice.sales_invoice_tag_products
          ) {
            for (const productTag of invoiceTag.sales_invoice
              .sales_invoice_tag_products) {
              allProducts.push({
                product: productTag.product_list,
                salesInvoice: invoiceTag.sales_invoice,
                productDetails: productTag,
              });
            }
          }
        }
      }

      if (allProducts.length === 0) {
        const ticketPage = {
          id: serializedBatchEntry.id,
          batch_transaction_number:
            serializedBatchEntry.batch_transaction_number,
          batch_name: serializedBatchEntry.batch_name,
          batch_remarks: serializedBatchEntry.batch_remarks,
          start_date: serializedBatchEntry.start_date,
          end_date: serializedBatchEntry.end_date,
          status: serializedBatchEntry.status,
          created_by: serializedBatchEntry.created_by,
          batch_entry_tag_mixers: serializedBatchEntry.batch_entry_tag_mixers,
          batch_entry_tag_invoices:
            serializedBatchEntry.batch_entry_tag_invoices,
          batch_entry_tag_raw_materials:
            serializedBatchEntry.batch_entry_tag_raw_materials,
          current_product: null,
          product_quantity: 0,
          product_unit_price: 0,
          product_subtotal: 0,
        };
        ticketPages.push(ticketPage);
      } else {
        for (const productInfo of allProducts) {
          const ticketPage = {
            id: `${serializedBatchEntry.id}_${productInfo.product.product_id}`,
            batch_transaction_number:
              serializedBatchEntry.batch_transaction_number,
            batch_name: productInfo.product.product_name,
            batch_remarks: serializedBatchEntry.batch_remarks,
            start_date: serializedBatchEntry.start_date,
            end_date: serializedBatchEntry.end_date,
            status: serializedBatchEntry.status,
            created_by: serializedBatchEntry.created_by,
            batch_entry_tag_mixers: serializedBatchEntry.batch_entry_tag_mixers,
            batch_entry_tag_invoices: [
              {
                id: productInfo.salesInvoice.id || null,
                batch_entry_id: productInfo.salesInvoice.batch_entry_id || null,
                sales_invoice_id:
                  productInfo.salesInvoice.sales_invoice_id || null,
                sales_invoice: {
                  ...productInfo.salesInvoice,
                  sales_invoice_tag_products: [productInfo.productDetails],
                },
              },
            ],

            batch_entry_tag_raw_materials:
              serializedBatchEntry.batch_entry_tag_raw_materials,

            current_product: productInfo.product,
            product_quantity: productInfo.productDetails.quantity || 0,
            product_unit_price: productInfo.productDetails.unit_price || 0,
            product_subtotal: productInfo.productDetails.subtotal || 0,
          };

          ticketPages.push(ticketPage);
        }
      }
    }

    // console.log(
    //   `Generated ${ticketPages.length} ticket pages for ${batchEntries.length} batch entries`
    // );

    res.status(200).json({
      success: true,
      data: ticketPages,
      message: "Batch ticket data retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getBatchTicketData:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/updateBatchStatus").post(async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No batch IDs provided or invalid format",
      });
    }

    const [updatedRowsCount] = await BatchEntryMain.update(
      {
        status: "Printed",
      },
      {
        where: {
          id: ids,
        },
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No batch entries found with the provided IDs",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedRowsCount} batch entries to 'Printed' status`,
      updatedCount: updatedRowsCount,
    });
  } catch (error) {
    console.error("Error updating status in batch entry:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// reprint list for red dot sa batch entry
router.route("/fetchReprintList").get(async (req, res) => {
  try {
    // Get count of BatchEntryReprint records with status "For-Approval"
    const count = await BatchEntryReprint.count({
      where: {
        status: "For-Approval",
      },
    });

    return res.status(200).json({
      success: true,
      count: count,
    });
  } catch (error) {
    console.error("Error in batch entry search:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
module.exports = router;
