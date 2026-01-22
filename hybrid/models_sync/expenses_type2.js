const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Expenses2 } = require("../../backend/db/models/associations.js");

const ExpensesType2Data = async () => {
  try {
    const localUsers = await Expenses2.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.expenses_one_id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `expenses2s` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`expenses2s\` (
                id, expenses_type, sub_type, description, isArchive, createdAt, updatedAt
              ) VALUES (
                :id, :expenses_type, :sub_type, :description, :isArchive, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              expenses_type: user.expenses_type,
              sub_type: user.sub_type,
              description: user.description,
              isArchive: user.isArchive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing expenses2s to cloud: ${user.expenses_type} ${user.sub_type} (${user.id})`
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
            `UPDATE expenses2s SET
               expenses_type = :expenses_type,
               sub_type = :sub_type,
               description = :description, 
               isArchive = :isArchive, 
               updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                expenses_type: user.expenses_type,
                sub_type: user.sub_type,
                description: user.description,
                isArchive: user.isArchive,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated expenses2s in cloud: ${user.expenses_type} (${user.sub_type}) - ${user.id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `expenses2s`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Expenses2.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Expenses2.create({
          id: user.id,
          expenses_type: user.expenses_type,
          sub_type: user.sub_type,
          description: user.description,
          isArchive: user.isArchive,
          updatedAt: user.updatedAt,
          createdAt: user.createdAt,
        });
        await console.log(
          `✅ Synced missing expenses2s to local: ${user.expenses_type} ${user.sub_type} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Expenses2.update(
            {
              expenses_type: user.expenses_type,
              sub_type: user.sub_type,
              description: user.description,
              isArchive: user.isArchive,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated expenses2s in local: ${user.expenses_type} (${user.sub_type}) - ${user.id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ExpensesType2Data };
