const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize.config");

const SalesJournal = sequelize.define("sales_journal", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  customer_id: {
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
    comment: "net quantity",
  },
  avg_unit_price: {
    type: DataTypes.DOUBLE,
  },
  payment_type: {
    type: DataTypes.STRING,
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

module.exports = SalesJournal;
