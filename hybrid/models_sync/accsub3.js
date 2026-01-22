const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  accountlist_sub3,
} = require("../../backend/db/models/ModelsBySubject/associations_sub.js");

const AccSub3SyncData = async () => {
  try {
    const localUsers = await accountlist_sub3.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `account_list_sub3s` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`account_list_sub3s\` (
                id, account_list_base_sub_id, account_name, amount, currency_id, investment_amount, created_by, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :account_list_base_sub_id, :account_name, :amount, :currency_id, :investment_amount, :created_by, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              account_list_base_sub_id: user.account_list_base_sub_id,
              account_name: user.account_name,
              amount: user.amount,
              currency_id: user.currency_id,
              investment_amount: user.investment_amount,
              created_by: user.created_by,
              isDeleted: user.isDeleted,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing account_list_sub3s to cloud: ${user.account_name} ${user.amount} (${user.id})`
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
            `UPDATE account_list_sub3s SET
               account_list_base_sub_id = :account_list_base_sub_id, 
               account_name = :account_name, 
               amount = :amount,
               currency_id= :currency_id,
               investment_amount = :investment_amount,
               created_by = :created_by,
               updatedAt = :updatedAt,
               isDeleted = :isDeleted,
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                account_list_base_sub_id: user.account_list_base_sub_id,
                account_name: user.account_name,
                amount: user.amount,
                currency_id: user.currency_id,
                investment_amount: user.investment_amount,
                isDeleted: user.isDeleted,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated account_list_sub3s in cloud: ${user.account_name} ${user.amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `account_list_sub3s`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await accountlist_sub3.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await accountlist_sub3.create({
          id: user.id,
          account_list_base_sub_id: user.account_list_base_sub_id,
          account_name: user.account_name,
          amount: user.amount,
          currency_id: user.currency_id,
          investment_amount: user.investment_amount,
          created_by: user.created_by,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });
        await console.log(
          `✅ Synced missing account_list_sub3s to local: ${user.account_name} ${user.amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await accountlist_sub3.update(
            {
              account_list_base_sub_id: user.account_list_base_sub_id,
              account_name: user.account_name,
              amount: user.amount,
              currency_id: user.currency_id,
              investment_amount: user.investment_amount,
              created_by: user.created_by,
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
            `🔁 Updated account_list_sub3s in local: ${user.account_name} ${user.amount} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { AccSub3SyncData };
