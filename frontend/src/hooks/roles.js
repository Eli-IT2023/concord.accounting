import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import BASE_URL from "../assets/global/url";

export default function Roles({ children }) {
  const [authrztn, setauthrztn] = useState([]);
  const [edit, setEdit] = useState(false);
  const [id, setId] = useState(null);
  const [idToAdd, setIdToAdd] = useState([]);
  const [route, setRoute] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathnameLocation = useRef("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const isSamePathnameLocation =
      previousPathnameLocation.current === location.pathname;

    if (typeof accessToken === "string") {
      var decoded = jwtDecode(accessToken);

      axios
        .get(BASE_URL + "/masterList/viewAuthorization/" + decoded.id)
        .then((res) => {
          // console.log("Res: ",res);
          if (res.status === 200) {
            setauthrztn(
              res.data.userRole.col_authorization
                .split(",")
                .map((item) => item.trim())
            );
            // setauthrztn(res.data.userRole.col_authorization);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }

    if (edit === true && !isSamePathnameLocation) {
      const payload = JSON.stringify({ id, idToAdd: idToAdd });
      const blob = new Blob([payload], { type: "application/json" });

      navigator.sendBeacon(
        `${BASE_URL}/${route}/getBackOrderListTransaction`,
        blob
      );
    }

    previousPathnameLocation.current = location.pathname;

    // Clean up function
    return () => {
      setId(null);
      setEdit(false);
      setIdToAdd([]);
      setRoute("");
      window.onbeforeunload = null;
    };
  }, [navigate, location.pathname]);

  return <>{children({ authrztn, setId, setIdToAdd, setEdit, setRoute })}</>;
}
