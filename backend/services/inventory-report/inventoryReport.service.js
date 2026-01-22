const Inventory_Journal = require("../../db/models/inventory_journal.model.js");
const ProductList = require("../../db/models/product.model.js");
const {
  createConditions,
  getAttributes,
  getAttributesSummary,
  sumIncoming,
} = require("./inventoryReport.helper.js");
const { Op } = require("sequelize");
const sequelize = require("../../db/config/sequelize.config.js");
const Cutoff = require("../../db/models/cutoff.model.js");
const Warehouse = require("../../db/models/warehouse.model.js");

const productCategories = [
  "Raw Materials",
  "Finish Product",
  "Consumables",
  // "Semi-Finished Product",
  // "Packaging",
];

// For inventory report Raw Materials, Finished Product and Consumables Tab
const getInventorySummary = async ({
  startDate,
  endDate,
  method,
  productListQueryOptions,
  inventoryJournalQueryOptions,
}) => {
  const dateConditions = createConditions(startDate, endDate);
  const attributeSummary = getAttributesSummary(dateConditions);

  // Get the inventory summary based on given query options
  const inventory = await Inventory_Journal[method]({
    // prettier-ignore
    attributes: [
      "product_id",
      [sequelize.col("product_code"), "productCode"],
      [sequelize.col("product_name"), "productName"],
      [sequelize.col("product_category"), "productCategory"],
      [sequelize.col("unit_of_measure"), "unitOfMeasure"],
      [sequelize.col("threshold"), "threshold"],
      [sequelize.fn("GROUP_CONCAT", sequelize.literal("DISTINCT name")), "warehouseName"],
      ...attributeSummary.beginningInventory,
      ...attributeSummary.productIn,
      ...attributeSummary.productOut,
      ...attributeSummary.finalInventory,
    ],
    include: [
      {
        model: ProductList,
        required: true,
        attributes: [],
        ...productListQueryOptions,
      },
      {
        model: Warehouse,
        required: true,
        attributes: [],
      },
    ],
    ...inventoryJournalQueryOptions,
  });

  return inventory;
};

// Get footer totals
const getInventoryTotal = async (attributes, productCategory) => {
  const total = await Inventory_Journal.findOne({
    attributes,
    include: [
      {
        model: ProductList,
        required: true,
        attributes: [],
        where: {
          product_category: productCategory,
          status: "Active",
        },
      },
    ],
    where: {
      isDeleted: false,
    },
    distinct: true,
    raw: true,
  });

  return total;
};

// prettier-ignore
// For Overview: Get the current and previous final inventory totals
const getBeginningAndFinalInventory = async (startDate, endDate) => {
  const dateConditions = createConditions(startDate, endDate);

  const attributeSummary = getAttributesSummary(dateConditions); // Get the attributes needed for footer total

  // Attributes to get the quantity, avg. price and amount of beginning and final inventory
  const attributesForTotal = [
    ...attributeSummary.beginningInventory,
    ...attributeSummary.finalInventory
  ];

  // Inventory report overview per product category
  const finalInventory = {};

  // Get the beginning and final inventory totals per product category
  await Promise.all(
    productCategories.map(async (category) => {
      finalInventory[category] = await getInventoryTotal(attributesForTotal, category)
    })   
  );

  return finalInventory;
};

// Get the inventory summary by product and warehouse
const getInventorySummaryByProduct = async ({
  selectedDate,
  productId,
  warehouseId,
  method, // Model method
  transaction = null, // For sequelize.transaction
}) => {
  // Get the current cutoff based on selected date
  const currentCutoff = await Cutoff.findOne({
    attributes: ["from", "to"],
    where: {
      from: {
        [Op.lte]: selectedDate,
      },
      to: {
        [Op.gte]: selectedDate,
      },
      isDeleted: false,
    },
    raw: true,
    ...(transaction && { transaction }),
  });

  // For ProductList query options
  const productListQueryOptions = {
    where: {
      product_id: productId,
      status: "Active",
    },
  };

  // For Inventory_Journal query options
  const inventoryJournalQueryOptions = {
    where: {
      warehouse_id: warehouseId,
      isDeleted: false,
    },
    raw: true,
    ...(transaction && { transaction }),
  };

  // Get the inventory summary
  const inventory = await getInventorySummary({
    startDate: currentCutoff?.from,
    endDate: currentCutoff?.to,
    method,
    productListQueryOptions,
    inventoryJournalQueryOptions,
  });

  return inventory;
};

// For COGs computation for product out
// Get the latest inventory counting from inventory journal
const getLatestInventoryCounting = async (productId, warehouseId) => {
  const inventoryCounting = await Inventory_Journal.findOne({
    // prettier-ignore
    attributes: [
      [sequelize.literal(`unit_price * quantity`), "totalAmount"],
      "quantity",
      "createdAt",
    ],
    where: {
      product_id: productId,
      warehouse_id: warehouseId,
      module_from: "Inventory Counting",
      type: "in",
      isDeleted: false,
    },
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  return {
    totalAmount: inventoryCounting?.totalAmount || 0,
    totalQuantity: inventoryCounting?.quantity || 0,
    createdAt: inventoryCounting?.createdAt || null,
  };
};

// For COGs computation for product out
// After inventory counting get the sum of new "in" entry from inventory journal
const getTotalIncoming = async ({ productId, warehouseId, createdAt }) => {
  const totalIncoming = await Inventory_Journal.findOne({
    // prettier-ignore
    attributes: [
      [sequelize.literal(`${sumIncoming("unit_price * quantity")}`), "totalAmount"],
      [sequelize.literal(`${sumIncoming("quantity")}`), "totalQuantity"],
    ],
    where: {
      product_id: productId,
      warehouse_id: warehouseId,
      isDeleted: false,
      createdAt: {
        [Op.gt]: createdAt,
      },
    },
    raw: true,
  });

  return {
    totalAmount: totalIncoming?.totalAmount || 0,
    totalQuantity: totalIncoming?.totalQuantity || 0,
  };
};

// Create a temporary table for the existing fetching then aggregate each column
const aggregateInventoryByCategory = async (inventory, productCategory) => {
  await sequelize.query(`
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_inventory (
      productCategory VARCHAR (50),
      productName VARCHAR (50),
      beginningInventoryAmount DOUBLE,
      beginningInventoryQuantity DOUBLE,
      productInAmount DOUBLE,
      productInQuantity DOUBLE,
      productOutAmount DOUBLE,
      productOutQuantity DOUBLE,
      finalInventoryAmount DOUBLE,
      finalInventoryQuantity DOUBLE,
      UNIQUE(productName, productCategory)
    )
  `);

  // Build the values to be inserted for bulk creation
  const values = inventory
    .map((item) => {
      return `('${item.productCategory}', '${item.productName}', 
      '${item.beginningInventoryAmount}', '${item.beginningInventoryQuantity}', 
      '${item.productInAmount}', '${item.productInQuantity}',
      '${item.productOutAmount}', '${item.productOutQuantity}',
      '${item.finalInventoryAmount}', '${item.finalInventoryQuantity}')`;
    })
    .join(", ");

  // Insert every product
  await sequelize.query(
    `
      INSERT IGNORE INTO temp_inventory (
      productCategory, productName,
      beginningInventoryAmount, beginningInventoryQuantity,
      productInAmount, productInQuantity,
      productOutAmount, productOutQuantity,
      finalInventoryAmount, finalInventoryQuantity
      )
      VALUES ${values}
      `
  );

  // Get the total amount per column
  const [total] = await sequelize.query(
    `
        SELECT 

        -- For beginning inventory
        SUM(beginningInventoryAmount) AS beginningInventoryAmount,
        COALESCE(SUM(beginningInventoryAmount) / SUM(beginningInventoryQuantity), 0) AS beginningInventoryAveragePrice,
        SUM(beginningInventoryQuantity) AS beginningInventoryQuantity,

        -- For product in
        SUM(productInAmount) AS productInAmount,
        COALESCE(SUM(productInAmount) / SUM(productInQuantity), 0) AS productInAveragePrice,
        SUM(productInQuantity) AS productInQuantity,

        -- For product out
        SUM(productOutAmount) AS productOutAmount,
        COALESCE(SUM(productOutAmount) / SUM(productOutQuantity), 0) AS productOutAveragePrice,
        SUM(productOutQuantity) AS productOutQuantity,

        -- For final inventory
        SUM(finalInventoryAmount) AS finalInventoryAmount,
        COALESCE(SUM(finalInventoryAmount) / SUM(finalInventoryQuantity), 0) AS finalInventoryAveragePrice,
        SUM(finalInventoryQuantity) AS finalInventoryQuantity

        FROM temp_inventory WHERE productCategory = '${productCategory}'
      `,
    {
      replacements: { productCategory },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return total;
};

// Get the inventory summary for table and footer total
const getInventorySummaryAndTotal = async (
  startDate,
  endDate,
  productCategory
) => {
  // For product list query options
  const productListQueryOptions = {
    where: {
      product_category: productCategory,
      status: "Active",
    },
  };

  // For inventory journal query options
  const inventoryJournalQueryOptions = {
    group: ["product_id"],
    where: {
      isDeleted: false,
    },
    raw: true,
  };

  // For inventory report tabs
  const inventory = await getInventorySummary({
    startDate,
    endDate,
    method: "findAll",
    productListQueryOptions,
    inventoryJournalQueryOptions,
  });

  // Get the footer totals
  const total = inventory.length
    ? await aggregateInventoryByCategory(inventory, productCategory)
    : {};

  return { inventory, total };
};

// Get the inventory summary per product category for overview
const getOverview = async (startDate, endDate) => {
  const finalInventory = {};

  await Promise.all(
    productCategories.map(async (category) => {
      const { inventory, total } = await getInventorySummaryAndTotal(
        startDate,
        endDate,
        category
      );
      finalInventory[category] = total;
    })
  );

  return finalInventory;
};

module.exports = {
  getInventorySummary,
  getInventoryTotal,
  getBeginningAndFinalInventory,
  getInventorySummaryByProduct,
  getLatestInventoryCounting,
  getTotalIncoming,
  aggregateInventoryByCategory,
  getInventorySummaryAndTotal,
  getOverview,
};
