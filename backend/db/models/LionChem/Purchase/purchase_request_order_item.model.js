const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PurchaseRequestOrderItem = sequelize.define(
  "purchase_request_order_item",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    pr_id: {
      type: DataTypes.STRING,
    },
    product_id: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.DOUBLE,
    },
    price: {
      type: DataTypes.DOUBLE,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
    },
  }
);

module.exports = PurchaseRequestOrderItem;
