const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  Previous_Profit_Loss,
} = require("../../backend/db/models/associations.js");

const PreviousProfitLossSyncData = async () => {
  try {
    const localUsers = await Previous_Profit_Loss.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `previous_profit_losses` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`previous_profit_losses\` (
                id, account_list_id, currency_id, amount, system_rate, system_value, actual_rate,  actual_amount, exchange_gain_loss, createdAt, updatedAt
              ) VALUES (
                  :id, :account_list_id, :currency_id, :amount, :system_rate, :system_value, :actual_rate,  :actual_amount, :exchange_gain_loss, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              account_list_id: user.account_list_id,
              currency_id: user.currency_id,
              amount: user.amount,
              system_rate: user.system_rate,
              system_value: user.system_value,
              actual_rate: user.actual_rate,
              actual_amount: user.actual_amount,
              exchange_gain_loss: user.exchange_gain_loss,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing previous_profit_losses to cloud: ${user.account_list_id} ${user.system_rate} (${user.id})`
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
            `UPDATE previous_profit_losses SET
            account_list_id = :account_list_id,
            currency_id = :currency_id,
            amount = :amount,
            system_rate = :system_rate,
            system_value = :system_value,
            actual_rate = :actual_rate,
            actual_amount = :actual_amount,
            exchange_gain_loss = :exchange_gain_loss,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                account_list_id: user.account_list_id,
                currency_id: user.currency_id,
                amount: user.amount,
                system_rate: user.system_rate,
                system_value: user.system_value,
                actual_rate: user.actual_rate,
                actual_amount: user.actual_amount,
                exchange_gain_loss: user.exchange_gain_loss,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated previous_profit_losses in cloud: ${user.account_list_id} ${user.currency_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `previous_profit_losses`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Previous_Profit_Loss.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Previous_Profit_Loss.create({
          id: user.id,
          account_list_id: user.account_list_id,
          currency_id: user.currency_id,
          amount: user.amount,
          system_rate: user.system_rate,
          system_value: user.system_value,
          actual_rate: user.actual_rate,
          actual_amount: user.actual_amount,
          exchange_gain_loss: user.exchange_gain_loss,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing previous_profit_losses to local: ${user.account_list_id} ${user.system_rate} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Previous_Profit_Loss.update(
            {
              id: user.id,
              account_list_id: user.account_list_id,
              currency_id: user.currency_id,
              amount: user.amount,
              system_rate: user.system_rate,
              system_value: user.system_value,
              actual_rate: user.actual_rate,
              actual_amount: user.actual_amount,
              exchange_gain_loss: user.exchange_gain_loss,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated previous_profit_losses in local: ${user.account_list_id} ${user.system_value} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { PreviousProfitLossSyncData };
