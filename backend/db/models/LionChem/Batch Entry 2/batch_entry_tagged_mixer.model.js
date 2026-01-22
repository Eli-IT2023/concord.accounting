const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const BatchEntryTaggedMixer = sequelize.define("batch_entry_tagged_mixer", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  batch_entry_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  mixer_id: {
    type: DataTypes.CHAR,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = BatchEntryTaggedMixer;
