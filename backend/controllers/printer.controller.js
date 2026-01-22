// backend/controllers/printer.controller.js
// Using Node's built-in fetch (Node >= 18)
exports.getPrinters = async (req, res) => {
  try {
    // call the local print-agent
    const response = await fetch("http://localhost:9100/printers");

    // network or non-2xx will be handled below
    if (!response.ok) {
      const text = await response.text().catch(() => null);
      throw new Error(
        `Print agent returned ${response.status} ${response.statusText} ${
          text || ""
        }`
      );
    }

    const printers = await response.json();
    console.log("🖨️ Printers from local agent:", printers);

    return res.json(printers);
  } catch (err) {
    console.error("❌ Error fetching printers:", err);
    return res.status(500).json({
      error: "Failed to connect to local print agent",
      details: err.message,
    });
  }
};
