const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BulkCollectionTransaction = sequelize.define(
  "bulk_collection_transaction",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    bulk_collection_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    sales_invoice_id: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
      comment: "soft delete",
    },
  }
);

module.exports = BulkCollectionTransaction;
