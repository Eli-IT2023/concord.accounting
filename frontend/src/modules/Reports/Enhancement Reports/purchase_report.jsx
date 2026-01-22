import { useState } from "react";
import OldPurchaseReport from "./components/PurchaseReport/OldPurchaseReport";
import NewPurchaseReport from "./components/PurchaseReport/NewPurchaseReport";

const PurchaseReport1 = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white rounded">
      {selectedValue === "OLD" ? (
        <OldPurchaseReport authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewPurchaseReport authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default PurchaseReport1;
