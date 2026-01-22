const router = require("express").Router();
const { Op, where, Sequelize } = require("sequelize");
const {
  Parameter,
  Activity_Log,
  PhysicalCategory,
} = require("../db/models/associations");
const moment = require("moment");

const { QueryTypes } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");

router.route("/getParameter").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    // Default sorting
    const sortColumn = sortDBTableColumn || "createdAt";
    const sortDirection = sortType || "DESC";

    // Main UNION query with normalized fields
    const rows = await sequelize.query(
      `
      SELECT 
        id,
        name,
        uom,
        category,
        description,
        status,
        createdAt
      FROM (
        SELECT 
          id,
          name,
          uom,
          category,        
          description,
          status,
          createdAt
        FROM parameters
        WHERE status = 'Active'

        UNION ALL

        SELECT 
          physical_id AS id,
          attribute AS name,
          '' AS uom,              -- Physical has no uom
          'Physical' AS category, -- flag category
          description,
          status,
          createdAt
        FROM physical_categories
        WHERE status = 'Active'
      ) AS combined
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { limit, offset },
        type: QueryTypes.SELECT,
      }
    );

    // Count query
    const totalResult = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT id FROM parameters WHERE status = 'Active'
        UNION ALL
        SELECT physical_id FROM physical_categories WHERE status = 'Active'
      ) AS combined
      `,
      { type: QueryTypes.SELECT }
    );

    const totalItems = totalResult[0].total;

    return res.status(200).json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getParameterSortData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    // Default sorting
    const sortColumn = sortDBTableColumn || "createdAt";
    const sortDirection = sortType || "DESC";

    // Main UNION query with sorting + pagination
    const rows = await sequelize.query(
      `
      SELECT 
        id,
        name,
        uom,
        category,
        description,
        status,
        createdAt
      FROM (
        SELECT 
          id,
          name,
          uom,
          category,        
          description,
          status,
          createdAt
        FROM parameters
        WHERE status = 'Active'

        UNION ALL

        SELECT 
          physical_id AS id,
          attribute AS name,
          '' AS uom,
          'Physical' AS category,
          description,
          status,
          createdAt
        FROM physical_categories
        WHERE status = 'Active'
      ) AS combined
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { limit, offset },
        type: QueryTypes.SELECT,
      }
    );

    // Count query (for total pages)
    const totalResult = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT id FROM parameters WHERE status = 'Active'
        UNION ALL
        SELECT physical_id FROM physical_categories WHERE status = 'Active'
      ) AS combined
      `,
      { type: QueryTypes.SELECT }
    );

    const totalItems = totalResult[0].total;

    return res.status(200).json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching sorted parameter data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getParameterFilter").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    const sortColumn = sortDBTableColumn || "createdAt";
    const sortDirection = sortType || "DESC";

    // Build filter conditions
    let whereConditions = [];
    if (filterStatus && filterStatus !== "All") {
      whereConditions.push(`status = '${filterStatus}'`);
    }
    if (filterDateCreated) {
      const start = moment(filterDateCreated, "YYYY-MM-DD")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      const end = moment(filterDateCreated, "YYYY-MM-DD")
        .endOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      whereConditions.push(`createdAt BETWEEN '${start}' AND '${end}'`);
    }
    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Data query
    const rows = await sequelize.query(
      `
      SELECT id, name, uom, category, description, status, createdAt
      FROM (
        SELECT 
          id,
          name,
          uom,
          category,
          description,
          status,
          createdAt
        FROM parameters

        UNION ALL

        SELECT 
          physical_id AS id,
          attribute AS name,
          '' AS uom,
          'Physical' AS category,
          description,
          status,
          createdAt
        FROM physical_categories
      ) AS combined
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { limit, offset },
        type: QueryTypes.SELECT,
      }
    );

    // Count query
    const totalResult = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT id, createdAt, status FROM parameters
        UNION ALL
        SELECT physical_id, createdAt, status FROM physical_categories
      ) AS combined
      ${whereClause}
      `,
      { type: QueryTypes.SELECT }
    );

    const totalItems = totalResult[0].total;

    return res.status(200).json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching parameter filters:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getParameterBySearch").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    const sortColumn = sortDBTableColumn || "createdAt";
    const sortDirection = sortType || "DESC";

    // Build WHERE conditions
    let whereConditions = [];

    if (filterStatus && filterStatus !== "All") {
      whereConditions.push(`status = '${filterStatus}'`);
    }

    if (searchText && filterColumn !== "all") {
      whereConditions.push(`${filterColumn} LIKE '%${searchText}%'`);
    } else if (searchText) {
      whereConditions.push(`(
        name LIKE '%${searchText}%' OR
        description LIKE '%${searchText}%' OR
        category LIKE '%${searchText}%'
      )`);
    }

    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Data query
    const rows = await sequelize.query(
      `
      SELECT id, name, uom, category, description, status, createdAt
      FROM (
        SELECT 
          id,
          name,
          uom,
          category,
          description,
          status,
          createdAt
        FROM parameters

        UNION ALL

        SELECT 
          physical_id AS id,
          attribute AS name,
          '' AS uom,
          'Physical' AS category,
          description,
          status,
          createdAt
        FROM physical_categories
      ) AS combined
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: { limit, offset },
        type: QueryTypes.SELECT,
      }
    );

    // Count query
    const totalResult = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT id, name, description, category, status FROM parameters
        UNION ALL
        SELECT physical_id, attribute, description, 'Physical' AS category, status FROM physical_categories
      ) AS combined
      ${whereClause}
      `,
      { type: QueryTypes.SELECT }
    );

    const totalItems = totalResult[0].total;

    return res.status(200).json({
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching parameter search:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/para_create").post(async (req, res) => {
  const t = await sequelize.transaction(); // start transaction

  try {
    const {
      specificationName,
      uom,
      category,
      description,
      status,
      userLoggedID,
    } = req.body;

    if (category === "Physical") {
      // Check if the parameter already exists
      const existingParameter = await PhysicalCategory.findOne({
        where: { attribute: specificationName.trim() },
        transaction: t,
      });

      if (existingParameter) {
        await t.rollback();
        return res.status(201).json();
      }

      const newPhysical = await PhysicalCategory.create(
        {
          attribute: specificationName.trim(),
          status,
          description,
        },
        { transaction: t }
      );

      await Activity_Log.create(
        {
          masterlist_id: userLoggedID,
          action_taken: `Created a new physical category: ${specificationName}`,
        },
        { transaction: t }
      );

      await t.commit();
      return res.status(200).json();
    } else {
      // Check if the parameter already exists
      const existingParameter = await Parameter.findOne({
        where: { name: specificationName.trim() },
        transaction: t,
      });

      if (existingParameter) {
        await t.rollback();
        return res.status(201).json();
      }

      const newParameter = await Parameter.create(
        {
          name: specificationName.trim(),
          uom: uom.trim(),
          category,
          description,
          status,
        },
        { transaction: t }
      );

      await Activity_Log.create(
        {
          masterlist_id: userLoggedID,
          action_taken: `Created a new parameter: ${specificationName}`,
        },
        { transaction: t }
      );

      await t.commit();
      return res.status(200).json();
    }
  } catch (error) {
    console.error(error);
    if (t) await t.rollback();
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/para_edit").post(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      specificationName,
      uom,
      category,
      description,
      status,
      userLoggedID,
      forEditPrimary,
    } = req.body;

    console.log("this is my req.body", req.body);

    let oldCategory = null;

    // Check in PhysicalCategory
    const physicalRecord = await PhysicalCategory.findOne({
      where: { physical_id: forEditPrimary },
      transaction: t,
    });

    if (physicalRecord) {
      oldCategory = "Physical";
    }

    // Check in Parameter
    const parameterRecord = await Parameter.findOne({
      where: { id: forEditPrimary },
      transaction: t,
    });

    if (parameterRecord) {
      oldCategory = parameterRecord.category;
    }

    if (!oldCategory) {
      await t.rollback();
      return res.status(404).json({ message: "Record not found" });
    }

    // CASE 1: Same category → update record
    if (oldCategory === category) {
      if (category === "Physical") {
        await PhysicalCategory.update(
          {
            attribute: specificationName.trim(),
            description,
            status,
          },
          { where: { physical_id: forEditPrimary }, transaction: t }
        );
      } else {
        await Parameter.update(
          {
            name: specificationName.trim(),
            uom: uom.trim(),
            category,
            description,
            status,
          },
          { where: { id: forEditPrimary }, transaction: t }
        );
      }

      await Activity_Log.create(
        {
          masterlist_id: userLoggedID,
          action_taken: `Updated ${category} parameter: ${specificationName}`,
        },
        { transaction: t }
      );
    }

    // CASE 2: Different category → delete old & create new
    else {
      // Delete old record
      if (oldCategory === "Physical") {
        await PhysicalCategory.destroy({
          where: { physical_id: forEditPrimary },
          transaction: t,
        });
      } else {
        await Parameter.destroy({
          where: { id: forEditPrimary },
          transaction: t,
        });
      }

      // Create new in the correct table
      if (category === "Physical") {
        await PhysicalCategory.create(
          {
            attribute: specificationName.trim(),
            description,
            status,
          },
          { transaction: t }
        );
      } else {
        await Parameter.create(
          {
            name: specificationName.trim(),
            uom: uom.trim(),
            category,
            description,
            status,
          },
          { transaction: t }
        );
      }

      await Activity_Log.create(
        {
          masterlist_id: userLoggedID,
          action_taken: `Changed category from ${oldCategory} → ${category} and created new parameter: ${specificationName}`,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return res.status(200).json({ message: "Update successful" });
  } catch (error) {
    console.error(error);
    if (t) await t.rollback();
    return res.status(500).json({ message: "Internal server error" });
  }
});

// router.route("/para_edit").post(async (req, res) => {
//   try {
//     const {
//       specificationName,
//       uom,
//       category,
//       description,
//       status,
//       userLoggedID,
//       forEditPrimary,
//     } = req.body;

//     console.log("this is my req.body", req.body);

//     oldCategory = null;

//     const checkParameter = await PhysicalCategory.findOne({
//       where: {
//         physical_id: forEditPrimary,
//       },
//     });

//     if (checkParameter) {
//       oldCategory = "Physical";
//     }

//     const checkParameter2 = await Parameter.findOne({
//       where: {
//         id: forEditPrimary,
//       },
//     });

//     if (checkParameter2) {
//       oldCategory = checkParameter2.category;
//     }

//     if (category === "Physical") {
//       // Check if the parameter already exists
//       const existingParameter = await PhysicalCategory.findOne({
//         where: {
//           attribute: specificationName.trim(),
//           physical_id: { [Op.ne]: forEditPrimary },
//         },
//       });

//       if (existingParameter) {
//         return res.status(201).json();
//       }
//     }

//     return;
//     // Check if the parameter already exists
//     const existingParameter = await Parameter.findOne({
//       where: {
//         name: specificationName.trim(),
//         id: { [Op.ne]: forEditPrimary },
//       },
//     });

//     if (existingParameter) {
//       return res.status(201).json();
//     }

//     const newParameter = await Parameter.update(
//       {
//         name: specificationName.trim(),
//         uom: uom.trim(),
//         category: category,
//         description: description,
//         status: status,
//       },
//       {
//         where: { id: forEditPrimary },
//       }
//     );

//     if (newParameter) {
//       await Activity_Log.create({
//         masterlist_id: userLoggedID,
//         action_taken: `Updated the parameter: ${specificationName} with ID ${forEditPrimary}`,
//       });

//       return res.status(200).json();
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

module.exports = router;
