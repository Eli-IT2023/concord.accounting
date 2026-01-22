const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Expenses1 } = require("../../backend/db/models/associations.js");

const ExpensesType1Data = async () => {
  try {
    const localUsers = await Expenses1.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.expenses_one_id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `expenses_ones` WHERE expenses_one_id = :expenses_one_id",
        {
          replacements: { expenses_one_id: user.expenses_one_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`expenses_ones\` (
                expenses_one_id, expenses_type_one, description, isArchive, createdAt, updatedAt
              ) VALUES (
                :expenses_one_id, :expenses_type_one, :description, :isArchive, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              expenses_one_id: user.expenses_one_id,
              expenses_type_one: user.expenses_type_one,
              description: user.description,
              isArchive: user.isArchive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing to expenses_ones cloud: ${user.expenses_type_one} ${user.description} (${user.expenses_one_id})`
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
            `UPDATE expenses_ones SET
               expenses_type_one = :expenses_type_one, 
               description = :description, 
               isArchive = :isArchive, 
               updatedAt = :updatedAt
              WHERE expenses_one_id = :expenses_one_id`,
            {
              replacements: {
                expenses_one_id: user.expenses_one_id,
                expenses_type_one: user.expenses_type_one,
                description: user.description,
                isArchive: user.isArchive,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated user in expenses_ones cloud: ${user.expenses_type_one} (${user.description}) - ${user.expenses_one_id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `expenses_ones`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Expenses1.findAll({
        where: { expenses_one_id: user.expenses_one_id },
      });

      if (localUser.length === 0) {
        await Expenses1.create({
          expenses_one_id: user.expenses_one_id,
          expenses_type_one: user.expenses_type_one,
          description: user.description,
          isArchive: user.isArchive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing expenses_ones to local: ${user.expenses_type_one} ${user.description} (${user.expenses_one_id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Expenses1.update(
            {
              expenses_type_one: user.expenses_type_one,
              description: user.description,
              isArchive: user.isArchive,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                expenses_one_id: user.expenses_one_id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated expenses_ones in local: ${user.expenses_type_one} (${user.description}) - ${user.expenses_one_id}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ExpensesType1Data };
