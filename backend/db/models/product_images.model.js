const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ProductImages = sequelize.define("product_images", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  product_image: {
    type: DataTypes.BLOB("long"),
    allowNull: false,
    get() {
      const value = this.getDataValue("product_image");
      return value ? value.toString("base64") : null;
    },
    set(value) {
      this.setDataValue("product_image", Buffer.from(value, "base64"));
    },
  },
});

module.exports = ProductImages;
