const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  issued_check,
} = require("../../backend/db/models/ModelsBySubject/associations_sub.js");

const IssuedCheckSyncData = async () => {
  try {
    const localUsers = await issued_check.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `issued_checks` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`issued_checks\` (
                id, account_list_id_issued_from, transaction_date, check_number, transaction_number, account_list_id_issued_to, module_from, description, amount, status, confirmed_by, amount_to_deduct, rate, orig_rate, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :account_list_id_issued_from, :transaction_date, :check_number, :transaction_number, :account_list_id_issued_to, :module_from, :description, :amount, :status, :confirmed_by, :amount_to_deduct, :rate, :orig_rate, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              account_list_id_issued_from: user.account_list_id_issued_from,
              transaction_date: user.transaction_date,
              check_number: user.check_number,
              transaction_number: user.transaction_number,
              account_list_id_issued_to: user.account_list_id_issued_to,
              module_from: user.module_from,
              description: user.description,
              amount: user.amount,
              status: user.status,
              confirmed_by: user.confirmed_by,
              amount_to_deduct: user.amount_to_deduct,
              rate: user.rate,
              orig_rate: user.orig_rate,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing issued_checks to cloud: ${user.account_list_id_issued_from} ${user.transaction_number} (${user.id})`
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
            `UPDATE issued_checks SET
            account_list_id_issued_from = :account_list_id_issued_from,
            transaction_date = :transaction_date,
            check_number = :check_number,
            transaction_number = :transaction_number,
            account_list_id_issued_to = :account_list_id_issued_to,
            module_from = :module_from,
            description = :description,
            amount = :amount,
            status = :status,
            confirmed_by = :confirmed_by,
            amount_to_deduct = :amount_to_deduct,
            rate = :rate,
            orig_rate = :orig_rate,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                account_list_id_issued_from: user.account_list_id_issued_from,
                transaction_date: user.transaction_date,
                check_number: user.check_number,
                transaction_number: user.transaction_number,
                account_list_id_issued_to: user.account_list_id_issued_to,
                module_from: user.module_from,
                description: user.description,
                amount: user.amount,
                status: user.status,
                confirmed_by: user.confirmed_by,
                amount_to_deduct: user.amount_to_deduct,
                rate: user.rate,
                orig_rate: user.orig_rate,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated issued_checks in cloud: ${user.account_list_id_issued_from} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `issued_checks`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await issued_check.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await issued_check.create({
          id: user.id,
          account_list_id_issued_from: user.account_list_id_issued_from,
          transaction_date: user.transaction_date,
          check_number: user.check_number,
          transaction_number: user.transaction_number,
          account_list_id_issued_to: user.account_list_id_issued_to,
          module_from: user.module_from,
          description: user.description,
          amount: user.amount,
          status: user.status,
          confirmed_by: user.confirmed_by,
          amount_to_deduct: user.amount_to_deduct,
          rate: user.rate,
          orig_rate: user.orig_rate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing issued_checks to local: ${user.account_list_id_issued_from} ${user.transaction_number} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await issued_check.update(
            {
              id: user.id,
              account_list_id_issued_from: user.account_list_id_issued_from,
              transaction_date: user.transaction_date,
              check_number: user.check_number,
              transaction_number: user.transaction_number,
              account_list_id_issued_to: user.account_list_id_issued_to,
              module_from: user.module_from,
              description: user.description,
              amount: user.amount,
              status: user.status,
              confirmed_by: user.confirmed_by,
              amount_to_deduct: user.amount_to_deduct,
              rate: user.rate,
              orig_rate: user.orig_rate,
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
            `🔁 Updated issued_checks in local: ${user.account_list_id_issued_from} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { IssuedCheckSyncData };
