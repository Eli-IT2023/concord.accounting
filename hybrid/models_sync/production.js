const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Production } = require("../../backend/db/models/associations.js");

const ProductionSyncData = async () => {
  try {
    const localUsers = await Production.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `productions` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`productions\` (
                id, production_id, \`desc\`, date_produce, shift, warehouse_id, status, created_by, approved_by, createdAt, updatedAt, isDeleted
              ) VALUES (
                 :id, :production_id, :desc, :date_produce, :shift, :warehouse_id, :status, :created_by, :approved_by, :createdAt, :updatedAt, :isDeleted
              )`,
          {
            replacements: {
              id: user.id,
              production_id: user.production_id,
              desc: user.desc,
              date_produce: user.date_produce,
              shift: user.shift,
              warehouse_id: user.warehouse_id,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              isDeleted: user.isDeleted,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing productions to cloud: ${user.production_id} ${user.date_produce} (${user.id})`
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
            `UPDATE productions SET
            production_id = :production_id,
            \`desc\` = :desc,
            date_produce = :date_produce,
            shift = :shift,
            warehouse_id = :warehouse_id,
            status = :status,
            created_by = :created_by,
            approved_by = :approved_by,
            updatedAt = :updatedAt,
            isDeleted = :isDeleted
            WHERE id = :id;`,
            {
              replacements: {
                id: user.id,
                production_id: user.production_id,
                desc: user.desc,
                date_produce: user.date_produce,
                shift: user.shift,
                warehouse_id: user.warehouse_id,
                status: user.status,
                created_by: user.created_by,
                approved_by: user.approved_by,
                updatedAt: user.updatedAt,
                isDeleted: user.isDeleted,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated productions in cloud: ${user.production_id} ${user.product_id} (${user.id})`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `productions`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.based_currency} ${user.currency_name}`
      // );

      const localUser = await Production.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await Production.create({
          id: user.id,
          production_id: user.production_id,
          desc: user.desc,
          date_produce: user.date_produce,
          shift: user.shift,
          warehouse_id: user.warehouse_id,
          status: user.status,
          created_by: user.created_by,
          approved_by: user.approved_by,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isDeleted: user.isDeleted,
        });

        console.log(
          `✅ Synced missing productions to local: ${user.production_id} ${user.date_produce} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Production.update(
            {
              id: user.id,
              production_id: user.production_id,
              desc: user.desc,
              date_produce: user.date_produce,
              shift: user.shift,
              warehouse_id: user.warehouse_id,
              status: user.status,
              created_by: user.created_by,
              approved_by: user.approved_by,
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
            `🔁 Updated productions in local: ${user.production_id} ${user.date_produce} (${user.id})`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { ProductionSyncData };
