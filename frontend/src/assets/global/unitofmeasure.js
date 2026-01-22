// const unit = ["L (Liters)", "KG (Kilogram)", "G (Gram)", "ML (Mililitre)", "OZ (Ounce)", "LBS (Pounds)", "Units (Units)"];
// const unit = ["KG (Kilogram)", "PC/s (Pieces)", "LTR/s (Liters)", "/BOX"]; MJC UOM
// const unit = ["KG (Kilogram)", "PC/s (Pieces)", "Set/s (Sets)"]; Suntech
const unit = ["KG (Kilogram)", "PC/s (Pieces)"];
const productUnits = unit.map((item) => {
  const matches = item.match(/^(.*?)\s+\(([^)]+)\)$/);
  const value = matches ? matches[2] : "";
  const label = matches ? matches[1] : item;
  return { value, label };
});

export default productUnits;
