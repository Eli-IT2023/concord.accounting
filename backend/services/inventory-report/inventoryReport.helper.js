const sequelize = require("../../db/config/sequelize.config");

const escape = (value) => `${sequelize.escape(value)}`;

// For date conditions
const createConditions = (startDate, endDate) => {
  const dateConditions = {
    between: `BETWEEN ${escape(startDate)} AND ${escape(endDate)}`,
    lessThanStart: `< ${escape(startDate)}`,
    lessThanEqualEnd: `<= ${escape(endDate)}`,
  };

  return dateConditions;
};

// prettier-ignore
// For Inventory counting
const sumInventoryCounting = (dateCondition, col) => `
  SUM(
    COALESCE(
      CASE
        WHEN date_in ${dateCondition} AND type IS NULL AND (module_from = "Inventory Counting" OR is_overridden = false) THEN ${col}
        ELSE 0
      END,
    0)
  )
`;

// Helper: Returns an SQL SUM expression filtered by date condition and entry type.
const sumAmount = (dateCondition, entryType, col, inventoryMovement = null) => {
  const ignoreInventoryCounting =
    inventoryMovement === "productTotals"
      ? "AND module_from != 'Inventory Counting'"
      : "";

  return `
    SUM(
      COALESCE(
        CASE
          WHEN date_in ${dateCondition} AND type = ${escape(entryType)} 
            ${ignoreInventoryCounting} -- For product in and out: disregard numbers from inventory counting module
            THEN ${col}
          ELSE 0
        END,
      0)
    )
  `;
};

// Helper: get the sum of all "in" entry
const sumIncoming = (column) => `
  SUM(
    COALESCE(
      CASE
        WHEN type = "in" THEN ${column}
        ELSE 0
      END,
    0)
  )
`;

// prettier-ignore
// For the calculation of Beginning Inventory and Final Inventory column (Table)
const endingInventory = (dateCondition) => {
  // Total without inventory counting
  const totalInUnitPrice = sumAmount(dateCondition, "in", "unit_price * quantity");
  const totalOutUnitPrice = sumAmount(dateCondition, "out", "unit_price * quantity");
  
  const endingInventoryQuantity = `(${sumAmount(dateCondition, "in", "quantity")} - ${sumAmount(dateCondition, "out", "quantity")})`;
  const endingInventoryAmount = `(${totalInUnitPrice} - ${totalOutUnitPrice})`;

  // Total inventory counting
  const inventoryCountingPrice = sumInventoryCounting(dateCondition, "unit_price * quantity");
  const inventoryCountingQuantity = sumInventoryCounting(dateCondition, "quantity");

  // return { 
  //   endingInventoryQuantity: `${endingInventoryQuantity} + ${inventoryCountingQuantity}`, 
  //   endingInventoryAmount: `${endingInventoryAmount} + ${inventoryCountingPrice}`
  // }

  return {
    endingInventoryQuantity,
    endingInventoryAmount
  }
}

// prettier-ignore
// For the calculation of Product In and Product Out column (Table)
const productTotals = (dateCondition, entryType) => {
  const movementTotalsQuantity = sumAmount(dateCondition, entryType, "quantity", "productTotals");
  const movementTotalsAmount = sumAmount(dateCondition, entryType, "unit_price * quantity", "productTotals");

  return {
    movementTotalsQuantity,
    movementTotalsAmount
  }
}

// For inventory consistency rule: zero quantity means zero value
const zeroAmountWhenZeroQuantity = (quantity, amount) => {
  return `
    CASE
      WHEN (${quantity}) = 0 THEN 0
      ELSE (${amount})
    END
  `;
};

// prettier-ignore
// This will determine the Beginning Inventory, Product In, Product Out and Final Inventory (Quantity, Avg. Price and Amount) columns
const calculations = (dateCondition, entryType) => {
  const { endingInventoryQuantity, endingInventoryAmount } = endingInventory(dateCondition);
  const { movementTotalsQuantity, movementTotalsAmount } = productTotals(dateCondition, entryType);

  return {
    // For Beginning and Final Inventory
    endingInventory: {
      totalQuantity: endingInventoryQuantity,
      averagePrice: `COALESCE((${endingInventoryAmount}) / (${endingInventoryQuantity}), 0)`,
      totalAmount: endingInventoryAmount,
    },
    // For Product In and Out
    productTotals: {
      totalQuantity: movementTotalsQuantity,
      averagePrice: `COALESCE((${movementTotalsAmount}) / (${movementTotalsQuantity}), 0)`,
      totalAmount: movementTotalsAmount,
    }
  }
}

// prettier-ignore
// Helper: Returns Sequelize attributes for quantity, average price, and amount
const getAttributes = (dateCondition, inventoryMovement, balance, entryType = null) => {
  const { totalQuantity, totalAmount, averagePrice } = calculations(dateCondition, entryType)[balance];

  return [
    [sequelize.literal(`${totalQuantity}`), `${inventoryMovement}Quantity`],
    [sequelize.literal(`${averagePrice}`), `${inventoryMovement}AveragePrice`],
    [sequelize.literal(`${zeroAmountWhenZeroQuantity(totalQuantity, totalAmount)}`), `${inventoryMovement}Amount`],
  ];
};

// List of attributes
const getAttributesSummary = (dateConditions) => {
  // prettier-ignore
  const attributeSummary = {
    beginningInventory: getAttributes(dateConditions.lessThanStart, "beginningInventory", "endingInventory", null), // "in" - "out" with date less than startDate
    productIn: getAttributes(dateConditions.between, "productIn", "productTotals", "in"), // sum all "in"
    productOut: getAttributes(dateConditions.between, "productOut", "productTotals", "out"), // sum all "out"
    finalInventory: getAttributes(dateConditions.lessThanEqualEnd, "finalInventory", "endingInventory", null), // "in" - "out" with date less than or equal endDate
  }

  return attributeSummary;
};

const calculateAveragePrice = (totalAmount, totalQuantity) => {
  const averagePrice = totalAmount / totalQuantity;
  return totalQuantity > 0 ? averagePrice : 0;
};

// prettier-ignore
// Get the average price for product out
const getAveragePrice = (inventory) => {
  const totalAmount = inventory.productInAmount + inventory.beginningInventoryAmount;
  const totalQuantity = inventory.productInQuantity + inventory.beginningInventoryQuantity;

  return calculateAveragePrice(totalAmount, totalQuantity)
};

// prettier-ignore
// Get the average price for product out, by getting the values after inventory counting + new "in" entries
const getAveragePriceAfterCounting = (inventoryCounting, totalIncoming) => {
  const totalAmount = inventoryCounting.totalAmount + totalIncoming.totalAmount;
  const totalQuantity = inventoryCounting.totalQuantity + totalIncoming.totalQuantity;
  
  return calculateAveragePrice(totalAmount, totalQuantity)
};

module.exports = {
  createConditions,
  getAttributes,
  getAttributesSummary,
  getAveragePrice,
  getAveragePriceAfterCounting,
  sumIncoming,
};
