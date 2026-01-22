const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AccountListSub3 = sequelize.define("account_list_sub3", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_list_base_sub_id: {
    type: DataTypes.CHAR,
  },
  account_name: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  investment_amount: {
    //for calculatio of share percentage
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  created_by: {
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

module.exports = AccountListSub3;
