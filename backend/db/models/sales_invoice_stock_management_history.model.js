const sequelize = require("../config/sequelize.config");
const { DataTypes, Transaction, STRING } = require("sequelize");

const SalesInvoiceStockManagementHistory = sequelize.define(
  "sales_invoice_stock_management_history",
  {
    id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    stock_management_id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: false,
    },
    sales_invoice_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    deducted_stock: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "Quantity of stock deducted for the sales invoice",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: "soft delete",
    },
  }
);

module.exports = SalesInvoiceStockManagementHistory;
