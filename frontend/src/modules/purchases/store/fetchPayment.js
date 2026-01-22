import { create } from "zustand";
import axios from "axios";
import BASE_URL from "../../../assets/global/url";
const useStore = create((set) => ({
  dataPayment: [],
  balanceBefore: "",
  balanceNow: "",
  setDataPayment: (value) => set({ dataPayment: value }),
  setBalanceBefore: (value) => set({ balanceBefore: value }),
  setBalanceNow: (value) => set({ balanceNow: value }),
  fetchDataPayment: async (id) => {
    try {
      axios
        .get(BASE_URL + "/payable_payment/getPaidInfo", {
          params: {
            id,
          },
        })
        .then((res) => {
          //   const data_payment = .map((data) => {
          //     return data; // Return each product for mapping
          //   });

          set({ dataPayment: res.data.payment_info });
          set({ balanceBefore: res.data.paymentBalanceBefore });
          set({ balanceNow: res.data.paymentBalanceNow });
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
