const expense = require("./expenses/index.js");
const trialBalance = require("./trial-balance/index.js");
const inventoryReport = require("./inventory-report/index.js");
const stockManagement = require("./stock-management/index.js");
const stockTransfer = require("./stock-transfer/index.js");

module.exports = {
  expense,
  trialBalance,
  inventoryReport,
  stockManagement,
  stockTransfer,
};
