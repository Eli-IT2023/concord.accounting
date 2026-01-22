const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");
const OtherIncome = sequelize.define("other_income", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  desc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  income_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  incomeType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Soft Delete",
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
// to make accurate the date and time without relying in the local device date and time
OtherIncome.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

OtherIncome.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});
module.exports = OtherIncome;
