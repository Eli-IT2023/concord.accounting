const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Loan_History = sequelize.define("loan_history", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  loan_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  transaction_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount_deducted: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  date_deducted: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  deduction_rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});

module.exports = Loan_History;
