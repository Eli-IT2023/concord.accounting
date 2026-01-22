const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AssetTransactionSubject = sequelize.define(
  "assetaccountlist_transaction_subject",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    assetaccount_list_sub3_from: {
      // pinagkukunan ng pera na subject 3
      type: DataTypes.CHAR,
    },
    assetaccount_list_sub3_to: {
      // kukuha ng pera na subject 3
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

module.exports = AssetTransactionSubject;
