const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  InventoryCounting,
} = require("../../backend/db/models/associations.js");

const InventoryCountingSyncData = async () => {
  try {
    const localUsers = await InventoryCounting.findAll({ raw: true });
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `inventory_countings`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `inventory_countings` WHERE inventory_counting_id = :inventory_counting_id",
        {
          replacements: { inventory_counting_id: user.inventory_counting_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`inventory_countings\` (
                inventory_counting_id, transaction_id, counting_date, remarks, user, status, created_by, approved_by, createdAt, updatedAt
              ) VALUES (
                 :inventory_counting_id, :transaction_id, :counting_date, :remarks, :user, :status, :created_by, :approved_by, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              inventory_counting_id: user.inventory_counting_id,
              transaction_id: user.transaction_id,
              counting_date: user.counting_date,
              remarks: user.remarks,
              user: user.user,
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
          `✅ Synced missing inventory_countings to cloud: ${user.inventory_counting_id} ${user.transaction_id} (${user.id})`
        );
      } else {
        // Compare fields to check if update is needed
        const cloud = cloudUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(cloud.updatedAt).getTime();

        if (needsUpdate) {
          await cloudDB.query(
            `UPDATE inventory_countings SET
            transaction_id = :transaction_id,
            counting_date = :counting_date,
            remarks = :remarks,
            user = :user,
            status = :status,
            created_by = :created_by,
            approved_by = :approved_by,
            updatedAt = :updatedAt
            WHERE inventory_counting_id = :inventory_counting_id;`,
            {
              replacements: {
                inventory_counting_id: user.inventory_counting_id,
                transaction_id: user.transaction_id,
                counting_date: user.counting_date,
                remarks: user.remarks,
                user: user.user,
                status: user.status,
                created_by: user.created_by,
                approved_by: user.approved_by,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated inventory_countings in cloud: ${user.inventory_counting_id} (${user.transaction_id}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const localUser = await InventoryCounting.findAll({
        where: { inventory_counting_id: user.inventory_counting_id },
      });

      if (localUser.length === 0) {
        await InventoryCounting.create({
          inventory_counting_id: user.inventory_counting_id,
          transaction_id: user.transaction_id,
          counting_date: user.counting_date,
          remarks: user.remarks,
          user: user.user,
          status: user.status,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing inventory_countings to local: ${user.inventory_counting_id} ${user.transaction_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await InventoryCounting.update(
            {
              inventory_counting_id: user.inventory_counting_id,
              transaction_id: user.transaction_id,
              counting_date: user.counting_date,
              remarks: user.remarks,
              user: user.user,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                inventory_counting_id: user.inventory_counting_id,
              },
            } // Use the ID to find the record to update
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { InventoryCountingSyncData };
