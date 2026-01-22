const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AccountList = sequelize.define("account_list", {
  account_list_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_type: {
    type: DataTypes.STRING,
  },
  account_name: {
    type: DataTypes.STRING,
  },
  account_number: {
    type: DataTypes.STRING,
  },
  bank_name: {
    type: DataTypes.STRING,
  },
  masterlist_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  bank_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  maintain_balance: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
  },
});

module.exports = AccountList;
