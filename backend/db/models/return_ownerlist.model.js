const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReturnOwnerList = sequelize.define("return_owner_list", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  return_capital_mother_id: {
    type: DataTypes.CHAR,
  },
  account_list_sub3_id: {
    //owner_id
    type: DataTypes.CHAR,
  },
  invested_amount: {
    type: DataTypes.DOUBLE,
  },
  current_balance: {
    type: DataTypes.DOUBLE,
  },
  shared_percentage: {
    type: DataTypes.DOUBLE,
  },
  to_return_amount: {
    type: DataTypes.DOUBLE,
  },
  new_balance: {
    type: DataTypes.DOUBLE,
  },
  capital_balance: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = ReturnOwnerList;
