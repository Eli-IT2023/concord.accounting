import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../../assets/global/url";

function useCompanyProfile() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${BASE_URL}/company_profile/get`);
        setCompany(res.data.company);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, []);

  return { company, loading, error };
}

export default useCompanyProfile;