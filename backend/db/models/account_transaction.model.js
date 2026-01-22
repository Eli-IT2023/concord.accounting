const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Account_Transaction = sequelize.define("account_transaction", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  account_list_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  receiver: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  withdrawal_option: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  used_for: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING("5000"),
    allowNull: true,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Account_Transaction;
