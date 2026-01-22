const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const StockTransfer = sequelize.define("stock_transfer_mother", {
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
  warehouse_from_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  warehouse_to_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },

  date_transfer: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Pending",
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
});

module.exports = StockTransfer;
