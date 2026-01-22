const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const SampleProduct = sequelize.define("sample_product", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  sp_no: {
    type: DataTypes.STRING,
  },
  customer_id: {
    type: DataTypes.CHAR,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  date_requested: {
    type: DataTypes.DATE,
  },
  date_received: {
    type: DataTypes.DATE,
  },
  totalQuantity: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  requestedBy: {
    type: DataTypes.CHAR,
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  requestedRemarks: {
    type: DataTypes.TEXT,
  },
  approvedBy: {
    type: DataTypes.CHAR,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  approvedRemarks: {
    type: DataTypes.TEXT,
  },
  preparedBy: {
    type: DataTypes.CHAR,
  },
  preparedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  preparedRemarks: {
    type: DataTypes.TEXT,
  },
  dispatchedBy: {
    type: DataTypes.CHAR,
  },
  dispatchedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  dispatchedRemarks: {
    type: DataTypes.TEXT,
  },
  receivedBy: {
    type: DataTypes.CHAR,
  },
  receivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  receivedRemarks: {
    type: DataTypes.TEXT,
  },
  rejectedBy: {
    type: DataTypes.CHAR,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  rejectedRemarks: {
    type: DataTypes.TEXT,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = SampleProduct;
