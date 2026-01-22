const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Loan_mother = sequelize.define("loan_mother", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loan_name: {
    type: DataTypes.STRING(3000),
    allowNull: true,
  },
  bulk_payment_id: {
    type: DataTypes.CHAR,
    allowNull: true,
    defaultValue: null,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  static_amount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  currency_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  // rate: {
  //   type: DataTypes.DOUBLE,
  //   allowNull: false,
  // },
  subject1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subject2_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  subject3_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING(3000),
    allowNull: true,
  },
  check_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date_issued: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "Pending",
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

module.exports = Loan_mother;
