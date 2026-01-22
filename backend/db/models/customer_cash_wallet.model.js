const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CustomerCashWallet = sequelize.define("customer_cash_wallet", {
  customer_cash_wallet_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  customer_id: {
    type: DataTypes.CHAR,
  },
  cash_type: {
    type: DataTypes.STRING,
  },
  check_number: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = CustomerCashWallet;
