const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  Payable_Bulk_Transaction,
} = require("../../backend/db/models/associations.js");

const PayableBulkTransactionSyncData = async () => {
  try {
    const localUsers = await Payable_Bulk_Transaction.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `payable_bulk_transactions` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`payable_bulk_transactions\` (
                id, payable_bulk_id, payable_id, createdAt,  updatedAt, isDeleted
              ) VALUES (
                :id, :payable_bulk_id, :payable_id, :createdAt,  :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              payable_bulk_id: user.payable_bulk_id,
              payable_id: user.payable_id,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing payable_bulk_transactions to cloud: ${user.payable_bulk_id} ${user.payable_id} (${user.id})`
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
            `UPDATE payable_bulk_transactions SET
            payable_bulk_id = :payable_bulk_id,
            payable_id = :payable_id,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                payable_bulk_id: user.payable_bulk_id,
                payable_id: user.payable_id,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated payable_bulk_transactions in cloud: ${user.payable_bulk_id} ${user.payable_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `payable_bulk_transactions`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Payable_Bulk_Transaction.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Payable_Bulk_Transaction.create({
          id: user.id,
          payable_bulk_id: user.payable_bulk_id,
          payable_id: user.payable_id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing payable_bulk_transactions to local: ${user.payable_bulk_id} ${user.payable_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Payable_Bulk_Transaction.update(
            {
              id: user.id,
              payable_bulk_id: user.payable_bulk_id,
              payable_id: user.payable_id,
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
            `🔁 Updated payable_bulk_transactions in local: ${user.module_from} ${user.payable_bulk_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayableBulkTransactionSyncData };
