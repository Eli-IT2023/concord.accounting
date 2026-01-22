const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PostProductionProduct = sequelize.define("post_production_product", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  post_production_id: {
    type: DataTypes.CHAR,
  },
  batch_entry_id: {
    type: DataTypes.CHAR,
  },
  sales_invoice_id: {
    type: DataTypes.CHAR,
  },
  product_id: {
    type: DataTypes.CHAR,
  },
  weight: {
    type: DataTypes.DOUBLE,
  },
  actual_weight: {
    type: DataTypes.DOUBLE,
    comment: "for post production may comparison for before and actual",
  },
  status: {
    type: DataTypes.STRING,
  },
});

module.exports = PostProductionProduct;
