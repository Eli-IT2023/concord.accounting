const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { StockTransfer } = require("../../backend/db/models/associations.js");

const StockTransferMotherSyncData = async () => {
  try {
    const localUsers = await StockTransfer.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `stock_transfer_mothers` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`stock_transfer_mothers\` (
                id, transaction_id, warehouse_from_id, warehouse_to_id, date_transfer, description, status, created_by, approved_by, createdAt, updatedAt
              ) VALUES (
                :id, :transaction_id, :warehouse_from_id, :warehouse_to_id, :date_transfer, :description, :status, :created_by, :approved_by, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              transaction_id: user.transaction_id,
              warehouse_from_id: user.warehouse_from_id,
              warehouse_to_id: user.warehouse_to_id,
              date_transfer: user.date_transfer,
              description: user.description,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing stock_transfer_mothers to cloud: ${user.transaction_id} ${user.warehouse_from_id} (${user.id})`
        );
      } else {
        // Compare fields to check if update is needed
        const cloud = cloudUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(cloud.updatedAt).getTime();

        if (needsUpdate) {
          //   console.log(`pumasok sa needsUpdate`);
          await cloudDB.query(
            `UPDATE stock_transfer_mothers SET
                transaction_id = :transaction_id,
                warehouse_from_id = :warehouse_from_id,
                warehouse_to_id = :warehouse_to_id,
                date_transfer = :date_transfer,
                description = :description,
                status = :status,
                approved_by = :approved_by,
                createdAt = :createdAt,
                updatedAt = :updatedAt
                WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                transaction_id: user.transaction_id,
                warehouse_from_id: user.warehouse_from_id,
                warehouse_to_id: user.warehouse_to_id,
                date_transfer: user.date_transfer,
                description: user.description,
                status: user.status,
                approved_by: user.approved_by,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated stock_transfer_mothers in cloud: ${user.transaction_id} ${user.warehouse_from_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `stock_transfer_mothers`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await StockTransfer.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await StockTransfer.create({
          id: user.id,
          transaction_id: user.transaction_id,
          warehouse_from_id: user.warehouse_from_id,
          warehouse_to_id: user.warehouse_to_id,
          date_transfer: user.date_transfer,
          description: user.description,
          status: user.status,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing stock_transfer_mothers to local: ${user.transaction_id} ${user.warehouse_from_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await StockTransfer.update(
            {
              id: user.id,
              transaction_id: user.transaction_id,
              warehouse_from_id: user.warehouse_from_id,
              warehouse_to_id: user.warehouse_to_id,
              date_transfer: user.date_transfer,
              description: user.description,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated stock_transfer_mothers in local: ${user.transaction_id} ${user.warehouse_from_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { StockTransferMotherSyncData };
