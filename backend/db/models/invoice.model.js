const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SalesInvoice = sequelize.define("sales_invoice", {
  sales_invoice_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invoice_title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sales_invoice: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  is_only_deliver_number: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  delivery_number: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  customer_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  po_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  invoice_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  payment_method: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  payment_terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  other_payment_terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_tax_applied: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  tax_settings_id: {
    type: DataTypes.CHAR,
    allowNull: true,
    defaultValue: null,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "currency rate",
  },
  remarks: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "For-Approval",
  },
  payAdded: {
    //para malaman kung already added na sa collection transaction
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "kung sino naglagay ng DR",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
  reserved: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "value sa pagreserve ng sales",
  },
  total_gross: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  withhold_tax: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  net_amount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  isAdded: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "checker kung na-add na sa batch entry",
  },
  isZeroRated: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  totalDiscountedAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
    comment: "total discounted amount",
  },
  taxRate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
    comment: "tax rate",
  },

  selectedTaxName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: "selected tax name for sales invoice",
  },
  vat_percentage: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  },
  vat_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  },
  sca_discount_percentage: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  },
  sca_discount_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  },
});

module.exports = SalesInvoice;
