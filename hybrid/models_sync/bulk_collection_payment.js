const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  BulkCollectionPayment,
} = require("../../backend/db/models/associations.js");

const BulkCollectionPaymentSyncData = async () => {
  try {
    const localUsers = await BulkCollectionPayment.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `bulk_collection_payments` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`bulk_collection_payments\` (
                id, bulk_collection_id, account_list_sub3_id, payment_type, check_number, ref_number, amount, date_issued, check_or_online, status, isFromLoan, collected_by, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :bulk_collection_id, :account_list_sub3_id, :payment_type, :check_number, :ref_number, :amount, :date_issued, :check_or_online, :status, :isFromLoan, :collected_by, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              bulk_collection_id: user.bulk_collection_id,
              account_list_sub3_id: user.account_list_sub3_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              ref_number: user.ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              check_or_online: user.check_or_online,
              status: user.status,
              isFromLoan: user.isFromLoan,
              collected_by: user.collected_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced bulk_collection_payments to cloud: ${user.account_list_sub3_id} ${user.bulk_collection_id} (${user.id})`
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
            `UPDATE bulk_collection_payments SET
            bulk_collection_id = :bulk_collection_id,
            account_list_sub3_id = :account_list_sub3_id,
            payment_type = :payment_type,
            check_number = :check_number,
            ref_number = :ref_number,
            amount = :amount,
            date_issued = :date_issued,
            check_or_online = :check_or_online,
            status = :status,
            isFromLoan = :isFromLoan,
            collected_by = :collected_by,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                bulk_collection_id: user.bulk_collection_id,
                account_list_sub3_id: user.account_list_sub3_id,
                payment_type: user.payment_type,
                check_number: user.check_number,
                ref_number: user.ref_number,
                amount: user.amount,
                date_issued: user.date_issued,
                check_or_online: user.check_or_online,
                status: user.status,
                isFromLoan: user.isFromLoan,
                collected_by: user.collected_by,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated bulk_collection_payments in cloud: ${user.bulk_collection_id} ${user.sales_invoice_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `bulk_collection_payments`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await BulkCollectionPayment.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await BulkCollectionPayment.create({
          id: user.id,
          bulk_collection_id: user.bulk_collection_id,
          account_list_sub3_id: user.account_list_sub3_id,
          payment_type: user.payment_type,
          check_number: user.check_number,
          ref_number: user.ref_number,
          amount: user.amount,
          date_issued: user.date_issued,
          check_or_online: user.check_or_online,
          status: user.status,
          isFromLoan: user.isFromLoan,
          collected_by: user.collected_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing bulk_collection_payments to local: ${user.bulk_collection_id} ${user.sales_invoice_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await BulkCollectionPayment.update(
            {
              bulk_collection_id: user.bulk_collection_id,
              account_list_sub3_id: user.account_list_sub3_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              ref_number: user.ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              check_or_online: user.check_or_online,
              status: user.status,
              isFromLoan: user.isFromLoan,
              collected_by: user.collected_by,
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
            `🔁 Updated bulk_collection_payments in local: ${user.bulk_collection_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { BulkCollectionPaymentSyncData };
