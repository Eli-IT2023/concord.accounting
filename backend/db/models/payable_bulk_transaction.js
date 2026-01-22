const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Payable_Bulk_Transaction = sequelize.define("payable_bulk_transaction", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  payable_bulk_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  payable_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Payable_Bulk_Transaction;
