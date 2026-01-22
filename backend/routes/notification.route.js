const router = require("express").Router();
const { Op, where } = require("sequelize");
const {
  Payable,
  SalesInvoice,
  Notification,
  Expenses,
  Cutoff,
  Activity_Log,
} = require("../db/models/associations");

const session = require("express-session");
const moment = require("moment-timezone");
router.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

router.route("/save").post(async (req, res) => {
  try {
    const { notifications, userLoggedID } = req.body;

    const notificationData = await Promise.all(
      notifications.map(async (notification) => {
        const existingNotification = await Notification.findOne({
          where: { setting_type: notification.setting_type },
        });

        const getData = await Notification.findOne({
          where: { setting_type: notification.setting_type },
        });

        if (existingNotification) {
          const getDataCheck = getData.isCheck ? "Checked" : "Unchecked";
          const currCheck = notification.isChecked ? "Checked" : "Unchecked";
          await Activity_Log.create({
            masterlist_id: userLoggedID,
            action_taken: `In App Notification: User updated app notification information \n
         '${getData.setting_type}: from ${getData.days} days to ${notification.days} days and ${getDataCheck} to ${currCheck},
      `,
          });
          await existingNotification.update({
            days: notification.days,
            isChecked: notification.isChecked,
          });
          return existingNotification;
        } else {
          return await Notification.create({
            setting_type: notification.setting_type,
            days: notification.days,
            isChecked: notification.isChecked,
          });
        }
      })
    );

    return res.status(200).json({
      message: "Notification settings saved successfully!",
      data: notificationData,
    });
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.route("/getNotificationData").get(async (req, res) => {
  try {
    const data = await Notification.findAll();

    return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json("error");
  }
});

// router.route("/getInvoiceandExpensesAlertNotification").get(async (req, res) => {
//     try {
//       // Fetch notification settings
//       const dueDateNotification = await Notification.findOne({
//         where: {
//           setting_type: "Due Date Alert",
//         },
//       });

//       if (!dueDateNotification) {
//         return res
//           .status(203)
//           .json({ message: "Notification settings not found" });
//       }

//       const notifyTrue = dueDateNotification.isChecked;
//       const notifyDays = dueDateNotification.days;

//       if (notifyTrue) {
//         const currentDate = moment().startOf("day");
//         const targetDate = currentDate.clone().add(notifyDays, "days");
//         const startOfMonth = currentDate.clone().startOf("month");
//         const endOfMonth = currentDate.clone().endOf("month");

//         const checkInvoiceData = await SalesInvoice.findAll({
//           where: {
//             due_date: {
//               [Op.gte]: startOfMonth.toDate(), // Start of current month
//               [Op.lte]: endOfMonth.toDate(), // End of current month
//               [Op.eq]: targetDate.toDate(), // Matches target date
//             },
//             payAdded: false,
//           },
//         });

//         const checkExpensesData = await Expenses.findAll({
//           where: {
//             due_date: {
//               [Op.gte]: startOfMonth.toDate(), // Start of current month
//               [Op.lte]: endOfMonth.toDate(), // End of current month
//               [Op.eq]: targetDate.toDate(), // Matches target date
//             },
//             isAdded: false,
//           },
//         });

//         const checkPayableData = await Payable.findAll({
//           where: {
//             due_date: {
//               [Op.gte]: startOfMonth.toDate(), // Start of current month
//               [Op.lte]: endOfMonth.toDate(), // End of current month
//               [Op.eq]: targetDate.toDate(), // Matches target date
//             },
//             isAdded: false,
//           },
//         });

//         return res.status(200).json({
//           salesInvoices: checkInvoiceData,
//           expenses: checkExpensesData,
//           payable: checkPayableData,
//         });
//       } else {
//         return res.status(202).json({ message: "Notifications are disabled" });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   });
router
  .route("/getInvoiceandExpensesAlertNotification")
  .get(async (req, res) => {
    try {
      // Fetch notification settings
      const dueDateNotification = await Notification.findOne({
        where: { setting_type: "Due Date Alert" },
      });

      if (!dueDateNotification) {
        return res
          .status(203)
          .json({ message: "Notification settings not found" });
      }

      const { isChecked: notifyTrue, days: notifyDays } = dueDateNotification;

      // Fetch last transaction settings
      const lastTransaction = await Notification.findOne({
        where: { setting_type: "Customer Last Transaction" },
      });

      const { isChecked: notifyLastTrue, days: notifyDaysLastTransaction } =
        lastTransaction;

      const latestCutOff = await Cutoff.findOne({
        order: [["from", "DESC"]],
      });

      const dateFrom = latestCutOff?.from;
      const dateTo = latestCutOff?.to;

      if (notifyTrue) {
        const currentDate = moment().startOf("day");
        const targetDate = currentDate.clone().add(notifyDays, "days");

        const dateConditions = latestCutOff
          ? {
              [Op.and]: [
                { due_date: { [Op.gte]: currentDate.toDate() } },
                { due_date: { [Op.lte]: targetDate.toDate() } },
                { due_date: { [Op.between]: [dateFrom, dateTo] } },
              ],
            }
          : {
              due_date: {
                [Op.gte]: currentDate.toDate(),
                [Op.lte]: targetDate.toDate(),
              },
            };

        // Fetch Sales Invoices based on due_date
        const checkInvoiceDataDue = await SalesInvoice.findAll({
          where: {
            ...dateConditions,
            payAdded: false,
          },
        });

        const checkExpensesData = await Expenses.findAll({
          where: {
            ...dateConditions,
            isAdded: false,
          },
        });

        const checkPayableData = await Payable.findAll({
          where: {
            ...dateConditions,
            isAdded: false,
          },
        });

        if (notifyLastTrue) {
          // const checkLastCustomerTransaction = await SalesInvoice.findAll({
          //   where: {
          //     invoice_date: {
          //       [Op.lte]: moment()
          //         .startOf("day")
          //         .subtract(notifyDaysLastTransaction, "days")
          //         .toDate(),
          //     },
          //     ...(latestCutOff && {
          //       invoice_date: {
          //         [Op.between]: [dateFrom, dateTo],
          //       },
          //     }),
          //   },
          // });

          const currentMonthStart = moment().startOf("month");
          const currentMonthEnd = moment().endOf("month");

          const isWithinCurrentMonth =
            dateFrom &&
            dateTo &&
            moment(dateFrom).isSame(currentMonthStart, "month") &&
            moment(dateTo).isSame(currentMonthStart, "month");

          const checkLastCustomerTransaction = isWithinCurrentMonth
            ? await SalesInvoice.findAll({
                where: {
                  [Op.and]: [
                    {
                      invoice_date: {
                        [Op.lte]: moment()
                          .startOf("day")
                          .subtract(notifyDaysLastTransaction, "days")
                          .toDate(),
                      },
                    },
                    {
                      invoice_date: {
                        [Op.between]: [dateFrom, dateTo],
                      },
                    },
                  ],
                },
              })
            : [];

          return res.status(200).json({
            salesInvoices: checkInvoiceDataDue,
            expenses: checkExpensesData,
            payable: checkPayableData,
            customer: checkLastCustomerTransaction,
          });
        }

        return res.status(200).json({
          salesInvoices: checkInvoiceDataDue,
          expenses: checkExpensesData,
          payable: checkPayableData,
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

//for last customer transaction fetching
// router.route("/getLastCustomerTransaction").get(async (req, res) => {
//   try {
//     // Fetch notification settings
//     const lastCustomer = await Notification.findOne({
//       where: { setting_type: "Customer Last Transaction" },
//     });

//     if (!lastCustomer) {
//       return res.status(203).json({ message: "No Customer Last Transaction" });
//     }

//     const { isChecked: notifyTrue, days: notifyDays } = lastCustomer;

//     const latestCutOff = await Cutoff.findOne({
//       order: [["from", "DESC"]],
//     });

//     const { from: dateFrom, to: dateTo } = latestCutOff;

//     if (notifyTrue) {
//       const currentDate = moment().startOf("day");
//       const targetDate = currentDate.clone().add(notifyDays, "days");

//       const checkLastCustomerTransaction = await SalesInvoice.findAll({
//         where: {
//           invoice_date: {
//             [Op.gte]: targetDate.toDate(),
//             [Op.between]: [dateFrom, dateTo],
//           },
//           payAdded: false,
//         },
//       });

//       // Return all data
//       return res.status(200).json(checkLastCustomerTransaction);
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.route("/updateNotificationInvoice").put(async (req, res) => {
  try {
    const { id } = req.body;

    const checkNotify = await SalesInvoice.findOne({
      where: { sales_invoice_id: id },
    });

    const Notification = checkNotify.notification;

    if (Notification === false) {
      // Perform the update only when notification is false
      await SalesInvoice.update(
        { notification: true },
        { where: { sales_invoice_id: id } }
      );

      return res.status(200).json({ message: "Notification updated" });
    } else {
      return res.status(200).json({ message: "Notification already updated" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/updateNotificationExpenses").put(async (req, res) => {
  try {
    const { id } = req.body;
    const checkNotify = await Expenses.findOne({
      where: { id: id },
    });

    const Notification = checkNotify.notification;

    if (Notification === false) {
      await Expenses.update({ notification: true }, { where: { id: id } });
      return res.status(200).json({ message: "Notification updated" });
    } else {
      return res.status(200).json({ message: "Notification already updated" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.route("/updateNotificationPayable").put(async (req, res) => {
  try {
    const { id } = req.body;

    const checkNotify = await Payable.findOne({
      where: { id: id },
    });

    const Notification = checkNotify.notification;

    if (Notification === false) {
      await Payable.update({ notification: true }, { where: { id: id } });
      return res.status(200).json({ message: "Notification updated" });
    } else {
      return res.status(200).json({ message: "Notification already updated" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router
  .route("/updateNotificationLastCustomerTransaction")
  .put(async (req, res) => {
    try {
      const { id } = req.body;

      const checkNotify = await SalesInvoice.findOne({
        where: { sales_invoice_id: id },
      });

      const Notification = checkNotify.notification;

      if (Notification === false) {
        await SalesInvoice.update(
          { notification: true },
          { where: { sales_invoice_id: id } }
        );

        return res.status(200).json({ message: "Notification updated" });
      } else {
        return res
          .status(200)
          .json({ message: "Notification already updated" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
module.exports = router;
