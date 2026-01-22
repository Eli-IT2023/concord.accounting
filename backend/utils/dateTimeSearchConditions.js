const { Sequelize, Op } = require("sequelize");

const isTimeSearchable = (text) => {
  return /(\d|am|pm|:|[a-z]{1,})/i.test(text);
};

const createDateTimeSearchConditions = (
  tableAlias,
  text,
  column = "createdAt"
) => {
  if (!isTimeSearchable(text)) return [];

  const normalizedText = text
    .trim()
    .toUpperCase()
    .replace(/(\d)(AM|PM)/i, "$1 $2")
    .replace(/-/g, " - ")
    .replace(/\s+/g, " ");

  // Pattern detection for "Jun 30, 2025" and similar formats
  const monthDayYearMatch = normalizedText.match(
    /^([A-Z]{3,})\s(\d{1,2})(?:,\s(\d{4}))?$/
  );
  const isMonthDayYear = monthDayYearMatch && monthDayYearMatch[1].length >= 3;

  return [
    // 1. Exact match for "Jun 30, 2025" format (abbreviated month with year)
    ...(isMonthDayYear && monthDayYearMatch[3]
      ? [
          Sequelize.where(
            Sequelize.literal(
              `DATE_FORMAT(\`${tableAlias}\`.\`${column}\`, '%b %d, %Y') = '${monthDayYearMatch[1].substring(
                0,
                3
              )} ${monthDayYearMatch[2]}, ${monthDayYearMatch[3]}'`
            )
          ),
        ]
      : []),

    // 2. Partial match for "Jun 30" (without year)
    ...(isMonthDayYear && !monthDayYearMatch[3]
      ? [
          Sequelize.where(
            Sequelize.literal(
              `DATE_FORMAT(\`${tableAlias}\`.\`${column}\`, '%b %d') LIKE '%${monthDayYearMatch[1].substring(
                0,
                3
              )}%${monthDayYearMatch[2]}%'`
            )
          ),
        ]
      : []),

    // Month prefix search ("J", "JU", etc.)
    ...(normalizedText.match(/^[A-Z]{1,3}$/)
      ? [
          Sequelize.where(
            Sequelize.literal(
              `(DATE_FORMAT(\`${tableAlias}\`.\`${column}\`, '%M') LIKE '${normalizedText}%' OR 
               DATE_FORMAT(\`${tableAlias}\`.\`${column}\`, '%b') LIKE '${normalizedText.substring(
                0,
                3
              )}%')`
            )
          ),
        ]
      : []),

    // Month-day search ("JUNE 3")
    ...(normalizedText.match(/^[A-Z]{3,}\s\d{1,2}$/)
      ? [
          Sequelize.where(
            Sequelize.literal(
              `DATE_FORMAT(\`${tableAlias}\`.\`${column}\`, '%M %d') LIKE '%${normalizedText.replace(
                /\s+/g,
                "%"
              )}%'`
            )
          ),
        ]
      : []),

    // Full format conditions
    Sequelize.where(
      Sequelize.fn(
        "DATE_FORMAT",
        Sequelize.col(`${tableAlias}.${column}`),
        "%b %d, %Y - %h:%i %p"
      ),
      {
        [Op.like]: Sequelize.literal(
          `'%${normalizedText.replace(/'/g, "''")}%'`
        ),
      }
    ),
    Sequelize.where(
      Sequelize.fn(
        "DATE_FORMAT",
        Sequelize.col(`${tableAlias}.${column}`),
        "%M %d, %Y - %h:%i %p"
      ),
      {
        [Op.like]: Sequelize.literal(
          `'%${normalizedText.replace(/'/g, "''")}%'`
        ),
      }
    ),
    Sequelize.where(
      Sequelize.fn(
        "DATE_FORMAT",
        Sequelize.col(`${tableAlias}.${column}`),
        "%M %d, %Y"
      ),
      { [Op.like]: `%${normalizedText.split("-")[0].trim()}%` }
    ),

    // Time-only searches
    ...(/^[\d:]+(?:\s?[AP]M)?$/i.test(normalizedText)
      ? [
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col(`${tableAlias}.${column}`),
              "%h:%i %p"
            ),
            { [Op.like]: `%${normalizedText}%` }
          ),
          Sequelize.where(
            Sequelize.fn(
              "DATE_FORMAT",
              Sequelize.col(`${tableAlias}.${column}`),
              "%H:%i"
            ),
            { [Op.like]: `%${normalizedText.replace(/[^0-9:]/g, "")}%` }
          ),
        ]
      : []),
  ];
};

module.exports = {
  createDateTimeSearchConditions,
  isTimeSearchable,
};
