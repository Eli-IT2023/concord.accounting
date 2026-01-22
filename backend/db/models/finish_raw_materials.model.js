const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Finish_Raw_Material = sequelize.define("finish_raw_material", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  product_id: {
    type: DataTypes.CHAR,
    allowNull: false,
    comment: "Finish Product ID",
  },
  product_tag_vendor_id: {
    type: DataTypes.CHAR,
    allowNull: false,
    comment: "Product Tag Vendor ID sa table ng product_tag_vendor",
  },
  // raw_product_id: {
  //   type: DataTypes.CHAR,
  //   allowNull: false,
  //   comment: "Raw Product ID",
  // },
  composition: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  weight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  qualified: {
    type: DataTypes.BOOLEAN,
  },
  instruction: {
    type: DataTypes.STRING(5000),
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = Finish_Raw_Material;
