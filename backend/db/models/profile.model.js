const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Profile_Image = sequelize.define("profile_image", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  emp_id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
  },
  profile_image: {
    type: DataTypes.BLOB("long"),
    allowNull: true,
  },
});

module.exports = Profile_Image;
