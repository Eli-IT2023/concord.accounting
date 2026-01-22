const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { Warehouse } = require("../../backend/db/models/associations.js");

const WarehouseSyncData = async () => {
  try {
    const localUsers = await Warehouse.findAll({ raw: true });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      //   console.log(
      //     `📝 Checking user in cloudDB: ${user.warehouse_id} - ${user.based_currency} ${user.currency_name}`
      //   );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `warehouses` WHERE warehouse_id = :warehouse_id",
        {
          replacements: { warehouse_id: user.warehouse_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`warehouses\` (
                warehouse_id, name, branch_type, address, province, municipality, zipcode, description, status, createdAt, updatedAt
              ) VALUES (
                :warehouse_id, :name, :branch_type, :address, :province, :municipality, :zipcode, :description, :status, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              warehouse_id: user.warehouse_id,
              name: user.name,
              branch_type: user.branch_type,
              address: user.address,
              province: user.province,
              municipality: user.municipality,
              zipcode: user.zipcode,
              description: user.description,
              status: user.status,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ (create) Synced missing to warehouses cloud: ${user.name} (${user.branch_type}) - ${user.warehouse_id}`
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
            `UPDATE warehouses SET
               name = :name, 
               branch_type = :branch_type, 
               address = :address, 
               province = :province, 
               municipality = :municipality,
               zipcode = :zipcode, 
               description = :description, 
               status = :status, 
               updatedAt = :updatedAt
              WHERE warehouse_id = :warehouse_id`,
            {
              replacements: {
                warehouse_id: user.warehouse_id,
                name: user.name,
                branch_type: user.branch_type,
                address: user.address,
                province: user.province,
                municipality: user.municipality,
                zipcode: user.zipcode,
                description: user.description,
                status: user.status,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated in warehouses cloud: ${user.name} (${user.branch_type}) - ${user.warehouse_id}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    const cloudUsers = await cloudDB.query("SELECT * FROM `warehouses`", {
      type: Sequelize.QueryTypes.SELECT,
    });
    for (const user of cloudUsers) {
      //   console.log(
      //     `📝 Checking in localDB: ${user.warehouse_id} - ${user.based_currency} ${user.currency_name}`
      //   );

      const localUser = await Warehouse.findAll({
        where: { warehouse_id: user.warehouse_id },
      });

      if (localUser.length === 0) {
        await Warehouse.create({
          warehouse_id: user.warehouse_id,
          name: user.name,
          branch_type: user.branch_type,
          address: user.address,
          province: user.province,
          municipality: user.municipality,
          zipcode: user.zipcode,
          description: user.description,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ (Create) Synced missing to warehouses local: ${user.name} ${user.branch_type} (${user.warehouse_id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await Warehouse.update(
            {
              name: user.name,
              branch_type: user.branch_type,
              address: user.address,
              province: user.province,
              municipality: user.municipality,
              zipcode: user.zipcode,
              description: user.description,
              status: user.status,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                warehouse_id: user.warehouse_id,
              },
            } // Use the ID to find the record to update
          );

          await console.log(
            `✅ (Update) Synced missing to warehouses local: ${user.name} ${user.branch_type} (${user.warehouse_id})`
          );
        }
      }
    }

    // // STEP 3: DELETE cloud items missing in local
    // // 💻 Deleted in local → remove from cloud
    // const cloudIDs = cloudUsers.map((user) => user.warehouse_id);
    // const localIDs = localUsers.map((user) => user.warehouse_id);
    // for (const cloudUser of cloudUsers) {
    //   if (!localIDs.includes(cloudUser.warehouse_id)) {
    //     const isDelete = await cloudDB.query(
    //       `DELETE FROM warehouses WHERE warehouse_id = :warehouse_id`,
    //       {
    //         replacements: { warehouse_id: cloudUser.warehouse_id },
    //         type: Sequelize.QueryTypes.DELETE,
    //       }
    //     );
    //     if (isDelete) {
    //       console.log(
    //         `🗑️ Deleted from cloud (missing in local): ${cloudUser.warehouse_id}`
    //       );
    //     }
    //   }
    // }
    // // STEP 4: DELETE local items missing in cloud
    // // 🌩️ Deleted in cloud → remove from local

    // for (const localUser of localUsers) {
    //   if (!cloudIDs.includes(localUser.warehouse_id)) {
    //     // await localDB.query(`DELETE FROM userroles WHERE warehouse_id = :warehouse_id`, {
    //     //   replacements: { warehouse_id: localUser.warehouse_id },
    //     //   type: Sequelize.QueryTypes.DELETE,
    //     // });

    //     const isDelete = await Warehouse.destroy({
    //       where: {
    //         warehouse_id: localUser.warehouse_id,
    //       },
    //     });

    //     if (isDelete) {
    //       console.log(
    //         `🗑️ Deleted from local (missing in cloud): ${localUser.warehouse_id}`
    //       );
    //     }
    //   }
    // }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { WarehouseSyncData };
