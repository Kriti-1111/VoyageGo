import User from "../models/User.js";

//GET ALL DRIVERS
export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: "DRIVER" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//GET DRIVER PROFILE
export const getDriverProfile = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select("-password");
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//UPDATE DRIVER AVAILABILITY
export const updateAvailability = async (req, res) => {
  const { isAvailable } = req.body;
  if (typeof isAvailable !== "boolean") {
    return res.status(400).json({ message: "isAvailable must be a boolean" });
  }
  try {
    const driver = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true },
    ).select("isAvailable");
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//VERIFY / UNVERIFY DRIVER (Admin only)
export const verifyDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDriverVerified } = req.body;

    if (typeof isDriverVerified !== "boolean") {
      return res
        .status(400)
        .json({ message: "isDriverVerified must be a boolean" });
    }

    const driver = await User.findOne({ _id: id, role: "DRIVER" });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (isDriverVerified) {
      if (
        !driver.documents?.license ||
        driver.documents?.status === "NotSubmitted"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Driver must submit their license document before verification.",
          });
      }
      driver.documents.status = "Verified";
    }

    driver.isDriverVerified = isDriverVerified;
    await driver.save();

    res.json({
      message: isDriverVerified
        ? "Driver verified successfully."
        : "Driver verification revoked.",
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        isDriverVerified: driver.isDriverVerified,
      },
    });
  } catch (error) {
    console.error("verifyDriver error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//UPDATE DRIVER (Admin only)
export const updateDriverAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverRatePerHour, district } = req.body;

    const updates = {};
    if (driverRatePerHour !== undefined)
      updates.driverRatePerHour = Number(driverRatePerHour);
    if (district !== undefined) updates.district = district;

    const driver = await User.findOneAndUpdate(
      { _id: id, role: "DRIVER" },
      updates,
      { new: true },
    );

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver updated successfully.", driver });
  } catch (error) {
    console.error("updateDriverAdmin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//UPDATE DRIVER PROFILE
export const updateDriverProfile = async (req, res) => {
  try {
    const { profilePhoto } = req.body;
    const driver = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto },
      { new: true },
    ).select("-password");

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.json({ message: "Profile updated successfully.", driver });
  } catch (error) {
    console.error("updateDriverProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//RATE DRIVER
export const rateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5." });
    }

    const driver = await User.findById(id);
    if (!driver || driver.role !== "DRIVER") {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.totalRating += Number(rating);
    driver.ratingCount += 1;
    await driver.save();

    res.json({ message: "Rating submitted successfully.", driver });
  } catch (error) {
    console.error("rateDriver error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
