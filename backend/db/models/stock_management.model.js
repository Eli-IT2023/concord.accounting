const sequelize = require("../config/sequelize.config");
const { DataTypes, Transaction, STRING } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");

const StockManagement = sequelize.define("stock_management", {
  stock_management_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  warehouse_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  stock: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  in: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "Para static na quantity na pumasok",
  },
  price: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "IN PESO NA TO",
  },
  price_in: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    comment: "IN PESO NA TO",
  },
  vendor_id: {
    type: DataTypes.CHAR,
  },
  date_in: {
    type: DataTypes.DATEONLY,
  },
  transaction_number: {
    type: STRING,
    defaultValue: null,
  },
  module_in_from: {
    type: STRING,
    defaultValue: null,
  },
  production_history_id: {
    type: DataTypes.CHAR,
    allowNull: true,
    defaultValue: null,
    comment:
      "tracking para mainherit sa kanya ang raw mats supplier sa kanya if galing production",
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
    comment: "soft delete",
  },
});
StockManagement.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

StockManagement.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});
module.exports = StockManagement;
