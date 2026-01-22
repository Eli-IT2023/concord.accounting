const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BulkCollection = sequelize.define("bulk_collection", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  customer_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  collection_date: {
    type: DataTypes.DATEONLY,
  },
  transaction_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  module_from: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: false,
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
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = BulkCollection;
