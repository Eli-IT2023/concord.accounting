const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AccountListBaseSub = sequelize.define("account_list_base_sub", {
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
  module_type: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "soft delete",
  },
});

module.exports = AccountListBaseSub;
