const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Balance_History = sequelize.define("balance_history", {
  balance_history_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_list_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  old_balance: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  new_balance: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
});

module.exports = Balance_History;
