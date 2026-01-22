const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const getAccurateDate = require("../../utils/accurate_date_time_today");
const Warehouse = sequelize.define("warehouse", {
  warehouse_id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
  },
  branch_type: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  province: {
    type: DataTypes.STRING,
  },
  municipality: {
    type: DataTypes.STRING,
  },
  zipcode: {
    type: DataTypes.INTEGER,
  },
  description: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Soft Delete",
  },
});
Warehouse.beforeCreate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.createdAt = ntpDate;
  data.updatedAt = ntpDate;
});

Warehouse.beforeUpdate(async (data, options) => {
  const ntpDate = await getAccurateDate();
  data.updatedAt = ntpDate;
});
module.exports = Warehouse;
