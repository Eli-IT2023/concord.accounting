const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const ConcordNotification = sequelize.define("concord_notification", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  module_id: {
    type: DataTypes.CHAR,
  },
  module_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  module_from: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  module_to: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdBy: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
});

module.exports = ConcordNotification;
