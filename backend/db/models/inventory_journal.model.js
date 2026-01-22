const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");
const Inventory_Journal = sequelize.define("inventory_journal", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  module_from: {
    type: DataTypes.STRING(50),
  },
  transaction_number: {
    type: DataTypes.STRING(50),
  },
  product_id: {
    type: DataTypes.CHAR,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
  },
  unit_price: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  date_in: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(50), // e.g., "in", "out", "adjustment"
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// to make accurate the date and time without relying in the local device date and time
Inventory_Journal.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

Inventory_Journal.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});

module.exports = Inventory_Journal;
