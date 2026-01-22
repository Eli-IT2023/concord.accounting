const sequelize = require("../config/sequelize.config");
const { DataTypes, DATEONLY, INTEGER } = require("sequelize");

const Payable = sequelize.define("payable", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  client_transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
  },
  vendor_id: {
    type: DataTypes.CHAR,
  },
  MOP: {
    type: DataTypes.STRING,
  },
  domestic_type: {
    type: DataTypes.STRING,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },
  tracking_number: {
    type: DataTypes.STRING,
  },
  isPercent_Discount: {
    type: DataTypes.BOOLEAN,
  },
  discount_value: {
    type: DataTypes.DOUBLE,
  },
  weighing_fee: {
    type: DataTypes.DOUBLE,
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.STRING,
  },
  isAdded: {
    type: DataTypes.BOOLEAN,
  },
  totalPrice: {
    type: DataTypes.DOUBLE,
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
  },
  notification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  currencyId: {
    type: DataTypes.CHAR,
  },
  description: {
    type: DataTypes.STRING(2000),
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  container_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
  date_approved: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Payable;
