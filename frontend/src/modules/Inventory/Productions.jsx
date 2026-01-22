import React, { useState, useEffect } from "react";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import OldProduction from "./Sub Folder/OldProduction";
import NewProduction from "./Sub Folder/NewProduction";

const Productions = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();
  const [selectedValue, setSelectedValue] = useState("NEW");

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };
  return (
    <div className="h-100 w-100 border bg-white custom-container">
      {/* {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
        <div className="d-flex flex-row ">
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
        </div>
      )} */}

      {selectedValue === "OLD" ? (
        <OldProduction authrztn={authrztn} />
      ) : selectedValue === "NEW" ? (
        <NewProduction authrztn={authrztn} />
      ) : null}
    </div>
  );
};

export default Productions;
