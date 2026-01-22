const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PurchaseOrder = sequelize.define("purchase_order", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  vendor_id: {
    type: DataTypes.CHAR,
  },
  pr_id: {
    type: DataTypes.CHAR,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
  },
  tax_id: {
    type: DataTypes.CHAR,
  },
  po_number: {
    type: DataTypes.STRING,
  },
  delivery_date: {
    type: DataTypes.STRING,
  },
  po_date: {
    type: DataTypes.STRING,
  },
  shipping_method: {
    type: DataTypes.STRING,
  },
  payment_term: {
    type: DataTypes.STRING,
  },
  tax_rate: {
    type: DataTypes.DOUBLE,
  },
  vat_rate: {
    type: DataTypes.DOUBLE,
  },
  subtotal: {
    type: DataTypes.DOUBLE,
  },
  vat_amount: {
    type: DataTypes.DOUBLE,
  },
  tax_amount: {
    type: DataTypes.DOUBLE,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  payment_status: {
    type: DataTypes.STRING,
  },

  preparedBy: {
    type: DataTypes.CHAR,
  },
  approvedBy: {
    type: DataTypes.CHAR,
  },
  approveRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  rejectedBy: {
    type: DataTypes.CHAR,
  },
  rejectRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  cancelledBy: {
    type: DataTypes.CHAR,
  },
  cancelRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = PurchaseOrder;
