import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

const CustomDatePickerInput = React.forwardRef(
  (
    {
      value,
      onClick,
      onChange,
      isInvalid,
      placeholder,
      readOnly,
      disabled,
      required,
    },
    ref
  ) => (
    <div className="position-relative">
      <input
        type="text"
        className={`form-control w-100 ${
          isInvalid ? "is-invalid border-danger" : ""
        }`}
        style={{
          cursor: "pointer",
          backgroundImage: "none",
        }}
        onClick={onClick}
        value={value}
        ref={ref}
        placeholder="Select Date"
        required={required}
        readOnly={readOnly}
        disabled={disabled}
      />
      <span
        onClick={onClick}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        <FaCalendarAlt />
      </span>
    </div>
  )
);

export default CustomDatePickerInput;
