const dateTimeFormat = (dateTime) => {
  return new Date(dateTime)
    .toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/,([^,]*)$/, " -$1");
};

export default dateTimeFormat;
