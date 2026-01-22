import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";
import swal from "sweetalert";
import DataTable from "react-data-table-component";
import { customStyles } from "../../../../assets/table-style";
import "@fortawesome/fontawesome-free/css/all.min.css";
import BASE_URL from "../../../../assets/global/url";
import Select from "react-select";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import "../../../../assets/css/style.css";
import DatePicker from "react-datepicker";
import NoAccess from "../../../../assets/img/NoAccess.png";
const InventoryReport1 = () => {
  const navigate = useNavigate();
  const { module, id } = useParams();

  const [thisFromdate, setThisFromdate] = useState("");
  const [thisTodate, setThisTodate] = useState("");
  const [cutoffList, setCutoffList] = useState([]);
  const [selectedCutoff_id, setSelectedCutoff_id] = useState("");
  const [showTable, setShowTable] = useState(false);

  const [beginningRawMaterials, setBeginningRawMaterials] = useState([]);
  const [currentRawInventory, setCurrentRawInventory] = useState([]);
  const [currentOut, setCurrentOut] = useState([]);
  const [finalRawMaterials, setFinalRawMaterials] = useState([]);

  const [outRawCalculation, setOutRawCalculation] = useState([]);
  const [inRawCalculation, setInRawCalculation] = useState([]);

  const [previousOutRawCalculation, setPreviousOutRawCalculation] = useState(
    []
  );
  const [previousInRawCalculation, setPreviousInRawCalculation] = useState([]);

  const [currentFinishInventory, setCurrentFinishInventory] = useState([]);
  const [currentFinishOut, setCurrentFinishOut] = useState([]);

  const [rawMaterialsProductOut, setRawMaterialsProductOut] = useState([]);

  const [beginningFinishProduct, setBeginningFinishProduct] = useState([]);
  const [finalProductOut, setFinalProductOut] = useState([]);

  const [finalFinishProduct, setFinalFinishProduct] = useState([]);

  const [outFinishCalculation, setOutFinishCalculation] = useState([]);
  const [inFinishCalculation, setInFinishCalculation] = useState([]);

  const [previousOutFinishCalculation, setPreviousOutFinishCalculation] =
    useState([]);
  const [previousInFinishCalculation, setPreviousInFinishCalculation] =
    useState([]);

  const [consumables, setConsumables] = useState([]);
  const [finalConsumable, setFinalConsumable] = useState([]);
  const [currentConsumable, setCurrentConsumable] = useState([]);
  const [consumableOut, setConsumableOut] = useState([]);

  const [outConsumableCalculation, setOutConsumableCalculation] = useState([]);
  const [inConsumableCalculation, setInConsumableCalculation] = useState([]);

  const [
    previousOutConsumableCalculation,
    setPreviousOutConsumableCalculation,
  ] = useState([]);
  const [previousInConsumableCalculation, setPreviousInConsumableCalculation] =
    useState([]);

  const toggleTable = () => {
    setShowTable(!showTable);
  };

  // Helper function
  const findData = (items, data) => {
    return items.find((item) => item.product_id === data.product_id);
  };

  const fetchInventory = () => {
    axios
      .get(`${BASE_URL}/inventoryReport/getInventoryReport`, {
        params: {
          cutoff_fromdate: thisFromdate,
          cutoff_todate: thisTodate,
        },
      })
      .then((res) => {
        console.log("API Response:", res.data);

        const {
          beginningInventory,
          currentInventory,
          finalInventory,
          outInventory,
          inCalculation,
          outCalculation,
          previousInCalculation,
          previousOutCalculation,
        } = res.data;

        //Raw Materials
        const beginningRawMaterials = Array.isArray(beginningInventory)
          ? beginningInventory.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        const finalRawMaterials = Array.isArray(finalInventory)
          ? finalInventory.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        //Finish Product
        const beginningFinishProduct = Array.isArray(beginningInventory)
          ? beginningInventory.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const finalFinishProduct = Array.isArray(finalInventory)
          ? finalInventory.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        //Consumable
        const beginningConsumable = Array.isArray(beginningInventory)
          ? beginningInventory.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        const finalConsumable = Array.isArray(finalInventory)
          ? finalInventory.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        //Product In
        const rawMaterialsProductIn = Array.isArray(currentInventory)
          ? currentInventory.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];
        const rawMaterialsCalculateProductIn = Array.isArray(inCalculation)
          ? inCalculation.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        const rawMaterialsCalculatePreviousIn = Array.isArray(
          previousInCalculation
        )
          ? previousInCalculation.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        const finishProductIn = Array.isArray(currentInventory)
          ? currentInventory.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const finishCalculateProductIn = Array.isArray(inCalculation)
          ? inCalculation.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const finishCalculatePreviousIn = Array.isArray(previousInCalculation)
          ? previousInCalculation.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const consumableProductIn = Array.isArray(currentInventory)
          ? currentInventory.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        const consumableCalculateProductIn = Array.isArray(inCalculation)
          ? inCalculation.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        const consumableCalculatePreviousIn = Array.isArray(
          previousInCalculation
        )
          ? previousInCalculation.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        //Product Out
        const rawMaterialsProductOut = Array.isArray(outInventory)
          ? outInventory.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        const rawMaterialsCalculateProductOut = Array.isArray(outCalculation)
          ? outCalculation.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        const rawMaterialsCalculatePreviousOut = Array.isArray(
          previousOutCalculation
        )
          ? previousOutCalculation.filter(
              (item) => item.product_list?.product_category === "Raw Materials"
            )
          : [];

        // Product Out

        const finishProductOut = Array.isArray(outInventory)
          ? outInventory.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const finishCalculateProductOut = Array.isArray(outCalculation)
          ? outCalculation.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const finishCalculatePreviousOut = Array.isArray(previousOutCalculation)
          ? previousOutCalculation.filter(
              (item) => item.product_list?.product_category === "Finish Product"
            )
          : [];

        const consumableOut = Array.isArray(outInventory)
          ? outInventory.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        const consumableCalculateProductOut = Array.isArray(outCalculation)
          ? outCalculation.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        const consumableCalculatePreviousOut = Array.isArray(
          previousOutCalculation
        )
          ? previousOutCalculation.filter(
              (item) => item.product_list?.product_category === "Consumables"
            )
          : [];

        setBeginningRawMaterials(beginningRawMaterials);
        setCurrentRawInventory(rawMaterialsProductIn);
        setCurrentOut(rawMaterialsProductOut);
        setFinalRawMaterials(finalRawMaterials);

        setOutRawCalculation(rawMaterialsCalculateProductOut);
        setInRawCalculation(rawMaterialsCalculateProductIn);

        setPreviousOutRawCalculation(rawMaterialsCalculatePreviousOut);
        setPreviousInRawCalculation(rawMaterialsCalculatePreviousIn);

        setBeginningFinishProduct(beginningFinishProduct);
        setCurrentFinishInventory(finishProductIn);
        setCurrentFinishOut(finishProductOut);

        setFinalFinishProduct(finalFinishProduct);

        // Finished
        setOutFinishCalculation(finishCalculateProductOut);
        setInFinishCalculation(finishCalculateProductIn);

        setPreviousOutFinishCalculation(finishCalculatePreviousOut);
        setPreviousInFinishCalculation(finishCalculatePreviousIn);

        setRawMaterialsProductOut(finishProductOut);
        setFinalProductOut(finishProductOut);

        setConsumables(beginningConsumable);
        setFinalConsumable(finalConsumable);
        setCurrentConsumable(consumableProductIn);
        setConsumableOut(consumableOut);

        // Consumable

        setOutConsumableCalculation(consumableCalculateProductOut);
        setInConsumableCalculation(consumableCalculateProductIn);

        setPreviousOutConsumableCalculation(consumableCalculatePreviousOut);
        setPreviousInConsumableCalculation(consumableCalculatePreviousIn);

        // For Calculation
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  };

  useEffect(() => {
    if (thisFromdate && thisTodate) {
      fetchInventory();
    }
  }, [thisFromdate, thisTodate]);

  const getCutoff = async () => {
    await axios
      .get(`${BASE_URL}/cutoff/getCutoffs`)
      .then((res) => {
        const cutoffList_id = res.data[0].id;
        const cutoff_fromdate = res.data[0].from;
        const cutoff_todate = res.data[0].to;

        setCutoffList(res.data);
        setSelectedCutoff_id(cutoffList_id);
        setThisFromdate(cutoff_fromdate || "");
        setThisTodate(cutoff_todate || "");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    getCutoff();
  }, []);

  const handleCutoffChange = (value) => {
    console.log(value);
    setSelectedCutoff_id(value);
    const cutoff_fromdate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).from ||
      "";
    const cutoff_todate =
      cutoffList.find((cutoff) => String(cutoff.id) === String(value)).to || "";

    setThisFromdate(cutoff_fromdate);
    setThisTodate(cutoff_todate);
  };

  useEffect(() => {
    console.log("Begiin", beginningRawMaterials);
  }, [beginningRawMaterials]);

  //------------------------ Computation for Raw Product   ------------------------ //

  const totalBeginningStock = beginningRawMaterials.reduce((sum, data) => {
    const previousIn = findData(previousInRawCalculation, data);
    const previousOut = findData(previousOutRawCalculation, data);
    return (
      sum + (previousIn?.totalIn ?? 0) - Number(previousOut?.stockOut ?? 0)
    );
    // sum + (data.totalStock || 0)},
  }, 0);

  const totalBeginningPrice = beginningRawMaterials.reduce(
    (sum, data) => sum + (data.totalPrice || 0),
    0
  );

  const totalBeginningAmount = beginningRawMaterials.reduce(
    (sum, data) => {
      const previousIn = findData(previousInRawCalculation, data);
      const previousOut = findData(previousOutRawCalculation, data);
      return (
        sum +
        ((previousIn?.totalIn ?? 0) - Number(previousOut?.stockOut ?? 0)) *
          Number(data?.totalPrice ?? 0)
      );
    },
    0
    // sum + Number(data?.totalStock ?? 0) * Number(data?.totalPrice ?? 0), 0
  );

  const totalProductInStock = currentRawInventory.reduce(
    (sum, current) => sum + Number(current?.totalIn ?? 0),
    0
  );

  const totalProductInPrice = currentRawInventory.reduce(
    (sum, current) => sum + Number(current?.totalPriceIn ?? 0),
    0
  );

  const totalProductInAmount = currentRawInventory.reduce(
    (sum, current) =>
      sum + Number(current?.totalIn ?? 0) * Number(current?.totalPriceIn ?? 0),
    0
  );

  const totalStockOut = currentOut.reduce(
    (sum, out) => sum + Number(out?.stockOut ?? 0),
    0
  );

  const totalAveragePrice = currentOut.reduce(
    (sum, out) => sum + Number(out?.averagePrice ?? 0),
    0
  );

  const totalStockOutAmount = currentOut.reduce(
    (sum, out) =>
      sum + Number(out?.stockOut ?? 0) * Number(out?.averagePrice ?? 0),
    0
  );

  const totalFinalStock = finalRawMaterials.reduce(
    (sum, data) => {
      const outCalculation = findData(outRawCalculation, data);
      const inCalculation = findData(inRawCalculation, data);
      const previousIn = findData(previousInRawCalculation, data);
      const previousOut = findData(previousOutRawCalculation, data);

      return (
        sum +
        ((previousIn?.totalIn ?? 0) -
          Number(previousOut?.stockOut ?? 0) +
          (inCalculation?.totalIn ?? 0) -
          Number(outCalculation?.stockOut ?? 0))
      );
    },
    0
    // sum + (data.totalStock || 0), 0
  );

  const totalFinalPrice = finalRawMaterials.reduce(
    (sum, data) => sum + (data.totalPrice || 0),
    0
  );

  const totalFinalAmount = finalRawMaterials.reduce(
    (sum, data) => {
      const finalMaterial = findData(finalRawMaterials, data);
      const outCalculation = findData(outRawCalculation, data);
      const inCalculation = findData(inRawCalculation, data);
      const previousIn = findData(previousInRawCalculation, data);
      const previousOut = findData(previousOutRawCalculation, data);

      return (
        sum +
        ((previousIn?.totalIn ?? 0) -
          Number(previousOut?.stockOut ?? 0) +
          (inCalculation?.totalIn ?? 0) -
          Number(outCalculation?.stockOut ?? 0)) *
          Number(finalMaterial?.totalPrice ?? 0)
      );
    },
    0
    //   sum +
    //   Number(finalMaterial?.totalStock ?? 0) *
    //     Number(finalMaterial?.totalPrice ?? 0),
    // 0
  );

  //------------------------ Computation for Finish Product   ------------------------ //

  const totalBeginningFinishStock = beginningFinishProduct.reduce(
    (sum, data) => {
      const previousIn = findData(previousInFinishCalculation, data);
      const previousOut = findData(previousOutFinishCalculation, data);
      return (
        sum + (previousIn?.totalIn ?? 0) - Number(previousOut?.stockOut ?? 0)
      );
    },
    0
    // sum + (data.totalStock || 0), 0
  );

  const totalBeginningConsumableStock = consumables.reduce(
    (sum, data) => {
      const previousIn = findData(previousInConsumableCalculation, data);
      const previousOut = findData(previousOutConsumableCalculation, data);
      return (
        sum + (previousIn?.totalIn ?? 0) - Number(previousOut?.stockOut ?? 0)
      );
    },
    0
    // sum + (data.totalStock || 0), 0
  );

  const totalBeginningFinishPrice = beginningFinishProduct.reduce(
    (sum, data) => sum + (data.totalPrice || 0),
    0
  );

  const totalBeginningConsumablePrice = consumables.reduce(
    (sum, data) => sum + (data.totalPrice || 0),
    0
  );

  const totalBeginningFinishAmount = beginningFinishProduct.reduce(
    (sum, data) => {
      // const stock = Number(data?.totalStock ?? 0);
      // const price = Number(data?.totalPrice ?? 0);
      // return sum + stock * price;

      const previousIn = findData(previousInFinishCalculation, data);
      const previousOut = findData(previousOutFinishCalculation, data);
      return (
        sum +
        ((previousIn?.totalIn ?? 0) - Number(previousOut?.stockOut ?? 0)) *
          Number(data?.totalPrice ?? 0)
      );
    },
    0
  );
  //------------------------ Computation for Consumable Product   ------------------------ //

  const totalBeginningConsumableAmount = consumables.reduce((sum, data) => {
    // const stock = Number(data?.totalStock ?? 0);
    // const price = Number(data?.totalPrice ?? 0);
    // return sum + stock * price;
    const previousIn = findData(previousInConsumableCalculation, data);
    const previousOut = findData(previousOutConsumableCalculation, data);
    return (
      sum +
      ((previousIn?.totalIn ?? 0) - Number(previousOut?.stockOut ?? 0)) *
        Number(data?.totalPrice ?? 0)
    );
  }, 0);

  console.log("finish Product", finalFinishProduct);

  const totalFinalFinishStock = finalFinishProduct.reduce(
    (sum, data) => {
      const outCalculation = findData(outFinishCalculation, data);
      const inCalculation = findData(inFinishCalculation, data);
      const previousIn = findData(previousInFinishCalculation, data);
      const previousOut = findData(previousOutFinishCalculation, data);
      return (
        sum +
        ((previousIn?.totalIn ?? 0) -
          Number(previousOut?.stockOut ?? 0) +
          (inCalculation?.totalIn ?? 0) -
          Number(outCalculation?.stockOut ?? 0))
      );
    },
    0
    // sum + Number(item.totalStock ?? 0), 0
  );

  const totalFinalConsumableStock = finalConsumable.reduce(
    (sum, data) => {
      const outCalculation = findData(outConsumableCalculation, data);
      const inCalculation = findData(inConsumableCalculation, data);
      const previousIn = findData(previousInConsumableCalculation, data);
      const previousOut = findData(previousOutConsumableCalculation, data);
      return (
        sum +
        ((previousIn?.totalIn ?? 0) -
          Number(previousOut?.stockOut ?? 0) +
          (inCalculation?.totalIn ?? 0) -
          Number(outCalculation?.stockOut ?? 0))
      );
    },
    0
    // sum + Number(item.totalStock ?? 0), 0
  );

  const totalFinalFinishPrice = finalFinishProduct.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0
  );

  const totalFinalConsumablePrice = finalConsumable.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0
  );

  const totalFinalFinishAmount = finalFinishProduct.reduce(
    (sum, data) => {
      const finalProduct = findData(finalFinishProduct, data);
      const outCalculation = findData(outFinishCalculation, data);
      const inCalculation = findData(inFinishCalculation, data);
      const previousIn = findData(previousInFinishCalculation, data);
      const previousOut = findData(previousOutFinishCalculation, data);
      return (
        sum +
        ((previousIn?.totalIn ?? 0) -
          Number(previousOut?.stockOut ?? 0) +
          (inCalculation?.totalIn ?? 0) -
          Number(outCalculation?.stockOut ?? 0)) *
          Number(finalProduct?.totalPrice ?? 0)
      );
    },
    0
    // sum + Number(data.totalStock ?? 0) * Number(data.totalPrice ?? 0), 0
  );

  const totalFinalConsumableAmount = finalConsumable.reduce(
    (sum, data) => {
      const finalProduct = findData(finalConsumable, data);
      const outCalculation = findData(outConsumableCalculation, data);
      const inCalculation = findData(inConsumableCalculation, data);
      const previousIn = findData(previousInConsumableCalculation, data);
      const previousOut = findData(previousOutConsumableCalculation, data);

      return (
        sum +
        ((previousIn?.totalIn ?? 0) -
          Number(previousOut?.stockOut ?? 0) +
          (inCalculation?.totalIn ?? 0) -
          Number(outCalculation?.stockOut ?? 0)) *
          Number(finalProduct?.totalPrice ?? 0)
      );
    },
    0
    // sum + Number(data.totalStock ?? 0) * Number(data.totalPrice ?? 0), 0
  );

  const inventoryGrowthPercentage =
    totalBeginningStock !== 0
      ? ((totalFinalStock - totalBeginningStock) / totalBeginningStock) * 100
      : 0;

  const amountGrowthPercentage =
    totalBeginningAmount !== 0
      ? ((totalFinalAmount - totalBeginningAmount) / totalBeginningAmount) * 100
      : 0;

  const inventoryFinalGrowthPercentage =
    totalBeginningFinishStock !== 0
      ? ((totalFinalFinishStock - totalBeginningFinishStock) /
          totalBeginningFinishStock) *
        100
      : 0;

  const amountFinalGrowthPercentage =
    totalBeginningFinishAmount !== 0
      ? ((totalFinalFinishAmount - totalBeginningFinishAmount) /
          totalBeginningFinishAmount) *
        100
      : 0;

  const inventoryConsGrowthPercentage =
    totalBeginningConsumableStock !== 0
      ? ((totalFinalConsumableStock - totalBeginningConsumableStock) /
          totalBeginningConsumableStock) *
        100
      : 0;

  const amountConsGrowthPercentage =
    totalBeginningConsumableAmount !== 0
      ? ((totalFinalConsumableAmount - totalBeginningConsumableAmount) /
          totalBeginningConsumableAmount) *
        100
      : 0;

  const totalProductInFinishStock = currentFinishInventory.reduce(
    (sum, data) => sum + (data.totalIn || 0),
    0
  );

  const totalProductInConsumableStock = currentConsumable.reduce(
    (sum, data) => sum + (data.totalIn || 0),
    0
  );

  const totalProductInFinishPrice = currentFinishInventory.reduce(
    (sum, data) => sum + (data.totalPriceIn || 0),
    0
  );

  const totalProductInConsumablePrice = currentConsumable.reduce(
    (sum, data) => sum + (data.totalPriceIn || 0),
    0
  );

  const totalProductInFinishAmount = currentFinishInventory.reduce(
    (sum, data) => {
      const totalIn = Number(data.totalIn ?? 0);
      const totalPriceIn = Number(data.totalPriceIn ?? 0);
      return sum + totalIn * totalPriceIn;
    },
    0
  );

  const totalProductInConsumableAmount = currentConsumable.reduce(
    (sum, data) => {
      const totalIn = Number(data.totalIn ?? 0);
      const totalPriceIn = Number(data.totalPriceIn ?? 0);
      return sum + totalIn * totalPriceIn;
    },
    0
  );

  const totalStockOutFinish = finalProductOut.reduce(
    (sum, item) => sum + Number(item.stockOut ?? 0),
    0
  );

  const totalStockOutConsumable = consumableOut.reduce(
    (sum, item) => sum + Number(item.stockOut ?? 0),
    0
  );

  const totalAveragePriceFinish = finalProductOut.reduce(
    (sum, item) => sum + Number(item.averagePrice ?? 0),
    0
  );

  const totalAveragePriceConsumable = consumableOut.reduce(
    (sum, item) => sum + Number(item.averagePrice ?? 0),
    0
  );

  const totalOutFinishAmount = finalProductOut.reduce(
    (sum, item) =>
      sum + Number(item.stockOut ?? 0) * Number(item.averagePrice ?? 0),
    0
  );

  const totalOutConsumableAmount = consumableOut.reduce(
    (sum, item) =>
      sum + Number(item.stockOut ?? 0) * Number(item.averagePrice ?? 0),
    0
  );

  return (
    <div className="h-100 w-100 border bg-white custom-container">
      <>
        <div className="w-100 p-2 d-flex flex-row justify-content-between">
          <div className="d-flex flex-column title-custom">
            <span className="fs-3 text-uppercase">
              {module && id && module === "earnings" && (
                <Link
                  to={`/accounting/view-earnings/${id}`}
                  className="text-dark mx-2"
                >
                  <i class="fa-solid fa-arrow-left"></i>
                </Link>
              )}
              Inventory Report
            </span>
          </div>
          <div>
            {/* <button className="btn btn-primary">Post Cutoff</button> */}
          </div>
        </div>
        <div className="w-100 row mx-auto mt-2">
          <h6>Accounting Period</h6>
          <div className="col-sm mb-2">
            <span>Cutoff</span>
            <Form.Select
              value={selectedCutoff_id}
              onChange={(e) => handleCutoffChange(e.target.value)}
              className="form-select"
              onMouseDown={(e) => {
                if (cutoffList.length === 0) {
                  e.preventDefault();
                  swal({
                    icon: "warning",
                    title: "No Cutoff Found",
                    text: "No cutoff records found. Please create a cutoff first in Monthly Cutoff Module.",
                  });
                  return;
                }
              }}
            >
              {cutoffList.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-sm mb-2">
            <span>From</span>
            {/* <input
            value={thisFromdate}
            type="date"
            readOnly
            onChange={(e) => setThisFromdate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
            <DatePicker
              selected={thisFromdate}
              dateFormat="MMM/dd/yyyy"
              className="form-control"
              readOnly
            />
          </div>
          <div className="col-sm mb-2">
            <span>To</span>
            {/* <input
            value={thisTodate}
            type="date"
            readOnly
            onChange={(e) => setThisTodate(e.target.value)}
            name=""
            className="form-control"
            id=""
          /> */}
            <DatePicker
              selected={thisTodate}
              dateFormat="MMM/dd/yyyy"
              className="form-control"
              readOnly
            />
          </div>
          <div className="col-sm"></div>

          <div className="col-sm"></div>
        </div>
        <div className="w-100 container-fluid mt-2">
          <div className="d-flex justify-content-between align-items-center">
            <h5>Overview</h5>
            <button className="btn btn-primary" onClick={toggleTable}>
              {showTable ? "Hide Overview" : "Show Overview"}
            </button>
          </div>

          <CSSTransition
            in={showTable}
            timeout={300}
            classNames="slide"
            unmountOnExit
          >
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-striped">
                <thead className="thead-light">
                  <tr>
                    <th rowSpan="2">Inventory Type</th>
                    <th colSpan="3" className="text-center">
                      Final Inventory
                    </th>
                    <th colSpan="3" className="text-center">
                      Comparison to Previous Period
                    </th>
                    <th colSpan="2" className="text-center">
                      Final Inventory Growth Index
                    </th>
                  </tr>
                  <tr>
                    <th>Quantity</th>
                    <th>Avg. Price</th>
                    <th>Amount (₱)</th>
                    <th>Quantity</th>
                    <th>Avg. Price</th>
                    <th>Amount (₱)</th>
                    <th>Quantity (%)</th>
                    <th>Amount (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Raw Materials Inventory</td>
                    <td>
                      {" "}
                      {totalFinalStock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalFinalPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalFinalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningStock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {" "}
                      {totalBeginningAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td> {inventoryGrowthPercentage.toFixed(2)}%</td>
                    <td>{amountGrowthPercentage.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>Finished Product Inventory</td>
                    <td>
                      {totalFinalFinishStock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalFinalFinishPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalFinalFinishAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningFinishStock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningFinishPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningFinishAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{inventoryFinalGrowthPercentage.toFixed(2)}%</td>
                    <td>{amountFinalGrowthPercentage.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>Consumable Inventory</td>
                    <td>
                      {" "}
                      {totalFinalConsumableStock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalFinalConsumablePrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalFinalConsumableAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningConsumableStock.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningConsumablePrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {totalBeginningConsumableAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{inventoryConsGrowthPercentage.toFixed(2)}%</td>
                    <td>{amountConsGrowthPercentage.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CSSTransition>
        </div>

        <div className="container-fluid mt-2">
          <Tabs
            defaultActiveKey="rawMaterials"
            id="uncontrolled-tab-example"
            className="mb-3"
          >
            <Tab eventKey="rawMaterials" title="Raw Materials">
              <div className="container-fluid">
                <div className="row">
                  <div className="col-sm mb-3">
                    <div className="w-100 d-flex align-items-center mt-3 mb-3">
                      <h5>Raw Materials Inventory</h5>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="thead-light">
                          <tr>
                            <th rowSpan="2">Item Code</th>
                            <th rowSpan="2">Product Name</th>
                            <th colSpan="3" className="text-center">
                              Beginning Inventory
                            </th>
                            <th colSpan="3" className="text-center">
                              Product In
                            </th>
                            <th colSpan="3" className="text-center">
                              Product Out
                            </th>
                            <th colSpan="3" className="text-center">
                              Final Inventory
                            </th>
                          </tr>
                          <tr>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Data Rows */}

                          {beginningRawMaterials.map((data, index) => {
                            const finalMaterial = findData(
                              finalRawMaterials,
                              data
                            );
                            // finalRawMaterials[index];
                            const current = findData(currentRawInventory, data);
                            // currentRawInventory[index];
                            const out = findData(currentOut, data);
                            // currentOut[index];
                            const outCalculation = findData(
                              outRawCalculation,
                              data
                            );
                            // outRawCalculation[index];
                            const inCalculation = findData(
                              inRawCalculation,
                              data
                            );
                            // inRawCalculation[index];
                            const previousIn = findData(
                              previousInRawCalculation,
                              data
                            );
                            // previousInRawCalculation[index];
                            const previousOut = findData(
                              previousOutRawCalculation,
                              data
                            );
                            // previousOutRawCalculation[index];

                            return (
                              <tr key={index}>
                                {/* Item Code */}
                                <td>{data.product_list.product_code}</td>
                                {/* Item Product */}
                                <td>{data.product_list.product_name}</td>

                                {/* Beginning Inventory */}
                                {/* Begin Inventory Qty */}
                                <td>
                                  {/* {data.totalStock.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || 0} */}
                                  {/* Sampl */}
                                  {(
                                    (previousIn?.totalIn ?? 0) -
                                    Number(previousOut?.stockOut ?? 0)
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                {/* Begin Inventory Price */}
                                <td>
                                  {data.totalPrice.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || 0}
                                </td>
                                {/* Begin Inventory Amount */}
                                <td>
                                  {
                                    // Number(data?.totalStock ?? 0) *
                                    // Number(data?.totalPrice ?? 0)
                                    (
                                      ((previousIn?.totalIn ?? 0) -
                                        Number(previousOut?.stockOut ?? 0)) *
                                      Number(data?.totalPrice ?? 0)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  }
                                </td>
                                {/* Product In */}
                                {/* Product In Qty */}
                                <td>
                                  {(current?.totalIn ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                {/* Product In Price */}
                                <td>
                                  {(current?.totalPriceIn ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                {/* Product In Amount */}
                                <td>
                                  {(
                                    (current?.totalIn ?? 0) *
                                    (current?.totalPriceIn ?? 0)
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                {/* Product Out */}
                                {/* Product Qty Out */}
                                <td>
                                  {Number(out?.stockOut ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                {/* Product Out Price */}
                                <td>
                                  {Number(
                                    out?.averagePrice ?? 0
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                {/* Product Out Amount */}
                                <td>
                                  {(
                                    Number(out?.stockOut ?? 0) *
                                    Number(out?.averagePrice ?? 0)
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>

                                {/* Final Inventory Quantity */}
                                <td>
                                  {/* {finalMaterial
                                  ? finalMaterial.totalStock.toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    ) || "0"
                                  : "0"} */}
                                  {/* {(
                                  data.totalStock +
                                  (inCalculation?.totalIn ?? 0) -
                                  Number(outCalculation?.stockOut ?? 0)
                                ).toLocaleString("en-US", {
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2,
                                })} */}
                                  {(
                                    (previousIn?.totalIn ?? 0) -
                                    Number(previousOut?.stockOut ?? 0) +
                                    (inCalculation?.totalIn ?? 0) -
                                    Number(outCalculation?.stockOut ?? 0)
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                {/* Final Inventory Price */}
                                <td>
                                  {finalMaterial
                                    ? finalMaterial.totalPrice.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      ) || "0.00"
                                    : "0.00"}
                                </td>
                                {/* Final Inventory Amount */}
                                <td>
                                  {
                                    // Number(finalMaterial?.totalStock ?? 0) *
                                    // Number(finalMaterial?.totalPrice ?? 0)
                                    (
                                      ((previousIn?.totalIn ?? 0) -
                                        Number(previousOut?.stockOut ?? 0) +
                                        (inCalculation?.totalIn ?? 0) -
                                        Number(outCalculation?.stockOut ?? 0)) *
                                      Number(finalMaterial?.totalPrice ?? 0)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  }
                                </td>
                              </tr>
                            );
                          })}

                          {/* Total Row */}
                          <tr className="font-weight-bold table-primary">
                            <td colSpan="2" className="text-right fw-bold">
                              Total:
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningStock.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Product In Totals */}
                            <td className="text-success fw-bold">
                              {totalProductInStock.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalProductInPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalProductInAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Product Out Totals (Assumed as zero for now) */}
                            <td className="text-success fw-bold">
                              {totalStockOut.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalAveragePrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalStockOutAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Final Inventory Totals */}
                            <td className="text-success fw-bold">
                              {totalFinalStock.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalFinalPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalFinalAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab eventKey="finishProduct" title="Finished Product">
              <div className="container-fluid">
                <div className="row">
                  <div className="col-sm mb-3">
                    <div className="w-100 d-flex align-items-center mt-3 mb-3">
                      <h5>Finished Product Inventory</h5>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="thead-light">
                          <tr>
                            <th rowSpan="2">Item Code</th>
                            <th rowSpan="2">Product Name</th>
                            <th colSpan="3" className="text-center">
                              Beginning Inventory
                            </th>
                            <th colSpan="3" className="text-center">
                              Product In
                            </th>
                            <th colSpan="3" className="text-center">
                              Product Out
                            </th>
                            <th colSpan="3" className="text-center">
                              Final Inventory
                            </th>
                          </tr>
                          <tr>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {beginningFinishProduct.map((data, index) => {
                            const finalProduct = findData(
                              finalFinishProduct,
                              data
                            );
                            // finalFinishProduct[index];
                            const current = findData(
                              currentFinishInventory,
                              data
                            );
                            // currentFinishInventory[index];
                            const outFinish = findData(finalProductOut, data);
                            // finalProductOut[index];
                            const outCalculation = findData(
                              outFinishCalculation,
                              data
                            );
                            // outFinishCalculation[index];
                            const inCalculation = findData(
                              inFinishCalculation,
                              data
                            );
                            // inFinishCalculation[index];
                            const previousIn = findData(
                              previousInFinishCalculation,
                              data
                            );
                            // previousInFinishCalculation[index];
                            const previousOut = findData(
                              previousOutFinishCalculation,
                              data
                            );
                            // previousOutFinishCalculation[index];

                            return (
                              <tr key={index}>
                                <td>{data.product_list.product_code}</td>
                                <td>{data.product_list.product_name}</td>
                                <td>
                                  {/* {data.totalStock.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || 0} */}
                                  {(
                                    (previousIn?.totalIn ?? 0) -
                                    Number(previousOut?.stockOut ?? 0)
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {data.totalPrice.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || 0}
                                </td>
                                <td>
                                  {
                                    // (data?.totalStock ?? 0) *
                                    // (data?.totalPrice ?? 0)
                                    (
                                      ((previousIn?.totalIn ?? 0) -
                                        Number(previousOut?.stockOut ?? 0)) *
                                      Number(data?.totalPrice ?? 0)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  }
                                </td>
                                <td>
                                  {(current?.totalIn ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>
                                  {(current?.totalPriceIn ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>
                                  {(
                                    (current?.totalIn ?? 0) *
                                    (current?.totalPriceIn ?? 0)
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {Number(
                                    outFinish?.stockOut ?? 0
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>

                                <td>
                                  {Number(
                                    outFinish?.averagePrice ?? 0
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>

                                <td>
                                  {(
                                    Number(outFinish?.stockOut ?? 0) *
                                    Number(outFinish?.averagePrice ?? 0)
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {/* {finalProduct
                                  ? finalProduct.totalStock.toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    ) || "0"
                                  : "0"} */}

                                  {(
                                    (previousIn?.totalIn ?? 0) -
                                    Number(previousOut?.stockOut ?? 0) +
                                    (inCalculation?.totalIn ?? 0) -
                                    Number(outCalculation?.stockOut ?? 0)
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {finalProduct
                                    ? finalProduct.totalPrice.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      ) || "0"
                                    : "0"}
                                </td>
                                <td>
                                  {
                                    // Number(finalProduct?.totalStock ?? 0) *
                                    // Number(finalProduct?.totalPrice ?? 0)
                                    (
                                      ((previousIn?.totalIn ?? 0) -
                                        Number(previousOut?.stockOut ?? 0) +
                                        (inCalculation?.totalIn ?? 0) -
                                        Number(outCalculation?.stockOut ?? 0)) *
                                      Number(finalProduct?.totalPrice ?? 0)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  }
                                </td>
                              </tr>
                            );
                          })}

                          {/* Total Row for Finished Products */}
                          <tr className="font-weight-bold table-primary">
                            <td colSpan="2" className="text-right fw-bold">
                              Total:
                            </td>

                            {/* Beginning Inventory Totals */}
                            <td className="text-success fw-bold">
                              {totalBeginningFinishStock.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningFinishPrice.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningFinishAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>

                            {/* Product In Totals */}
                            <td className="text-success fw-bold">
                              {totalProductInFinishStock.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalProductInFinishPrice.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalProductInFinishAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>

                            {/* Product Out Totals (Assumed as zero for now) */}
                            <td className="text-success fw-bold">
                              {totalStockOutFinish.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalAveragePriceFinish.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            <td className="text-success fw-bold">
                              {totalOutFinishAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Final Inventory Totals */}
                            <td className="text-success fw-bold">
                              {totalFinalFinishStock.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalFinalFinishPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalFinalFinishAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab eventKey="consumables" title="Consumable">
              <div className="container-fluid">
                <div className="row">
                  <div className="col-sm mb-3">
                    <div className="w-100 d-flex align-items-center mt-3 mb-3">
                      <h5>Consumable Inventory</h5>
                      <hr className="flex-grow-1 mx-3" />
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="thead-light">
                          <tr>
                            <th rowSpan="2">Item Code</th>
                            <th rowSpan="2">Product Name</th>
                            <th colSpan="3" className="text-center">
                              Beginning Inventory
                            </th>
                            <th colSpan="3" className="text-center">
                              Product In
                            </th>
                            <th colSpan="3" className="text-center">
                              Product Out
                            </th>
                            <th colSpan="3" className="text-center">
                              Final Inventory
                            </th>
                          </tr>
                          <tr>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Amount (₱)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consumables.map((data, index) => {
                            const finalProduct = findData(
                              finalConsumable,
                              data
                            );
                            // finalConsumable[index];
                            const current = findData(currentConsumable, data);
                            // currentConsumable[index];
                            const outFinish = findData(consumableOut, data);
                            // consumableOut[index];
                            const outCalculation = findData(
                              outConsumableCalculation,
                              data
                            );
                            // outConsumableCalculation[index];
                            const inCalculation = findData(
                              inConsumableCalculation,
                              data
                            );
                            // inConsumableCalculation[index];
                            const previousIn = findData(
                              previousInConsumableCalculation,
                              data
                            );
                            // previousInConsumableCalculation[index];
                            const previousOut = findData(
                              previousOutConsumableCalculation,
                              data
                            );
                            // previousOutConsumableCalculation[index];

                            return (
                              <tr key={index}>
                                <td>{data.product_list.product_code}</td>
                                <td>{data.product_list.product_name}</td>
                                <td>
                                  {/* {data.totalStock.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || 0} */}
                                  {(
                                    (previousIn?.totalIn ?? 0) -
                                    Number(previousOut?.stockOut ?? 0)
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {data.totalPrice.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || 0}
                                </td>
                                <td>
                                  {
                                    // (data?.totalStock ?? 0) *
                                    // (data?.totalPrice ?? 0)
                                    (
                                      ((previousIn?.totalIn ?? 0) -
                                        Number(previousOut?.stockOut ?? 0)) *
                                      Number(data?.totalPrice ?? 0)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  }
                                </td>
                                <td>
                                  {(current?.totalIn ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>
                                  {(current?.totalPriceIn ?? 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td>
                                  {(
                                    (current?.totalIn ?? 0) *
                                    (current?.totalPriceIn ?? 0)
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {Number(
                                    outFinish?.stockOut ?? 0
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>

                                <td>
                                  {Number(
                                    outFinish?.averagePrice ?? 0
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>

                                <td>
                                  {(
                                    Number(outFinish?.stockOut ?? 0) *
                                    Number(outFinish?.averagePrice ?? 0)
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {/* {finalProduct
                                  ? finalProduct.totalStock.toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    ) || "0"
                                  : "0"} */}
                                  {(
                                    (previousIn?.totalIn ?? 0) -
                                    Number(previousOut?.stockOut ?? 0) +
                                    (inCalculation?.totalIn ?? 0) -
                                    Number(outCalculation?.stockOut ?? 0)
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {finalProduct
                                    ? finalProduct.totalPrice.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      ) || "0"
                                    : "0"}
                                </td>
                                <td>
                                  {
                                    // Number(finalProduct?.totalStock ?? 0) *
                                    // Number(finalProduct?.totalPrice ?? 0)
                                    (
                                      ((previousIn?.totalIn ?? 0) -
                                        Number(previousOut?.stockOut ?? 0) +
                                        (inCalculation?.totalIn ?? 0) -
                                        Number(outCalculation?.stockOut ?? 0)) *
                                      Number(finalProduct?.totalPrice ?? 0)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  }
                                </td>
                              </tr>
                            );
                          })}

                          {/* Total Row for Finished Products */}
                          <tr className="font-weight-bold table-primary">
                            <td colSpan="2" className="text-right fw-bold">
                              Total:
                            </td>

                            {/* Beginning Inventory Totals */}
                            <td className="text-success fw-bold">
                              {totalBeginningConsumableStock.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningConsumablePrice.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalBeginningConsumableAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>

                            {/* Product In Totals */}
                            <td className="text-success fw-bold">
                              {totalProductInConsumableStock.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalProductInConsumablePrice.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalProductInConsumableAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>

                            {/* Product Out Totals (Assumed as zero for now) */}
                            <td className="text-success fw-bold">
                              {totalStockOutConsumable.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-success fw-bold">
                              {totalAveragePriceConsumable.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>

                            <td className="text-success fw-bold">
                              {totalOutConsumableAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>

                            {/* Final Inventory Totals */}
                            <td className="text-success fw-bold">
                              {totalFinalConsumableStock.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalFinalConsumablePrice.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                            <td className="text-success fw-bold">
                              {totalFinalConsumableAmount.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </>
    </div>
  );
};

export default InventoryReport1;
