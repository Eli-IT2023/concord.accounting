const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CompanySettings = sequelize.define("company_settings", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  sub_name: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  email: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  profile_picture: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
    get() {
      const value = this.getDataValue("profile_picture");
      return value ? value.toString("base64") : null;
    },
    set(value) {
      this.setDataValue("profile_picture", Buffer.from(value, "base64"));
    },
  },
});

module.exports = CompanySettings;
