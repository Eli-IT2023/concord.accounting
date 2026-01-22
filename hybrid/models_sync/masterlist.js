const { Sequelize } = require("sequelize");
const { localDB, cloudDB } = require("../connection.js");
// const { MasterList, cloudDB, Sequelize } = require("../db/models/associations"); // Adjust the import path as per your structure
// Import all models and manually attach them
const { MasterList } = require("../../backend/db/models/associations.js");

const MasterListsyncData = async () => {
  try {
    const localUsers = await MasterList.findAll({ raw: true });
    const cloudUsers = await cloudDB.query("SELECT * FROM `masterlists`", {
      type: Sequelize.QueryTypes.SELECT,
    });

    /** ✅ STEP 1: Sync Local → Cloud **/
    for (const user of localUsers) {
      // console.log(
      //   `📝 Checking user in cloudDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const cloudUser = await cloudDB.query(
        "SELECT * FROM `masterlists` WHERE id = :id",
        {
          replacements: { id: user.id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (cloudUser.length === 0) {
        await cloudDB.query(
          `INSERT INTO \`masterlists\` (
                id, emp_id, fname, mname, lname, address, city, province, zip_code, 
                email, number, birthdate, marital_status, gender, userrole_id, 
                uname, password, salary, daily_rate, status, user_type, createdAt, updatedAt
              ) VALUES (
                :id, :emp_id, :fname, :mname, :lname, :address, :city, :province, :zip_code, 
                :email, :number, :birthdate, :marital_status, :gender, :userrole_id, 
                :uname, :password, :salary, :daily_rate, :status, :user_type, :createdAt, :updatedAt
              )`,
          {
            replacements: {
              id: user.id,
              emp_id: user.emp_id,
              fname: user.fname,
              mname: user.mname,
              lname: user.lname,
              address: user.address,
              city: user.city,
              province: user.province,
              zip_code: user.zip_code,
              email: user.email,
              number: user.number,
              birthdate: user.birthdate,
              marital_status: user.marital_status,
              gender: user.gender,
              userrole_id: user.userrole_id,
              uname: user.uname,
              password: user.password,
              salary: user.salary,
              daily_rate: user.daily_rate,
              status: user.status,
              user_type: user.user_type,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            type: Sequelize.QueryTypes.INSERT,
          }
        );
        console.log(
          `✅ Synced missing masterlists to cloud: ${user.fname} ${user.lname} (${user.id})`
        );
      } else {
        // Compare fields to check if update is needed
        const cloud = cloudUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(cloud.updatedAt).getTime();

        if (needsUpdate) {
          console.log(`pumasok sa needsUpdate`);
          await cloudDB.query(
            `UPDATE masterlists SET
                emp_id = :emp_id, 
                fname = :fname, 
                mname = :mname, 
                lname = :lname, 
                address = :address, 
                city = :city, 
                province = :province, 
                zip_code = :zip_code, 
                email = :email, 
                number = :number, 
                birthdate = :birthdate,
                marital_status = :marital_status, 
                gender = :gender, 
                userrole_id = :userrole_id, 
                uname = :uname, 
                password = :password, 
                salary = :salary, 
                daily_rate = :daily_rate, 
                status = :status, 
                user_type = :user_type,  
                updatedAt = :updatedAt
              WHERE id = :id`,
            {
              replacements: {
                id: user.id,
                emp_id: user.emp_id,
                fname: user.fname,
                mname: user.mname,
                lname: user.lname,
                address: user.address,
                city: user.city,
                province: user.province,
                zip_code: user.zip_code,
                email: user.email,
                number: user.number,
                birthdate: user.birthdate,
                marital_status: user.marital_status,
                gender: user.gender,
                userrole_id: user.userrole_id,
                uname: user.uname,
                password: user.password,
                salary: user.salary,
                daily_rate: user.daily_rate,
                status: user.status,
                user_type: user.user_type,
                updatedAt: user.updatedAt,
              },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );
          console.log(
            `🔁 Updated masterlists in cloud: ${user.col_rolename} (${user.col_id}) - ${user.col_authorization}`
          );
        }
      }
    }

    /** ✅ STEP 2: Sync Cloud → Local **/
    for (const user of cloudUsers) {
      // console.log(
      //   `📝 Checking user in localDB: ${user.id} - ${user.fname} ${user.lname}`
      // );

      const localUser = await MasterList.findAll({
        where: { id: user.id },
      });

      if (localUser.length === 0) {
        await MasterList.create({
          id: user.id,
          emp_id: user.emp_id,
          fname: user.fname,
          mname: user.mname,
          lname: user.lname,
          address: user.address,
          city: user.city,
          province: user.province,
          zip_code: user.zip_code,
          email: user.email,
          number: user.number,
          birthdate: user.birthdate,
          marital_status: user.marital_status,
          gender: user.gender,
          userrole_id: user.userrole_id,
          uname: user.uname,
          password: user.password,
          salary: user.salary,
          daily_rate: user.daily_rate,
          status: user.status,
          user_type: user.user_type,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        await console.log(
          `✅ Synced missing masterlists to local: ${user.fname} ${user.lname} (${user.id})`
        );
      } else {
        const local = localUser[0];
        // const needsUpdate = cloud.updatedAt !== user.updatedAt;
        const needsUpdate =
          new Date(user.updatedAt).getTime() >
          new Date(local.updatedAt).getTime();

        if (needsUpdate) {
          await MasterList.update(
            {
              emp_id: user.emp_id,
              fname: user.fname,
              mname: user.mname,
              lname: user.lname,
              address: user.address,
              city: user.city,
              province: user.province,
              zip_code: user.zip_code,
              email: user.email,
              number: user.number,
              birthdate: user.birthdate,
              marital_status: user.marital_status,
              gender: user.gender,
              userrole_id: user.userrole_id,
              uname: user.uname,
              password: user.password,
              salary: user.salary,
              daily_rate: user.daily_rate,
              status: user.status,
              user_type: user.user_type,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            {
              where: {
                id: user.id,
              },
            } // Use the ID to find the record to update
          );

          console.log(
            `🔁 Updated masterlists in local: ${user.col_rolename} (${user.col_id}) - ${user.col_authorization}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Sync error:", err);
  }
};

module.exports = { MasterListsyncData };
