import Booking from "../models/Booking.js";

//Get all condition reports
export const getAllConditionReports = async (req, res) => {
  try {
    // Find bookings that have either a pre-trip or post-trip report submitted
    const bookings = await Booking.find({
      $or: [
        { "preTrip.submittedAt": { $exists: true, $ne: null } },
        { "postTrip.submittedAt": { $exists: true, $ne: null } },
      ],
    })
      .populate("customer", "name email phone")
      .populate("vehicle", "name plateNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("getAllConditionReports:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Review condition report
export const reviewConditionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed, damageFlagged, damageFlaggedBy, damageNote } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking/Report not found." });
    }

    if (reviewed !== undefined) booking.conditionReportReviewed = reviewed;
    if (damageFlagged !== undefined) {
      booking.damageFlagged = damageFlagged;
    }
    if (damageFlaggedBy !== undefined)
      booking.damageFlaggedBy = damageFlaggedBy;
    if (damageNote !== undefined) booking.damageNote = damageNote;

    await booking.save();

    const updated = await Booking.findById(id)
      .populate("customer", "name email phone")
      .populate("vehicle", "name plateNumber");

    res.status(200).json(updated);
  } catch (error) {
    console.error("reviewConditionReport:", error);
    res.status(500).json({ message: "Server error." });
  }
};
