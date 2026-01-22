const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ScheduleProductList = sequelize.define("schedule_product_list", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  schedule_id: {
    type: DataTypes.CHAR,
  },
  schedule_invoice_id: {
    type: DataTypes.CHAR,
  },
  product_id: {
    type: DataTypes.CHAR,
  },
  original_quantity: {
    type: DataTypes.DOUBLE,
  },
  original_weight: {
    type: DataTypes.DOUBLE,
  },
  delivered_quantity: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
  },
  non_modify_weight: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    allowNull: false,
    comment: "this is for record para sa records pag nag return",
  },
  returned_weight: {
    defaultValue: 0,
    allowNull: false,
    type: DataTypes.DOUBLE,
  },
  quantity_to_deliver: {
    type: DataTypes.DOUBLE,
  },
  weight_to_delivered: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
  packaging_unit_quantity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
});

module.exports = ScheduleProductList;
