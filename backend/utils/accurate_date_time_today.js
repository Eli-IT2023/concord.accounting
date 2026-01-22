const ntpClient = require("ntp-client");

/**
 * Try getting NTP time from a single server
 * Returns a Promise.
 */
const getTimeFromServer = (server) => {
  return new Promise((resolve, reject) => {
    ntpClient.getNetworkTime(server, 123, (err, date) => {
      if (err) {
        reject(err);
      } else {
        const formatted = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours()
        ).padStart(2, "0")}:${String(date.getMinutes()).padStart(
          2,
          "0"
        )}:${String(date.getSeconds()).padStart(2, "0")}`;
        resolve(formatted);
      }
    });
  });
};

/**
 * Tries multiple NTP servers in order until one succeeds.
 */
const getFormattedDateFromNTP = async () => {
  const servers = [
    "time.google.com",
    "time.windows.com",
    "pool.ntp.org",
    "time.nist.gov",
  ];

  let lastError;
  for (const server of servers) {
    try {
      console.log(`Trying NTP server: ${server}`);
      const date = await getTimeFromServer(server);
      console.log(`Got time from ${server}: ${date}`);
      return date;
    } catch (err) {
      console.warn(`Failed to get time from ${server}: ${err.message}`);
      lastError = err;
    }
  }
  throw new Error(`All NTP servers failed: ${lastError.message}`);
};

module.exports = getFormattedDateFromNTP;
