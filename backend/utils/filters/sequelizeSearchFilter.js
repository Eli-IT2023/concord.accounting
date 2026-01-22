const { where, Op, fn, col, literal, STRING } = require("sequelize");
const sequelize = require("../../db/config/sequelize.config");

const opLike = (searchText) => ({
  [Op.like]: `%${searchText?.trim()?.toLowerCase()}%`,
});

// Generic LIKE Filter
const likeFilter = (text, field) => {
  return {
    [`$${field}$`]: opLike(text),
  };
};

// Convert the column value to CHAR then apply LIKE search
const castFilter = (text, field) => {
  return {
    [`$${field}$`]: sequelize.where(
      literal(`CAST (${field} AS CHAR)`),
      opLike(text)
    ),
  };
};

// Format Date to MMM/dd/yyyy then apply LIKE search
const dateFormatFilter = (text, field) => {
  return {
    [`$${field}$`]: sequelize.where(
      sequelize.fn("DATE_FORMAT", sequelize.col(field), "%b/%d/%Y"),
      opLike(text)
    ),
  };
};

// Format Date to MMM/dd/yyy, hh:mm am then apply LIKE search
const createdAtFilter = (text, field) => {
  return {
    [`$${field}$`]: sequelize.where(
      sequelize.fn("DATE_FORMAT", sequelize.col(field), "%b/%d/%Y, %h:%i %p"),
      opLike(text)
    ),
  };
};

// Concatenate two table column then apply LIKE search
const concatFilter = (text, column1, column2) => {
  return sequelize.where(
    fn("CONCAT", col(column1), literal("' - '"), col(column2)),
    opLike(text)
  );
};

// Concatenate two table column with separator then apply LIKE search
const dynamicConcatFilter = (text, column1, column2, separator) => {
  const normalizeText = (column) => fn("LOWER", fn("TRIM", col(column)));

  return sequelize.where(
    fn("CONCAT", normalizeText(column1), separator, normalizeText(column2)),
    opLike(text)
  );
};

module.exports = {
  opLike,
  likeFilter,
  castFilter,
  dateFormatFilter,
  createdAtFilter,
  concatFilter,
  dynamicConcatFilter,
};
