const router = require("express").Router();
const { where, Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const {
  FixedAsset,
  FixedAssetForecast,
  Expenses,
  Currency,
  Cutoff,
  Activity_Log,
} = require("../db/models/associations");

const {
  currency_sub,
} = require("../db/models/ModelsBySubject/associations_sub");
const session = require("express-session");
const moment = require("moment-timezone");

router.route("/getCode").get(async (req, res) => {
  const currentDate = moment().tz("Asia/Manila").toDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}${month}`;

  const generateTwoNum = Math.floor(10 + Math.random() * 90);
  const time = new Date()
    .toLocaleTimeString("en-GB", { hour12: false })
    .replace(/:/g, "");

  try {
    // const lastPayCode = await FixedAsset.findOne({
    //   where: {
    //     transaction_code: {
    //       [Op.like]: `FA-${currentMonth}%`,
    //     },
    //   },
    //   order: [["transaction_code", "DESC"]],
    // });

    // console.log(`Query Result:`, lastPayCode);
    let newRefCode = `FA-${currentMonth}${time}${generateTwoNum}`;
    // if (lastPayCode && lastPayCode.transaction_code) {
    //   // console.log(`Last Pay Code: ${lastPayCode.transaction_code}`);
    //   const latestRefCode = lastPayCode.transaction_code;
    //   const refCodeParts = latestRefCode.split("-");
    //   if (refCodeParts.length === 4 && !isNaN(refCodeParts[3])) {
    //     const latestSequence = parseInt(refCodeParts[3], 10);
    //     const newSequence = String(latestSequence + 1).padStart(5, "0");
    //     newRefCode = `FA-${currentMonth}-${newSequence}`;
    //   } else {
    //     // If the refCode doesn't split correctly or sequence is not a number
    //     newRefCode = `FA-${currentMonth}-00001`;
    //   }
    // } else {
    //   console.log("No matching records found, initializing new sequence.");
    //   newRefCode = `FA-${currentMonth}-00001`;
    // }
    // console.log(newRefCode);
    res.json(newRefCode);
  } catch (error) {
    console.error("Error fetching last transaction_id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/fetchExpensesProducts").get(async (req, res) => {
  try {
    const { id } = req.query;
    const products = await Expenses.findAll({
      where: {
        expenses2_id: "11111111-1111-1111-1111-111111111111",
        status: "Approved",
        isDeleted: false,
      },
      include: [
        {
          model: currency_sub,
          required: true,
        },
        // {
        //   model: FixedAsset,
        //   required: false,
        //   where: {
        //     id: {
        //       [Op.ne]: id,
        //     },
        //   },
        // },
      ],
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/createFixedAsset").post(async (req, res) => {
  const {
    transactionCode,
    date,
    expenses_id,
    costPerUnit,
    quantity,
    totalCost,
    monthsToPay,
    depreciationAmount,
    remarks,
    forecast,
    userLoggedID,
    productName,
    currencyId,
  } = req.body;

  try {
    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: date },
          },
          {
            to: { [Op.gte]: date },
          },
        ],
        isDeleted: false,
      },
    });

    const isPosted = findCutoff?.isPosted;

    if (isPosted) {
      return res.status(409).json({ message: "Cutoff is already posted" });
    }

    const fixedAsset = await FixedAsset.create({
      transaction_code: transactionCode,
      transaction_date: date,
      date_depreciated: date,
      // expenses_id: expenses_id,
      product_name: productName,
      currency_id: currencyId,
      cost_per_unit: costPerUnit,
      quantity: quantity,
      total_cost: totalCost,
      depreciation_amount: depreciationAmount,
      static_months_to_pay: monthsToPay,
      remarks: remarks,
      created_by: userLoggedID,
    });

    if (fixedAsset) {
      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Fixed Assets: User created new fixed asset with transaction ID ${transactionCode}`,
      });

      forecast.forEach(async (item) => {
        await FixedAssetForecast.create({
          fixed_asset_id: fixedAsset.id,
          date: item.date,
          amount: item.amount,
          status: "Pending",
        });
      });

      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error("Error creating fixed asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router
  .route("/deleteFixedAsset/:fixedAssetId/:fixedAssetDate")
  .delete(async (req, res) => {
    try {
      const id = req.params.fixedAssetId;
      const fixedAsset_Date = req.params.fixedAssetDate;
      const getCutoff = await Cutoff.findOne({
        where: {
          [Op.and]: [
            {
              from: {
                [Op.lte]: fixedAsset_Date, // from date is less than or equal
              },
            },
            {
              to: {
                [Op.gte]: fixedAsset_Date, // to date is greater than or equal
              },
            },
          ],
        },
      });

      const {
        from: dateFrom,
        to: dateTo,
        isPosted: postedCutoff,
        name: CutoffName,
      } = getCutoff;

      const getFixedAsset = await FixedAsset.findOne({
        where: { id: id },
      });

      const fixedDate = new Date(getFixedAsset.date_depreciated);
      const cutoffFrom = new Date(dateFrom);
      const cutoffTo = new Date(dateTo);

      if (postedCutoff == true) {
        if (fixedDate >= cutoffFrom && fixedDate <= cutoffTo) {
          return res.status(202).json({
            success: false,
            fixedDate: getFixedAsset.date_depreciated,
            CutoffName: CutoffName,
          });
        }
      }

      const deleteForecast = await FixedAssetForecast.destroy({
        where: { fixed_asset_id: id },
      });

      if (deleteForecast) {
        await FixedAsset.destroy({ where: { id: id } });
      }

      return res.status(200).json({
        success: true,
        message: "Fixed Asset deleted successfully.",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  });

router.route("/getFixedAsset").get(async (req, res) => {
  try {
    const { filterColumn, searchText, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let fixedAssetWhereClause = {};
    let expensesWhereClause = {};

    // Fixed Asset Table Column
    const fixedAssetTableColumn = [
      "transaction_code",
      "date_depreciated",
      "total_cost",
      "remarks",
      "status",
      "product_name",
    ];

    if (searchText && searchText.trim() !== "") {
      switch (filterColumn) {
        // Filter for transaction id
        case "transaction_code":
          fixedAssetWhereClause = {
            transaction_code: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for date depreciated
        case "date_depreciated":
          fixedAssetWhereClause = sequelize.where(
            literal(`CAST(date_depreciated AS CHAR)`),
            { [Op.like]: `%${searchText}%` }
          );
          break;
        // Filter for item name
        case "item_name":
          fixedAssetWhereClause = {
            product_name: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for total cost
        case "total_cost":
          if (searchText !== null && searchText !== "") {
            fixedAssetWhereClause = {
              total_cost: sequelize.where(
                literal(`CAST (total_cost AS CHAR)`),
                {
                  [Op.like]: `%${searchText}%`,
                }
              ),
            };
          }
          break;
        // Filter for remarks
        case "remarks":
          fixedAssetWhereClause = {
            remarks: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for status
        case "status":
          fixedAssetWhereClause = {
            status: {
              [Op.like]: `%${searchText}%`,
            },
          };
          break;
        // Filter for all
        default:
          fixedAssetWhereClause = {
            [Op.or]: fixedAssetTableColumn.map((col) => {
              if (col === "date_depreciated" || col === "total_cost") {
                return sequelize.where(literal(`CAST(${col} AS CHAR)`), {
                  [Op.like]: `%${searchText}%`,
                });
              } else {
                return {
                  [col]: {
                    [Op.like]: `%${searchText}%`,
                  },
                };
              }
            }),
          };
          break;
      }
    }

    let { count, rows: fixedAsset } = await FixedAsset.findAndCountAll({
      include: [
        // {
        //   model: Expenses,
        //   required: true,
        //   include: [
        //     {
        //       model: Currency,
        //       required: true,
        //     },
        //   ],
        //   where: expensesWhereClause,
        // },
        { model: Currency, required: true },
        {
          model: FixedAssetForecast,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
      limit: limit,
      offset: offset,
      where: {
        ...fixedAssetWhereClause,
        date_depreciated: {
          [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
        },
      },
    });

    // if (fixedAsset.length === 0) {
    //   let fixedAssetWhereClause = {
    //     date_depreciated: {
    //       [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //     },
    //   };
    //   expensesWhereClause = {
    //     product_name: {
    //       [Op.like]: `%${searchText}%`,
    //     },
    //   };
    //   let { count, rows: fixedAsset } = await FixedAsset.findAndCountAll({
    //     include: [
    //       // {
    //       //   model: Expenses,
    //       //   required: true,
    //       //   include: [
    //       //     {
    //       //       model: Currency,
    //       //       required: true,
    //       //     },
    //       //   ],
    //       //   where: expensesWhereClause,
    //       // },
    //       { model: Currency, required: true },
    //       {
    //         model: FixedAssetForecast,
    //         required: true,
    //       },
    //     ],
    //     order: [["createdAt", "DESC"]],
    //     distinct: true,
    //     limit: limit,
    //     offset: offset,
    //     where: {
    //       ...fixedAssetWhereClause,
    //       date_depreciated: {
    //         [Op.and]: [{ [Op.gte]: startDate }, { [Op.lte]: endDate }],
    //       },
    //     },
    //   });
    // }

    console.log(fixedAsset, "fixed ====");

    if (fixedAsset.length > 0) {
      const updatedFixedAsset = fixedAsset.map((asset) => {
        const depreciated_amount = asset.fixed_asset_forecasts
          ?.filter((forecast) => forecast.isPaid)
          .reduce((total, forecast) => total + forecast.amount, 0);

        const monthPaid = asset.fixed_asset_forecasts.reduce((acc, item) => {
          const isPaid = item.isPaid;
          const monthPaid = isPaid
            ? item.amount / asset.depreciation_amount
            : 0;
          return acc + monthPaid;
        }, 0);

        // const currency_rate = asset.expense.currency.currency_rate;
        return {
          id: asset.id,
          transaction_code: asset.transaction_code,
          date_depreciated: asset.date_depreciated,
          // expenses_id: asset.expenses_id,
          product_name: asset.product_name,
          // currency_name: asset.expense.currency.currency_name,
          currency_rate: asset.currency.currency_rate,
          total_cost: asset.total_cost,
          depreciated_amount: depreciated_amount,
          net_value: asset.total_cost - depreciated_amount || 0,
          months_left: asset.static_months_to_pay - monthPaid,
          remarks: asset.remarks,
          status: asset.status,
          createdAt: asset.createdAt,
        };
      });

      // console.log(updatedFixedAsset);
      if (updatedFixedAsset) {
        return res.json({
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page || 1),
          data: updatedFixedAsset,
        });
      }
    }

    return res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page || 1),
      data: fixedAsset,
    });
    //  else {
    //   res.status(500).json({ error: "Internal Server Error" });
    // }
  } catch (error) {
    console.error("Error fetching fixed asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/getFixedAssetForecast").get(async (req, res) => {
  try {
    const { fixedAssetIds } = req.query;
    const data = await FixedAssetForecast.findAll({
      include: [{ model: FixedAsset, required: true }],
      where: {
        id: {
          [Op.in]: fixedAssetIds,
        },
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/getFixedAssetById").get(async (req, res) => {
  try {
    const fixedAsset = await FixedAsset.findOne({
      where: {
        id: req.query.id,
      },
      include: [{ model: Currency, required: true }],
      // include: [
      //   {
      //     model: Expenses,
      //     required: true,
      //     include: [
      //       {
      //         model: currency_sub,
      //         required: true,
      //       },
      //     ],
      //   },
      // ],
    });

    const findCutoff = await Cutoff.findOne({
      where: {
        [Op.and]: [
          {
            from: { [Op.lte]: fixedAsset.date_depreciated },
          },
          {
            to: { [Op.gte]: fixedAsset.date_depreciated },
          },
        ],
        isDeleted: false,
      },
    });

    const isPosted = findCutoff?.isPosted || false;
    const plainData = fixedAsset.get({ plain: true });
    plainData.isPosted = isPosted;

    return res.json(plainData);
  } catch (error) {
    console.error("Error fetching fixed asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/updateFixedAsset").post(async (req, res) => {
  const {
    id,
    date,
    expenses_id,
    costPerUnit,
    quantity,
    totalCost,
    monthsToPay,
    depreciationAmount,
    remarks,
    forecast,
    userLoggedID,
    productName,
    currencyId,
  } = req.query;

  try {
    const getData = await FixedAsset.findOne({
      where: {
        id: id,
      },
    });

    const fixedAsset = await FixedAsset.update(
      {
        date_depreciated: date,
        cost_per_unit: costPerUnit,
        quantity: quantity,
        total_cost: totalCost,
        static_months_to_pay: monthsToPay,
        depreciation_amount: depreciationAmount,
        remarks: remarks,
        product_name: productName,
        currency_id: currencyId,
      },
      {
        where: {
          id: id,
        },
      }
    );

    if (fixedAsset) {
      await FixedAssetForecast.destroy({
        where: {
          fixed_asset_id: id,
        },
      });

      // Check if forecast exists and is an array before calling forEach
      if (forecast && Array.isArray(forecast) && forecast.length > 0) {
        forecast.forEach(async (item) => {
          await FixedAssetForecast.create({
            fixed_asset_id: id,
            date: item.date,
            amount: item.amount,
          });
        });
      }

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Fixed Asset: Update the fixed asset with transaction code ${getData.transaction_code} \n
        Depreciation Amount: ${getData.depreciation_amount} to ${depreciationAmount}, 
        Date Depreciated:${getData.date_depreciated} to ${date}, 
        Cost Per Unit: ${getData.cost_per_unit} to ${costPerUnit}
        Quantity: ${getData.quantity} to ${quantity}
        Remarks: ${getData.remarks} to ${remarks}
        `,
      });

      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error("Error updating fixed asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/approveFixedAsset").post(async (req, res) => {
  const { id, productName, totalCost, date, userLoggedID } = req.query;
  try {
    // let baseSubject_id;
    // const baseSubject = await accountlist_base_subject.findOne({
    //   where: {
    //     subject_name: "Fixed Assets",
    //   },
    // });

    // if (!baseSubject) {
    //   const newBaseSubject = await accountlist_base_subject.create({
    //     subject_name: "Fixed Assets",
    //     subject_type: "Bank",
    //     module_type: "Asset Account",
    //   });

    //   if (newBaseSubject) {
    //     baseSubject_id = newBaseSubject.id;
    //   }
    // } else {
    //   baseSubject_id = baseSubject.id;
    // }

    // const sub3 = await accountlist_sub3.create({
    //   account_list_base_sub_id: baseSubject_id,
    //   account_name: productName,
    //   amount: totalCost,
    //   currency_id: currencyID,
    // });

    // if (sub3) {
    //   const transaction = await accountlist_transaction_subject.create({
    //     account_list_sub3_id_transacted: sub3.id,
    //     payment_method: "--",
    //     amount: totalCost,
    //     date: date,
    //     currency_id: currencyID,
    //     check_or_remarks: null,
    //     type: "Debit",
    //   });
    // }

    const getData = await FixedAsset.findOne({
      where: {
        id: id,
      },
      attributes: ["transaction_code"],
    });

    const fixedAsset = await FixedAsset.update(
      {
        status: "Approved",
        approved_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Fixed Assets: User approved the fixed asset with transaction code ${getData.transaction_code}`,
    });

    if (fixedAsset) {
      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error("Error approving fixed asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/rejectFixedAsset").post(async (req, res) => {
  const { id, userLoggedID } = req.query;
  try {
    const getData = await FixedAsset.findOne({
      where: {
        id: id,
      },
      attributes: ["transaction_code"],
    });

    const fixedAsset = await FixedAsset.update(
      {
        status: "Rejected",
        approved_by: userLoggedID,
      },
      {
        where: {
          id: id,
        },
      }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Fixed Assets: User rejected the fixed asset with transaction code ${getData.transaction_code}`,
    });

    if (fixedAsset) {
      return res.status(200).json();
    } else {
      return res.status(500).json();
    }
  } catch (error) {
    console.error("Error approving fixed asset:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.route("/getAvailableQuantity").get(async (req, res) => {
//   const { expenses_id, id } = req.query;
//   try {
//     const totalQuantity = await FixedAsset.sum("quantity", {
//       where: {
//         expenses_id: expenses_id,
//         id: { [Op.ne]: id },
//         status: { [Op.ne]: "Rejected" },
//       },
//     });

//     // console.log(`Total Quantity: ${totalQuantity}`);
//     res.json(totalQuantity || 0);
//   } catch (error) {
//     console.error("Error fetching available quantity:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/deductDepreciation").get(async (req, res) => {
  try {
    const currentDate = moment().tz("Asia/Manila");
    const currentMonth = currentDate.month(); // Get the current month (0-11)
    const currentYear = currentDate.year(); // Get the current year

    const fixedAsset = await FixedAssetForecast.findAll({
      include: [
        {
          model: FixedAsset,
          required: true,
          where: {
            status: "Approved",
          },
        },
      ],
      where: {
        isPaid: false,
        status: "Pending",
        [Op.or]: [
          {
            // For records from previous years
            [Op.and]: [
              sequelize.where(sequelize.fn("YEAR", sequelize.col("date")), {
                [Op.lt]: currentYear,
              }), // Year less than current year
            ],
          },
          {
            // For records from the current year
            [Op.and]: [
              sequelize.where(
                sequelize.fn("YEAR", sequelize.col("date")),
                currentYear
              ), // Current year
              sequelize.where(sequelize.fn("MONTH", sequelize.col("date")), {
                [Op.lte]: currentMonth + 1,
              }), // Month less than or equal to current month
            ],
          },
        ],
      },
    });

    if (fixedAsset) {
      fixedAsset.forEach(async (asset) => {
        const assetForecast_id = asset.id;

        await FixedAssetForecast.update(
          {
            isPaid: true,
            status: "Paid",
          },
          { where: { id: assetForecast_id } }
        );
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deducting depreciation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/skipDeduction").post(async (req, res) => {
  const { id, forecastId } = req.query;

  try {
    const getForecast = await FixedAssetForecast.findOne({
      where: { id: forecastId },
    });

    const depreciateAmount = getForecast.amount;

    // Fetch the last forecast ordered by date in ascending order
    const lastForecast = await FixedAssetForecast.findOne({
      where: { fixed_asset_id: id },
      order: [["date", "DESC"]],
    });

    const updateForecast = await FixedAssetForecast.update(
      { status: "Skipped" },
      { where: { id: forecastId } }
    );

    if (updateForecast) {
      // Calculate the new date by adding 1 month to the last forecast's date
      const newDate = new Date(lastForecast.date);
      newDate.setMonth(newDate.getMonth() + 1);

      await FixedAssetForecast.create({
        fixed_asset_id: id,
        date: newDate,
        amount: depreciateAmount,
        status: "Pending",
      });
    }

    res.status(200).json({
      message: "Forecast updated and new forecast created successfully",
    });
  } catch (error) {
    console.error("Error updating forecast:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/getApprovedForecast").get(async (req, res) => {
  try {
    const { id } = req.query;

    const fixedAsset = await FixedAsset.findOne({
      where: {
        id,
      },
    });

    const fixedAssetForecast = await FixedAssetForecast.findAll({
      where: {
        fixed_asset_id: id,
      },
    });

    const paidItemCount = fixedAssetForecast.reduce((acc, item) => {
      const isPaid = item.isPaid;
      const monthPaid = item.amount / fixedAsset.depreciation_amount;

      return acc + (isPaid ? monthPaid : 0);
    }, 0);

    res.json({
      fixedAssetForecast,
      paidItemCount,
      totalCost: fixedAsset.total_cost,
    });
  } catch (error) {
    console.error("Error fetching approved forecast:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
