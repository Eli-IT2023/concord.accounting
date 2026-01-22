const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const {
  ReturnCapitalMother,
} = require("../../backend/db/models/associations.js");

const ReturnCapitalMotherSyncData = async () => {
  try {
    const localUsers = await ReturnCapitalMother.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `return_capital_mothers` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`return_capital_mothers\` (
                id, name, total_net_amount,total_distributed_amount, status, created_by, approved_by, createdAt, updatedAt
              ) VALUES (
                 :id, :name, :total_net_amount,:total_distributed_amount, :status, :created_by, :approved_by, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              name: user.name,
              total_net_amount: user.total_net_amount,
              total_distributed_amount: user.total_distributed_amount,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing return_capital_mothers to cloud: ${user.total_net_amount} ${user.total_distributed_amount} (${user.id})`
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
            `UPDATE return_capital_mothers SET
            name = :name,
            total_net_amount = :total_net_amount,
            total_distributed_amount = :total_distributed_amount,
            status = :status,
            created_by = :created_by,
            approved_by = :approved_by,
            updatedAt = :updatedAt
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                name: user.name,
                total_net_amount: user.total_net_amount,
                total_distributed_amount: user.total_distributed_amount,
                status: user.status,
                created_by: user.created_by,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated return_capital_mothers in cloud: ${user.total_net_amount} ${user.total_distributed_amount} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query(
      "SELECT * FROM `return_capital_mothers`",
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await ReturnCapitalMother.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await ReturnCapitalMother.create({
          id: user.id,
          name: user.name,
          total_net_amount: user.total_net_amount,
          total_distributed_amount: user.total_distributed_amount,
          status: user.status,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });

        console.log(
          `✅ Synced missing return_capital_mothers to local: ${user.total_net_amount} ${user.total_distributed_amount} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await ReturnCapitalMother.update(
            {
              id: user.id,
              name: user.name,
              total_net_amount: user.total_net_amount,
              total_distributed_amount: user.total_distributed_amount,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            }
          );

          console.log(
            `🔁 Updated return_capital_mothers in local: ${user.name} ${user.total_net_amount} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ReturnCapitalMotherSyncData };
