import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import swal from "sweetalert";

const CustomDatePicker = ({
  index, // For Payment list, to remove calendar icon
  arrayOfObjectIndex, // To Set value of specific Index for Array of objects
  label, // Input field label
  field, // Key name from data object and used as form field name in useForm
  selected, // Date value
  handleDateChange,
  handleBlur,
  setter, // Set Date
  CustomInput,
  disabled,
  isRequired,
  validated, // Input field validation
  confirmation, // Apply custom border style when validation fails
  dateValidation, // Validation for cutoff date for "handleResetToToday" function
  postedCutoffValidation, // Posted cutoff validation for "handleResetToToday" function
  setIsAmountDisabled, // To Enable Amount input field in payment method
  iconTopOffset, // Icon position
  padding, // Input field padding
  maxDate,
  minDate,
  dateAndTime,
}) => {
  const [hoverYear, setHoverYear] = useState(null);
  const [selectYear, setSelectYear] = useState(false);
  const [yearList, setYearList] = useState([]);
  const yearListRef = useRef();
  const dateFormat = dateAndTime ? "MMM/dd/yyyy h:mm aa" : "MMM/dd/yyyy";

  // Initialize yearList
  const generateYears = (year) => {
    setYearList(() => {
      const updated = [];
      const currentYear = new Date().getFullYear();

      // Generate years based on current year or selected year
      const yearList = Array.from(
        { length: 16 },
        (_, i) => (year ? year : currentYear) - 16 + i + 1
      );

      // Divide array by 4 items
      for (let i = 0; i < yearList.length; i += 4) {
        updated.push(yearList.slice(i, i + 4));
      }

      return updated;
    });
  };

  const increaseYear = (changeYear) => {
    setYearList((prev) => {
      const updated = prev.map((item) => item.map((year) => year + 10));
      changeYear(updated[3][3]);

      return updated;
    });
  };

  const decreaseYear = (changeYear) => {
    setYearList((prev) => {
      const updated = prev.map((item) => item.map((year) => year - 10));
      changeYear(updated[3][3]);

      return updated;
    });
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const updateValue = (today) => {
    // useForm setter
    if (setter.name === "setValue") {
      setter(field, today);
      return;
    }

    // useState: array of objects
    if (field && typeof arrayOfObjectIndex === "number") {
      setter((prev) => {
        const updated = [...prev];
        updated[arrayOfObjectIndex] = {
          ...updated[arrayOfObjectIndex],
          [field]: today,
        };

        return updated;
      });

      return;
    }

    // useState: object
    if (field) {
      setter((prev) => ({
        ...prev,
        [field]: today,
      }));

      return;
    }

    // useState: primitive
    setter(today);
  };

  // prettier-ignore
  const handleResetToToday = (changeYear, changeMonth) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();

    // Run cutoff date validation if provided
    const existingCutoff = dateValidation && dateValidation(today, setter, label, field); // Check if there's existing cutoff for the selected date
    const isPosted = postedCutoffValidation && postedCutoffValidation(today, setter, label); // Check if the selected date falls within the posted cutoff period

    if (existingCutoff === false || isPosted) return

    // Update form/state with today's date
    updateValue(today);

    // Reset supporting dropdowns (years + month selector)
    generateYears();
    changeYear(currentYear);
    changeMonth(currentMonthIndex);

    setIsAmountDisabled && setIsAmountDisabled(false); // For Payment
  };

  // Handles "Today" button click or pressing Enter
  const handleClickToday = (changeYear, changeMonth) => {
    if (label === "Birthday") {
      swal({
        icon: "warning",
        title: "Invalid Birth Date",
        text: "Birth date cannot be today's date. Please select a valid past date.",
      });

      return;
    }

    setSelectYear(false);
    handleResetToToday(changeYear, changeMonth);
  };

  useEffect(() => {
    // Initialize Year List
    generateYears();

    // Close year dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (yearListRef.current && !yearListRef.current.contains(e.target))
        setSelectYear(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`${index === undefined && "position-relative"} flex-grow-1`}
    >
      <DatePicker
        onMonthChange={(newDate) => {
          const selectedYear = new Date(newDate).getFullYear();

          const isNotInCurrentYearList = !yearList
            .flat()
            .includes(selectedYear);

          if (isNotInCurrentYearList) {
            generateYears(selectedYear);
          }
        }}
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div
            style={{
              margin: 10,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {/* Go to Previous Month */}
            <button
              onClick={decreaseMonth}
              type="button"
              className="btn py-0 me-1 rounded-0 border border-0"
              disabled={prevMonthButtonDisabled}
            >
              {"<"}
            </button>

            {/* List of Months options */}
            <select
              value={months[date?.getMonth()]}
              onChange={({ target: { value } }) =>
                changeMonth(months.indexOf(value))
              }
              className="fw-bold rounded custom-date-picker"
              style={{
                cursor: "pointer",
                backgroundColor: "transparent",
              }}
            >
              {months.map((option) => (
                <option
                  style={{ backgroundColor: "white" }}
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {/* List of Years options */}
            <div ref={yearListRef} className="position-relative">
              <select
                value={date?.getFullYear()}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelectYear((prev) => !prev);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setSelectYear((prev) => !prev);
                  }
                }}
                style={{ cursor: "pointer" }}
                className="h-100 fw-bold rounded bg-transparent"
              >
                {yearList.map((item) =>
                  item.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                )}
              </select>

              {selectYear && (
                <>
                  <div
                    className="position-absolute bg-white rounded"
                    style={{
                      border: "1px solid #aeaeae",
                    }}
                  >
                    <div
                      className="d-flex justify-content-between align-items-center p-2 mb-2"
                      style={{
                        backgroundColor: "#f0f0f0",
                        borderBottom: "1px solid #aeaeae",
                        borderTopRightRadius: "0.3rem",
                        borderTopLeftRadius: "0.3rem",
                      }}
                    >
                      {/* Go to Previous Year */}
                      <button
                        onClick={() => decreaseYear(changeYear)}
                        type="button"
                        className="btn py-0 me-1 rounded-0 border border-0"
                      >
                        {"<"}
                      </button>

                      <div>
                        {yearList[0][0]} {"-"}{" "}
                        {yearList[yearList.length - 1][3]}
                      </div>

                      {/* Go to Next Year */}
                      <button
                        onClick={() => increaseYear(changeYear)}
                        type="button"
                        className="btn py-0 me-1 rounded-0 border border-0"
                      >
                        {">"}
                      </button>
                    </div>
                    <div className="px-2">
                      {yearList.map((item) => (
                        <div className="d-flex flex-column">
                          <ul className="d-flex p-0 m-0">
                            {item.map((year, i) => {
                              // Check if the current year is the selected one
                              const isSelectedYear =
                                date?.getFullYear() === year;

                              // Determine background color based on state
                              const getBgColor = () => {
                                if (isSelectedYear) return "#216ba5"; // Blue
                                if (hoverYear === year) return "#f0f0f0"; // Light gray
                                return "white"; // Default
                              };

                              return (
                                <li
                                  className="list-unstyled p-2 w-50"
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: getBgColor(),
                                    color: isSelectedYear ? "white" : "black",
                                    borderRadius: "0.3rem",
                                  }}
                                  onClick={() => {
                                    changeYear(year);
                                    setSelectYear(false);
                                  }}
                                  onMouseEnter={() => setHoverYear(year)}
                                  onMouseLeave={() => setHoverYear(null)}
                                >
                                  {year}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      type="button"
                      className="mt-2 px-2 pb-2 text-secondary"
                      style={{ float: "right" }}
                      onClick={() => handleClickToday(changeYear, changeMonth)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleClickToday(changeYear, changeMonth);
                        }
                      }}
                    >
                      Today
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Go to Next Month */}
            <button
              onClick={increaseMonth}
              type="button"
              className="btn py-0 ms-1 rounded-0 border border-0"
              disabled={nextMonthButtonDisabled}
            >
              {">"}
            </button>
          </div>
        )}
        selected={selected}
        dateFormat={dateFormat}
        onChange={handleDateChange}
        onCalendarClose={handleBlur || undefined}
        maxDate={label === "Birthday" ? new Date() : maxDate}
        minDate={minDate}
        {...(dateAndTime && {
          showTimeInput: true,
          timeInputLabel: "Time:",
        })}
        customInput={
          <CustomInput
            disabled={disabled}
            isRequired={isRequired}
            index={index}
            confirmation={confirmation}
            generateYears={generateYears}
            label={label}
            padding={padding}
          />
        }
        disabled={disabled}
      />
      {/* Calendar Icon */}
      <i
        className={`fa-solid fa-calendar-week calendar-position ${
          index !== undefined && "d-none"
        }`}
        style={{
          right: `${validated ? "2rem" : "1rem"}`,
          top: iconTopOffset ?? "0.8rem",
        }}
      ></i>
    </div>
  );
};

export default CustomDatePicker;
