const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BankTransaction = sequelize.define("bank_transaction", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_list_id_bank_from: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
  },
  transaction_number: {
    type: DataTypes.STRING,
  },

  account_list_id_bank_to: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  module_from: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  confirmed_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "masterlist id",
  },
  amount_to_deduct: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "para kapag transfer to other currency",
  },
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "rate kapag transfer to other currency",
  },
  orig_rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "original rate before i-transfer to other currency",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = BankTransaction;
