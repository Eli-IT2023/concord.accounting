import { useState } from "react";
import OldExpenseReport from "./components/ExpenseReport/OldExpenseReport";
import NewExpenseReport from "./components/ExpenseReport/NewExpenseReport";

const ExpensesReport1 = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white rounded">
      {selectedValue === "OLD" ? (
        <OldExpenseReport authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewExpenseReport authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default ExpensesReport1;
