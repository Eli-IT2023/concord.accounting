import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const useDecodeToken = () => {
  const [userLoggedID, setUserLoggedID] = useState([]);

  useEffect(() => {
    const decodeToken = () => {
      var token = localStorage.getItem("accessToken");
      if (typeof token === "string") {
        var decoded = jwtDecode(token);
        // console.log("DECODED TOKEN:", decoded);
        setUserLoggedID(decoded.id);
      }
    };

    decodeToken();
  }, []);

  return userLoggedID;
};

export default useDecodeToken;
