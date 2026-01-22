const express = require("express");
const router = express.Router();
const CompanySettings = require("../db/models/company_settings.model");
const multer = require("multer");
const sharp = require("sharp");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create company settings
router.post("/create", upload.single("profile_picture"), async (req, res) => {
  try {
    const { name, sub_name, address, email, phone } = req.body;
    let profile_picture = req.file ? req.file.buffer : null;

    if (req.file) {
      console.log(
        `[IMAGE] Received "${req.file.originalname}" size: ${req.file.size} bytes`
      );
      // Compress and resize the image
      const compressedBuffer = await sharp(req.file.buffer)
        .resize({ width: 600, height: 600, fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      console.log(
        `[IMAGE] Compressed "${req.file.originalname}" size: ${compressedBuffer.length} bytes`
      );
      profile_picture = compressedBuffer;
    }

    const company = await CompanySettings.create({
      name,
      sub_name,
      address,
      email,
      phone,
      profile_picture,
    });

    res.status(201).json({ message: "Company settings created", company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update company settings
router.put(
  "/update/:id",
  upload.single("profile_picture"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, sub_name, address, email, phone } = req.body;
      const updateData = { name, sub_name, address, email, phone };

      if (req.file) {
        console.log(
          `[IMAGE] Received "${req.file.originalname}" size: ${req.file.size} bytes`
        );
        // Compress and resize the image
        const compressedBuffer = await sharp(req.file.buffer)
          .resize({ width: 600, height: 600, fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer();
        console.log(
          `[IMAGE] Compressed "${req.file.originalname}" size: ${compressedBuffer.length} bytes`
        );
        updateData.profile_picture = compressedBuffer;
      }

      const [updated] = await CompanySettings.update(updateData, {
        where: { id },
      });

      if (updated) {
        const updatedCompany = await CompanySettings.findByPk(id);
        res.json({
          message: "Company settings updated",
          company: updatedCompany,
        });
      } else {
        res.status(404).json({ message: "Company not found" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/get", async (req, res) => {
  try {
    const company = await CompanySettings.findOne({ order: [["id", "DESC"]] });
    if (!company) {
      return res.status(404).json({ message: "No company settings found" });
    }
    // No need to manually convert to base64, model getter handles it
    res.json({ company: company.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
