const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  CashFlow,
  issued_check,
} = require("../../backend/db/models/ModelsBySubject/associations_sub.js");

const CashFlowSyncData = async () => {
  try {
    const localUsers = await CashFlow.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `cash_flows` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`cash_flows\` (
                id, account_list_id_cash_from, transaction_date, transaction_number, account_list_id_cash_to, module_from, description, amount, status, createdAt, updatedAt, isDeleted
              ) VALUES (
                :id, :account_list_id_cash_from, :transaction_date, :transaction_number, :account_list_id_cash_to, :module_from, :description, :amount, :status, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              account_list_id_cash_from: user.account_list_id_cash_from,
              transaction_date: user.transaction_date,
              transaction_number: user.transaction_number,
              account_list_id_cash_to: user.account_list_id_cash_to,
              module_from: user.module_from,
              description: user.description,
              amount: user.amount,
              status: user.status,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing cash_flows to cloud: ${user.account_list_id_cash_from} ${user.transaction_number} (${user.id})`
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
            `UPDATE cash_flows SET
            account_list_id_cash_from = :account_list_id_cash_from,
            transaction_date = :transaction_date,
            transaction_number = :transaction_number,
            account_list_id_cash_to = :account_list_id_cash_to,
            module_from = :module_from,
            description = :description,
            amount = :amount,
            status = :status,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                account_list_id_cash_from: user.account_list_id_cash_from,
                transaction_date: user.transaction_date,
                transaction_number: user.transaction_number,
                account_list_id_cash_to: user.account_list_id_cash_to,
                module_from: user.module_from,
                description: user.description,
                amount: user.amount,
                status: user.status,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated cash_flows in cloud: ${user.account_list_id_cash_from} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `cash_flows`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await CashFlow.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await CashFlow.create({
          id: user.id,
          account_list_id_cash_from: user.account_list_id_cash_from,
          transaction_date: user.transaction_date,
          transaction_number: user.transaction_number,
          account_list_id_cash_to: user.account_list_id_cash_to,
          module_from: user.module_from,
          description: user.description,
          amount: user.amount,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing cash_flows to local: ${user.account_list_id_cash_from} ${user.transaction_number} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await CashFlow.update(
            {
              id: user.id,
              account_list_id_cash_from: user.account_list_id_cash_from,
              transaction_date: user.transaction_date,
              transaction_number: user.transaction_number,
              account_list_id_cash_to: user.account_list_id_cash_to,
              module_from: user.module_from,
              description: user.description,
              amount: user.amount,
              status: user.status,
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
            `🔁 Updated cash_flows in local: ${user.account_list_id_cash_from} ${user.transaction_number} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { CashFlowSyncData };
