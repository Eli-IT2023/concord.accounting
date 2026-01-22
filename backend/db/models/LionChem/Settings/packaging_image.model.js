const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PackagingImage = sequelize.define("packaging_images", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },

  packaging_id: {
    type: DataTypes.CHAR,
  },

  packaging_image: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
  },
  mime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isSelected: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
});

module.exports = PackagingImage;
