const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AssetAccountListBaseSub = sequelize.define("assetaccount_list_base_sub", {
  id: {
    type: DataTypes.CHAR(36), // Use STRING(36) for UUID
    allowNull: true,
    primaryKey: true,
    // autoIncrement: true,
    defaultValue: DataTypes.UUIDV4,
  },
  subject_name: {
    type: DataTypes.STRING,
  },
  subject_type: {
    type: DataTypes.STRING,
  },
});

module.exports = AssetAccountListBaseSub;
