// useExchangeProfitLoss.js
import { useMemo } from "react";

export default function useExchangeProfitLoss(data) {
  return useMemo(() => {
    let totalPL = 0;
    let totalExpectedPHP = 0;

    const processed = data.map((r) => {
      const isToSmallerCurrency = [
        "USD",
        "EUR",
        "CNY",
        "AUD",
        "CAD",
        "SGD",
      ].includes(r.currency_name_to);

      // Amount converted based on exchange rate
      const amount_to = isToSmallerCurrency
        ? parseFloat(r.amount_from / r.exchange_rate)
        : parseFloat(r.amount_from * r.exchange_rate);

      // Expected amount based on received rate
      const expectedAmount = isToSmallerCurrency
        ? parseFloat(r.amount_from / r.received_rate)
        : parseFloat(r.amount_from * r.received_rate);

      // P/L in "to" currency
      const profitLossToCurrency = isToSmallerCurrency
        ? expectedAmount - amount_to
        : amount_to - expectedAmount;

      // Convert profit/loss to PHP
      let profitLossPHP;
      if (r.currency_name_to === "PHP") {
        profitLossPHP = profitLossToCurrency;
      } else if (r.currency_name_from === "PHP") {
        profitLossPHP = profitLossToCurrency * r.exchange_rate;
      } else {
        profitLossPHP = profitLossToCurrency;
      }

      // Convert expected amount to PHP to compute percentage
      let expectedAmountPHP;
      if (r.currency_name_to === "PHP") {
        expectedAmountPHP = expectedAmount;
      } else if (r.currency_name_from === "PHP") {
        expectedAmountPHP = expectedAmount * r.exchange_rate;
      } else {
        expectedAmountPHP = expectedAmount;
      }

      // % P/L
      const percentPL =
        expectedAmountPHP !== 0 ? (profitLossPHP / expectedAmountPHP) * 100 : 0;

      // Accumulate totals
      totalPL += profitLossPHP;
      totalExpectedPHP += expectedAmountPHP;

      return {
        ...r,
        amount_to,
        expectedAmount,
        profitLossPHP,
        percentPL,
      };
    });

    // Total Percentage
    const totalPercent =
      totalExpectedPHP !== 0 ? (totalPL / totalExpectedPHP) * 100 : 0;

    return {
      rows: processed,
      totalPL,
      totalPercent,
    };
  }, [data]);
}
