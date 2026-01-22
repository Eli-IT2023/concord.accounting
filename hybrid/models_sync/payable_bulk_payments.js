const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Payable_Payment } = require("../../backend/db/models/associations.js");

const Payable_Payment_syncData = async () => {
  try {
    const localUsers = await Payable_Payment.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `payable_bulk_payments` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`payable_bulk_payments\` (
                id, payable_id, accountList_id , payment_type, check_number, ref_number, amount, date_issued, status, createdAt, updatedAt
              ) VALUES (
                :id, :payable_id, :accountList_id , :payment_type, :check_number, :ref_number, :amount, :date_issued, :status, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              payable_id: user.payable_id,
              accountList_id: user.accountList_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              ref_number: user.ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              status: user.status,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing  payable_bulk_payments to cloud: ${user.payment_type} ${user.amount} (${user.id})`
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
            `UPDATE payable_bulk_payments SET 
             payable_id = :payable_id,
                accountList_id = :accountList_id,
                payment_type = :payment_type,
                check_number = :check_number,
                ref_number = :ref_number,
                amount = :amount,
                date_issued = :date_issued,
                status = :status,
                updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                payable_id: user.payable_id,
                accountList_id: user.accountList_id,
                payment_type: user.payment_type,
                check_number: user.check_number,
                ref_number: user.ref_number,
                amount: user.amount,
                date_issued: user.date_issued,
                status: user.status,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated payable_bulk_payments in cloud: ${user.payment_type} ${user.amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `payable_bulk_payments`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Payable_Payment.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Payable_Payment.create({
          id: user.id,
          payable_id: user.payable_id,
          accountList_id: user.accountList_id,
          payment_type: user.payment_type,
          check_number: user.check_number,
          ref_number: user.ref_number,
          amount: user.amount,
          date_issued: user.date_issued,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing payable_bulk_payments to local: ${user.payment_type} ${user.amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Payable_Payment.update(
            {
              payable_id: user.payable_id,
              accountList_id: user.accountList_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              ref_number: user.ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              status: user.status,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the id to find the record to update
          );

          console.log(
            `🔁 Updated payable_bulk_payments in local: ${user.payment_type} ${user.amount} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { Payable_Payment_syncData };
