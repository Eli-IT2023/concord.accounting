const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../../utils/accurate_date_time_today");
const TransactionSubject = sequelize.define("accountlist_transaction_subject", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  account_list_sub3_id_transacted: {
    // kung saan nag transact
    type: DataTypes.CHAR,
  },
  // account_list_sub3_from: {
  //   // pinagkukunan ng pera na subject 3
  //   type: DataTypes.INTEGER,
  // },
  sub_3_to: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment:
      "Para if (Debit) from sa transction, may (Credit) to sa transction",
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
  isTransferOnly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  module_from: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transaction_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transferred_by: {
    type: DataTypes.CHAR,
    allowNull: true,
    comment: "(masterlist id) transferred or confirmed",
  },
  rate: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "rate of money based on currency (in/out)",
  },
  account_balance: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    comment: "para sa balance ng pera sa account",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});
TransactionSubject.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

TransactionSubject.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});
module.exports = TransactionSubject;
