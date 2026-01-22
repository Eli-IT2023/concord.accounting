const TotalCard = ({ totalLabel, totalQuantity, totalCosting }) => {
  return (
    <div>
      <h6 className="text-secondary text-center">{totalLabel}</h6>
      <div className="d-flex gap-4 mt-2 text-white flex-row justify-content-evenly px-3 total-amount-container-production align-items-center rounded">
        <p className="mb-0">
          Total Quantity:{" "}
          <span>
            {totalQuantity.toLocaleString("en-US", {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}
          </span>
        </p>
        <p className="mb-0">
          Total Costing:{" "}
          <span>
            {totalCosting.toLocaleString("en-US", {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            })}
          </span>
        </p>
      </div>
    </div>
  );
};

export default TotalCard;
