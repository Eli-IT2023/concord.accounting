// const sequelize = require("../../../config/sequelize.config");
// const { DataTypes } = require("sequelize");

// const BatchEntryReprint = sequelize.define("batch_entry_tag_reprint", {
//   id: {
//     type: DataTypes.CHAR(36),
//     allowNull: true,
//     primaryKey: true,
//     defaultValue: DataTypes.UUIDV4,
//   },
//   batch_entry_id: {
//     type: DataTypes.CHAR,
//     allowNull: true,
//   },
//   date_requested: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   remarks: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },

//   status: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },

//   requestor: {
//     type: DataTypes.CHAR,
//     allowNull: true,
//     comment: "masterlist id foreign key",
//   },
//   approver: {
//     type: DataTypes.CHAR,
//     allowNull: true,
//     comment: "masterlist id foreign key",
//   },
//   approver_remarks: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   date_approved: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   declinedBy: {
//     type: DataTypes.CHAR,
//     allowNull: true,
//   },
//   declinedAt: {
//     type: DataTypes.DATE,
//     allowNull: true,
//     defaultValue: null,
//   },
//   declinedRemarks: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
// });

// module.exports = BatchEntryReprint;
