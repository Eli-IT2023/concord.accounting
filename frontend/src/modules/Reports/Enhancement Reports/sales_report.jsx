import { useState } from "react";
import OldSalesReport from "./components/SalesReport/OldSalesReport";
import NewSalesReport from "./components/SalesReport/NewSalesReport";

const SalesReport1 = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white rounded">
      {selectedValue === "OLD" ? (
        <OldSalesReport authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewSalesReport authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default SalesReport1;
