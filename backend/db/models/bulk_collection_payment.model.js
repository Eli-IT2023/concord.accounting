const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BulkCollectionPayment = sequelize.define("bulk_collection_payment", {
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
  account_list_sub3_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  payment_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  check_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ref_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  date_issued: {
    type: DataTypes.DATEONLY,
  },
  check_or_online: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isFromLoan: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  collected_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = BulkCollectionPayment;
