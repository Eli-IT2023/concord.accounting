const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { UserRole } = require("../../backend/db/models/associations.js");
const UserRolesyncData = async () => {
  try {
    const localUsers = await UserRole.findAll({ raw: true });
    const cloudUsers = await cloudDB.query("SELECT * FROM `userroles`", {
      type: Sequelize.QueryTypes.SELECT,
    });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.col_id} - ${user.col_rolename} - ${user.col_authorization}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `userroles` WHERE col_id = :col_id",
        {
          replacements: { col_id: user.col_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO userroles (
                col_id, col_rolename, col_desc, col_authorization, createdAt, updatedAt
              ) VALUES (
                :col_id, :col_rolename, :col_desc, :col_authorization, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              col_id: user.col_id,
              col_rolename: user.col_rolename,
              col_desc: user.col_desc,
              col_authorization: user.col_authorization,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing userroles to cloud : ${user.col_rolename} (${user.col_id}) - ${user.col_authorization}`
        );
      } else {
        // Compare fields to check if update is needed
        const cloud = cloudUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(cloud.updatedAt).getTime();

        if (needsUpdate) {
          await cloudDB.query(
            `UPDATE userroles SET
                col_rolename = :col_rolename,
                col_desc = :col_desc,
                col_authorization = :col_authorization,
                updatedAt = :updatedAt
              WHERE col_id = :col_id`,
            {
              replacements: {
                col_id: user.col_id,
                col_rolename: user.col_rolename,
                col_desc: user.col_desc,
                col_authorization: user.col_authorization,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated userroles in cloud: ${user.col_rolename} (${user.col_id}) - ${user.col_authorization}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/

    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking in localDB: ${user.col_id} - ${user.col_rolename} - ${user.col_authorization}`
      // );

      const localUser = await UserRole.findAll({
        where: { col_id: user.col_id },
      });

      if (localUser.length === 0) {
        // await UserRole.create({
        //   col_id: user.col_id,
        //   col_rolename: user.col_rolename,
        //   col_desc: user.col_desc,
        //   col_authorization: `${user.col_authorization}`,
        //   createdAt: user.createdAt,
        //   updatedAt: user.updatedAt,
        // });
        await localDB.query(
          `INSERT INTO userroles (
                col_id, col_rolename, col_desc, col_authorization, createdAt, updatedAt
              ) VALUES (
                :col_id, :col_rolename, :col_desc, :col_authorization, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              col_id: user.col_id,
              col_rolename: user.col_rolename,
              col_desc: user.col_desc,
              col_authorization: user.col_authorization,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        await console.log(
          `✅ Synced missing userroles to local: ${user.col_rolename} (${user.col_id}) - ${user.col_authorization}`
        );
      } else {
        // Compare fields to check if update is needed
        const local = localUser[0];
        // const needsUpdate = local.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await localDB.query(
            `UPDATE userroles SET
                col_rolename = :col_rolename,
                col_desc = :col_desc,
                col_authorization = :col_authorization,
                updatedAt = :updatedAt
              WHERE col_id = :col_id`,
            {
              replacements: {
                col_id: user.col_id,
                col_rolename: user.col_rolename,
                col_desc: user.col_desc,
                col_authorization: user.col_authorization,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated in userroles local: ${user.col_rolename} (${user.col_id}) - ${user.col_authorization}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { UserRolesyncData };
