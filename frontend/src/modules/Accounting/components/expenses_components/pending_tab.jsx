import { React, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import swal from "sweetalert";
import { format } from "date-fns";
import BASE_URL from "../../../../assets/global/url";
import { useNavigate } from "react-router-dom";
import { PaginationControls } from "../../../../hooks/customHook/paginationHook/usePagination";
import { useServerPagination } from "../../../../hooks/customHook/paginationHook/useServerPagination";
import axios from "axios";
function Pending_tab({
  authrztn,
  currencyId,
  userLoggedID,
  selectedCutOff,
  status_tab,
}) {
  const [searchText, setSearchText] = useState("");
  const [filterColumn, setFilterColumn] = useState("all");
  const navigate = useNavigate();

  const pagination = useServerPagination("about:blank", 10);

  const columns = [
    {
      name: "Transaction ID",
      selector: (row) => row.client_transaction_id,
    },

    {
      name: "Expenses Type",
      selector: (row) =>
        row.expenses2_id === null
          ? "NA"
          : `${row.expenses2.sub_type} (${row.expenses2.expenses_one.expenses_type_one})`,
    },
    {
      name: "Foreign Type",
      selector: (row) => (row.foreign === "" ? "NA" : row.foreign),
    },
    {
      name: "Amount",
      selector: (row) =>
        `${row.currency.currency_name} ${
          row.totalAmount?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`,
    },
    {
      name: "Description",
      selector: (row) => (row.desc === "" ? "NA" : row.desc),
    },
    {
      name: "Date Approved",
      selector: (row) =>
        row.date_approved
          ? format(row.date_approved, "MMM/dd/yyyy hh:mm a")
          : "n/a",
    },
    {
      name: "Expenses Date",
      selector: (row) => format(row.expenses_date, "MMM/dd/yyyy"),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => {
        let color;
        switch (row.status) {
          case "For-Approval":
            color = "#FFA500";
            break;
          case "Approved":
            color = "#3B9F3F";
            break;
          case "Rejected":
            color = "#FF0000";
            break;
          default:
            color = "initial";
        }
        return (
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "5px",
              color: color,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            {row.status}
          </div>
        );
      },
    },
  ];
  if (authrztn.includes("Expenses-Delete")) {
    columns.push({
      name: "Action",
      selector: (row) => (
        <i
          className="fas fa-trash"
          style={{ cursor: "pointer", color: "red", fontSize: "1.5rem" }}
          onClick={() => handleDeleteExpenses(row.id, row.expenses_date)}
        ></i>
      ),
    });
  }

  // console.log(typeof authrztn);

  const handleDeleteExpenses = async (expensesId, expensesDate) => {
    swal({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const response = await axios.delete(
            `${BASE_URL}/expenses/deleteExpenses/${expensesId}/${expensesDate}`,
            {
              data: { userLoggedID },
            }
          );
          if (response.status === 200) {
            swal({
              title: "Expenses Deleted Successfully!",
              text: "The expenses has been successfully deleted.",
              icon: "success",
              button: "OK",
            }).then(() => {
              fetchExpensesData();
              //   fetchCutOff();
              // setDeletionTrigger(true);
            });
          } else if (response.status === 203) {
            const { transactionNumber, moduleType } = response.data;
            const title = document.createElement("div");
            const text = document.createElement("div");
            const swalInfo = document.createElement("div");

            title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
            text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                                  Delete first the expenses in module <strong>${moduleType}</strong> with 
                                  Transaction Number: <strong>${transactionNumber}</strong>
                                </div>`;

            swalInfo.append(title);
            swalInfo.append(text);
            swal({
              icon: "error",
              content: swalInfo,
            });
          } else if (response.status === 202) {
            const { expensesDate, CutoffName } = response.data;
            swal({
              title: "Delete Prohibited!",
              text: `Expenses cannot be deleted as its expenses date (${expensesDate}) falls within the posted cutoff period named "${CutoffName}".`,
              icon: "warning",
              button: "OK",
            });
          } else {
            swal({
              icon: "error",
              title: "Something went wrong",
              text: "Please contact our support team for assistance.",
            });
          }
        } catch (err) {
          if (err.response) {
            const { status, data } = err.response;

            if (status === 300) {
              const { fixedAssetTransactionNumber, module } = data;
              const title = document.createElement("div");
              const text = document.createElement("div");
              const swalInfo = document.createElement("div");

              title.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">Deletion Prohibited!</div>`;
              text.innerHTML = `<div style="text-align: center; margin-top: 10px;">
                                      Delete first the expenses in module <strong>${module}</strong> with 
                                      Transaction Number: <strong>${fixedAssetTransactionNumber}</strong>
                                    </div>`;

              swalInfo.append(title);
              swalInfo.append(text);
              swal({
                icon: "error",
                content: swalInfo,
              });
            } else {
              swal({
                icon: "error",
                title: "Something went wrong",
                text: "Please contact our support team for assistance.",
              });
            }
          } else {
            swal({
              icon: "error",
              title: "Error",
              text: "An error occurred while deleting the expenses.",
            });
          }
        }
      }
    });
  };

  const fetchExpensesData = () => {
    pagination.updateApiUrl(`${BASE_URL}/expenses/getExpensesData`);
    pagination.updateParams({
      startDate: selectedCutOff.from,
      endDate: selectedCutOff.to,
      currencyId,
      status_tab: status_tab,
    });

    // setIsLoading(false);
  };

  const handleRowClick = (data) => {
    navigate(`/accounting/view-expenses/${data.id}`);
  };

  useEffect(() => {
    fetchExpensesData();
  }, [currencyId, selectedCutOff]);

  const handleSearchChange = (e) => {
    const value = e.target.value;

    pagination.updateApiUrl(`${BASE_URL}/expenses/getExpensesData-search`);
    pagination.updateParams({
      startDate: selectedCutOff.from,
      endDate: selectedCutOff.to,
      currencyId,
      searchText: value,
      filterColumn,
      status_tab: status_tab,
    });
    setSearchText(value);
  };

  const handleFilterColumnChange = (value) => {
    setFilterColumn(value);
    setSearchText("");
  };

  const searchFilters = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "client_transaction_id",
      label: "Transaction ID",
    },
    {
      value: "expenses2.expenses_one.expenses_type_one",
      label: "Expenses Type 1",
    },
    {
      value: "expenses2.sub_type",
      label: "Expenses Type 2",
    },
    {
      value: "foreign",
      label: "Foreign Type",
    },
    {
      value: "desc",
      label: "Description",
    },
    {
      value: "expenses_date",
      label: "Expenses Date",
    },
  ];

  return (
    <div>
      <div className="w-100 mt-4 mb-2 container-fluid">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search"
            value={searchText}
            onChange={handleSearchChange}
            aria-label="Search"
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
            {searchFilters.map(({ value, label }, i) => (
              <li key={i}>
                <button
                  className={`dropdown-item ${
                    filterColumn === value ? "active" : ""
                  }`}
                  onClick={() => handleFilterColumnChange(value)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* data table */}
      <div className="w-100 mt-3 container-fluid">
        <DataTable
          columns={columns}
          data={pagination.data}
          customStyles={customStyles}
          onRowClicked={handleRowClick}
          className="dataTable"
        />
        <PaginationControls {...pagination} />
      </div>
    </div>
  );
}

export default Pending_tab;
