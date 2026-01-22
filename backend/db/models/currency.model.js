const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");
const Currency = sequelize.define("currency", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  based_currency: {
    type: DataTypes.STRING,
  },
  currency_name: {
    type: DataTypes.STRING,
  },
  currency_rate: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  isArchive: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});
Currency.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

Currency.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});
module.exports = Currency;
