const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  Other_Income_Payment,
} = require("../../backend/db/models/associations.js");

const OtherIncomePaymentSyncData = async () => {
  try {
    const localUsers = await Other_Income_Payment.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `other_income_payments` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`other_income_payments\` (
                id, other_income_id, account_list_sub3_id, payment_type, check_number, online_name, online_ref_number, amount, date_issued, \`foreign\`, createdAt, updatedAt
              ) VALUES (
              :id, :other_income_id, :account_list_sub3_id, :payment_type, :check_number, :online_name, :online_ref_number, :amount, :date_issued, :foreign, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              other_income_id: user.other_income_id,
              account_list_sub3_id: user.account_list_sub3_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              online_name: user.online_name,
              online_ref_number: user.online_ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              foreign: user.foreign,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing other_income_payments to cloud: ${user.other_income_id} ${user.payment_type} (${user.id})`
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
            `UPDATE other_income_payments SET
            other_income_id = :other_income_id,
            account_list_sub3_id = :account_list_sub3_id,
            payment_type = :payment_type,
            check_number = :check_number,
            online_name = :online_name,
            online_ref_number = :online_ref_number,
            amount = :amount,
            date_issued = :date_issued,
            \`foreign\` = :foreign,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                other_income_id: user.other_income_id,
                account_list_sub3_id: user.account_list_sub3_id,
                payment_type: user.payment_type,
                check_number: user.check_number,
                online_name: user.online_name,
                online_ref_number: user.online_ref_number,
                amount: user.amount,
                date_issued: user.date_issued,
                foreign: user.foreign,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated other_income_payments in cloud: ${user.return_capital_mother_id} ${user.invested_amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `other_income_payments`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Other_Income_Payment.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Other_Income_Payment.create({
          id: user.id,
          other_income_id: user.other_income_id,
          account_list_sub3_id: user.account_list_sub3_id,
          payment_type: user.payment_type,
          check_number: user.check_number,
          online_name: user.online_name,
          online_ref_number: user.online_ref_number,
          amount: user.amount,
          date_issued: user.date_issued,
          foreign: user.foreign,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing other_income_payments to local: ${user.other_income_id} ${user.payment_type} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Other_Income_Payment.update(
            {
              id: user.id,
              other_income_id: user.other_income_id,
              account_list_sub3_id: user.account_list_sub3_id,
              payment_type: user.payment_type,
              check_number: user.check_number,
              online_name: user.online_name,
              online_ref_number: user.online_ref_number,
              amount: user.amount,
              date_issued: user.date_issued,
              foreign: user.foreign,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated other_income_payments in local: ${user.payment_type} ${user.check_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { OtherIncomePaymentSyncData };
