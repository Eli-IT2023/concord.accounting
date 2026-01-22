const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PayableTransactionSubject = sequelize.define(
  "payable_transaction_subject",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    payble_list_sub3_id_transacted: {
      type: DataTypes.CHAR,
    },
    payment_method: {
      type: DataTypes.STRING,
    },
    amount: {
      type: DataTypes.DOUBLE,
    },
    date: {
      type: DataTypes.DATEONLY,
    },
    check_or_remarks: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
    },
  }
);

module.exports = PayableTransactionSubject;
