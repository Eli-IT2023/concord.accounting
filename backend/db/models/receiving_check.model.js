const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ReceivingCheck = sequelize.define("receiving_check", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  bulk_collection_payment_id: {
    type: DataTypes.CHAR,
  },
  account_list_sub3_id: {
    type: DataTypes.CHAR,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
  },
  issued_date: {
    type: DataTypes.DATEONLY,
  },
  currency_id: {
    type: DataTypes.CHAR,
  },
  check_number: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
});

module.exports = ReceivingCheck;
