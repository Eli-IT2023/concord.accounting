const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const StockTransferProducts = sequelize.define("stock_transfer_products", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  stock_transfer_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  available_quantity: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },

  quantity_to_transfer: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
});

module.exports = StockTransferProducts;
