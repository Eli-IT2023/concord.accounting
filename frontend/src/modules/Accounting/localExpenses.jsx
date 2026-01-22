import { useState } from "react";
import OldLocalExpenses from "./components/LocalOverseas/OldLocalExpenses";
import NewLocalExpenses from "./components/LocalOverseas/NewLocalExpenses";

const LocalExpenses = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  return (
    <div className="h-100 w-100 bg-white custom-container">
      {selectedValue === "OLD" ? (
        <OldLocalExpenses authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewLocalExpenses authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default LocalExpenses;
