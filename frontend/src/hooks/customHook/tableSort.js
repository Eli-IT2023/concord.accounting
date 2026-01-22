import { useState } from "react";

export const useSort = (
  initialSortColumn = "",
  initialSortAsc = false,
  fullUrl = ""
) => {
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [isSortedAsc, setIsSortedAsc] = useState(initialSortAsc);

  const toggleSort = (newSortColumn, updateParams) => {
    const isSameColumn = sortColumn === newSortColumn;
    const nextSortAsc = isSameColumn ? !isSortedAsc : true;

    setSortColumn(newSortColumn);
    setIsSortedAsc(nextSortAsc);

    const sortType = nextSortAsc ? "asc" : "desc";

    updateParams({
      sortType,
      sortDBTableColumn: newSortColumn,
      url: fullUrl,
    });
  };

  return {
    sortColumn,
    isSortedAsc,
    toggleSort,
  };
};
