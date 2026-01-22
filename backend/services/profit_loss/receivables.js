const { Op } = require("sequelize");
const { Currency, SalesJournal } = require("../../db/models/associations");

async function getReceivableData(date_to) {
  /* ---------------------------------------------------
   * 1. Fetch DEBITS
   * --------------------------------------------------- */
  const debits = await SalesJournal.findAll({
    attributes: [
      "id",
      "date",
      "currency_name",
      "currency_rate",
      "total_amount",
    ],
    where: {
      date: { [Op.lte]: date_to },
      payment_type: "Debit",
      currency_name: { [Op.ne]: "PHP" },
      isDeleted: 0,
    },
    order: [
      ["currency_name", "ASC"],
      ["date", "ASC"],
      ["id", "ASC"],
    ],
    raw: true,
  });

  /* ---------------------------------------------------
   * 2. Fetch CREDITS
   * --------------------------------------------------- */
  const credits = await SalesJournal.findAll({
    attributes: [
      "id",
      "date",
      "currency_name",
      "currency_rate",
      "total_amount",
    ],
    where: {
      date: { [Op.lte]: date_to },
      payment_type: "Credit",
      currency_name: { [Op.ne]: "PHP" },
      isDeleted: 0,
    },
    order: [
      ["currency_name", "ASC"],
      ["date", "ASC"],
      ["id", "ASC"],
    ],
    raw: true,
  });

  /* ---------------------------------------------------
   * 3. FIFO SETTLEMENT
   * --------------------------------------------------- */
  let debitIndex = 0;

  for (const credit of credits) {
    let remainingCredit = Number(credit.total_amount);

    while (remainingCredit > 0 && debitIndex < debits.length) {
      const debit = debits[debitIndex];

      if (debit.currency_name !== credit.currency_name) {
        debitIndex++;
        continue;
      }

      if (debit.remaining === undefined) {
        debit.remaining = Number(debit.total_amount);
      }

      if (debit.remaining <= 0) {
        debitIndex++;
        continue;
      }

      const applied = Math.min(debit.remaining, remainingCredit);
      debit.remaining -= applied;
      remainingCredit -= applied;

      if (debit.remaining === 0) debitIndex++;
    }
  }

  /* ---------------------------------------------------
   * 4. Aggregate outstanding receivables
   * --------------------------------------------------- */
  const grouped = {};

  for (const d of debits) {
    const remaining =
      d.remaining !== undefined ? Number(d.remaining) : Number(d.total_amount);

    if (remaining <= 0) continue;

    const key = `${d.currency_name}-${d.currency_rate}`;

    if (!grouped[key]) {
      grouped[key] = {
        currency_name: d.currency_name,
        transaction_rate: Number(d.currency_rate),
        original_amount: 0,
      };
    }

    grouped[key].original_amount += remaining;
  }

  /* ---------------------------------------------------
   * 5. Load SYSTEM RATES
   * --------------------------------------------------- */
  const currencies = await Currency.findAll({
    attributes: ["currency_name", "currency_rate"],
    raw: true,
  });

  const systemRateMap = currencies.reduce((map, c) => {
    map[c.currency_name] = Number(c.currency_rate);
    return map;
  }, {});

  /* ---------------------------------------------------
   * 6. Build FINAL DATA (UI-ready)
   * --------------------------------------------------- */
  return Object.values(grouped).map((item) => {
    const system_rate = systemRateMap[item.currency_name] || 1;

    const assumed_amount = item.original_amount * item.transaction_rate;
    const actual_amount = item.original_amount * system_rate;

    const profit_loss = actual_amount - assumed_amount;
    const profit_loss_percent =
      assumed_amount !== 0 ? (profit_loss / assumed_amount) * 100 : 0;

    return {
      module: "Receivables",
      currency_name: item.currency_name,
      transaction_rate: item.transaction_rate,
      system_rate,
      original_amount: item.original_amount,
      assumed_amount,
      actual_amount,
      profit_loss,
      profit_loss_percent,
    };
  });
}

module.exports = {
  getReceivableData,
};
