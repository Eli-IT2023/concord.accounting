const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnProduct = sequelize.define("return_product", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  title: {
    type: DataTypes.STRING,
  },
  return_product_code: {
    type: DataTypes.STRING,
  },

  total_weight: {
    type: DataTypes.DOUBLE,
  },
  move_to: {
    type: DataTypes.STRING,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.CHAR,
  },
  approvedBy: {
    type: DataTypes.CHAR,
  },
  approvedRemarks: {
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
  rejectedRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  closedBy: {
    type: DataTypes.CHAR,
  },
  closedRemarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = ReturnProduct;
