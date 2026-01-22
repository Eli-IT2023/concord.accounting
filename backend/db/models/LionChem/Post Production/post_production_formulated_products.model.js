const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PostProductionFormulatedProducts = sequelize.define(
  "post_production_formulated_products",
  {
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
    batch_entry_product_id: {
      type: DataTypes.CHAR,
    },
    product_id: {
      type: DataTypes.CHAR,
    },
    target_weight: {
      type: DataTypes.DOUBLE,
    },
    actual_weight: {
      type: DataTypes.DOUBLE,
      comment: "for post production may comparison for before and actual",
    },
    status: {
      type: DataTypes.STRING,
    },
  }
);

module.exports = PostProductionFormulatedProducts;
