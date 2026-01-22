const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const TaxReport = sequelize.define("tax_report", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  module_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "e.g. Sales, Purchase, etc.",
  },
  module_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  transaction_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transaction_user: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    comment: "Customer or Supplier ID",
  },
  tax_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  tax_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tax_rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  tax_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transaction_amount: {
    type: DataTypes.DOUBLE,
  },
  tax_amount: {
    type: DataTypes.DOUBLE,
  },
  transaction_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  transaction_status: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "e.g. paid, unpaid, etc.",
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = TaxReport;
