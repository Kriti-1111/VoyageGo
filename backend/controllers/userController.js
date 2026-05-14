import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const uploadOnlineDocuments = async (req, res) => {
  try {
    const { citizenshipFront, citizenshipBack, license } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!citizenshipFront || !citizenshipBack) {
      return res
        .status(400)
        .json({ message: "Citizenship Front and Back are required." });
    }

    if (user.role === "DRIVER" && !license) {
      return res
        .status(400)
        .json({ message: "Driver's license is required for drivers." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "documents.status": "PendingReview",
          "documents.verificationMethod": "Online",
          "documents.citizenshipFront": citizenshipFront,
          "documents.citizenshipBack": citizenshipBack,
          "documents.license": license || "",
          "documents.rejectionReason": "",
        },
      },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Documents uploaded successfully", user: updatedUser });
  } catch (error) {
    console.error("uploadOnlineDocuments error:", error);
    res.status(500).json({ message: "Server error uploading documents." });
  }
};

//In Person Staff Verification
export const verifyWalkInDocuments = async (req, res) => {
  try {
    const { customerId, citizenshipFront, citizenshipBack, license } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }

    if (!citizenshipFront || !citizenshipBack) {
      return res
        .status(400)
        .json({ message: "Citizenship Front and Back are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      customerId,
      {
        $set: {
          "documents.status": "Verified",
          "documents.verificationMethod": "InPerson",
          "documents.citizenshipFront": citizenshipFront,
          "documents.citizenshipBack": citizenshipBack,
          "documents.license": license || "",
          "documents.rejectionReason": "",
        },
      },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await Notification.create({
        recipient: customerId,
        type: "PAYMENT_SUCCESS",
        title: "Documents verified",
        message:
          "Your identity documents have been verified in person by our staff. Your account is now fully verified.",
      });
    } catch (e) {
      console.error("Notification error (verifyWalkIn):", e.message);
    }

    res.status(200).json({
      message: "Walk-in documents verified immediately",
      user: updatedUser,
    });
  } catch (error) {
    console.error("verifyWalkInDocuments error:", error);
    res
      .status(500)
      .json({ message: "Server error verifying walk-in documents." });
  }
};

//Admin Fetch Pending Documents
export const getPendingDocuments = async (req, res) => {
  try {
    const users = await User.find({ "documents.status": "PendingReview" })
      .select("-password")
      .sort({ createdAt: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("getPendingDocuments error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching pending documents." });
  }
};

//Admin Review Documents
export const reviewDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const newStatus = action === "approve" ? "Verified" : "Rejected";
    const rejectionReason =
      action === "reject" ? reason || "Your documents were rejected." : "";

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "documents.status": newStatus,
          "documents.rejectionReason": rejectionReason,
        },
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    //Notify customer: approval or rejection
    try {
      if (action === "approve") {
        await Notification.create({
          recipient: id,
          type: "PAYMENT_SUCCESS",
          title: "Documents approved",
          message:
            "Your submitted documents have been reviewed and approved. Your account is now fully verified.",
        });
      } else {
        await Notification.create({
          recipient: id,
          type: "BOOKING_CANCELLED",
          title: "Documents rejected",
          message: `Your documents were not accepted. Reason: ${rejectionReason} Please resubmit corrected documents.`,
        });
      }
    } catch (e) {
      console.error("Notification error (reviewDocuments):", e.message);
    }

    res
      .status(200)
      .json({ message: `Documents ${newStatus.toLowerCase()}`, user });
  } catch (error) {
    console.error("reviewDocuments error:", error);
    res.status(500).json({ message: "Server error reviewing documents." });
  }
};
