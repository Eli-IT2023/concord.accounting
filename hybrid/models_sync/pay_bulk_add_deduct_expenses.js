const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  PayBulkAddDeductExpenses,
} = require("../../backend/db/models/associations.js");

const PayBulkAddDeductExpensesSyncData = async () => {
  try {
    const localUsers = await PayBulkAddDeductExpenses.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `pay_bulk_add_deduct_expenses` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`pay_bulk_add_deduct_expenses\` (
                id, pay_bulk_id, account_list_sub3_id, loan_id, amount, type_expenses, description, loan_or_account, rate, createdAt, updatedAt
              ) VALUES (
                 :id, :pay_bulk_id, :account_list_sub3_id, :loan_id, :amount, :type_expenses, :description, :loan_or_account, :rate, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              pay_bulk_id: user.pay_bulk_id,
              account_list_sub3_id: user.account_list_sub3_id,
              loan_id: user.loan_id,
              amount: user.amount,
              type_expenses: user.type_expenses,
              description: user.description,
              loan_or_account: user.loan_or_account,
              rate: user.rate,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing pay_bulk_add_deduct_expenses to cloud: ${user.pay_bulk_id} ${user.account_list_sub3_id} (${user.id})`
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
            `UPDATE pay_bulk_add_deduct_expenses SET
            pay_bulk_id = :pay_bulk_id,
            account_list_sub3_id = :account_list_sub3_id,
            loan_id = :loan_id,
            amount = :amount,
            type_expenses = :type_expenses,
            description = :description,
            loan_or_account = :loan_or_account,
            rate = :rate,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                pay_bulk_id: user.pay_bulk_id,
                account_list_sub3_id: user.account_list_sub3_id,
                loan_id: user.loan_id,
                amount: user.amount,
                type_expenses: user.type_expenses,
                description: user.description,
                loan_or_account: user.loan_or_account,
                rate: user.rate,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated pay_bulk_add_deduct_expenses in cloud: ${user.pay_bulk_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `pay_bulk_add_deduct_expenses`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await PayBulkAddDeductExpenses.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await PayBulkAddDeductExpenses.create({
          id: user.id,
          pay_bulk_id: user.pay_bulk_id,
          account_list_sub3_id: user.account_list_sub3_id,
          loan_id: user.loan_id,
          amount: user.amount,
          type_expenses: user.type_expenses,
          description: user.description,
          loan_or_account: user.loan_or_account,
          rate: user.rate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing pay_bulk_add_deduct_expenses to local: ${user.account_list_sub3_id} ${user.pay_bulk_id} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await PayBulkAddDeductExpenses.update(
            {
              id: user.id,
              pay_bulk_id: user.pay_bulk_id,
              account_list_sub3_id: user.account_list_sub3_id,
              loan_id: user.loan_id,
              amount: user.amount,
              type_expenses: user.type_expenses,
              description: user.description,
              loan_or_account: user.loan_or_account,
              rate: user.rate,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated pay_bulk_add_deduct_expenses in local: ${user.pay_bulk_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PayBulkAddDeductExpensesSyncData };
