// useCollapsibleSections.js
import React, { useState } from "react";

export const useCollapsibleSections = (initialSections = {}) => {
  const [sections, setSections] = useState({
    "Set Schedule": true,
    "Customer List": true,
    Materials: true,
    Cost: true,

    ...initialSections,
  });

  const toggleSection = (sectionKey) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const isOpen = (sectionKey) => {
    return sections[sectionKey] || false;
  };

  return { toggleSection, isOpen };
};

export const CollapsibleContainer = ({
  title,
  children,
  toggleSection,
  isOpen,
}) => {
  return (
    <div className="container-fluid mb-4">
      <div
        className="w-100 d-flex align-items-center mt-3 px-2"
        style={{ cursor: "pointer" }}
        onClick={() => toggleSection(title)}
      >
        <i
          className={`fa-solid ${
            isOpen(title) ? "fa-circle-chevron-down" : "fa-circle-chevron-right"
          }`}
          style={{
            color: "#007bff",
            paddingRight: "5px",
            transition: "transform 0.5s ease-in-out",
          }}
        ></i>
        <h5 className="mt-2">{title}</h5>
        <hr className="flex-grow-1 mx-3" />
      </div>

      <div
        style={{
          maxHeight: isOpen(title) ? "1000px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.5s ease-in-out, opacity 0.5s ease-in-out",
          opacity: isOpen(title) ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};
