const express = require("express");
const router = express.Router();
const RBAC = require("../db/models/rbac.model");

// Add RBAC role
router.post("/addRbac", async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log the incoming data
    const { roleName, roleDescription, permissions } = req.body;

    // Check if the role_name already exists
    const isExist = await RBAC.findOne({
      where: {
        role_name: roleName,
      },
    });

    if (isExist) {
      // If the role already exists, return a status of 201 (conflict)
      res.status(201).json({
        message: "Role already exists.",
      });
    } else {
      // Ensure that permissions is an array and convert to a string format
      if (!Array.isArray(permissions)) {
        return res
          .status(400)
          .json({ message: "Permissions must be an array." });
      }

      // Create a comma-separated string from the permissions array
      const permissionsString = permissions.join(", "); // Join the array elements with a comma and space

      // Create a new RBAC entry
      const rbac = await RBAC.create({
        role_name: roleName,
        description: roleDescription,
        permission: permissionsString, // Use the new comma-separated string
      });

      if (rbac) {
        res.status(200).json({
          message: "RBAC entry created successfully.",
          data: rbac,
        });
      }
    }
  } catch (error) {
    console.error(error); // Log the error
    res.status(500).json({
      message: "There was an error adding the RBAC entry.",
      error: error.message,
    });
  }
});

module.exports = router;
