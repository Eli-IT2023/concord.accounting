const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  accountlist_base_subject,
} = require("../../backend/db/models/ModelsBySubject/associations_sub.js");

const AccBaseSubjectSyncData = async () => {
  try {
    const localUsers = await accountlist_base_subject.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `account_list_base_subs` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`account_list_base_subs\` (
                id, subject_name, subject_type, module_type, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :subject_name, :subject_type, :module_type, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              subject_name: user.subject_name,
              subject_type: user.subject_type,
              module_type: user.module_type,
              isDeleted: user.isDeleted,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing account_list_base_subs to cloud: ${user.subject_name} ${user.subject_type} (${user.id})`
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
            `UPDATE account_list_base_subs SET
               subject_name = :subject_name, 
               subject_type = :subject_type, 
               module_type = :module_type,
<<<<<<< HEAD
               isDeleted = :isDeleted, 
               updatedAt = :updatedAt
=======
               updatedAt = :updatedAt,
               isDeleted = :isDeleted
>>>>>>> origin/franco
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                subject_name: user.subject_name,
                subject_type: user.subject_type,
                module_type: user.module_type,
                isDeleted: user.isDeleted,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated account_list_base_subs in cloud: ${user.subject_name} ${user.subject_type} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `account_list_base_subs`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await accountlist_base_subject.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await accountlist_base_subject.create({
          id: user.id,
          subject_name: user.subject_name,
          subject_type: user.subject_type,
          module_type: user.module_type,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });
        await console.log(
          `✅ Synced missing account_list_base_subs to local: ${user.subject_name} ${user.subject_type} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await accountlist_base_subject.update(
            {
              subject_name: user.subject_name,
              subject_type: user.subject_type,
              module_type: user.module_type,
              isDeleted: user.isDeleted,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated account_list_base_subs in local: ${user.subject_name} ${user.subject_type} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { AccBaseSubjectSyncData };
