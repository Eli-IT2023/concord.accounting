const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");

const ProductList = sequelize.define("product_list", {
  product_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: false,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  product_name: {
    type: DataTypes.STRING,
  },
  product_category: {
    type: DataTypes.STRING,
  },
  unit_of_measure: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  threshold: {
    type: DataTypes.BIGINT,
  },
  archive_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },
});

ProductList.beforeCreate(async (prod, options) => {
  const ntpDate = await getAccurateDate();
  prod.createdAt = ntpDate;
  prod.updatedAt = ntpDate;
});

ProductList.beforeUpdate(async (prod, options) => {
  const ntpDate = await getAccurateDate();
  prod.updatedAt = ntpDate;
});

module.exports = ProductList;
