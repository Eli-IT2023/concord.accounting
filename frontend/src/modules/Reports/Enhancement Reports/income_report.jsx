import { useState } from "react";
import OldIncomeStatement from "./components/IncomeStatement/OldIncomeStatement";
import NewIncomeStatement from "./components/IncomeStatement/NewIncomeStatement";

const IncomeReport1 = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white rounded">
      {selectedValue === "OLD" ? (
        <OldIncomeStatement authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewIncomeStatement authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default IncomeReport1;
