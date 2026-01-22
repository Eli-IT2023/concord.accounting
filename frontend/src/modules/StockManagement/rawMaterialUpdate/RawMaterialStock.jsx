import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
import DataTable from "react-data-table-component";
import { customStyles } from "../../styles/table-style";
import Nav from "react-bootstrap/Nav";

function RawMaterialStock() {
  const { id } = useParams();
  const [stockManagement, setStockManagement] = useState([]);
  const [inboundData, setInboundData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [stockManagementId, setStockManagementId] = useState("");
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/stockManagement/getStockManagementUpdate`, {
        params: { stockManagementId: id },
      })
      .then((res) => {
        setStockManagementId(res.data.stock_management_id);
        setProductName(res.data.product_list.product_name);
        setProductId(res.data.product_list.product_code);
        setProductCategory(res.data.product_list.product_category);
      })
      .catch((error) => {
        console.error("Error fetching customer details: ", error);
      });
  }, [id]);

  const reloadTable = () => {
    axios
      .get(`${BASE_URL}/stockManagement/getStockManagementProductTagVendor`, {
        params: {
          stockManagementId: stockManagementId,
        },
      })
      .then((res) => {
        const sortedStockList = res.data.sort(
          (a, b) =>
            b.stock_management_product_tag_vendor_id -
            a.stock_management_product_tag_vendor_id
        );
        setInboundData(sortedStockList);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    reloadTable(stockManagementId);
  }, [stockManagementId]);

  const columns = [
    {
      name: "Vendor",
      selector: (row) => row.vendor,
    },
    {
      name: "Quantity",
      selector: (row) => row.quantity,
    },
    {
      name: "Unit Price",
      selector: (row) => row.unitPrice,
    },
    {
      name: "Total Value",
      selector: (row) => row.totalValue,
    },
  ];

  const userData = inboundData.map((data, i) => ({
    key: i,
    stockManagementId: data.stock_management_product_tag_vendor_id,
    vendor: data.vendor.company_name,
    quantity: data.quantity,
    unitPrice: data.price,
    totalValue: data.quantity * data.price,
  }));

  return (
    <div>
      <DataTable
        columns={columns}
        data={userData}
        pagination
        customStyles={customStyles}
      />
    </div>
  );
}

export default RawMaterialStock;
