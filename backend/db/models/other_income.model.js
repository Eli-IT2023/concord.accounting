const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const OtherIncome = sequelize.define("other_income", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  desc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  income_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  incomeType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  approved_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id: For approver and rejector",
  },
});

module.exports = OtherIncome;
