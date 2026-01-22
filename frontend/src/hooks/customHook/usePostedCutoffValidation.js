import { useEffect, useState } from "react";
import BASE_URL from "../../assets/global/url";
import axios from "axios";
import swal from "sweetalert";
import { format } from "date-fns";

export const usePostedCutoffValidation = () => {
  // Check if the cutoff for the selected date has been posted
  const postedCutoffValidation = async (date, setDate, dateLabel) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/cutoff/validation/posted-cutoff`,
        {
          params: {
            date,
          },
        }
      );

      // If the date is posted alert the user
      if (res.data === true) {
        swal({
          icon: "error",
          title: `Invalid ${dateLabel}`,
          text: `A cutoff has already been posted for the selected date (${format(date, "MMM/dd/yyyy")}).`, // prettier-ignore
        }).then(() => {
          setDate(""); // Clear the date input
        });

        return true; // cutoff is posted
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { postedCutoffValidation };
};
