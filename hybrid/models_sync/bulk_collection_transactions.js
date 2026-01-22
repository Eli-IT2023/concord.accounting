const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  BulkCollectionTransaction,
} = require("../../backend/db/models/associations.js");

const BulkCollectionTransactionSyncData = async () => {
  try {
    const localUsers = await BulkCollectionTransaction.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `bulk_collection_transactions` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`bulk_collection_transactions\` (
                id, bulk_collection_id, sales_invoice_id, createdAt, updatedAt, isDeleted
              ) VALUES (
                 :id, :bulk_collection_id, :sales_invoice_id, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              bulk_collection_id: user.bulk_collection_id,
              sales_invoice_id: user.sales_invoice_id,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing bulk_collection_transactions to cloud: ${user.sales_invoice_id} ${user.bulk_collection_id} (${user.id})`
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
            `UPDATE bulk_collection_transactions SET
            bulk_collection_id = :bulk_collection_id,
            sales_invoice_id = :sales_invoice_id,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                bulk_collection_id: user.bulk_collection_id,
                sales_invoice_id: user.sales_invoice_id,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated bulk_collection_transactions in cloud: ${user.bulk_collection_id} ${user.sales_invoice_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `bulk_collection_transactions`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await BulkCollectionTransaction.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await BulkCollectionTransaction.create({
          id: user.id,
          bulk_collection_id: user.bulk_collection_id,
          sales_invoice_id: user.sales_invoice_id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing bulk_collection_transactions to local: ${user.bulk_collection_id} ${user.sales_invoice_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await BulkCollectionTransaction.update(
            {
              bulk_collection_id: user.bulk_collection_id,
              sales_invoice_id: user.sales_invoice_id,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated bulk_collection_transactions in local: ${user.bulk_collection_id} ${user.sales_invoice_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { BulkCollectionTransactionSyncData };
