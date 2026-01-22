const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Payable_Bulk = sequelize.define("payable_bulk", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_number: {
    type: DataTypes.STRING,
  },
  payable_date: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.STRING,
  },
  vendor_id: {
    type: DataTypes.CHAR,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlistID approve/reject",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Payable_Bulk;
