const axios = require("axios");
require("dotenv").config();

const PRINTNODE_API_KEY = process.env.PRINTNODE_API_KEY;

async function printWithPrintNode(printerId, title, pdfUrl) {
  try {
    const response = await axios.post(
      "https://api.printnode.com/printjobs",
      {
        printerId,
        title,
        contentType: "pdf_uri",
        content: pdfUrl,
        source: "My Web App",
      },
      {
        auth: {
          username: PRINTNODE_API_KEY,
          password: "", // API key as username
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error sending print job:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { printWithPrintNode };
