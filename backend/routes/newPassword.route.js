const router = require("express").Router();
const { MasterList } = require("../db/models/associations");

router.route("/changePassword").post(async (req, res) => {
  const { password, email, userID } = req.body;

  try {
    // Log to debug input values
    console.log("Received values:", { email, userID });

    // Check if the user with the provided email and emp_id exists
    const user = await MasterList.findOne({
      where: {
        email: email,
        emp_id: userID,
      },
      logging: console.log, // Add logging for Sequelize query
    });

    // If no matching user is found, return a 404 error
    if (!user) {
      console.log("User not found with email:", email, "and emp_id:", userID); // Add logging
      return res.status(404).json({ message: "User not found" });
    }

    // Log that the user was found
    console.log("User found:", user);

    // If the user exists, update the password
    const [isUpdate] = await MasterList.update(
      { password: password },
      { where: { email: email, emp_id: userID }, logging: console.log } // Add logging
    );

    // Log the update result
    console.log("Password update result:", isUpdate);

    // If the password was updated
    if (isUpdate) {
      return res.status(200).json({ message: "Password updated successfully" });
    } else {
      return res.status(500).json({ message: "Failed to update password" });
    }
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
