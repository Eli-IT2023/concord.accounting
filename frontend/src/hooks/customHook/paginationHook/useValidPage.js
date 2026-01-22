import { useSearchParams } from "react-router-dom";

export const useValidPage = (totalPages) => {
  const [searchParams] = useSearchParams();

  const paramsPage = parseInt(searchParams.get("page") || "1", 10);

  if (paramsPage > totalPages) {
    return totalPages;
  }

  if (paramsPage < 1) {
    return 1;
  }

  return paramsPage;
};
