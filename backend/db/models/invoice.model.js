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
  client_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customer_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  account_list_sub3_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  liability_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
  },
  payment_method: {
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
  payment_terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transaction_discount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  item_discount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  shipping_fee: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  discount_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  payAdded: {
    //para malaman kung already added na sa collection transaction
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  remarks: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  dr_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  po_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  container_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id: For approver and rejector",
  },
  date_approved: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "rate",
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
    comment: "amount of container",
  },
  quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 0,
    comment: "quantity of container",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
  isReturn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = SalesInvoice;
