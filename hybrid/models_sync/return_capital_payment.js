const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  ReturnCapitalPayments,
} = require("../../backend/db/models/associations.js");

const ReturnCapitalPaymentSyncData = async () => {
  try {
    const localUsers = await ReturnCapitalPayments.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `return_capital_payments` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`return_capital_payments\` (
                id, return_owner_list_id, amount, check_number, account_list_id_payment, date, type, createdAt, updatedAt
              ) VALUES (
               :id, :return_owner_list_id, :amount, :check_number, :account_list_id_payment, :date, :type, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              return_owner_list_id: user.return_owner_list_id,
              amount: user.amount,
              check_number: user.check_number,
              account_list_id_payment: user.account_list_id_payment,
              date: user.date,
              type: user.type,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing return_capital_payments to cloud: ${user.return_owner_list_id} ${user.amount} (${user.id})`
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
            `UPDATE return_capital_payments SET
            return_owner_list_id = :return_owner_list_id,
            amount = :amount,
            check_number = :check_number,
            account_list_id_payment = :account_list_id_payment,
            date = :date,
            type = :type,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                return_owner_list_id: user.return_owner_list_id,
                amount: user.amount,
                check_number: user.check_number,
                account_list_id_payment: user.account_list_id_payment,
                date: user.date,
                type: user.type,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated return_capital_payments in cloud: ${user.return_owner_list_id} ${user.check_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `return_capital_payments`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReturnCapitalPayments.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReturnCapitalPayments.create({
          id: user.id,
          return_owner_list_id: user.return_owner_list_id,
          amount: user.amount,
          check_number: user.check_number,
          account_list_id_payment: user.account_list_id_payment,
          date: user.date,
          type: user.type,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing return_capital_payments to local: ${user.return_owner_list_id} ${user.amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReturnCapitalPayments.update(
            {
              id: user.id,
              return_owner_list_id: user.return_owner_list_id,
              amount: user.amount,
              check_number: user.check_number,
              account_list_id_payment: user.account_list_id_payment,
              date: user.date,
              type: user.type,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated return_capital_payments in local: ${user.return_owner_list_id} ${user.check_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReturnCapitalPaymentSyncData };
