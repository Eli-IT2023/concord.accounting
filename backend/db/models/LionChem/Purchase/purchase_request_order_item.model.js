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
      type: DataTypes.CHAR,
    },
    product_id: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.DOUBLE,
    },
    new_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
    unit_quantity: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: "UOM unit quantity",
    },
    uom: {
      type: DataTypes.STRING,
      comment:
        "for display lang sa update hindi pwede id since definite na dapat yung uom once na create",
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
    },
    isDeleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  }
);

module.exports = PurchaseRequestOrderItem;
