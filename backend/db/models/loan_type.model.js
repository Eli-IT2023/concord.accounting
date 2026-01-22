const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Loan = sequelize.define("loan", {
  loan_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  masterlist_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  // account_list_id: {
  //   type: DataTypes.INTEGER,
  //   allowNull: true,
  // },
  loan_label_mother_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  payment_options: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  loan_amount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  interest_percent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  interest_amount: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  terms: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Loan;
