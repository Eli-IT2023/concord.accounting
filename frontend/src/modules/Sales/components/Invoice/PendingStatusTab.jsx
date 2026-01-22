import { MultiSelect } from "react-multi-select-component";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import BASE_URL from "../../../../assets/global/url";
import { useEffect, useContext, useState, useRef } from "react";
import { RefreshContext } from "../../Invoice";

const PendingStatusTab = () => {
  const {
    selectedCutOff,
    currencyId,
    customerOptions,
    setCustomerSearchValue,
    columns,
    handleUpdateInvoice,
    refreshKey,
  } = useContext(RefreshContext);

  const [selectedCustomer, setSelectedCustomer] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const debounceTimer = useRef();

  // const pendingSalesInvoicePagination = useServerPagination(
  //   BASE_URL + "/invoice/getSalesData",
  //   10,
  //   {
  //     startDate: selectedCutOff?.from,
  //     endDate: selectedCutOff?.to,
  //     filterColumn,
  //     searchTerm,
  //     status: "Pending",
  //     currencyId,
  //     selectedCustomer,
  //   }
  // );

  const pendingSalesInvoicePagination = useServerPagination("about:blank", 10);

  const handleCustomerChange = (selectedOption) => {
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      pendingSalesInvoicePagination.updateApiUrl(
        `${BASE_URL}/invoice/getSalesData/customer-filter`
      );
      pendingSalesInvoicePagination.updateParams({
        startDate: selectedCutOff?.from,
        endDate: selectedCutOff?.to,
        status: "Pending",
        currencyId,
        selectedCustomer: selectedOption,
      });
    }, 600);

    setSelectedCustomer(selectedOption);
    setSearchTerm("");
  };

  const handleFilterColumnSelect = (column) => {
    setFilterColumn(column);
    setSearchTerm("");
  };

  const handleSearch = (e) => {
    let input = e.target.value;

    // Remove commas
    const raw = String(input).replace(/,/g, "");

    const [intPart, decimalPart] = raw.split(".");

    // Add commas to integer part
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Join back decimal part if it exists
    const formatted =
      decimalPart !== undefined ? `${withCommas}.${decimalPart}` : withCommas;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      pendingSalesInvoicePagination.updateApiUrl(
        `${BASE_URL}/invoice/getSalesData/search`
      );
      pendingSalesInvoicePagination.updateParams({
        startDate: selectedCutOff?.from,
        endDate: selectedCutOff?.to,
        filterColumn,
        searchTerm: input,
        status: "Pending",
        currencyId,
        selectedCustomer,
      });
    }, 600);

    // To apply comma if match with total amount
    const isMatchingTotalAmount = pendingSalesInvoicePagination.data.some(
      (item) => String(item.total_amount).includes(raw)
    );

    setSearchTerm(isMatchingTotalAmount ? formatted : raw);
  };

  const fetchSalesInvoice = () => {
    pendingSalesInvoicePagination.updateApiUrl(
      BASE_URL + "/invoice/getSalesData"
    );
    pendingSalesInvoicePagination.updateParams({
      startDate: selectedCutOff?.from,
      endDate: selectedCutOff?.to,
      filterColumn,
      searchTerm,
      status: "Pending",
      currencyId,
      selectedCustomer,
    });
    setSearchTerm("");
    setSelectedCustomer([]);
  };

  useEffect(() => {
    fetchSalesInvoice();
  }, [selectedCutOff, currencyId, refreshKey]);

  return (
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col-sm-12 col-md-4">
          <span>Customer</span>
          <MultiSelect
            options={customerOptions}
            value={selectedCustomer}
            onChange={handleCustomerChange}
            labelledBy="Select Customer"
            // filterOptions={(options, filter) => {
            //   setCustomerSearchValue(filter);
            //   return options.filter(({ label }) =>
            //     label.toLowerCase().includes(filter.toLowerCase())
            //   );
            // }}
            debounceDuration={300}
            overrideStrings={{
              selectSomeItems: "Select Customer", // placeholder text
              search: "Search Customer",
            }}
          />
        </div>
      </div>
      <div className="w-100 mt-2">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearch}
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
                onClick={() => handleFilterColumnSelect("all")}
              >
                All
              </button>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            {[
              { value: "client_transaction_id", label: "Transaction ID" },
              { value: "destination", label: "Destination" },
              // { value: "customer", label: "Customer" },
              { value: "invoice_date", label: "Invoice Date" },
              { value: "due_date", label: "Due Date" },
              { value: "dr_number", label: "DR Number" },
              { value: "po_number", label: "PO Number" },
              // { value: "currency", label: "Currency" },
              { value: "total_amount", label: "Total Amount" },
              // { value: "status", label: "Status" },
              { value: "product_name", label: "Product Name" },
              { value: "product_code", label: "Product Code" },
            ].map(({ value, label }) => (
              <li key={value}>
                <button
                  className={`dropdown-item ${
                    filterColumn === value ? "active" : ""
                  }`}
                  onClick={() => handleFilterColumnSelect(value)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* data table */}
      <div className="w-100 mt-3">
        <div className="sales-invoice-data-table">
          <DataTable
            columns={columns}
            data={pendingSalesInvoicePagination.data}
            customStyles={customStyles}
            className="dataTable"
            onRowClicked={handleUpdateInvoice}
          />
          <PaginationControls {...pendingSalesInvoicePagination} />
        </div>
      </div>
    </div>
  );
};

export default PendingStatusTab;
