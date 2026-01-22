import { useState } from "react";
import OldLocalPurchase from "./component/OldLocalPurchase";
import NewLocalPurchase from "./component/NewLocalPurchase";

const Local_purchase = ({ authrztn }) => {
  const [selectedValue, setSelectedValue] = useState("NEW");

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {/* <div className="d-flex flex-row ">
        <div className="">
          <input
            type="radio"
            id="old"
            name=""
            value="OLD"
            checked={selectedValue === "OLD"}
            onChange={handleChange}
          />
          <label htmlFor="old">OLD</label>
        </div>
        <div className="mx-4">
          <input
            type="radio"
            id="new"
            name=""
            value="NEW"
            checked={selectedValue === "NEW"}
            onChange={handleChange}
          />
          <label htmlFor="new">NEW</label>
        </div>
      </div> */}

      {selectedValue === "OLD" ? (
        <OldLocalPurchase authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewLocalPurchase authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default Local_purchase;
