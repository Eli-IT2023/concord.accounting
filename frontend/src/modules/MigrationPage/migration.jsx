import React, { useEffect, useState } from "react";

import SupplierMigration from "./components/supplier";
import CustomerMigration from "./components/customer";
import ProductMigration from "./components/product";
import ExpensesMigration from "./components/expenses";
import OtherIncome from "./components/other_income";
import Accounts from "./components/accounts";

import swal from "sweetalert";
import axios from "axios";
import BASE_URL from "../../assets/global/url";
import Select from "react-select";
import useDecodeToken from "../../hooks/customHook/useDecodeToken";
import SalesMigration from "./components/SalesMigration";
import PayableMigration from "./components/PayableMigration";
import FixedAssetMigration from "./components/FixedAssetMigration";
const Migration_Page = ({ authrztn }) => {
  const userLoggedID = useDecodeToken();

  const [productOptions, setProductOptions] = useState([]);
  const [product, setProduct] = useState([]);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [lastDate, setLastDate] = useState("");

  const syncStatus = () => {
    swal({
      icon: "warning",
      title: "Are you sure?",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    }).then(async (confirm) => {
      if (confirm) {
        try {
          const res = await axios.put(
            `${BASE_URL}/paylocalexpenses/syncStatus`
          );

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Successful",
            });
          }

          console.log(res.data.dataToUpdate);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const syncInventoryJournal = () => {
    // para sa new table ng inventory report sana (inventory_journal)
    swal({
      icon: "warning",
      title: "Are you sure?",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    }).then(async (confirm) => {
      if (confirm) {
        try {
          const res = await axios.post(
            `${BASE_URL}/migration/syncInventoryJournal`
          );

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Successful",
            });
          }

          // console.log(res.data.dataToUpdate);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const syncInventoryReport = () => {
    // sync isali sa insert ang mga raw used sa production
    swal({
      icon: "warning",
      title: "Are you sure?",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    }).then(async (confirm) => {
      if (confirm) {
        try {
          const res = await axios.post(
            `${BASE_URL}/migration/syncInventoryReport`
          );

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Successful",
            });
          }

          // console.log(res.data.dataToUpdate);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const tagALLVendor = () => {
    swal({
      icon: "warning",
      title: "Are you sure?",
      buttons: ["Cancel", "OK"],
      dangerMode: true,
    }).then(async (confirm) => {
      if (confirm) {
        try {
          const res = await axios.post(`${BASE_URL}/migration/tagALLVendor`);

          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Successful",
            });
          }

          // console.log(res.data.dataToUpdate);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleAddProduct = async () => {
    try {
      if (product.length === 0) {
        swal({
          icon: "warning",
          title: "Warning",
          text: "Please select product first.",
        });
        return;
      }

      swal({
        icon: "warning",
        title: "Are you sure?",
        dangerMode: true,
        buttons: ["Cancel", "OK"],
      }).then(async (confirm) => {
        if (confirm) {
          const res = await axios.post(`${BASE_URL}/product/addProduct`, {
            productList: product,
          });
          if (res.status === 200) {
            swal({
              icon: "success",
              title: "Added Successfully",
              text: "Product has been added successfully",
            }).then(() => {
              setProduct([]);
            });
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/product/getProductData`);
      const options = res.data.map((item) => ({
        value: item.product_id,
        label: item.product_name,
      }));
      setProductOptions(options);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  const months = [
    { value: 0, name: "January" },
    { value: 1, name: "February" },
    { value: 2, name: "March" },
    { value: 3, name: "April" },
    { value: 4, name: "May" },
    { value: 5, name: "June" },
    { value: 6, name: "July" },
    { value: 7, name: "August" },
    { value: 8, name: "September" },
    { value: 9, name: "October" },
    { value: 10, name: "November" },
    { value: 11, name: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i); // 10 years back and forward

  useEffect(() => {
    if (month !== "" && year !== "") {
      const date = new Date(year, parseInt(month) + 1, 0); // Last day of month
      const formatted = date.toLocaleDateString("en-CA"); // Outputs YYYY-MM-DD in local time
      setLastDate(formatted);
    }
  }, [month, year]);

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <div className="container-fluid ">
        {" "}
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3">Migration Page</span>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <div className="d-flex flex-column">
              <label className="form-label mb-1">Month to Migrate</label>
              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex flex-column">
              <label className="form-label mb-1">Year to Migrate</label>
              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {lastDate && (
              <div className="d-flex flex-column">
                <label className="form-label mb-1 invisible">Last Date</label>
                <span className="badge bg-primary align-self-start">
                  Last Date: {lastDate}
                </span>
                <small className="text-muted">
                  This will be used as the base date of the migration.
                </small>
              </div>
            )}
          </div>
        </div>
        <SupplierMigration lastDate={lastDate} />
        <div className="border m-3"></div>
        <CustomerMigration lastDate={lastDate} />
        <div className="border m-3"></div>
        <ExpensesMigration lastDate={lastDate} />
        <div className="border m-3"></div>
        <ProductMigration lastDate={lastDate} />
        <div className="border m-3"></div>
        <OtherIncome lastDate={lastDate} />
        <div className="border m-3"></div>
        <Accounts lastDate={lastDate} />
        <div className="border m-3" />
        <SalesMigration lastDate={lastDate} />
        <div className="border m-3" />
        <PayableMigration lastDate={lastDate} />
        <div className="border m-3" />
        <FixedAssetMigration lastDate={lastDate} />
      </div>

      {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
        <div className="m-3 d-flex align-items-center">
          <Select
            isMulti
            name="colors"
            options={productOptions}
            className="basic-multi-select ms-1 w-25"
            classNamePrefix="select"
            value={product}
            onChange={(value) => {
              setProduct(value);
            }}
          />

          <button className="btn btn-primary mx-2" onClick={handleAddProduct}>
            Add Product
          </button>
        </div>
      )}
      {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
        <>
          <div>
            <span>Sync Inventory Report -&gt; </span>
            <button className="btn btn-primary" onClick={syncInventoryReport}>
              Sync
            </button>
          </div>

          <div>
            <span>Sync status for Local/Overseas Expense -&gt; </span>
            <button className="btn btn-primary" onClick={syncStatus}>
              Sync
            </button>
          </div>
        </>
      )}

      {userLoggedID === "11111111-1111-1111-1111-111111111111" && (
        <div>
          <span>Tag ALl Vendor per product </span>
          <button className="btn btn-primary" onClick={tagALLVendor}>
            TAG ALL
          </button>
        </div>
      )}
    </div>
  );
};

export default Migration_Page;
