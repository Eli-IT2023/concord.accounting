import { useContext, useEffect, useRef, useState } from "react";
import { MultiSelect } from "react-multi-select-component";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../../../assets/global/url";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/global/table-style";
import { RefreshContext } from "../../Payable";

const ApprovedStatusTab = ({
  selectedCutOff,
  currencyId,
  vendorDataFilter,
  setSearchTermFilter,
  columns,
}) => {
  const refreshKey = useContext(RefreshContext);
  const navigate = useNavigate();
  const debounceTimer = useRef();
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState([]);
  const approvedPayablePagination = useServerPagination(
    `${BASE_URL}/payable/fetchPayableSs`,
    10,
    {
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      currencyId,
      selectedVendor,
      status: "Approved",
    }
  );

  const handleVendorChange = (selected) => {
    setSelectedVendor(selected);

    approvedPayablePagination.updateApiUrl(
      `${BASE_URL}/payable/fetchPayableSs`
    );
    approvedPayablePagination.updateParams({
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      currencyId,
      selectedVendor: selected,
      status: "Approved",
    });
  };

  const handleSearch = (value) => {
    let input = value;
    let searchValue;

    // Remove commas
    const raw = String(input).replace(/,/g, "");

    const [intPart, decimalPart] = raw.split(".");

    // Add commas to integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Join back decimal part if it exists
    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;

    // To apply comma if match with total amount
    const isMatchingTotalAmount = approvedPayablePagination.data.some((item) =>
      String(item.totalPrice).includes(raw)
    );

    if (isMatchingTotalAmount) {
      setSearchText(formatted);
      searchValue = formatted;
    } else {
      setSearchText(raw);
      searchValue = raw;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      approvedPayablePagination.updateApiUrl(
        `${BASE_URL}/payable/fetchPayableSearch`
      );
      approvedPayablePagination.updateParams({
        startDate: selectedCutOff?.from,
        endDate: selectedCutOff?.to,
        filterColumn: filterColumn,
        searchText: searchValue,
        currencyId,
        status: "Approved",
      });
    }, 500);
  };

  const fetchPayable = () => {
    approvedPayablePagination.updateApiUrl(
      `${BASE_URL}/payable/fetchPayableSs`
    );
    approvedPayablePagination.updateParams({
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      currencyId,
      selectedVendor,
      status: "Approved",
    });
  };

  useEffect(() => {
    fetchPayable();
  }, [selectedVendor, currencyId, selectedCutOff, refreshKey]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12 col-md-4">
          <span>Suppliers</span>
          <MultiSelect
            options={vendorDataFilter} // You can also use vendorFetch here if needed
            value={selectedVendor}
            onChange={handleVendorChange}
            labelledBy="Select"
            className="w-100"
            style={{ maxWidth: "1000px" }}
            filterOptions={(options, filter) => {
              setSearchTermFilter(filter); // always update, even when ""
              return options.filter(({ label }) =>
                label.toLowerCase().includes(filter.toLowerCase())
              );
            }}
          />
        </div>
      </div>

      <div className="input-group my-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search"
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
        />

        <button
          type="button"
          className="btn btn-outline-secondary dropdown-toggle-split"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <i className="fa-solid fa-sliders"></i>
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "all" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("all")}
            >
              All
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "product" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("product")}
            >
              Product Name/Code
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "transaction_date" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("transaction_date")}
            >
              Transaction Date
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "transaction_id" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("transaction_id")}
            >
              Transaction No.
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "warehouse.name" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("warehouse.name")}
            >
              Receiving Warehouse
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "MOP" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("MOP")}
            >
              Mode of Payment
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "vendor.company_name" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("vendor.company_name")}
            >
              Vendor
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "discount_value" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("discount_value")}
            >
              Discount
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "due_date" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("due_date")}
            >
              Deadline
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "purchaseDate" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("purchaseDate")}
            >
              Purchase Date
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                filterColumn === "totalPrice" ? "active" : ""
              }`}
              onClick={() => setFilterColumn("totalPrice")}
            >
              Total Price
            </button>
          </li>
        </ul>
      </div>

      <div className="data-table-cell-width">
        <DataTable
          columns={columns}
          data={approvedPayablePagination.data}
          customStyles={customStyles}
          highlightOnHover
          className="dataTable"
          onRowClicked={(row) =>
            navigate(`../purchases/purchase-pay/${row.id}?page=${1}`)
          }
        />
        <PaginationControls {...approvedPayablePagination} />
      </div>
    </div>
  );
};

export default ApprovedStatusTab;
