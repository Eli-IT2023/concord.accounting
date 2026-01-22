const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { ReceivingCheck } = require("../../backend/db/models/associations.js");

const ReceivingCheckSyncData = async () => {
  try {
    const localUsers = await ReceivingCheck.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `receiving_checks` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`receiving_checks\` (
                id, bulk_collection_payment_id, account_list_sub3_id, transaction_date, issued_date, currency_id, check_number,  amount, createdAt, updatedAt
              ) VALUES (
                 :id, :bulk_collection_payment_id, :account_list_sub3_id, :transaction_date, :issued_date, :currency_id, :check_number,  :amount, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              bulk_collection_payment_id: user.bulk_collection_payment_id,
              account_list_sub3_id: user.account_list_sub3_id,
              transaction_date: user.transaction_date,
              issued_date: user.issued_date,
              currency_id: user.currency_id,
              check_number: user.check_number,
              amount: user.amount,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing to cloud: ${user.bulk_collectionn_payment_id} ${user.transaction_date} (${user.id})`
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
            `UPDATE receiving_checks SET
            bulk_collection_payment_id = :bulk_collection_payment_id,
            account_list_sub3_id = :account_list_sub3_id,
            transaction_date = :transaction_date,
            issued_date = :issued_date,
            currency_id = :currency_id,
            check_number = :check_number,
            amount = :amount,
            updatedAt = :updatedAt
             WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                bulk_collection_payment_id: user.bulk_collection_payment_id,
                account_list_sub3_id: user.account_list_sub3_id,
                transaction_date: user.transaction_date,
                issued_date: user.issued_date,
                currency_id: user.currency_id,
                check_number: user.check_number,
                amount: user.amount,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated user in cloud: ${user.bulk_collectionn_payment_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `receiving_checks`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReceivingCheck.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReceivingCheck.create({
          id: user.id,
          bulk_collection_payment_id: user.bulk_collection_payment_id,
          account_list_sub3_id: user.account_list_sub3_id,
          transaction_date: user.transaction_date,
          issued_date: user.issued_date,
          currency_id: user.currency_id,
          check_number: user.check_number,
          amount: user.amount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing receiving_checks to local: ${user.bulk_collectionn_payment_id} ${user.account_list_sub3_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReceivingCheck.update(
            {
              id: user.id,
              bulk_collection_payment_id: user.bulk_collection_payment_id,
              account_list_sub3_id: user.account_list_sub3_id,
              transaction_date: user.transaction_date,
              issued_date: user.issued_date,
              currency_id: user.currency_id,
              check_number: user.check_number,
              amount: user.amount,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated receiving_checks in local: ${user.bulk_collectionn_payment_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReceivingCheckSyncData };
