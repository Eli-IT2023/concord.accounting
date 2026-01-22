const sequelize = require("../config/sequelize.config");
const { DataTypes, DATEONLY, INTEGER } = require("sequelize");

const P_L_v2_report = sequelize.define("p_l_v2_journal", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  date: {
    type: DataTypes.DATEONLY,
    comment: "date when the transaction happened",
  },
  currency_name_from: {
    type: DataTypes.STRING,
  },
  currency_name_to: {
    type: DataTypes.STRING,
  },
  amount_from: {
    type: DataTypes.DOUBLE,
  },
  exchange_rate: {
    type: DataTypes.DOUBLE,
  },
  received_rate: {
    type: DataTypes.DOUBLE,
  },
  fee: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  profit_loss_amount: {
    type: DataTypes.DOUBLE,
    comment: "calculated profit or loss amount already in PESO",
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = P_L_v2_report;
