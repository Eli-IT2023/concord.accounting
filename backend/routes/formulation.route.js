const router = require("express").Router();
const { where, Op, fn, col, literal, Sequelize } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  ProductList,
  Source,
  Parameter,
  MasterList,
  Finish_Raw_Material,
  Finish_Parameter,
  Product_Tag_Vendor,
  Vendors,
  Packaging,
  FormulationProductRemarks,
  PhysicalCategory,
  FormulationPhysical,
  Formulation,
  FormulationProductUsed,
  StockManagement,
} = require("../db/models/associations");
const {
  createDateTimeSearchConditions,
} = require("../utils/dateTimeSearchConditions");

const {
  currency_sub,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");

// const Finish_Raw_Material = require("../db/models/finish_raw_materials.model");
// const Finish_Parameter = require("../db/models/finish_parameter.model");

// original getParameters
// router.route("/getParameters").get(async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     const { count, rows } = await Parameter.findAndCountAll({
//       order: [["createdAt", "DESC"]],
//       limit: limit,
//       offset: offset,
//     });

//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       data: rows,
//     });
//   } catch (error) {
//     console.error(error);
//   }
// });

router.route("/getMaterials").get(async (req, res) => {
  try {
    const { formulationId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log("FORMULATION ID:", formulationId);

    // Initialize empty array if no formulationId
    let formulationMaterials = [];
    let getFormulation = null;

    if (formulationId) {
      getFormulation = await Formulation.findOne({
        where: { product_id: formulationId },
      });

      if (getFormulation) {
        formulationMaterials = await FormulationProductUsed.findAll({
          where: {
            formulation_id: getFormulation.id,
            category: "Vendor Product",
          },
          attributes: [
            "vendor_id",
            "composition",
            "target_weight",
            "instruction",
            "category",
            "id",
          ],
        });
      }
    }
    // Extract vendor_ids from used formulation materials
    const usedMaterialVendorIds = formulationMaterials.map((m) => m.vendor_id);

    console.log(
      "FORMULATION MATERIALS:",
      JSON.stringify(formulationMaterials, null, 2)
    );
    console.log("USED VENDOR IDS:", usedMaterialVendorIds);

    // Step 2: Fetch vendor materials (Product_Tag_Vendor) based on vendor_ids
    const { count, rows } = await Product_Tag_Vendor.findAndCountAll({
      where: {
        status: "Active",
        ...(usedMaterialVendorIds.length > 0 && {
          vendor_id: { [Op.in]: usedMaterialVendorIds },
        }),
      },
      include: [
        {
          model: Vendors,
          attributes: ["id", "company_name"],
        },
        {
          model: ProductList,
          attributes: [
            "product_id",
            "product_name",
            "product_code",
            "client_code",
            "status",
            "product_category",
          ],
          where: {
            product_category: { [Op.in]: ["Raw Materials", "Consumables"] },
            status: "Active",
          },
          include: [
            {
              model: Packaging,
              required: false,
              attributes: ["id", "packaging_name"],
              as: "prod_packaging",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    console.log(rows, "THIS IS THE FETCHED");

    // Step 3: Transform rows to frontend-friendly format
    const transformedData = rows.map((item) => {
      const productData = item.product_list;
      const packagingData = productData?.prod_packaging;

      const formulationMaterial = formulationMaterials.find(
        (fm) => fm.vendor_id === item.vendor_id
      );

      return {
        product_id: productData?.product_id || "---",
        product_code: productData?.product_code || "---",
        client_code: productData?.client_code || "---",
        product_name: productData?.product_name || "---",
        packaging_name: packagingData?.packaging_name || "---",
        company_name: item.vendor?.company_name || "---",
        status: "Active",
        materialCategory: "Vendor Product",
        id: item.id,
        vendor_id: item.vendor_id,
        isSelected: usedMaterialVendorIds.includes(item.vendor_id),
        composition: formulationMaterial?.composition || 0,
        targetWeight: formulationMaterial?.target_weight || 0,
        instruction: formulationMaterial?.instruction || "",
        formulationUsedId: formulationMaterial?.id || "---",
        category: formulationMaterial?.category || "Vendor Product",
      };
    });

    console.log(
      "TRANSFORMED (USED) MATERIALS",
      JSON.stringify(transformedData, null, 2)
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: transformedData,
    });
  } catch (error) {
    console.error("ERROR FETCHING MATERIALS:", error);
    return res.status(500).json({
      message: "Error fetching materials",
      error: error.message,
    });
  }
});

router.route("/getRawProductListMaterials").get(async (req, res) => {
  try {
    const { formulationId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // First get all raw materials used in this formulation
    let formulationMaterials = [];
    let getFormulation = null;

    if (formulationId) {
      getFormulation = await Formulation.findOne({
        where: { product_id: formulationId },
      });

      if (getFormulation) {
        formulationMaterials = await FormulationProductUsed.findAll({
          where: {
            formulation_id: getFormulation.id,
            category: "Raw Product",
          },
          attributes: [
            "product_id",
            "composition",
            "target_weight",
            "instruction",
            "category",
            "id",
          ],
        });
      }
    }

    const usedMaterialIds = formulationMaterials.map((m) => m.product_id);

    const { count, rows } = await ProductList.findAndCountAll({
      where: {
        status: "Active",
        product_category: "Raw Materials",
        product_id:
          usedMaterialIds.length > 0
            ? { [Op.in]: usedMaterialIds }
            : { [Op.notIn]: [] },
      },

      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: false, // Changed to false to handle cases where packaging might be null
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    // Transform data to match your required structure
    const transformedData = rows.map((item) => {
      // Safely access packaging data with null check
      const packagingData = item.prod_packaging;

      // Find the formulation material data for this product
      const formulationMaterial = formulationMaterials.find(
        (fm) => fm.product_id === item.product_id
      );

      return {
        product_id: item.product_id,
        product_code: item.product_code,
        client_code: item.client_code,
        product_name: item.product_name,
        packaging_name: packagingData?.packaging_name || "---",
        company_name: "---", // Raw products don't have vendors
        status: "Active",
        materialCategory: "Raw Product",
        // Additional fields for frontend compatibility
        id: item.product_id, // Use product_id as id for raw products
        vendor_id: null, // Raw products don't have vendor tags
        isSelected: usedMaterialIds.includes(item.product_id), // Pre-check if used in formulation
        composition: formulationMaterial?.composition || 0,
        targetWeight: formulationMaterial?.target_weight || 0,
        instruction: formulationMaterial?.instruction || "",
        formulationUsedId: formulationMaterial?.id || "---",
        category: formulationMaterial?.category || "Raw Product",
      };
    });

    console.log(
      "TRANSFORMED (USED) RAW MATERIALS",
      JSON.stringify(transformedData, null, 2)
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: transformedData,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error fetching raw materials", error: error.message });
  }
});

router.route("/getFinishedProductListMaterials").get(async (req, res) => {
  try {
    const { formulationId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // First get all finished materials used in this formulation

    let formulationMaterials = [];
    let getFormulation = null;

    if (formulationId) {
      getFormulation = await Formulation.findOne({
        where: { product_id: formulationId },
      });

      if (getFormulation) {
        formulationMaterials = await FormulationProductUsed.findAll({
          where: {
            formulation_id: getFormulation.id,
            category: "Finished Product",
          },
          attributes: [
            "product_id",
            "composition",
            "target_weight",
            "instruction",
            "category",
            "id",
          ],
        });
      }
    }

    const usedMaterialIds = formulationMaterials.map((m) => m.product_id);

    console.log(usedMaterialIds, "THIS IS USED MATERIALS");

    let { count, rows } = await ProductList.findAndCountAll({
      where: {
        status: "Active",
        product_category: "Finish Product",
        product_id:
          usedMaterialIds.length > 0
            ? { [Op.in]: usedMaterialIds }
            : { [Op.notIn]: [] },
      },
      include: [
        {
          model: Packaging,
          as: "prod_packaging",
          required: false, // Changed to false to handle cases where packaging might be null
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    if (formulationId) {
      rows = rows.filter((item) => formulationId !== item.product_id);
    }

    // Transform data to match your required structure
    const transformedData = rows.map((item) => {
      // Safely access packaging data with null check
      const packagingData = item.prod_packaging;

      // Find the formulation material data for this product
      const formulationMaterial = formulationMaterials.find(
        (fm) => fm.product_id === item.product_id
      );

      return {
        product_id: item.product_id,
        product_code: item.product_code,
        client_code: item.client_code,
        product_name: item.product_name,
        packaging_name: packagingData?.packaging_name || "---",
        company_name: "---", // Finished products don't have vendors
        status: "Active",
        materialCategory: "Finished Product",
        // Additional fields for frontend compatibility
        id: item.product_id, // Use product_id as id for finished products
        vendor_id: null, // Finished products don't have vendor tags
        isSelected: usedMaterialIds.includes(item.product_id), // Pre-check if used in formulation
        composition: formulationMaterial?.composition || 0,
        targetWeight: formulationMaterial?.target_weight || 0,
        instruction: formulationMaterial?.instruction || "",
        formulationUsedId: formulationMaterial?.id || "---",
        category: formulationMaterial?.category || "Finished Product",
      };
    });

    console.log(
      "TRANSFORMED (USED) FINISHEd MATERIALS",
      JSON.stringify(transformedData, null, 2)
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: transformedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error fetching finished materials",
      error: error.message,
    });
  }
});

// new getParameters
router.route("/getParameters").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category; // Add category filter

    const whereClause = {};
    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await Parameter.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
  }
});

router.route("/getPhysicalAttributes").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await PhysicalCategory.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error(error);
  }
});

router.route("/getFinishProduct").get(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ProductList.findAndCountAll({
      where: {
        product_category: "Finish Product",
        status: "Active",
      },
      include: [
        {
          model: MasterList,
          required: true,
          attributes: ["fname", "mname", "lname"],
        },
        {
          model: Packaging,
          as: "prod_packaging",
          required: true,
          attributes: ["packaging_name", "unit", "unit_quantity"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const productsWithStatus = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();

        const rawMaterials = await Finish_Raw_Material.findAll({
          where: {
            product_id: product.product_id,
          },
          attributes: ["qualified", "isDeleted"],
        });

        const activeRawMaterials = rawMaterials.filter(
          (material) => material.isDeleted === false
        );

        let status = "Not Yet Qualified";
        let statusColor = "text-danger";

        if (activeRawMaterials.length > 0) {
          const allQualified = activeRawMaterials.every(
            (material) => material.qualified === true
          );
          const anyQualified = activeRawMaterials.some(
            (material) => material.qualified === true
          );

          if (allQualified) {
            status = "Closed";
            statusColor = "text-success";
          } else if (anyQualified) {
            status = "Quality Checking";
            statusColor = "text-primary";
          }
        }

        const chemistName = productData.masterlist
          ? `${productData.masterlist.fname || ""} ${
              productData.masterlist.mname || ""
            } ${productData.masterlist.lname || ""}`.trim()
          : "";

        const packagingInfo = productData.prod_packaging
          ? `${productData.prod_packaging.packaging_name || ""} - (${
              productData.prod_packaging.unit_quantity || ""
            }${productData.prod_packaging.unit || ""})`.trim()
          : "";

        return {
          ...productData,
          chemistName,
          packagingInfo,
          qualificationStatus: status,
          statusColor,
        };
      })
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: productsWithStatus,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching finish products",
      error: error.message,
    });
  }
});

router.route("/getChemist").get(async (req, res) => {
  try {
    const data = await MasterList.findAll({
      order: [["createdAt", "DESC"]],
      // TEMPORARY LANG WALA TO PARA MAKITA SI ELI ADMIN AS AGENT
      // where: {
      //   emp_id: {
      //     [Op.ne]: "00000",
      //   },
      // },
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getSpecificFormulation").get(async (req, res) => {
  try {
    const productData2 = await ProductList.findOne({
      where: {
        product_id: req.query.id,
      },
      include: [
        {
          model: Formulation,
          as: "f_product_id",
          include: [
            {
              model: FormulationProductUsed,
              as: "fpu_formulation_id",
              order: [["index", "ASC"]],
              include: [
                {
                  model: ProductList,
                  as: "fpu_product_id",
                  attributes: [
                    "product_id",
                    "product_code",
                    "client_code",
                    "product_name",
                  ],
                },
                {
                  model: Vendors,
                  as: "fpu_vendor_id",
                  attributes: ["company_name"],
                },
              ],
            },
          ],
        },
        {
          model: Finish_Parameter,
          include: [
            {
              model: Parameter,
              required: true,
            },
          ],
        },
        {
          model: FormulationPhysical,
          as: "fp_product_id",
          include: [
            {
              model: PhysicalCategory,
              as: "fp_physical_id",
              required: true,
            },
          ],
        },
      ],
    });

    if (!productData2) {
      return res.status(404).json({ message: "Formulation not found" });
    }

    // console.log("THIS IS PRODUCT DATA 2", productData2);

    console.log(
      "THIS IS PRODUCT DATA 2",
      JSON.stringify(productData2, null, 2)
    );

    console.log(
      "DITO YUNG SELECTED",
      productData2.f_product_id[0]?.fpu_formulation_id
    );

    const transformedData = {
      ...productData2.dataValues,
      materials:
        productData2.f_product_id[0]?.fpu_formulation_id?.map((item) => ({
          id: item.product_tag_vendor_id, // If this exists in your model
          formulationUsedId: item.id,
          product_tag_vendor_id: item.product_tag_vendor_id || null, // or remove if unused
          product_list: {
            product_code: item.fpu_product_id?.product_code || null,
            client_code: item.fpu_product_id?.client_code || null,
            product_name: item.fpu_product_id?.product_name || null,
          },
          vendor: {
            company_name:
              item.category === "Finished Product"
                ? item.fpu_vendor_id?.company_name || null
                : null,
          },
          composition: item.composition,
          isAdded: item.qualified, // renamed as per your new field meaning
          instruction: item.instruction,
          isDeleted: item.isDeleted,
        })) || [],
      parameters:
        productData2.finish_parameters?.map((param) => ({
          finishParamTagId: param.id,
          id: param.parameter_id,
          name: param.parameter?.name,
          uom: param.uom,
          value: param.value,
          category: param.category,
          isDeleted: param.isDeleted,
          createdAt: param.createdAt,
        })) || [],
      physicalAttributes:
        productData2.fp_product_id?.map((param) => ({
          id: param.id,
          physical_id: param.physical_id,
          attribute: param.attribute,
          description: param.description,
          isDeleted: param.isDeleted,
          createdAt: param.createdAt,
        })) || [],
    };

    console.log(
      "TRANSFORMED DATA MATERIALS aaa",
      JSON.stringify(transformedData.materials, null, 2)
    );

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching specific finish products",
      error: error.message,
    });
  }
});

// for fetching
// {
//   model: Product_Tag_Vendor,
//   as: "fpu_product_tag_vendor",
//   attributes: ["id"],
//   include: [
//     {
//       model: Vendors,
//       attributes: ["company_name"],
//     },
//     {
//       model: ProductList,
//       attributes: [
//         "product_id",
//         "product_name",
//         "product_code",
//         "client_code",
//       ],
//     },
//   ],
// },
router.route("/getFormulationMaterials").get(async (req, res) => {
  try {
    const { formulationId } = req.query;

    if (!formulationId) {
      return res.status(400).json({ message: "Formulation ID is required" });
    }

    const materials = await Formulation.findOne({
      where: {
        product_id: formulationId, // Ensure this matches your DB column
      },
      include: [
        {
          model: FormulationProductUsed,
          as: "fpu_formulation_id", // Must match the `as` in `hasMany`
          order: [["index", "ASC"]],
          include: [
            {
              model: ProductList,
              as: "fpu_product_id", // Must match the `as` in `FormulationProductUsed.belongsTo(ProductList)`
            },
            {
              model: Vendors,
              as: "fpu_vendor_id", // Must match the `as` in `FormulationProductUsed.belongsTo(ProductList)`
            },
          ],
        },
      ],
    });

    console.log("THIS IS MATERIALS", materials);
    // return;
    // Transform the data to a consistent format
    const transformedMaterials = await Promise.all(
      materials?.fpu_formulation_id.map(async (item) => {
        if (item.category === "Vendor Product") {
          const productTagVendorData = await Product_Tag_Vendor.findOne({
            where: {
              vendor_id: item.fpu_vendor_id?.id,
              product_id: item.product_id,
            },
          });

          return {
            id: productTagVendorData?.id,
            index: item.index,
            vendor_id: item.fpu_vendor_id?.id || null,
            company_name: item.fpu_vendor_id?.company_name || "---",
            product_id: item.product_id,
            product_name: item.fpu_product_id?.product_name,
            product_code: item.fpu_product_id?.product_code,
            category: item.category || "Vendor Product",
            composition: item.composition || 0,
            target_weight: item.target_weight || 0,
            instruction: item.instruction || "",
            isAdded: item.isAdded || 0,
            uuid: uuidv4(),
          };
        } else {
          return {
            id: item.id,
            vendor_id: null,
            company_name: "---",
            product_id: item.product_id,
            product_name: item.fpu_product_id?.product_name,
            product_code: item.fpu_product_id?.product_code,
            category: item.category,
            composition: item.composition || 0,
            target_weight: item.target_weight || 0,
            instruction: item.instruction || "",
            isAdded: item.isAdded || 0,
            uuid: uuidv4(),
          };
        }
      })
    );

    return res.status(200).json(transformedMaterials);
  } catch (error) {
    console.error(
      error,
      "An error occurred while fetching formulation material"
    );
    return res.status(500).json({
      message: "An error occurred while fetching formulation materials",
      error: error.message,
    });
  }
});

// save lang
// const productData = await ProductList.findOne({
//   where: {
//     product_id: req.query.id,
//   },
//   include: [
//     {
//       model: Finish_Parameter,
//       include: [
//         {
//           model: Parameter,
//           required: true,
//         },
//       ],
//     },
//     {
//       model: Finish_Raw_Material,
//       include: [
//         {
//           model: Product_Tag_Vendor,
//           required: true,
//           include: [
//             {
//               model: ProductList,
//               required: true,
//               attributes: [
//                 "product_id",
//                 "product_code",
//                 "client_code",
//                 "product_name",
//               ],
//             },
//             {
//               model: Vendors,
//               required: true,
//               attributes: ["id", "company_name"],
//             },
//           ],
//         },
//       ],
//     },
//     {
//       model: FormulationPhysical,
//       as: "fp_product_id",
//       include: [
//         {
//           model: PhysicalCategory,
//           as: "fp_physical_id",
//           required: true,
//         },
//       ],
//     },
//   ],
// });

// if (!productData) {
//   return res.status(404).json({ message: "Formulation not found" });
// }

// console.log(JSON.stringify(productData), "THIS IS PRODUCT DATA");

// const transformedData = {
//   ...productData.dataValues,
//   materials:
//     productData.finish_raw_materials?.map((rawMaterial) => ({
//       id: rawMaterial.product_tag_vendor_id,
//       finishRawMatTagId: rawMaterial.id,
//       product_tag_vendor_id: rawMaterial.product_tag_vendor_id,
//       product_list: {
//         product_code:
//           rawMaterial.product_tag_vendor?.product_list?.product_code,
//         client_code: rawMaterial.product_tag_vendor?.product_list?.client_code,
//         product_name:
//           rawMaterial.product_tag_vendor?.product_list?.product_name,
//       },
//       vendor: {
//         company_name: rawMaterial.product_tag_vendor?.vendor?.company_name,
//       },
//       composition: rawMaterial.composition,
//       qualified: rawMaterial.qualified,
//       instruction: rawMaterial.instruction,
//       isDeleted: rawMaterial.isDeleted,
//     })) || [],
//   parameters:
//     productData.finish_parameters?.map((param) => ({
//       finishParamTagId: param.id,
//       id: param.parameter_id,
//       name: param.parameter?.name,
//       uom: param.uom,
//       value: param.value,
//       category: param.category,
//       isDeleted: param.isDeleted,
//       createdAt: param.createdAt,
//     })) || [],
//   physicalAttributes:
//     productData.fp_product_id?.map((param) => ({
//       id: param.id,
//       physical_id: param.physical_id,
//       attribute: param.attribute,
//       description: param.description,
//       isDeleted: param.isDeleted,
//       createdAt: param.createdAt,
//     })) || [],
// };

// return res.status(200).json(transformedData);

// v3 createFinishGoods
router.route("/createFinishGoods").post(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Destructure request body
    const {
      formData = {},
      userLoggedID,
      remarksData = {},
      selectedMaterials = [],
      selectedParameters = [],
      selectedPhysical = [],
    } = req.body;

    // Destructure formData with default values
    const {
      productCode,
      clientCode,
      productName,
      productCategory,
      packaging_id,
      srp_amount,
      remarks,
      suffix,
      weight,
      threshold,
    } = formData;

    // Handle null/undefined values for srp_amount and weight (default to 0)
    const safeSrpAmount =
      srp_amount !== null && srp_amount !== undefined
        ? parseFloat(srp_amount) || 0
        : 0;

    const safeWeight =
      weight !== null && weight !== undefined ? parseFloat(weight) || 0 : 0;

    // Threshold can be null/undefined, so we preserve that
    const safeThreshold =
      threshold !== null && threshold !== undefined
        ? parseFloat(threshold)
        : null;

    // Validate product existence
    const existingProduct = await ProductList.findOne({
      where: {
        product_code: productCode,
        suffix: suffix, // This will match null/empty suffix too
        status: "Active",
      },
      transaction,
    });

    if (existingProduct) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Product with code ${productCode}${
          suffix ? ` and suffix ${suffix}` : ""
        } already exists.`,
      });
    }

    // Calculate totals
    const total_composition = selectedMaterials.reduce(
      (sum, m) => sum + (Number(m.composition) || 0),
      0
    );
    const total_target_weight = selectedMaterials.reduce(
      (sum, m) => sum + (Number(m.targetWeight) || 0),
      0
    );

    // Create finish good product with safe values
    const finishGood = await ProductList.create(
      {
        product_code: productCode,
        product_name: productName,
        client_code: clientCode,
        product_category: "Finish Product",
        packaging_id,
        status: "Active",
        srp_amount: safeSrpAmount, // Use safe value (0 if null)
        suffix,
        weight: safeWeight, // Use safe value (0 if null)
        threshold: safeThreshold, // Can be null
        masterlist_id: userLoggedID,
      },
      { transaction }
    );

    if (finishGood) {
      const stockManagement = await StockManagement.create(
        {
          product_id: finishGood.product_id,
          warehouse_id: "11111111-1111-1111-1111-111111111111",
          stock: 0,
          in: 0,
          price: safeSrpAmount, // Use safe value (0 if null)
          price_in: safeSrpAmount, // Use safe value (0 if null)
          vendor_id: null,
          date_in: moment().tz("Asia/Manila").format("YYYY-MM-DD"),
          transaction_number: null,
          module_in_from: "Formulation",
          isDeleted: 0,
        },
        { transaction }
      );
      if (!stockManagement) {
        await transaction.rollback();
        return res.status(500).json({
          message: "Failed to create stock management record",
        });
      }
      console.log("Stock Management Record Created:", stockManagement);
    }

    // Create formulation
    const formulation = await Formulation.create(
      {
        product_id: finishGood.product_id,
        total_composition,
        total_target_weight,
        status: "Active",
        createdBy: userLoggedID,
      },
      { transaction }
    );

    // Process materials with proper vendor_id handling
    if (selectedMaterials.length > 0) {
      const materialsToCreate = await Promise.all(
        selectedMaterials.map(async (material) => {
          let productId = material.product_id;
          let vendorId = null;
          let origProductTagVendorId = null;

          if (material.product_tag_vendor_id) {
            const vendorProduct = await Product_Tag_Vendor.findOne({
              where: {
                vendor_id: material.product_tag_vendor_id,
                product_id: productId,
              },
              transaction,
            });

            if (vendorProduct) {
              productId = vendorProduct.product_id;
              vendorId = vendorProduct.vendor_id;
              origProductTagVendorId = vendorProduct.id;
            }
          }

          return {
            index: material.index,
            formulation_id: formulation.id,
            product_id: productId,
            composition: material.composition || 0,
            category: material.category || "Unknown",
            target_weight: material.targetWeight || 0,
            instruction: material.instruction || "",
            vendor_id: vendorId,
            isAdded: material.isAdded ? 1 : 0,
            status: "Active",
          };
        })
      );

      await FormulationProductUsed.bulkCreate(materialsToCreate, {
        transaction,
      });
    }

    // Process parameters
    if (selectedParameters.length > 0) {
      const parametersToInsert = selectedParameters.map((param) => ({
        formulation_id: formulation.id,
        finish_product_id: finishGood.product_id,
        parameter_id: param.id,
        uom: param.uom,
        value: param.value || 0, // Default to 0 if null
        category: param.category,
      }));

      await Finish_Parameter.bulkCreate(parametersToInsert, { transaction });
    }

    // Process physical attributes
    if (selectedPhysical.length > 0) {
      const physicalAttributes = selectedPhysical.map((attr) => ({
        formulation_id: formulation.id,
        product_id: finishGood.product_id,
        physical_id: attr.physical_id,
        attribute: attr.attribute || "",
        description: attr.description || "",
        createdBy: userLoggedID,
      }));
      await FormulationPhysical.bulkCreate(physicalAttributes, { transaction });
    }

    // Handle current remark - check both remarksData.currentRemark and formData.remarks
    const currentRemark =
      remarksData.currentRemark?.remarks || formData.remarks;
    if (currentRemark && currentRemark.trim() !== "") {
      await FormulationProductRemarks.create(
        {
          product_id: finishGood.product_id,
          formulation_id: formulation.id,
          remarks: currentRemark,
          createdBy: userLoggedID,
        },
        { transaction }
      );
    }

    // Handle previous remarks if any
    if (remarksData?.previousRemarks?.length > 0) {
      const previousRemarksToInsert = remarksData.previousRemarks.map(
        (remark) => ({
          product_id: finishGood.product_id,
          formulation_id: formulation.id,
          remarks: remark.remarks || "",
          createdBy: remark.createdBy || userLoggedID,
          createdAt: remark.createdAt,
        })
      );

      await FormulationProductRemarks.bulkCreate(previousRemarksToInsert, {
        transaction,
      });
    }

    // Commit transaction
    await transaction.commit();

    // Log success
    logCreationSuccess({
      formData,
      userLoggedID,
      selectedMaterials,
      selectedParameters,
      selectedPhysical,
      remarksData,
      formulationId: formulation.id,
      productId: finishGood.product_id,
    });

    return res.status(200).json({
      success: true,
      data: {
        formulation,
        finishGood,
      },
    });
  } catch (error) {
    // Rollback on error
    await transaction.rollback();

    console.error("Formulation Creation Failed:", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      success: false,
      message: "Error creating formulation",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Helper function for logging
function logCreationSuccess({
  formData,
  userLoggedID,
  selectedMaterials,
  selectedParameters,
  selectedPhysical,
  remarksData,
  formulationId,
  productId,
}) {
  console.log("========== FORMULATION CREATED SUCCESSFULLY ==========");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Formulation ID: ${formulationId}`);
  console.log(`Product ID: ${productId}`);

  console.log("\n=== PRODUCT DETAILS ===");
  console.table({
    "Product Code": formData.productCode,
    "Product Name": formData.productName,
    "Client Code": formData.clientCode,
    Suffix: formData.suffix,
    Weight: formData.weight,
    "SRP Amount": formData.srp_amount,
  });

  console.log("\n=== MATERIALS ===");
  console.table(
    selectedMaterials.map((m) => ({
      "Product ID": m.product_id,
      "Vendor Tag": m.product_tag_vendor_id || "None",
      Composition: m.composition,
      "Target Weight": m.targetWeight,
    }))
  );

  console.log("\n=== PARAMETERS ===");
  console.table(
    selectedParameters.map((p) => ({
      Parameter: p.name,
      Value: p.value,
      UOM: p.uom,
      Category: p.category,
    }))
  );

  console.log("\n=== PHYSICAL ATTRIBUTES ===");
  console.table(
    selectedPhysical.map((p) => ({
      Attribute: p.attribute,
      Description: p.description,
    }))
  );

  console.log("\n========== END OF LOG ==========\n");
}

// v2 createFinishGoods
// router.route("/createFinishGoods").post(async (req, res) => {
//   try {
//     const {
//       formData,
//       selectedMaterials,
//       selectedParameters,
//       selectedPhysical,
//       userLoggedID,
//       remarksData = {}, // Default empty object
//     } = req.body;

//     const {
//       clientCode,
//       productCode,
//       productName,
//       packaging_id,
//       suffix,
//       weight,
//       srp_amount,
//     } = formData;

//     const createFinishGood = await ProductList.create({
//       product_code: productCode,
//       product_name: productName,
//       client_code: clientCode,
//       product_category: "Finish Product",
//       packaging_id: packaging_id,
//       status: "Active",
//       srp_amount: srp_amount,
//       suffix: suffix,
//       weight: weight,
//       masterlist_id: userLoggedID,
//     });

//     if (createFinishGood) {
//       const product_id = createFinishGood.product_id;

//       // Handle current remark - check both remarksData.currentRemark and formData.remarks
//       const currentRemark =
//         remarksData.currentRemark?.remarks || formData.remarks;
//       if (currentRemark && currentRemark.trim() !== "") {
//         await FormulationProductRemarks.create({
//           product_id: product_id,
//           remarks: currentRemark,
//           createdBy: userLoggedID,
//         });
//       }

//       // Handle previous remarks if any
//       if (remarksData?.previousRemarks?.length > 0) {
//         const previousRemarksToInsert = remarksData.previousRemarks.map(
//           (remark) => ({
//             product_id: product_id,
//             remarks: remark.remarks,
//             createdBy: remark.createdBy || userLoggedID,
//             createdAt: remark.createdAt, // Preserve original creation date
//           })
//         );

//         await FormulationProductRemarks.bulkCreate(previousRemarksToInsert);
//       }

//       const materialsToInsert = selectedMaterials.map((item) => ({
//         product_id: createFinishGood.product_id,
//         product_tag_vendor_id: item.id,
//         composition: item.composition,
//         qualified: item.qualified,
//         instruction: item.instruction,
//         weight: item.targetWeight,
//       }));

//       const paramsToInsert = selectedParameters.map((item) => ({
//         finish_product_id: createFinishGood.product_id,
//         parameter_id: item.id,
//         uom: item.uom,
//         value: item.value,
//         category: item.category,
//       }));

//       const physicalAttrToInsert = selectedPhysical.map((item) => ({
//         product_id: createFinishGood.product_id,
//         physical_id: item.physical_id,
//         attribute: item.attribute,
//         description: item.description,
//       }));

//       await Finish_Raw_Material.bulkCreate(materialsToInsert);
//       await Finish_Parameter.bulkCreate(paramsToInsert);
//       await FormulationPhysical.bulkCreate(physicalAttrToInsert);
//     }

//     return res.status(200).json();
//   } catch (error) {
//     console.error(error);
//   }
// });

// v1 createfinishgoods
// router.route("/createFinishGoods").post(async (req, res) => {
//   try {
//     const { formData, selectedMaterials, selectedParameters, userLoggedID } =
//       req.body;

//     const {
//       clientCode,
//       productCode,
//       productName,
//       packaging_id,
//       remarks,
//       suffix,
//       weight,
//     } = formData;

//     const createFinishGood = await ProductList.create({
//       product_code: productCode,
//       product_name: productName,
//       client_code: clientCode,
//       product_category: "Finish Product",
//       packaging_id: packaging_id,
//       status: "Active",
//       suffix: suffix,
//       weight: weight,
//       masterlist_id: userLoggedID,
//     });

//     if (createFinishGood) {
//       const product_id = createFinishGood.product_id;

//       // Insert remarks using the product_id
//       if (remarks && remarks.trim(" ") !== "") {
//         const insertRemarks = await FormulationProductRemarks.create({
//           product_id: product_id,
//           remarks: remarks,
//           createdBy: userLoggedID,
//         });
//       }

//       const materialsToInsert = selectedMaterials.map((item) => ({
//         product_id: createFinishGood.product_id,
//         product_tag_vendor_id: item.id,
//         composition: item.composition,
//         qualified: item.qualified,
//         instruction: item.instruction,
//         weight: item.targetWeight,
//       }));

//       const paramsToInsert = selectedParameters.map((item) => ({
//         finish_product_id: createFinishGood.product_id,
//         parameter_id: item.id,
//         uom: item.uom,
//         category: item.category,
//       }));

//       await Finish_Raw_Material.bulkCreate(materialsToInsert);
//       await Finish_Parameter.bulkCreate(paramsToInsert);
//     }

//     return res.status(200).json();
//   } catch (error) {
//     console.error(error);
//   }
// });

router.route("/updateFormulation").post(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      formData = {},
      userLoggedID,
      selectedMaterials = [],
      selectedParameters = [],
      selectedPhysical = [],
      remarksData = {},
      productId, // this is the `id` of the product to update
    } = req.body;

    // Destructure form data
    const {
      productCode,
      clientCode,
      productName,
      productCategory,
      packaging_id,
      srp_amount,
      suffix,
      weight,
      threshold,
    } = formData;

    // Check if the product exists
    const existingProduct = await ProductList.findOne({
      where: {
        product_id: productId,
        status: "Active",
      },
      transaction,
    });

    if (!existingProduct) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Product not found or is inactive.",
      });
    }

    // Update product details
    await ProductList.update(
      {
        product_code: productCode,
        product_name: productName,
        client_code: clientCode,
        product_category: productCategory || "Finish Product",
        packaging_id,
        srp_amount: srp_amount || 0,
        suffix,
        weight: weight || 0,
        // threshold: threshold ? threshold : 0,
        threshold: threshold || null,
        updatedAt: new Date(),
      },
      {
        where: { product_id: productId },
        transaction,
      }
    );

    // Update formulation
    const total_composition = selectedMaterials.reduce(
      (sum, m) => sum + (Number(m.composition) || 0),
      0
    );
    const total_target_weight = selectedMaterials.reduce(
      (sum, m) => sum + (Number(m.targetWeight) || 0),
      0
    );
    const getFormulation = await Formulation.findOne({
      where: { product_id: productId },
    });

    const formulationId = getFormulation.id;

    await Formulation.update(
      {
        total_composition,
        total_target_weight,
        updatedAt: new Date(),
      },
      {
        where: { id: formulationId },
        transaction,
      }
    );

    // Update Materials: Delete old and insert new
    // 1. Get all existing materials for this formulation
    const existingMaterials = await FormulationProductUsed.findAll({
      where: { formulation_id: formulationId },
      transaction,
    });

    // 2. Create maps for existing materials
    const existingMaterialMap = new Map();
    existingMaterials.forEach((m) => {
      existingMaterialMap.set(m.id, m);
    });

    // 3. Process incoming materials
    const materialsToKeep = new Set();
    const materialsToUpdate = [];
    const materialsToCreate = [];

    for (const material of selectedMaterials) {
      if (material.formulation_material_id) {
        // Existing material - update
        const existingMaterial = existingMaterialMap.get(
          material.formulation_material_id
        );
        if (existingMaterial) {
          materialsToUpdate.push({
            id: material.formulation_material_id,
            composition: material.composition || 0,
            target_weight: material.targetWeight || 0,
            instruction: material.instruction || "",
            isAdded: material.isAdded ? 1 : 0,
            updatedAt: new Date(),
          });
          materialsToKeep.add(material.formulation_material_id);
        }
      } else {
        // New material - create
        let productId = material.product_id;
        let vendorId = null;

        // For vendor materials, get product_id from product_tag_vendor
        if (material.product_tag_vendor_id) {
          const vendorProduct = await Product_Tag_Vendor.findOne({
            where: {
              vendor_id: material?.product_tag_vendor_id,
              product_id: productId,
            },
            transaction,
          });
          if (vendorProduct) {
            productId = vendorProduct.product_id;
            vendorId = vendorProduct.vendor_id;
          }
        }

        // Only proceed if we have a valid product_id
        if (productId) {
          materialsToCreate.push({
            index: material.index,
            formulation_id: formulationId,
            product_id: productId,
            composition: material.composition || 0,
            category: material.category || "Unknown",
            target_weight: material.targetWeight || 0,
            instruction: material.instruction || "",
            // product_tag_vendor_id: material.product_tag_vendor_id || null,
            vendor_id: vendorId,
            isAdded: material.isAdded ? 1 : 0,
            status: "Active",
            // createdBy: userLoggedID,
          });
        }
      }
    }

    // 4. Determine materials to delete (existing ones not in the update)
    const materialsToDelete = [...existingMaterialMap.keys()].filter(
      (id) => !materialsToKeep.has(id)
    );

    // 5. Execute database operations in proper order
    // Delete first
    if (materialsToDelete.length > 0) {
      await FormulationProductUsed.destroy({
        where: { id: materialsToDelete },
        transaction,
      });
    }

    // Then update existing
    if (materialsToUpdate.length > 0) {
      await Promise.all(
        materialsToUpdate.map((material) =>
          FormulationProductUsed.update(material, {
            where: { id: material.id },
            transaction,
          })
        )
      );
    }

    // Finally create new ones
    if (materialsToCreate.length > 0) {
      await FormulationProductUsed.bulkCreate(materialsToCreate, {
        transaction,
      });
    }

    // Update Parameters
    await Finish_Parameter.destroy({
      where: { formulation_id: formulationId },
      transaction,
    });

    if (selectedParameters.length > 0) {
      const parametersToInsert = selectedParameters.map((param) => ({
        formulation_id: formulationId,
        finish_product_id: productId,
        parameter_id: param.id,
        uom: param.uom,
        value: param.value,
        category: param.category,
      }));

      await Finish_Parameter.bulkCreate(parametersToInsert, { transaction });
    }

    // Update Physical Attributes
    await FormulationPhysical.destroy({
      where: { formulation_id: formulationId },
      transaction,
    });

    if (selectedPhysical.length > 0) {
      const physicalAttributes = selectedPhysical.map((attr) => ({
        formulation_id: formulationId,
        product_id: productId,
        physical_id: attr.physical_id,
        attribute: attr.attribute,
        description: attr.description,
        createdBy: userLoggedID,
      }));

      await FormulationPhysical.bulkCreate(physicalAttributes, { transaction });
    }

    // Update Remarks
    const currentRemark =
      remarksData.currentRemark?.remarks || formData.remarks;

    const recentRemarkFromDB = await FormulationProductRemarks.findOne({
      where: {
        product_id: productId,
        formulation_id: formulationId,
      },
      attributes: ["remarks"],
      order: [["createdAt", "DESC"]],
    });

    const mostRecentRemark = recentRemarkFromDB?.remarks || null;

    if (
      currentRemark &&
      currentRemark.trim() !== "" &&
      currentRemark !== mostRecentRemark
    ) {
      await FormulationProductRemarks.create(
        {
          product_id: productId,
          formulation_id: formulationId,
          remarks: currentRemark,
          createdBy: userLoggedID,
        },
        { transaction }
      );
    }

    // Handle deleted remarks
    if (
      Array.isArray(remarksData.deletedRemarks) &&
      remarksData.deletedRemarks.length > 0
    ) {
      await FormulationProductRemarks.update(
        {
          isDeleted: true,
          updatedBy: userLoggedID,
        },
        {
          where: {
            id: remarksData.deletedRemarks,
          },
          transaction,
        }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Formulation updated successfully",
    });
  } catch (error) {
    await transaction.rollback();

    console.error("Update Formulation Error:", {
      message: error.message,
      stack: error.stack,
      request: req.body,
    });

    return res.status(500).json({
      success: false,
      message: "Error updating formulation",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// v1
// router.route("/updateFormulation").post(async (req, res) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const requestData = req.body;
//     const {
//       formData,
//       id,
//       selectedMaterials,
//       selectedParameters,
//       selectedPhysical,
//       userLoggedID,
//       remarksData = {}, // Default empty object if not provided
//     } = requestData;

//     // Get deletedRemarks from remarksData with fallback
//     const deletedRemarks = remarksData.deletedRemarks || [];

//     if (!requestData.selectedMaterials) {
//       await transaction.rollback();
//       return res.status(400).json({
//         message: "selectedMaterials is required",
//       });
//     }

//     // Validate each material
//     for (const mat of selectedMaterials) {
//       if (!mat.product_tag_vendor_id) {
//         await transaction.rollback();
//         return res.status(400).json({
//           message: `Material ${mat.id} is missing product_tag_vendor_id`,
//         });
//       }
//     }

//     await ProductList.update(
//       {
//         product_code: formData.productCode,
//         client_code: formData.clientCode,
//         product_name: formData.productName,
//         product_category: formData.productCategory,
//         packaging_id: formData.packaging_id,
//         srp_amount: formData.srp_amount,
//         suffix: formData.suffix,
//         weight: formData.weight,
//       },
//       {
//         where: { product_id: id },
//         transaction,
//       }
//     );

//     // fetch the current latestremark
//     const latestRemark = await FormulationProductRemarks.findOne({
//       where: {
//         product_id: id,
//         isDeleted: false,
//       },
//       order: [["createdAt", "DESC"]],
//     });

//     const originalRemarks = latestRemark?.remarks || "";

//     if (
//       remarksData.currentRemark?.remarks?.trim() !== "" &&
//       remarksData.currentRemark?.remarks !== originalRemarks
//     ) {
//       await FormulationProductRemarks.create(
//         {
//           product_id: id,
//           remarks: remarksData.currentRemark.remarks,
//           createdBy: userLoggedID,
//         },
//         { transaction }
//       );
//     }

//     // Handle deleted remarks with the properly extracted array
//     if (deletedRemarks.length > 0) {
//       await FormulationProductRemarks.update(
//         {
//           isDeleted: 1,
//           updatedBy: userLoggedID,
//         },
//         {
//           where: {
//             id: deletedRemarks,
//           },
//           transaction,
//         }
//       );
//     }

//     // Handle previous remarks if any (shouldn't normally change, but just in case)
//     // if (remarksData?.previousRemarks?.length > 0) {
//     //   for (const remark of remarksData.previousRemarks) {
//     //     if (remark.id) {
//     //       await FormulationProductRemarks.update(
//     //         {
//     //           remarks: remark.remarks,
//     //           updatedBy: userLoggedID,
//     //         },
//     //         {
//     //           where: { id: remark.id },
//     //           transaction,
//     //         }
//     //       );
//     //     }
//     //   }
//     // }

//     // Handle Materials
//     await Finish_Raw_Material.update(
//       { isDeleted: true },
//       { where: { product_id: id }, transaction }
//     );

//     for (const mat of selectedMaterials) {
//       if (mat.finishRawMatTagId) {
//         await Finish_Raw_Material.update(
//           {
//             isDeleted: false,
//             composition: mat.composition,
//             qualified: mat.qualified,
//             instruction: mat.instruction,
//             weight: mat.targetWeight,
//           },
//           {
//             where: { id: mat.finishRawMatTagId },
//             transaction,
//           }
//         );
//       } else {
//         await Finish_Raw_Material.create(
//           {
//             product_id: id,
//             product_tag_vendor_id: mat.product_tag_vendor_id,
//             composition: mat.composition,
//             qualified: mat.qualified,
//             instruction: mat.instruction ?? "",
//             weight: mat.targetWeight,
//             isDeleted: false,
//           },
//           { transaction }
//         );
//       }
//     }

//     // Handle Parameters
//     await Finish_Parameter.update(
//       { isDeleted: true },
//       { where: { finish_product_id: id }, transaction }
//     );

//     for (const param of selectedParameters) {
//       if (param.finishParamTagId) {
//         await Finish_Parameter.update(
//           {
//             isDeleted: false,
//             uom: param.uom,
//             value: param.value,
//             category: param.category,
//           },
//           {
//             where: { id: param.finishParamTagId },
//             transaction,
//           }
//         );
//       } else {
//         await Finish_Parameter.create(
//           {
//             finish_product_id: id,
//             parameter_id: param.id,
//             uom: param.uom,
//             value: param.value,
//             category: param.category,
//             isDeleted: false,
//           },
//           { transaction }
//         );
//       }
//     }

//     // Handle Physical Attributes - THIS IS THE FIXED SECTION
//     await FormulationPhysical.update(
//       { isDeleted: true },
//       { where: { product_id: id }, transaction }
//     );

//     for (const physical of selectedPhysical) {
//       if (physical.id) {
//         // Update existing record
//         await FormulationPhysical.update(
//           {
//             isDeleted: false,
//             attribute: physical.attribute,
//             description: physical.description,
//             physical_id: physical.physical_id,
//           },
//           {
//             where: {
//               id: physical.id,
//             },
//             transaction,
//           }
//         );
//       } else {
//         // Create new record
//         await FormulationPhysical.create(
//           {
//             product_id: id,
//             physical_id: physical.physical_id,
//             isDeleted: false,
//             attribute: physical.attribute,
//             description: physical.description,
//           },
//           { transaction }
//         );
//       }
//     }

//     await transaction.commit();

//     return res.status(200).json({
//       message: "Formulation updated successfully",
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error updating formulation:", error);
//     return res.status(500).json({
//       message: "An error occurred while updating specific finish products",
//       error: error.message,
//     });
//   }
// });

router.route("/getFinishProductBySearchOrFilter").get(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const status = req.query.status || "";
    const searchCategory = req.query.searchCategory || "All";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Base conditions for all queries
    const baseCondition = {
      product_category: "Finish Product",
      status: "Active",
    };
    // Build the search condition based on the category
    let searchCondition = { ...baseCondition };

    if (searchText) {
      switch (searchCategory) {
        case "product_id":
          searchCondition = {
            ...baseCondition,
            product_code: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "product_name":
          searchCondition = {
            ...baseCondition,
            product_name: { [Op.like]: `%${searchText}%` },
          };
          break;
        case "chemist":
          // For chemist name search, we'll handle it in the include/where part
          break;
        default:
          // Default (all) - search across multiple fields
          searchCondition = {
            ...baseCondition,
            [Op.or]: [
              { product_name: { [Op.like]: `%${searchText}%` } },
              { product_code: { [Op.like]: `%${searchText}%` } },
            ],
          };
      }
    }

    // Configure inclusion of MasterList for chemist name search
    const includeOption = {
      model: MasterList,
      required: true,
      attributes: ["fname", "mname", "lname"],
    };

    // If searching by chemist name, add where clause to the include option
    if (searchCategory === "chemist" && searchText) {
      includeOption.where = {
        [Op.or]: [
          { fname: { [Op.like]: `%${searchText}%` } },
          { mname: { [Op.like]: `%${searchText}%` } },
          { lname: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    // Perform the database query
    const { count, rows } = await ProductList.findAndCountAll({
      where: searchCondition,
      include: [includeOption],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    console.log(rows, "I NEED TO SEE THE DATA");

    // Process results to include status information
    const productsWithStatus = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();

        const rawMaterials = await Finish_Raw_Material.findAll({
          where: {
            product_id: product.product_id,
          },
          attributes: ["qualified"],
        });

        let qualificationStatus = "Not Yet Qualified";
        let statusColor = "text-danger";

        if (rawMaterials.length > 0) {
          const allQualified = rawMaterials.every(
            (material) => material.qualified === true
          );
          const anyQualified = rawMaterials.some(
            (material) => material.qualified === true
          );

          if (allQualified) {
            qualificationStatus = "Closed";
            statusColor = "text-success";
          } else if (anyQualified) {
            qualificationStatus = "Quality Checking";
            statusColor = "text-primary";
          }
        }

        const chemistName = productData.masterlist
          ? `${productData.masterlist.fname || ""} ${
              productData.masterlist.mname || ""
            } ${productData.masterlist.lname || ""}`.trim()
          : "";

        // Filter by status if specified
        if (status.trim("") !== "") {
          if (status && qualificationStatus !== status) {
            return null; // This will be filtered out
          }
        }

        return {
          ...productData,
          chemistName,
          qualificationStatus,
          statusColor,
        };
      })
    );

    console.log(productsWithStatus, "PRODUCT WITH STATUS");
    // Filter out null items (those that didn't match status filter)
    const filteredProducts = productsWithStatus.filter((item) => item !== null);

    return res.status(200).json({
      totalItems: filteredProducts.length, // Adjust count for filtered results
      totalPages: Math.ceil(filteredProducts.length / limit),
      currentPage: page,
      data: filteredProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching finish products",
      error: error.message,
    });
  }
});

router.route("/getFinishProductSearch").get(async (req, res) => {
  try {
    const { searchText, searchField } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log("ETO YUNG SEARCH FIELD", searchField);

    // Build where clause for ProductList
    let whereClause = {
      product_category: "Finish Product",
      status: "Active",
    };

    const include = [
      {
        model: MasterList,
        required: true,
        attributes: ["fname", "mname", "lname"],
      },
      {
        model: Packaging,
        as: "prod_packaging",
        required: true,
        attributes: ["packaging_name", "unit", "unit_quantity"],
      },
    ];

    if (searchText && searchText.trim() !== "") {
      const text = searchText.trim();

      if (searchField) {
        switch (searchField) {
          case "product_code":
            whereClause.product_code = { [Op.like]: `%${text}%` };
            break;
          case "product_name":
            whereClause.product_name = { [Op.like]: `%${text}%` };
            break;
          case "suffix":
            whereClause.suffix = { [Op.like]: `%${text}%` };
            break;
          case "packaging": {
            whereClause[Op.or] = [
              { "$prod_packaging.packaging_name$": { [Op.like]: `%${text}%` } },
              { "$prod_packaging.unit$": { [Op.like]: `%${text}%` } },
              Sequelize.where(
                Sequelize.literal(
                  `CONCAT(\`prod_packaging\`.\`packaging_name\`, ' - (', \`prod_packaging\`.\`unit_quantity\`, \`prod_packaging\`.\`unit\`, ')')`
                ),
                { [Op.like]: `%${text}%` }
              ),
              Sequelize.where(
                Sequelize.literal(
                  `CONCAT(\`prod_packaging\`.\`unit_quantity\`, \`prod_packaging\`.\`unit\`)`
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ];
            break;
          }
          case "chemist":
            whereClause[Op.and] = [
              Sequelize.where(
                Sequelize.literal(
                  "CONCAT(`masterlist`.fname, ' ', `masterlist`.lname)"
                ),
                {
                  [Op.like]: `%${text}%`,
                }
              ),
            ];
            break;
        }
      } else {
        // Global search across multiple fields
        whereClause[Op.or] = [
          { product_code: { [Op.like]: `%${text}%` } },
          { product_name: { [Op.like]: `%${text}%` } },
          { suffix: { [Op.like]: `%${text}` } },
          ...createDateTimeSearchConditions("product_list", text, "createdAt"),
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`masterlist\`.fname, ' ', \`masterlist\`.lname)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          { "$prod_packaging.packaging_name$": { [Op.like]: `%${text}%` } },
          { "$prod_packaging.unit$": { [Op.like]: `%${text}%` } },
          // Search the formatted packaging string: "Packaging Name - (Unit_Quantity Unit)"
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(
                \`prod_packaging\`.\`packaging_name\`, 
                ' - (', 
                \`prod_packaging\`.\`unit_quantity\`, 
                \`prod_packaging\`.\`unit\`, 
                ')'
              )`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
          // Search the formatted packaging string: "50kg" (unit_quantity + unit)
          Sequelize.where(
            Sequelize.literal(
              `CONCAT(\`prod_packaging\`.\`unit_quantity\`, \`prod_packaging\`.\`unit\`)`
            ),
            {
              [Op.like]: `%${text}%`,
            }
          ),
        ];
      }
    }

    const { count, rows } = await ProductList.findAndCountAll({
      where: whereClause,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    // Add the same transformation logic as your original endpoint
    const productsWithStatus = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();

        const rawMaterials = await Finish_Raw_Material.findAll({
          where: {
            product_id: product.product_id,
          },
          attributes: ["qualified", "isDeleted"],
        });

        const activeRawMaterials = rawMaterials.filter(
          (material) => material.isDeleted === false
        );

        let status = "Not Yet Qualified";
        let statusColor = "text-danger";

        if (activeRawMaterials.length > 0) {
          const allQualified = activeRawMaterials.every(
            (material) => material.qualified === true
          );
          const anyQualified = activeRawMaterials.some(
            (material) => material.qualified === true
          );

          if (allQualified) {
            status = "Closed";
            statusColor = "text-success";
          } else if (anyQualified) {
            status = "Quality Checking";
            statusColor = "text-primary";
          }
        }

        const chemistName = productData.masterlist
          ? `${productData.masterlist.fname || ""} ${
              productData.masterlist.mname || ""
            } ${productData.masterlist.lname || ""}`.trim()
          : "";

        const packagingInfo = productData.prod_packaging
          ? `${productData.prod_packaging.packaging_name || ""} - (${
              productData.prod_packaging.unit_quantity || ""
            }${productData.prod_packaging.unit || ""})`.trim()
          : "";

        return {
          ...productData,
          chemistName,
          packagingInfo,
          qualificationStatus: status,
          statusColor,
        };
      })
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: productsWithStatus,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      message: "An error occurred while searching finish products",
      error: error.message,
    });
  }
});

router.route("/getFilteredFinishProduct").get(async (req, res) => {
  try {
    const { chemistID } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build where clause for ProductList
    let whereClause = {
      product_category: "Finish Product",
      status: "Active",
    };

    // Build include conditions for MasterList
    const includeConditions = [
      {
        model: MasterList,
        required: true,
        attributes: ["fname", "mname", "lname"],
        // Add where clause to MasterList if chemistID is provided
        ...(chemistID && { where: { id: chemistID } }),
      },
      {
        model: Packaging,
        as: "prod_packaging",
        required: true,
        attributes: ["packaging_name", "unit", "unit_quantity"],
      },
    ];

    const { count, rows } = await ProductList.findAndCountAll({
      where: whereClause,
      include: includeConditions,
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const productsWithStatus = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();

        const rawMaterials = await Finish_Raw_Material.findAll({
          where: {
            product_id: product.product_id,
          },
          attributes: ["qualified", "isDeleted"],
        });

        const activeRawMaterials = rawMaterials.filter(
          (material) => material.isDeleted === false
        );

        let status = "Not Yet Qualified";
        let statusColor = "text-danger";

        if (activeRawMaterials.length > 0) {
          const allQualified = activeRawMaterials.every(
            (material) => material.qualified === true
          );
          const anyQualified = activeRawMaterials.some(
            (material) => material.qualified === true
          );

          if (allQualified) {
            status = "Closed";
            statusColor = "text-success";
          } else if (anyQualified) {
            status = "Quality Checking";
            statusColor = "text-primary";
          }
        }

        const chemistName = productData.masterlist
          ? `${productData.masterlist.fname || ""} ${
              productData.masterlist.mname || ""
            } ${productData.masterlist.lname || ""}`.trim()
          : "";

        const packagingInfo = productData.prod_packaging
          ? `${productData.prod_packaging.packaging_name || ""} - (${
              productData.prod_packaging.unit_quantity || ""
            }${productData.prod_packaging.unit || ""})`.trim()
          : "";

        return {
          ...productData,
          chemistName,
          packagingInfo,
          qualificationStatus: status,
          statusColor,
        };
      })
    );

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: productsWithStatus,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while fetching filtered finish products",
      error: error.message,
    });
  }
});

router;

router.get("/getRemarksHistory", async (req, res) => {
  const { product_id } = req.query;
  try {
    const isFetch = await FormulationProductRemarks.findAll({
      where: { product_id, isDeleted: 0 },
      include: [
        {
          model: MasterList,
          as: "fpr_author_id",
          required: true,
          attributes: [
            [
              sequelize.fn(
                "CONCAT",
                sequelize.col("fpr_author_id.fname"),
                " ",
                sequelize.col("fpr_author_id.lname")
              ),
              "fullName",
            ],
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedResults = isFetch.map((remark) => {
      return {
        ...remark.get({ plain: true }),
        fullName: remark.fpr_author_id.get("fullName"),
      };
    });

    return res.json(formattedResults);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
