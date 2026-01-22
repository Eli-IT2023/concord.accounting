import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import BASE_URL from "../assets/global/url";
import { useSearchParams } from "react-router-dom";

const CurrencySelector = ({
  setWidgetCurrencySymbol,
  fetchCutOff,
  currencyId,
  setCurrencyId,
  setCurrentPage,
  handleSearch,
  searchText,
  style,
}) => {
  const [currencyList, setCurrencyList] = useState([]);
  const didRun = useRef(false);
  const previousCurrency = useRef(null);

  // Fetch all currency
  const getCurrencyList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/currency/fetchCurrency`);
      setCurrencyList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // List of currency symbol
  const currencySymbol = {
    PHP: "₱",
    JPY: "¥",
    USD: "$",
    EUR: "€",
    HKD: "HK$",
    CNY: "CN¥",
  };

  // Get currency name
  const currencyName = currencyList.find(
    (item) => item.id === currencyId
  )?.currency_name;

  useEffect(() => {
    getCurrencyList();
  }, []);

  useEffect(() => {
    setWidgetCurrencySymbol(currencySymbol[currencyName || "PHP"]);
    setCurrentPage && setCurrentPage(1);

    // Prevents unnecessary fetchings
    const isSameCurrency = previousCurrency.current === currencyId;
    if (didRun.current && isSameCurrency) return;
    didRun.current = true;
    previousCurrency.current = currencyId;

    if (searchText) {
      handleSearch && handleSearch(searchText);
    } else {
      fetchCutOff && fetchCutOff();
    }
  }, [currencyId]);

  return (
    <div className="px-2 ms-auto" style={{ ...style }}>
      <select
        name="currency"
        id="currency"
        className="form-select"
        value={currencyId}
        onChange={(e) => {
          setCurrencyId(e.target.value);
        }}
      >
        <option value="All">All</option>
        {currencyList.map((item) => (
          <option key={item.id} value={item.id}>
            {item.currency_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;
