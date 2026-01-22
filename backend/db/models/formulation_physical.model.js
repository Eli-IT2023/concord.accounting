const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const FormulationPhysical = sequelize.define(
  "formulation_physical_attributes",
  {
    id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
      allowNull: true,
      primaryKey: true,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
    },
    formulation_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "formulations", // Explicit reference
        key: "id",
      },
    },
    product_id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    },
    physical_id: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    },
    attribute: {
      type: DataTypes.STRING(200),
    },
    description: {
      type: DataTypes.TEXT,
    },

    createdBy: {
      type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }
);

module.exports = FormulationPhysical;
