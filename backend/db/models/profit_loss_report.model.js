const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ProfitLossReport = sequelize.define("profit_loss_report", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  issued_check_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  currency_rate: {
    type: DataTypes.DOUBLE,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
  },
  bank_transaction_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  collection_check_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
});

module.exports = ProfitLossReport;
