const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  PayBulkExpensesPayment,
} = require("../../backend/db/models/associations.js");

const PayBulkExpensesPaymentSyncData = async () => {
  try {
    const localUsers = await PayBulkExpensesPayment.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `pay_bulk_expenses_payments` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`pay_bulk_expenses_payments\` (
                id, pay_bulk_id, account_list_sub3_id, payment_type, check_number, online_name, online_ref_number, amount,  date_issued, is_completed, createdAt, updatedAt, isDeleted
              ) VALUES (
                 :id, :pay_bulk_id, :account_list_sub3_id, :payment_type, :check_number, :online_name, :online_ref_number, :amount,  :date_issued, :is_completed, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              pay_bulk_id: user.pay_bulk_id,
              account_list_sub3_id: user.account_list_sub3_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              online_name: user.online_name,
              online_ref_number: user.online_ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              is_completed: user.is_completed,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing pay_bulk_expenses_payments to cloud: ${user.transaction_number} ${user.status} (${user.id})`
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
            `UPDATE pay_bulk_expenses_payments SET
            pay_bulk_id = :pay_bulk_id,
            account_list_sub3_id = :account_list_sub3_id,
            payment_type = :payment_type,
            check_number = :check_number,
            online_name = :online_name,
            online_ref_number = :online_ref_number,
            amount = :amount,
            date_issued = :date_issued,
            is_completed = :is_completed,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                pay_bulk_id: user.pay_bulk_id,
                account_list_sub3_id: user.account_list_sub3_id,
                payment_type: user.payment_type,
                check_number: user.check_number,
                online_name: user.online_name,
                online_ref_number: user.online_ref_number,
                amount: user.amount,
                date_issued: user.date_issued,
                is_completed: user.is_completed,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated pay_bulk_expenses_payments in cloud: ${user.customer_id} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `pay_bulk_expenses_payments`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await PayBulkExpensesPayment.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await PayBulkExpensesPayment.create({
          id: user.id,
          pay_bulk_id: user.pay_bulk_id,
          account_list_sub3_id: user.account_list_sub3_id,
          payment_type: user.payment_type,
          check_number: user.check_number,
          online_name: user.online_name,
          online_ref_number: user.online_ref_number,
          amount: user.amount,
          date_issued: user.date_issued,
          is_completed: user.is_completed,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing pay_bulk_expenses_payments to local: ${user.pay_bulk_id} ${user.account_list_sub3_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await PayBulkExpensesPayment.update(
            {
              id: user.id,
              pay_bulk_id: user.pay_bulk_id,
              account_list_sub3_id: user.account_list_sub3_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              online_name: user.online_name,
              online_ref_number: user.online_ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              is_completed: user.is_completed,
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
            `🔁 Updated pay_bulk_expenses_payments in local: ${user.pay_bulk_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayBulkExpensesPaymentSyncData };
