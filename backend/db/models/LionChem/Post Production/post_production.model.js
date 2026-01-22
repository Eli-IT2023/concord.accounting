const sequelize = require("../../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const PostProduction = sequelize.define("post_production", {
  id: {
    type: DataTypes.CHAR(36),
    allowNull: true,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  batch_entry_id: {
    type: DataTypes.CHAR,
  },
  total_weight_in: {
    type: DataTypes.DOUBLE,
  },
  total_weight_out: {
    type: DataTypes.DOUBLE,
  },
  total_quantity_required: {
    type: DataTypes.DOUBLE,
  },
  total_quantity_used: {
    type: DataTypes.DOUBLE,
  },
  total_quantity_ordered: {
    type: DataTypes.DOUBLE,
  },
  total_quantity_produced: {
    type: DataTypes.DOUBLE,
  },
  total_loss: {
    type: DataTypes.DOUBLE,
  },
  total_production_loss: {
    type: DataTypes.DOUBLE,
  },
  status: {
    type: DataTypes.STRING,
  },
});

module.exports = PostProduction;
