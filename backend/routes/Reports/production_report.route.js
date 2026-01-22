const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../../db/config/sequelize.config");
const {
  Production_Raw_Used,
  Production_finish_raw_used,
  StockManagement,
  ProductList,
  Production_Finish_Product,
  Production,
} = require("../../db/models/associations");

const session = require("express-session");

router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/fetchRawProduct").get(async (req, res) => {
  const { cutoffList_id, cutoff_fromdate, cutoff_todate } = req.query;

  try {
    const data = await Production_finish_raw_used.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: Production_Raw_Used,
          where: {
            isDeleted: false,
          },
          required: true,
          include: [
            {
              // model: StockManagement,
              // required: true,
              // include: [
              //   {
              model: ProductList,
              required: true,
              //   },
              // ],
            },
          ],
        },
        {
          model: Production_Finish_Product,
          required: true,
          where: {
            isDeleted: false,
          },
          include: [
            {
              model: Production,
              required: true,
              where: {
                date_produce: {
                  [Op.between]: [cutoff_fromdate, cutoff_todate],
                },
              },
            },
          ],
        },
      ],
    });

    if (data) {
      // Create an object to store grouped data
      const groupedData = data.reduce((acc, element) => {
        // const product_id =
        //   element.production_raw_used.stock_management.product_list.product_id;
        // const productCode =
        //   element.production_raw_used.stock_management.product_list
        //     .product_code;
        // const productName =
        //   element.production_raw_used.stock_management.product_list
        //     .product_name;
        const product_id = element.production_raw_used.product_list.product_id;
        const productCode =
          element.production_raw_used.product_list.product_code;
        const productName =
          element.production_raw_used.product_list.product_name;
        const netWeight = element.net_weight || 0;

        if (!acc[productCode]) {
          acc[productCode] = {
            product_id: product_id,
            product_code: productCode,
            product_name: productName,
            total_net_weight: 0,
            items: [],
          };
        }

        acc[productCode].total_net_weight += netWeight;
        acc[productCode].items.push(element);

        return acc;
      }, {});

      // Convert the grouped object to array
      const result = Object.values(groupedData);
      return res.json(result);
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/fetchFinishedProduct").get(async (req, res) => {
  const { cutoffList_id, cutoff_fromdate, cutoff_todate } = req.query;

  try {
    console.log("###############################################");
    // Get total count of records
    const totalCount = await Production_Finish_Product.count({
      include: [
        {
          model: Production,
          required: true,
          where: {
            date_produce: {
              [Op.between]: [cutoff_fromdate, cutoff_todate],
            },
          },
        },
      ],
      where: {
        isDeleted: false,
      },
    });

    const data2 = await Production_finish_raw_used.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: Production_Finish_Product,
          required: true,
          include: [
            {
              model: Production,
              required: true,
              where: {
                date_produce: {
                  [Op.between]: [cutoff_fromdate, cutoff_todate],
                },
              },
            },
            {
              model: ProductList,
              required: true,
            },
          ],
        },
        {
          model: Production_Raw_Used,
          required: true,
          where: {
            isDeleted: false,
          },
          // include: [
          //   {
          //     model: StockManagement,
          //     required: true,
          //   },
          // ],
        },
      ],
    });

    if (data2) {
      const finishedGroupedData = data2.reduce((acc, element) => {
        const product_id2 = element.production_finish_product.product_id;
        const productCode2 =
          element.production_finish_product.product_list.product_code;
        const productName2 =
          element.production_finish_product.product_list.product_name;
        const produce2 = element.production_finish_product.produce;
        const weightIn2 = element.weight_in || 0;
        const netWeight2 = element.net_weight || 0;
        const defectiveUnit = weightIn2 - netWeight2;
        const totalDataCount = totalCount;

        // Initialize group if not already present
        if (!acc[productCode2]) {
          acc[productCode2] = {
            product_id2,
            product_code2: productCode2,
            product_name2: productName2,
            total_weight_in2: 0,
            total_net_weight2: 0,
            total_produce2: 0,
            total_defective2: 0,
            production_efficiency2: "0%",
            defective_loss2: "0%",
            items2: [],
            totalDataCount: totalDataCount,
          };
        }

        // Increment count and accumulate values
        acc[productCode2].total_weight_in2 += weightIn2;
        acc[productCode2].total_net_weight2 += netWeight2;
        acc[productCode2].total_produce2 += produce2;
        acc[productCode2].total_defective2 += defectiveUnit;

        // Calculate final percentages for the group
        const totalEfficiency = acc[productCode2].total_weight_in2
          ? (
              (acc[productCode2].total_net_weight2 /
                acc[productCode2].total_weight_in2) *
              100
            ).toFixed(2)
          : 0;
        const totalLoss = acc[productCode2].total_weight_in2
          ? (
              (acc[productCode2].total_defective2 /
                acc[productCode2].total_weight_in2) *
              100
            ).toFixed(2)
          : 0;

        acc[productCode2].production_efficiency2 = `${totalEfficiency}%`;
        acc[productCode2].defective_loss2 = `${totalLoss}%`;
        acc[productCode2].items2.push(element);

        return acc;
      }, {});

      // Convert grouped data to array and return
      const result = Object.values(finishedGroupedData);
      console.log("Finished Grouped Data:", result);
      return res.json(result);
    }

    return res.json([]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
