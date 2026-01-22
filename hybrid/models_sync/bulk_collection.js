const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { BulkCollection } = require("../../backend/db/models/associations.js");

const BulkCollectionSyncData = async () => {
  try {
    const localUsers = await BulkCollection.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `bulk_collections` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`bulk_collections\` (
                id, customer_id, collection_date, transaction_number, status, module_from, type, currency_id, created_by, approved_by, createdAt, updatedAt, isDeleted
              ) VALUES (
               :id, :customer_id, :collection_date, :transaction_number, :status, :module_from, :type, :currency_id, :created_by, :approved_by, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              customer_id: user.customer_id,
              collection_date: user.collection_date,
              transaction_number: user.transaction_number,
              status: user.status,
              module_from: user.module_from,
              type: user.type,
              currency_id: user.currency_id,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing bulk_collections to cloud: ${user.customer_id} ${user.transaction_number} (${user.id})`
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
            `UPDATE bulk_collections SET
            customer_id = :customer_id,
            collection_date = :collection_date,
            transaction_number = :transaction_number,
            status = :status,
            module_from = :module_from,
            type = :type,
            currency_id = :currency_id,
            approved_by = :approved_by,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                customer_id: user.customer_id,
                collection_date: user.collection_date,
                transaction_number: user.transaction_number,
                status: user.status,
                module_from: user.module_from,
                type: user.type,
                currency_id: user.currency_id,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated bulk_collections in cloud: ${user.customer_id} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `bulk_collections`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await BulkCollection.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await BulkCollection.create({
          id: user.id,
          customer_id: user.customer_id,
          collection_date: user.collection_date,
          transaction_number: user.transaction_number,
          status: user.status,
          module_from: user.module_from,
          type: user.type,
          currency_id: user.currency_id,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing bulk_collections to local: ${user.customer_id} ${user.transaction_number} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await BulkCollection.update(
            {
              customer_id: user.customer_id,
              collection_date: user.collection_date,
              transaction_number: user.transaction_number,
              status: user.status,
              module_from: user.module_from,
              type: user.type,
              currency_id: user.currency_id,
              approved_by: user.approved_by,
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
            `🔁 Updated bulk_collections in local: ${user.customer_id} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { BulkCollectionSyncData };
