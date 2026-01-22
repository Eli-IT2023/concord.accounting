import { create } from "zustand";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
const useStore = create((set) => ({
  vendorId: "",
  vendorName: "",
  email: "",
  country: "",
  warehouseID: "",
  warehouseName: "",
  transaction_id: "",
  createdAt: "",
  isPaid: "",
  due_date: "",
  purchaseDate: "",
  containerNumber: "",
  pier: "",
  currencyId: "",
  currency_name: "",
  domestic_type: "",
  setDomestic_type: "",
  tracking_number: "",
  setTracking_number: "",
  currencyRate: "",
  netWeight: "",
  weighingFee: "",
  // total_to_pay: "",
  discountType: "",
  discountValue: "",
  status: "",
  approvedBy: "",
  createdBy: "",
  isCutoffPosted: false,
  dataProduct: [],
  dataOtherFees: [],
  removeDataProductIds: [],
  setDataProduct: (value) => set({ dataProduct: value }),
  removeDataProduct: (id) =>
    set((state) => ({
      dataProduct: state.dataProduct.filter((item) => item.id !== id),
      removeDataProductIds: [...state.removeDataProductIds, id],
    })),

  updateDataProduct: (id, field, value) =>
    set((state) => ({
      dataProduct: state.dataProduct.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    })),

  setVendorID: (value) => set({ vendorId: value }),
  setVendorName: (value) => set({ vendorName: value }),
  setEmail: (value) => set({ email: value }),
  setCountry: (value) => set({ country: value }),
  setWarehouseID: (value) => set({ warehouseID: value }),
  setTransaction_id: (value) => set({ transaction_id: value }),
  setCreatedAt: (value) => set({ createdAt: value }),
  setIsPaid: (value) => set({ isPaid: value }),
  setDue_date: (value) => set({ due_date: value }),
  setPurchaseDate: (value) => set({ purchaseDate: value }),
  setContainerNumber: (value) => set({ containerNumber: value }),
  setPier: (value) => set({ pier: value }),
  setCurrencyId: (value) => set({ currencyId: value }),
  setDomestic_type: (value) => set({ domestic_type: value }),
  setTracking_number: (value) => set({ tracking_number: value }),
  setNetWeight: (value) => set({ netWeight: value }),
  setWeighingFee: (value) => set({ weighingFee: value }),
  // setTotal_to_pay: (value) => set({ total_to_pay: value }),
  setDataProduct: (value) => set({ dataProduct: value }),
  setDataOtherFees: (value) => set({ dataOtherFees: value }),
  setDiscountValue: (value) => set({ discountValue: value }),
  setStatus: (value) => set({ vendorId: value }),
  setDiscountType: (value) => set({ discountValue: value }),
  setApprovedBy: (value) => set({ approvedBy: value }),
  setCreatedBy: (value) => set({ createdBy: value }),
  setCurrencyRate: (value) => set({ currencyRate: value }),
  fetchData: async (id) => {
    try {
      axios
        .get(BASE_URL + "/payable/getInfo", {
          params: {
            id,
          },
        })
        .then((res) => {
          // let totalPay = 0;
          // let totalPay_addFee = 0;
          // console.log(res.data);
          set({ vendorId: res.data.vendor_id });
          set({ vendorName: res.data.vendor.company_name });
          set({ email: res.data.vendor.company_email });
          set({ country: res.data.vendor.company_country });
          set({ warehouseID: res.data.warehouse_id });
          set({ warehouseName: res.data.warehouse.name });
          set({ transaction_id: res.data.transaction_id });
          set({ createdAt: res.data.createdAt });
          set({ isPaid: res.data.isPaid === false ? "Not Paid" : "Paid" });
          set({ due_date: res.data.due_date });
          set({ purchaseDate: res.data.purchaseDate });
          set({ containerNumber: res.data.container_number });
          set({ pier: res.data.pier });
          set({ currencyId: res.data.currencyId });
          set({ currency_name: res.data.currency.currency_name });
          set({ domestic_type: res.data.domestic_type });
          set({ tracking_number: res.data.tracking_number });
          set({ netWeight: res.data.net_weight });
          set({ weighingFee: res.data.weighing_fee });
          set({ discountValue: res.data.discount_value });
          set({ status: res.data.status });
          set({ isCutoffPosted: res.data.isCutoffPosted });
          set({ currencyRate: res.data.rate });
          set({
            discountType: res.data.isPercent_Discount === true ? "%" : "₱",
          });
          set({
            approvedBy: `${res.data.approved_masterlist?.fname || "TBA"} ${
              res.data.approved_masterlist?.mname || ""
            } ${res.data.approved_masterlist?.lname || ""}`,
          });
          set({
            createdBy: `${res.data.created_masterlist?.fname || ""} ${
              res.data.created_masterlist?.mname || ""
            } ${res.data.created_masterlist?.lname || ""}`,
          });
          // Map over the payable_products array inside res.data
          const products = res.data.payable_products.map((data1) => {
            // const total =
            //   parseFloat(data1.totalPrice) - parseFloat(data1.moisture);
            // if (!isNaN(total)) {
            //   totalPay += total;
            // }

            return data1; // Return each product for mapping
          });

          const otherFees = res.data.payable_other_fees.map((data1) => {
            // const fee = parseFloat(data1.fee_amount);
            // if (!isNaN(fee)) {
            //   totalPay_addFee += fee;
            // }
            return data1; // Return each fee for mapping
          });

          // console.log("Total PayFee:", totalPay_addFee); // This will log the final totalPay
          // console.log("Total Pay:", totalPay); // This will log the final totalPay
          // console.log("Total Pay ALL:", totalPay + totalPay_addFee);
          set({ dataProduct: products });
          set({ dataOtherFees: otherFees });
          // set({ total_to_pay: (totalPay + totalPay_addFee).toFixed(2) });
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },
}));

export default useStore;
