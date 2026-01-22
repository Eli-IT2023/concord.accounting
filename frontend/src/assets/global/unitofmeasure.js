// const unit = ["L (Liters)", "KG (Kilogram)", "G (Gram)", "ML (Mililitre)", "OZ (Ounce)", "LBS (Pounds)", "Units (Units)"];
const unit = ["KG (Kilogram)", "Units (Units)"];

const productUnits = unit.map((item) => {
  const matches = item.match(/^(.*?)\s+\(([^)]+)\)$/);
  const value = matches ? matches[2] : "";
  const label = matches ? matches[1] : item;
  return { value, label };
});

export default productUnits;
