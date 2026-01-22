const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  accountlist_transaction_subject,
} = require("../../backend/db/models/ModelsBySubject/associations_sub.js");

const AccSub3TransactionSyncData = async () => {
  try {
    const localUsers = await accountlist_transaction_subject.findAll({
      raw: true,
    });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `accountlist_transaction_subjects` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`accountlist_transaction_subjects\` (
                id, account_list_sub3_id_transacted, sub_3_to, payment_method, amount, date, check_or_remarks, type, isTransferOnly, module_from, transaction_number, transferred_by, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :account_list_sub3_id_transacted, :sub_3_to, :payment_method, :amount, :date, :check_or_remarks, :type, :isTransferOnly, :module_from, :transaction_number, :transferred_by, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              account_list_sub3_id_transacted:
                user.account_list_sub3_id_transacted,
              sub_3_to: user.sub_3_to,
              payment_method: user.payment_method,
              amount: user.amount,
              date: user.date,
              check_or_remarks: user.check_or_remarks,
              type: user.type,
              isTransferOnly: user.isTransferOnly,
              module_from: user.module_from,
              transaction_number: user.transaction_number,
              transferred_by: user.transferred_by,
              isDeleted: user.isDeleted,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing accountlist_transaction_subjects to cloud: ${user.account_list_sub3_id_transacted} ${user.sub_3_to} (${user.id})`
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
            `UPDATE accountlist_transaction_subjects SET
               account_list_sub3_id_transacted = :account_list_sub3_id_transacted, 
               sub_3_to = :sub_3_to, 
               payment_method = :payment_method,
               amount= :amount,
               date = :date,
               check_or_remarks = :check_or_remarks,
               type = :type,
               isTransferOnly= :isTransferOnly,
               module_from = :module_from,
               transaction_number = :transaction_number,
               transferred_by = :transferred_by,
               updatedAt = :updatedAt,
               isDeleted = :isDeleted
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                account_list_sub3_id_transacted:
                  user.account_list_sub3_id_transacted,
                sub_3_to: user.sub_3_to,
                payment_method: user.payment_method,
                amount: user.amount,
                date: user.date,
                check_or_remarks: user.check_or_remarks,
                type: user.type,
                isTransferOnly: user.isTransferOnly,
                module_from: user.module_from,
                transaction_number: user.transaction_number,
                transferred_by: user.transferred_by,
                isDeleted: user.isDeleted,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated accountlist_transaction_subjects in cloud: ${user.account_list_sub3_id_transacted} ${user.sub_3_to} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `accountlist_transaction_subjects`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await accountlist_transaction_subject.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await accountlist_transaction_subject.create({
          id: user.id,
          account_list_sub3_id_transacted: user.account_list_sub3_id_transacted,
          sub_3_to: user.sub_3_to,
          payment_method: user.payment_method,
          amount: user.amount,
          date: user.date,
          check_or_remarks: user.check_or_remarks,
          type: user.type,
          isTransferOnly: user.isTransferOnly,
          module_from: user.module_from,
          transaction_number: user.transaction_number,
          transferred_by: user.transferred_by,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
          rate: user.rate,
        });
        await console.log(
          `✅ Synced missing accountlist_transaction_subjects to local: ${user.account_list_sub3_id_transacted} ${user.sub_3_to} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await accountlist_transaction_subject.update(
            {
              id: user.id,
              account_list_sub3_id_transacted:
                user.account_list_sub3_id_transacted,
              sub_3_to: user.sub_3_to,
              payment_method: user.payment_method,
              amount: user.amount,
              date: user.date,
              check_or_remarks: user.check_or_remarks,
              type: user.type,
              isTransferOnly: user.isTransferOnly,
              module_from: user.module_from,
              transaction_number: user.transaction_number,
              transferred_by: user.transferred_by,
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
            `🔁 Updated accountlist_transaction_subjects in local: ${user.account_name} ${user.amount} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { AccSub3TransactionSyncData };
