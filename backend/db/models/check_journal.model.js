const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const CheckJournal = sequelize.define("check_journal", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  module_from: {
    type: DataTypes.STRING,
  },
  transaction_number: {
    type: DataTypes.STRING,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
  },
  issued_date: {
    type: DataTypes.DATEONLY,
  },
  type: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  check_number: {
    type: DataTypes.STRING,
  },
  currency_name: {
    type: DataTypes.STRING,
  },
  currency_rate: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = CheckJournal;
