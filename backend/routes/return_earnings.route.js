const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");

const {
  Cutoff,
  ReturnEarnings,
  ReturnEarningsCutoffs,
  ReturnOwnerList,
  ReturnCapitalMother,
  ReturnChildRetained,
  ReturnCapitalPayments,
  Activity_Log,
} = require("../db/models/associations");

const {
  accountlist_sub3,
  accountlist_transaction_subject,
  currency_sub,
  accountlist_base_subject,
  CashFlow,
  issued_check,
  bank_transaction,
} = require("../db/models/ModelsBySubject/associations_sub");

const session = require("express-session");

router.route("/getCutoffs").get(async (req, res) => {
  const cutoffs = await Cutoff.findAll({
    where: {
      isPosted: true,
      isDeleted: false,
    },
    order: [["from", "DESC"]],
  });

  if (cutoffs) {
    return res.status(200).json(cutoffs);
  } else {
    return res.status(500).json({ message: "An error occurred" });
  }
});

//used Module:
// Return Earnings
//Cutoff
router.route("/createEarnings").post(async (req, res) => {
  const { selectedOptionsCutoff, earning_name, userLoggedID } = req.body;
  try {
    // Get min and max dates
    const minMaxDates = selectedOptionsCutoff.reduce(
      (acc, curr) => {
        const fromDate = new Date(curr.from);
        const toDate = new Date(curr.to);

        if (!acc.min || fromDate < acc.min) {
          acc.min = fromDate;
        }
        if (!acc.max || toDate > acc.max) {
          acc.max = toDate;
        }
        return acc;
      },
      { min: null, max: null }
    );

    // Format dates back to 'YYYY-MM-DD'
    const formattedMinDate = minMaxDates.min.toISOString().split("T")[0];
    const formattedMaxDate = minMaxDates.max.toISOString().split("T")[0];

    // console.log("Min Date:", formattedMinDate);
    // console.log("Max Date:", formattedMaxDate);

    const overlappingCutoff = await ReturnEarnings.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                // New range starts within an existing range
                [Op.and]: {
                  from: { [Op.lte]: formattedMinDate },
                  to: { [Op.gte]: formattedMinDate },
                },
              },
              {
                // New range ends within an existing range
                [Op.and]: {
                  from: { [Op.lte]: formattedMaxDate },
                  to: { [Op.gte]: formattedMaxDate },
                },
              },
              {
                // New range completely contains an existing range
                [Op.and]: {
                  from: { [Op.gte]: formattedMinDate },
                  to: { [Op.lte]: formattedMaxDate },
                },
              },
            ],
          },
          {
            isDeleted: false,
          },
        ],
      },
    });

    if (overlappingCutoff) {
      return res.status(201).json({
        message: "Date range overlaps with existing cutoff period",
      });
    }

    const newEarnings = await ReturnEarnings.create({
      name: earning_name,
      from: formattedMinDate,
      to: formattedMaxDate,
    });

    if (newEarnings) {
      const updatePromises = selectedOptionsCutoff.map(async (cutoff) => {
        await ReturnEarningsCutoffs.create({
          return_earnings_id: newEarnings.id,
          cutoff_id: cutoff.value,
        });
      });

      await Promise.all(updatePromises);

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Retained Earnings: User created new earnings named ${earning_name}`,
      });
      console.log("pasok");
      return res.status(200).json({ message: "Earnings created successfully" });
    }
  } catch (error) {
    console.log("Err returm", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/updateEarnings").post(async (req, res) => {
  const { id, selectedOptionsCutoff, earning_name, userLoggedID } = req.body;
  try {
    // console.log(selectedOptionsCutoff);

    // Get min and max dates
    const minMaxDates = selectedOptionsCutoff.reduce(
      (acc, curr) => {
        const fromDate = new Date(curr.from);
        const toDate = new Date(curr.to);

        if (!acc.min || fromDate < acc.min) {
          acc.min = fromDate;
        }
        if (!acc.max || toDate > acc.max) {
          acc.max = toDate;
        }
        return acc;
      },
      { min: null, max: null }
    );

    // Format dates back to 'YYYY-MM-DD'
    const formattedMinDate = minMaxDates.min.toISOString().split("T")[0];
    const formattedMaxDate = minMaxDates.max.toISOString().split("T")[0];

    const overlappingCutoff = await ReturnEarnings.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          {
            // New range starts within an existing range
            [Op.and]: {
              from: { [Op.lte]: formattedMinDate },
              to: { [Op.gte]: formattedMinDate },
            },
          },
          {
            // New range ends within an existing range
            [Op.and]: {
              from: { [Op.lte]: formattedMaxDate },
              to: { [Op.gte]: formattedMaxDate },
            },
          },
          {
            // New range completely contains an existing range
            [Op.and]: {
              from: { [Op.gte]: formattedMinDate },
              to: { [Op.lte]: formattedMaxDate },
            },
          },
        ],
      },
    });

    if (overlappingCutoff) {
      return res.status(201).json({
        message: "Date range overlaps with existing cutoff period",
      });
    }

    //For activity log
    const getData = await ReturnEarnings.findOne({
      include: [
        {
          model: ReturnEarningsCutoffs,
          include: [
            {
              model: Cutoff,
            },
          ],
        },
      ],
      where: {
        id: id,
      },
    });

    const cutoffNames = getData.return_earnings_cutoffs
      .map((item) => item.cutoff.name)
      .join(", ");

    // For activity log //

    const newEarnings = await ReturnEarnings.update(
      {
        name: earning_name,
        from: formattedMinDate,
        to: formattedMaxDate,
      },
      { where: { id: id } }
    );

    if (newEarnings[0] > 0) {
      // Check if any rows were updated
      // Awaiting the deletion of return cutoffs
      const deleteReturnCutoffs = await ReturnEarningsCutoffs.destroy({
        where: { return_earnings_id: id },
      });

      // Awaiting all promises for selectedOptionsCutoff
      const updatePromises = selectedOptionsCutoff.map(async (cutoff) => {
        return ReturnEarningsCutoffs.create({
          // Return the promise
          return_earnings_id: id,
          cutoff_id: cutoff.value,
        });
      });

      // Await all promises
      await Promise.all([deleteReturnCutoffs, ...updatePromises]);

      //For Activity Logs
      const findNewCutOff = await Promise.all(
        selectedOptionsCutoff.map(async (cutoff) => {
          const foundCutoff = await Cutoff.findOne({
            where: { id: cutoff.value },
          });
          return foundCutoff ? foundCutoff.name : null;
        })
      );
      const newCutoffNames = findNewCutOff.filter(Boolean).join(", ");

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Retained Earnings: User updated the retained earnings information \n
        Retain Earning Name: ${getData.name} to ${earning_name}
        Selected Posted Cutoff: [${cutoffNames}] to  [${newCutoffNames}]
        `,
      });
      //For Activity Logs //

      return res.status(200).json({ message: "Earnings updated successfully" });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.route("/getEarnings").get(async (req, res) => {
  try {
    const { searchText } = req.query;
    const earnings = await ReturnEarnings.findAll({
      include: [
        {
          model: ReturnEarningsCutoffs,
          required: true,
          include: [
            {
              model: Cutoff,
              required: true,
            },
          ],
        },
      ],
      where: {
        name: {
          [Op.like]: `%${searchText}%`,
        },
        isDeleted: false,
      },
    });

    if (earnings) {
      const formattedResults = [];

      for (const earning of earnings) {
        let earningNetAmount = 0;
        const cutoffTransactions = [];

        for (const cutoff of earning.return_earnings_cutoffs) {
          const cutoffId = cutoff.cutoff_id;
          const cutoffName = cutoff.cutoff.name;
          const from = cutoff.cutoff.from;
          const to = cutoff.cutoff.to;

          const transactions = await accountlist_transaction_subject.findAll({
            where: {
              date: { [Op.between]: [from, to] },
              isDeleted: false,
              check_or_remarks: {
                [Op.or]: [{ [Op.ne]: "Funding Capital" }, { [Op.is]: null }],
              },
              isTransferOnly: false,
            },
            order: [["date", "DESC"]],
            include: [
              {
                model: accountlist_sub3,
                as: "transacteds",
                required: true,
                include: [
                  {
                    model: currency_sub,
                    required: true,
                  },
                ],
              },
            ],
          });

          const currencyTotals = {};

          // Calculate totals per currency for this cutoff
          transactions.forEach((transaction) => {
            const currencyId = transaction.transacteds.currency_id;
            const currencyName = transaction.transacteds.currency.currency_name;
            const currencyRate = transaction.transacteds.currency.currency_rate;

            if (!currencyTotals[currencyId]) {
              currencyTotals[currencyId] = {
                credit: 0,
                debit: 0,
                currencyName,
                currencyRate,
              };
            }

            if (transaction.type === "Credit") {
              currencyTotals[currencyId].credit += transaction.amount;
            } else if (transaction.type === "Debit") {
              currencyTotals[currencyId].debit += transaction.amount;
            }
          });

          // Calculate net amount for this cutoff
          let cutoffNetAmount = 0;
          Object.values(currencyTotals).forEach(
            ({ debit, credit, currencyRate }) => {
              cutoffNetAmount += (debit - credit) * currencyRate;
            }
          );

          earningNetAmount += cutoffNetAmount;

          cutoffTransactions.push({
            cutoff_id: cutoffId,
            cutoff_name: cutoffName,
            from: from,
            to: to,
            netAmount: cutoffNetAmount,
          });
        }

        formattedResults.push({
          id: earning.id,
          name: earning.name,
          netAmount: earningNetAmount,
          basic_info: [
            {
              id: earning.id,
              name: earning.name,
              isPosted: earning.isPosted,
              isAdded: earning.isAdded,
              from: earning.return_earnings_cutoffs[0]?.cutoff.from,
              to: earning.return_earnings_cutoffs[
                earning.return_earnings_cutoffs.length - 1
              ]?.cutoff.to,
            },
          ],
          cutoffs: cutoffTransactions,
        });
      }

      res.status(200).json(formattedResults);
    } else {
      res.status(500).json({ message: "An error occurred" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

router.route("/fetchEarningbyID").get(async (req, res) => {
  const { id } = req.query;

  const earnings = await ReturnEarnings.findOne({ where: { id: id } });

  if (earnings) {
    res.status(200).json(earnings);
  } else {
    res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/getTransaction").get(async (req, res) => {
  const { id } = req.query;

  try {
    const getEarnings = await ReturnEarnings.findOne({
      include: [
        {
          model: ReturnEarningsCutoffs,
          required: true,
          include: [
            {
              model: Cutoff,
              required: true,
            },
          ],
        },
      ],
      where: { id: id, isDeleted: false },
    });

    if (getEarnings) {
      // Initialize overall grouped transactions per cutoff
      const overallGroupedTransactions = {};

      for (const cutoff of getEarnings.return_earnings_cutoffs) {
        const cutoffId = cutoff.cutoff_id;
        const cutoffName = cutoff.cutoff.name; // Capture cutoff name
        const from = cutoff.cutoff.from;
        const to = cutoff.cutoff.to;

        const transactions = await accountlist_transaction_subject.findAll({
          where: {
            date: { [Op.between]: [from, to] },
            check_or_remarks: {
              [Op.or]: [{ [Op.ne]: "Funding Capital" }, { [Op.is]: null }],
            },
            isTransferOnly: false,
          },
          order: [["date", "DESC"]],
          include: [
            {
              model: accountlist_sub3,
              as: "transacteds",
              required: true,
              include: [
                {
                  model: currency_sub,
                  required: true,
                },
              ],
            },
          ],
        });

        // Initialize the group for this cutoff if it doesn't exist
        if (!overallGroupedTransactions[cutoffId]) {
          overallGroupedTransactions[cutoffId] = {
            cutoffName, // Store cutoff name here
            currencies: {}, // Initialize currencies object
          };
        }

        // Group transactions by currency_id for this cutoff
        transactions.forEach((transaction) => {
          const currencyId = transaction.transacteds.currency_id;
          const currencyName = transaction.transacteds.currency.currency_name;
          const currencyRate = transaction.transacteds.currency.currency_rate;
          const type = transaction.type; // Assuming 'type' is a field in the transaction

          // Initialize the group for this currency if it doesn't exist
          if (!overallGroupedTransactions[cutoffId].currencies[currencyId]) {
            overallGroupedTransactions[cutoffId].currencies[currencyId] = {
              credit: 0,
              debit: 0,
              currencyName,
              currencyRate,
            };
          }

          // Sum the amounts based on type
          if (type === "Credit") {
            overallGroupedTransactions[cutoffId].currencies[
              currencyId
            ].credit += transaction.amount; // Assuming 'amount' is a field in the transaction
          } else if (type === "Debit") {
            overallGroupedTransactions[cutoffId].currencies[currencyId].debit +=
              transaction.amount; // Assuming 'amount' is a field in the transaction
          }
        });
      }

      // Prepare the result for response
      const result = Object.entries(overallGroupedTransactions).flatMap(
        ([cutoffId, { cutoffName, currencies }]) => {
          return Object.entries(currencies).map(([currencyId, amounts]) => {
            return {
              cutoff_id: cutoffId, // Include cutoff ID in the result
              cutoff_name: cutoffName, // Include cutoff name in the result
              currency_id: currencyId,
              currency_name: amounts.currencyName,
              netAmount: amounts.debit - amounts.credit,
              currency_rate: amounts.currencyRate,
            };
          });
        }
      );

      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching transactions" });
  }
});
router.route("/deleteEarnings").post(async (req, res) => {
  const { id, userLoggedID } = req.query;
  try {
    const getData = await ReturnEarnings.findOne({
      where: {
        id: id,
      },
    });
    // const deletedEarnings = await ReturnEarnings.destroy({ where: { id: id } });
    const deletedEarnings = await ReturnEarnings.update(
      { isDeleted: true },
      { where: { id: id } }
    );

    await Activity_Log.create({
      masterlist_id: userLoggedID,
      action_taken: `Retained Earnings: User deleted an earnings named ${getData.name}`,
    });

    if (deletedEarnings) {
      return res.status(200).json({ message: "Earnings deleted successfully" });
    } else {
      return res.status(500).json({ message: "An error occurred" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred", error });
  }
});

// used file ReturnEarnings.jsx
router.route("/getOwnerList").get(async (req, res) => {
  try {
    const getOwners = await accountlist_sub3.findAll({
      include: [
        {
          model: accountlist_base_subject,
          required: true,
          where: {
            module_type: "Owner's Equity Account",
          },
        },
        {
          model: currency_sub,
          required: true,
        },
      ],
    });

    const totalInvestment = getOwners.reduce(
      (sum, owner) =>
        sum +
        parseFloat(owner.investment_amount) *
          parseFloat(owner.currency.currency_rate),
      0
    );
    console.log(totalInvestment);

    // Create an array to hold the owner profits
    const ownerProfitsArray = getOwners.map((owner) => {
      const investmentAmount =
        parseFloat(owner.investment_amount) *
        parseFloat(owner.currency.currency_rate);
      const sharedPercentage = (investmentAmount / totalInvestment) * 100;

      // console.log(sharedPercentage);
      return {
        id: owner.id,
        owner_name: owner.account_name,
        amount: owner.amount,
        currency_id: owner.currency_id,
        currency_name: owner.currency.currency_name,
        currency_rate: owner.currency.currency_rate,
        shared_percentage: sharedPercentage.toFixed(2),
        investment_amount: owner.investment_amount,
      };
    });

    // console.log(ownerProfitsArray);

    res.status(200).json(ownerProfitsArray);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

router.route("/claimProfit").post(async (req, res) => {
  const { id, OwnerProfit } = req.body;

  try {
    const updateReturnEarnings = await ReturnEarnings.update(
      {
        isPosted: true,
      },
      { where: { id: id } }
    );

    if (updateReturnEarnings) {
      // Create an array of promises for updating owners and creating transactions
      const promises = OwnerProfit.map(async (owner) => {
        await accountlist_sub3.update(
          {
            amount: owner.newBalance,
          },
          { where: { id: owner.id } }
        );

        return accountlist_transaction_subject.create({
          account_list_sub3_id_transacted: owner.id,
          paymentMethod: "--",
          amount: owner.profit,
          date: new Date(),
          check_or_remarks: "Claimed Profit",
          isTransferOnly: true,
          type: "Debit",
        });
      });

      // Await all promises
      await Promise.all(promises);
      return res.status(200).json({ message: "Profit claimed successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred", error });
  }
});

router.route("/getAccounts").get(async (req, res) => {
  const accounts = await accountlist_sub3.findAll({
    include: [
      {
        model: accountlist_base_subject,
        required: true,
        where: { module_type: "Account-List" },
      },
      {
        model: currency_sub,
        required: true,
      },
    ],
  });

  if (accounts) {
    // console.log(accounts);
    return res.status(200).json(accounts);
  } else {
    return res.status(500).json({ message: "An error occurred" });
  }
});

router.route("/saveRetainEarnings").post(async (req, res) => {
  const {
    ownerList,
    selectedEarningsNetAmount,
    selectedEarnings,
    totalDistributedEarnings,
    floatPayment, // destructured from req.body
    userLoggedID,
  } = req.body;

  try {
    const names = selectedEarnings.map((item) => item.name).join(", ");

    const mother = await ReturnCapitalMother.create({
      name: names,
      total_net_amount: selectedEarningsNetAmount,
      total_distributed_amount: totalDistributedEarnings,
      created_by: userLoggedID,
    });

    if (mother) {
      // Create arrays to hold all promises
      const earningPromises = selectedEarnings.map(async (earning) => {
        await ReturnChildRetained.create({
          return_capital_mother_id: mother.id,
          return_earnings_id: earning.basicId,
        });

        await ReturnEarnings.update(
          { isAdded: true },
          { where: { id: earning.basicId } }
        );
      });

      const ownerPromises = ownerList.map(async (owner) => {
        const ownerListEntry = await ReturnOwnerList.create({
          return_capital_mother_id: mother.id,
          invested_amount: owner.investment_amount,
          current_balance: owner.amount,
          account_list_sub3_id: owner.id,
          shared_percentage: owner.shared_percentage,
          to_return_amount: owner.toReturn,
          new_balance: owner.newBalance,
          capital_balance: owner.capitalBalance,
        });

        // Filter floatPayment items for this owner and create payments
        const ownerPayments = floatPayment.filter(
          (item) => item.ownerId === owner.id
        );
        const paymentPromises = ownerPayments.map(async (item) => {
          await ReturnCapitalPayments.create({
            return_owner_list_id: ownerListEntry.id,
            amount: item.amount,
            check_number: item.checkNumber,
            account_list_id_payment: item.subject3,
            date: item.date,
            type: item.type,
          });
        });

        // Wait for all payments for this owner to be created
        await Promise.all(paymentPromises);
      });

      // Wait for all promises to resolve
      await Promise.all([...earningPromises, ...ownerPromises]);

      await Activity_Log.create({
        masterlist_id: userLoggedID,
        action_taken: `Retained Earnings: User returned earnings for ${names} with total distributed earnings ${totalDistributedEarnings}`,
      });

      return res
        .status(200)
        .json({ message: "Retain earnings saved successfully" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

router.route("/getViewReturned").get(async (req, res) => {
  const viewReturned = await ReturnCapitalMother.findAll({
    include: [
      {
        model: ReturnChildRetained,
        required: true,
        include: [
          {
            model: ReturnEarnings,
            required: true,
          },
        ],
      },
      {
        model: ReturnOwnerList,
        required: true,
        include: [
          {
            model: accountlist_sub3,
            required: true,
            include: [
              {
                model: currency_sub,
                required: true,
              },
            ],
          },
          {
            model: ReturnCapitalPayments,
            required: true,

            include: [
              {
                model: accountlist_sub3,
                required: true,
                include: [
                  {
                    model: currency_sub,
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return res.status(200).json(viewReturned);
});

router.route("/approveReturnCapital").post(async (req, res) => {
  const { arrayData, type, floatPayment, userLoggedID } = req.body;

  const returnCapitalMother_id = arrayData[0].return_capital_mother_id;
  // console.log(returnCapitalMother_id);

  const getData = await ReturnCapitalMother.findOne({
    attributes: ["name"],
    where: { id: returnCapitalMother_id },
  });

  if (type === "cancel") {
    try {
      const updateReturnEarnings = await ReturnCapitalMother.update(
        {
          status: "Canceled",
          approved_by: userLoggedID,
        },
        { where: { id: returnCapitalMother_id } }
      );

      if (updateReturnEarnings) {
        // Use Promise.all to wait for all updates to complete
        await Promise.all(
          arrayData.map(async (item) => {
            const retainedEarnings_id = item.return_earning.id;
            await ReturnEarnings.update(
              { isAdded: false },
              { where: { id: retainedEarnings_id } }
            );
          })
        );

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Retained Earnings: User canceled the return capital for ${getData.name}`,
        });

        return res.status(200).json({ message: "Successfully canceled" });
      } else {
        return res.status(500).json({ message: "An error occurred" });
      }
    } catch (error) {
      console.log(error);
      console.log("canceled error");
    }
  } else {
    try {
      const updateReturnEarnings = await ReturnCapitalMother.update(
        { status: "Approved", approved_by: userLoggedID },
        { where: { id: returnCapitalMother_id } }
      );

      if (updateReturnEarnings) {
        await floatPayment.forEach(async (item) => {
          if (item.type === "Cash") {
            // Create cash flow record
            await CashFlow.create({
              account_list_id_cash_from: item.subject3,
              account_list_id_cash_to: item.ownerId,
              amount: item.amount,
              transaction_number: "Returning Capital",
              module_from: "Return Earnings",
              transaction_date: item.date,
              description: "Returning Capital",
              status: "Transfered",
            }),
              // Update source account balance
              await accountlist_sub3.decrement("amount", {
                by: parseFloat(item.amount),
                where: { id: item.subject3 },
              }),
              // Create source transaction record
              await accountlist_transaction_subject.create({
                account_list_sub3_id_transacted: item.subject3,
                payment_method: item.type,
                amount: item.amount,
                date: item.date,
                check_or_remarks: "Returning Capital",
                type: "Credit",
                isTransferOnly: true,
              }),
              // Update destination account balance
              await accountlist_sub3.increment("amount", {
                by: parseFloat(item.amount),
                where: { id: item.ownerId },
              }),
              // Create destination transaction record
              await accountlist_transaction_subject.create({
                account_list_sub3_id_transacted: item.ownerId,
                payment_method: item.type,
                amount: item.amount,
                date: item.date,
                check_or_remarks: "Returning Capital",
                type: "Debit",
                isTransferOnly: true,
              });
          } else if (item.type === "Bank" && item.checkNumber !== "") {
            // console.log("check");
            await issued_check.create({
              account_list_id_issued_from: item.subject3,
              account_list_id_issued_to: item.ownerId,
              amount: item.amount,
              transaction_number: "Returning Capital",
              module_from: "Return Earnings",
              transaction_date: item.date,
              check_number: item.checkNumber,
              description: "Returning Capital",
              status: "Pending",
            });
          } else if (item.type === "Bank" && item.checkNumber === "") {
            // console.log("bank");
            await bank_transaction.create({
              account_list_id_bank_from: item.subject3,
              account_list_id_bank_to: item.ownerId,
              amount: item.amount,
              transaction_number: "Returning Capital",
              module_from: "Return Earnings",
              transaction_date: item.date,
              description: "Returning Capital",
              status: "Pending",
            });
          }
        });

        await Activity_Log.create({
          masterlist_id: userLoggedID,
          action_taken: `Retained Earnings: User approved the return capital for ${getData.name}`,
        });

        // If we reach here, all transactions completed successfully
        return res.status(200).json({
          message: "All transactions completed successfully",
          success: true,
        });
      } else {
        return res.status(500).json({ message: "An error occurred" });
      }
    } catch (error) {
      console.log(error);
      console.log("approved error");
    }
  }
});

module.exports = router;
