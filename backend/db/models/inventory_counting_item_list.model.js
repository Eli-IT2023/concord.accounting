const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const InventoryCountingItemList = sequelize.define(
  "inventory_counting_item_list",
  {
    inventory_counting_item_list_id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    inventory_counting_id: {
      type: DataTypes.CHAR,
    },
    stock_management_id: {
      type: DataTypes.CHAR,
    },
    system_quantity: {
      type: DataTypes.DOUBLE,
    },
    actual_count: {
      type: DataTypes.DOUBLE,
    },
    product_id: {
      type: DataTypes.CHAR,
    },
    warehouse_id: {
      type: DataTypes.CHAR,
    },
  }
);

module.exports = InventoryCountingItemList;
