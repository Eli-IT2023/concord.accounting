const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CustomerProductPriceHistory = sequelize.define(
  "customer_product_price_history",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    customer_id: {
      type: DataTypes.CHAR,
    },
    product_id: {
      type: DataTypes.CHAR,
    },

    previous_amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
  }
);

module.exports = CustomerProductPriceHistory;
