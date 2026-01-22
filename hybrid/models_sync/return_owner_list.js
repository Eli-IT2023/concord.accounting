const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { ReturnOwnerList } = require("../../backend/db/models/associations.js");

const ReturnOwnerListSyncData = async () => {
  try {
    const localUsers = await ReturnOwnerList.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `return_owner_lists` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`return_owner_lists\` (
                id, return_capital_mother_id, account_list_sub3_id, invested_amount, current_balance, shared_percentage, to_return_amount,  new_balance, capital_balance, createdAt, updatedAt
              ) VALUES (
              :id, :return_capital_mother_id, :account_list_sub3_id, :invested_amount, :current_balance, :shared_percentage, :to_return_amount,  :new_balance, :capital_balance, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              return_capital_mother_id: user.return_capital_mother_id,
              account_list_sub3_id: user.account_list_sub3_id,
              invested_amount: user.invested_amount,
              current_balance: user.current_balance,
              shared_percentage: user.shared_percentage,
              to_return_amount: user.to_return_amount,
              new_balance: user.new_balance,
              capital_balance: user.capital_balance,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing return_owner_lists to cloud: ${user.return_capital_mother_id} ${user.invested_amount} (${user.id})`
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
            `UPDATE return_owner_lists SET
            return_capital_mother_id = :return_capital_mother_id,
            account_list_sub3_id = :account_list_sub3_id,
            invested_amount = :invested_amount,
            current_balance = :current_balance,
            shared_percentage = :shared_percentage,
            to_return_amount = :to_return_amount,
            new_balance = :new_balance,
            capital_balance = :capital_balance,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                return_capital_mother_id: user.return_capital_mother_id,
                account_list_sub3_id: user.account_list_sub3_id,
                invested_amount: user.invested_amount,
                current_balance: user.current_balance,
                shared_percentage: user.shared_percentage,
                to_return_amount: user.to_return_amount,
                new_balance: user.new_balance,
                capital_balance: user.capital_balance,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated return_owner_lists in cloud: ${user.return_capital_mother_id} ${user.invested_amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `return_owner_lists`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReturnOwnerList.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReturnOwnerList.create({
          id: user.id,
          return_capital_mother_id: user.return_capital_mother_id,
          account_list_sub3_id: user.account_list_sub3_id,
          invested_amount: user.invested_amount,
          current_balance: user.current_balance,
          shared_percentage: user.shared_percentage,
          to_return_amount: user.to_return_amount,
          new_balance: user.new_balance,
          capital_balance: user.capital_balance,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing return_owner_lists to local: ${user.current_balance} ${user.invested_amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReturnOwnerList.update(
            {
              id: user.id,
              return_capital_mother_id: user.return_capital_mother_id,
              account_list_sub3_id: user.account_list_sub3_id,
              invested_amount: user.invested_amount,
              current_balance: user.current_balance,
              shared_percentage: user.shared_percentage,
              to_return_amount: user.to_return_amount,
              new_balance: user.new_balance,
              capital_balance: user.capital_balance,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated return_owner_lists in local: ${user.return_capital_mother_id} ${user.account_list_sub3_id} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReturnOwnerListSyncData };
