import { useEffect, useState } from "react";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import swal from "sweetalert";
import { format } from "date-fns";

export const useDateValidation = () => {
  // Check if the selected date falls within the range of any defined cutoff period
  const dateValidation = async (date, setDate, dateLabel) => {
    try {
      const res = await axios.get(`${BASE_URL}/cutoff/dateValidation`, {
        params: {
          date,
        },
      });

      // If the date is not valid (e.g., no cutoff), alert the user
      // if (res.data == false) {
      //   swal({
      //     icon: "error",
      //     title: `Invalid ${dateLabel}`,
      //     text: `Please Create Cutoff for this Date (${format(
      //       date,
      //       "MMM/dd/yyyy"
      //     )})`,
      //   }).then(() => {
      //     setDate(""); // Clear the date input
      //   });

      //   return false; // No existing cutoff found
      // }
    } catch (error) {
      console.error(error);
    }
  };

  return { dateValidation };
};
