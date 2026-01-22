const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PayableJournal = sequelize.define("payable_journal", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  vendor_id: {
    type: DataTypes.CHAR,
  },
  transaction_number: {
    type: DataTypes.STRING,
  },
  date: {
    type: DataTypes.DATEONLY,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
  },
  total_quantity: {
    type: DataTypes.DOUBLE,
  },
  avg_unit_price: {
    type: DataTypes.DOUBLE,
  },
  payment_type: {
    type: DataTypes.STRING(50),
    comment: "Debit or Credit",
  },
  currency_name: {
    type: DataTypes.STRING,
  },
  currency_rate: {
    type: DataTypes.DOUBLE,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = PayableJournal;
