const router = require("express").Router();
const { where, Op, fn, col, Sequelize } = require("sequelize");
const sequelize = require("../../../db/config/sequelize.config");
const {
  Packaging,
  Activity_Log,
  PackagingImage,
} = require("../../../db/models/associations");
const session = require("express-session");
const moment = require("moment");

// CREATE
router.route("/create").post(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      packageName,
      packagingImage, // array of strings or { data, tempId }
      description,
      unit,
      unitQuantity,
      status,
      userLoggedID,
      selectedImg, // can be tempId or created DB id or index
    } = req.body;

    // Check duplicate
    const existingParameter = await Packaging.findOne({
      where: {
        packaging_name: packageName.trim(),
        unit_quantity: unitQuantity,
        unit: unit,
      },
      transaction: t,
    });

    if (existingParameter) {
      await t.rollback();
      return res.status(201).json(); // exists
    }

    // Create packaging
    const createPackaging = await Packaging.create(
      {
        packaging_name: packageName.trim(),
        description,
        unit,
        unit_quantity: unitQuantity,
        status,
      },
      { transaction: t }
    );

    await Activity_Log.create(
      {
        masterlist_id: userLoggedID,
        action_taken: `Created a new packaging: ${packageName}`,
      },
      { transaction: t }
    );

    // Process images (if any)
    if (packagingImage && packagingImage.length > 0) {
      const createdImages = await Promise.all(
        packagingImage.map(async (img, index) => {
          const imageData = typeof img === "string" ? img : img.data;
          let newImage = null;

          if (imageData && imageData.startsWith("data:image/")) {
            // capture MIME more robustly
            const mimeMatch = imageData.match(
              /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
            );
            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
            const base64Data = imageData.replace(
              /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
              ""
            );
            const packagingImageBuffer = Buffer.from(base64Data, "base64");

            newImage = await PackagingImage.create(
              {
                packaging_id: createPackaging.id,
                packaging_image: packagingImageBuffer,
                mime: mimeType,
                isSelected: 0,
                isDeleted: 0,
              },
              { transaction: t }
            );
          }

          return {
            dbImage: newImage ? newImage.toJSON() : null,
            tempId: typeof img === "object" ? img.tempId : null,
            index,
          };
        })
      );

      // If client provided selectedImg (tempId or created id or index), find & mark it
      if (selectedImg) {
        const selected = createdImages.find(
          (ci) =>
            (ci.dbImage && ci.dbImage.id === selectedImg) ||
            (ci.tempId && ci.tempId === selectedImg) ||
            String(ci.index) === String(selectedImg)
        );

        if (selected && selected.dbImage && selected.dbImage.id) {
          await PackagingImage.update(
            { isSelected: 1 },
            {
              where: { id: selected.dbImage.id },
              transaction: t,
            }
          );
        }
      }
    }

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("CREATE packaging error:", error);
    await t.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// UPDATE
router.route("/update").post(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      packageName,
      packagingImage, // array of existing images (with id) and/or new { data, tempId }
      description,
      status,
      unit,
      unitQuantity,
      userLoggedID,
      forEditPrimary,
      selectedImg, // selected id or tempId or index
      deletedImageIds = [],
    } = req.body;

    // Check duplicate packaging (exclude current)
    const existingPackaging = await Packaging.findOne({
      where: {
        packaging_name: packageName.trim(),
        unit_quantity: unitQuantity,
        unit: unit,
        id: { [Op.ne]: forEditPrimary },
      },
      transaction: t,
    });

    if (existingPackaging) {
      await t.rollback();
      return res.status(201).json(); // exists
    }

    // Update packaging record
    await Packaging.update(
      {
        packaging_name: packageName.trim(),
        description,
        unit,
        unit_quantity: unitQuantity,
        status,
      },
      { where: { id: forEditPrimary }, transaction: t }
    );

    // Process new images (create those without id)
    const newImageIds = {}; // tempId -> new db id
    if (packagingImage && packagingImage.length > 0) {
      await Promise.all(
        packagingImage.map(async (img, index) => {
          if (img.id) {
            // existing image, skip creation
            return;
          }

          const imageData = img.data;
          if (imageData && imageData.startsWith("data:image/")) {
            const mimeMatch = imageData.match(
              /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
            );
            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
            const base64Data = imageData.replace(
              /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
              ""
            );
            const packagingImageBuffer = Buffer.from(base64Data, "base64");

            const created = await PackagingImage.create(
              {
                packaging_id: forEditPrimary,
                packaging_image: packagingImageBuffer,
                mime: mimeType,
                isSelected: 0,
                isDeleted: 0,
              },
              { transaction: t }
            );

            if (img.tempId) {
              newImageIds[img.tempId] = created.id;
            }
          }
        })
      );
    }

    // Reset all isSelected for this packaging
    await PackagingImage.update(
      { isSelected: 0 },
      { where: { packaging_id: forEditPrimary }, transaction: t }
    );

    // Determine final selected id (if selectedImg references a tempId, map to new id)
    let finalSelectedId = null;
    if (selectedImg) {
      if (newImageIds[selectedImg]) {
        finalSelectedId = newImageIds[selectedImg];
      } else {
        finalSelectedId = selectedImg; // assume DB id or index handled by client
      }
    }

    // Set selected image if found
    if (finalSelectedId) {
      await PackagingImage.update(
        { isSelected: 1 },
        {
          where: { id: finalSelectedId, packaging_id: forEditPrimary },
          transaction: t,
        }
      );
    }

    // Mark deleted images (soft delete)
    if (deletedImageIds && deletedImageIds.length > 0) {
      await PackagingImage.update(
        { isDeleted: 1 },
        {
          where: {
            id: { [Op.in]: deletedImageIds },
            packaging_id: forEditPrimary,
          },
          transaction: t,
        }
      );
    }

    // Log activity
    await Activity_Log.create(
      {
        masterlist_id: userLoggedID,
        action_taken: `Updated packaging: ${packageName} with ID ${forEditPrimary}`,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("UPDATE packaging error:", error);
    await t.rollback();
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// FETCH DATA
router.route("/fetchData").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await Packaging.findAndCountAll({
      where: {
        status: "Active",
      },
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "packaging_name"} ${sortType || "ASC"}`
        ),
      ],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: `data:${
                image.mime
              };base64,${image.packaging_image.toString("base64")}`,
            };
          }
          return image;
        });
      }

      return formattedRow;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// FETCH SORTED DATA
router.route("/fetchDataSort").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { sortType, sortDBTableColumn } = req.query;

    const { count, rows } = await Packaging.findAndCountAll({
      where: {
        status: "Active",
      },
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [[sortDBTableColumn, sortType]],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: `data:${
                image.mime
              };base64,${image.packaging_image.toString("base64")}`,
            };
          }
          return image;
        });
      }

      return formattedRow;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// FETCH FILTERED DATA
router.route("/fetchFilteredData").get(async (req, res) => {
  try {
    const { filterStatus, filterDateCreated } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    // Build the where clause dynamically
    const whereClause = {};

    // Handle status filter (including "All" option)
    if (filterStatus && filterStatus !== "All") {
      whereClause.status = filterStatus;
    }

    // Handle date filter
    if (filterDateCreated) {
      const startOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .startOf("day")
        .toDate();

      const endOfDay = moment(filterDateCreated, "YYYY-MM-DD")
        .endOf("day")
        .toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "packaging_name"} ${sortType || "DESC"}`
        ),
      ],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: `data:${
                image.mime
              };base64,${image.packaging_image.toString("base64")}`,
            };
          }
          return image;
        });
      }

      return formattedRow;
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: formattedRows,
      filters: {
        status: filterStatus,
        date: filterDateCreated,
      },
    });
  } catch (error) {
    console.error("Error fetching filtered data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// FETCH SEARCH DATA
router.route("/fetchSearchData").get(async (req, res) => {
  try {
    const { searchText, filterColumn, filterStatus } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { sortType, sortDBTableColumn } = req.query;

    const whereClause = {};

    if (filterColumn !== "all") {
      whereClause[filterColumn] = {
        [Op.like]: `%${searchText}%`,
      };
      whereClause.status = filterStatus;
    } else {
      whereClause[Op.or] = [
        { packaging_name: { [Op.like]: `%${searchText}%` } },
        { description: { [Op.like]: `%${searchText}%` } },
      ];
      whereClause.status = filterStatus;
    }

    const { count, rows } = await Packaging.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PackagingImage,
          as: "images",
          attributes: ["id", "packaging_image", "isSelected"],
          where: { isDeleted: 0 },
          required: false,
        },
      ],
      order: [
        Sequelize.literal(
          `${sortDBTableColumn || "packaging_name"} ${sortType || "DESC"}`
        ),
      ],
      limit: limit,
      offset: offset,
    });

    // Convert image buffers to base64 strings
    const formattedRows = rows.map((row) => {
      const formattedRow = row.get({ plain: true });
      if (formattedRow.images && formattedRow.images.length > 0) {
        formattedRow.images = formattedRow.images.map((image) => {
          if (image.packaging_image) {
            return {
              ...image,
              packaging_image: `data:${
                image.mime
              };base64,${image.packaging_image.toString("base64")}`,
            };
          }
          return image;
        });
      }

      return formattedRow;
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: formattedRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
