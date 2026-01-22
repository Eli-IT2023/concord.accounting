const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const FormulationProductUsed = sequelize.define("formulation_product_used", {
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
  formulation_id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
  },
  vendor_id: {
    type: DataTypes.CHAR(36),
    allowNull: true, // Must be true for SET NULL to work
    references: {
      model: "vendors", // Make sure this matches your Vendors table name
      key: "id",
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  },
  index: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  composition: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  target_weight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  instruction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isAdded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = FormulationProductUsed;
