const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CustomerSocialLinks = sequelize.define("customer_social_links", {
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
  platform: {
    type: DataTypes.STRING,
  },
  link: {
    type: DataTypes.STRING,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = CustomerSocialLinks;
