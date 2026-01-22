import React, { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { getMonthBoundaries } from "../utils/newdate";

const DateRangePicker = ({
  startDate,
  endDate,
  onDateRangeChange,
  label = "Date range",
}) => {
  const boundaries = getMonthBoundaries();

  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: boundaries.start,
      endDate: boundaries.end,
      key: "selection",
    },
  ]);

  const handleSelect = (ranges) => {
    setDateRange([ranges.selection]);
    onDateRangeChange(ranges.selection.startDate, ranges.selection.endDate);
  };

  const handleApply = () => {
    setShowCalendar(false);
  };

  // Format date as: Oct. 17, 2025
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="date-range-picker-container">
      <label className="date-range-label">{label}</label>
      <div className="date-range-input-wrapper">
        <input
          type="text"
          className="date-range-input"
          value={`${formatDate(dateRange[0].startDate)} – ${formatDate(
            dateRange[0].endDate
          )}`}
          readOnly
          onClick={() => setShowCalendar(!showCalendar)}
        />
        <button
          className="date-range-button"
          onClick={() => setShowCalendar(!showCalendar)}
          type="button"
        >
          <i className="bx bx-calendar"></i>
        </button>
      </div>

      {showCalendar && (
        <div className="date-range-popover">
          <DateRange
            ranges={dateRange}
            onChange={handleSelect}
            months={1}
            direction="vertical"
            showMonthAndYearPickers={false}
          />
          <div className="date-range-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowCalendar(false)}
            >
              Close
            </button>
            <button className="btn btn-primary" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
