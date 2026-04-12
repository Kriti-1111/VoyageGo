import User from "../models/User.js";

// POST /api/users/documents - Online Customer Upload
export const uploadOnlineDocuments = async (req, res) => {
  try {
    const { citizenshipFront, citizenshipBack, license } = req.body;
    
    // We expect the user to be injected by auth middleware
    const userId = req.user.id; // from jwt token decoded.id
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate we have the required docs
    if (!citizenshipFront || !citizenshipBack) {
      return res.status(400).json({ message: "Citizenship Front and Back are required." });
    }

    if (user.role === "DRIVER" && !license) {
      return res.status(400).json({ message: "Driver's license is required for drivers." });
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
        }
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Documents uploaded successfully", user: updatedUser });
  } catch (error) {
    console.error("uploadOnlineDocuments error:", error);
    res.status(500).json({ message: "Server error uploading documents." });
  }
};

// POST /api/users/documents/walkin - In-Person Staff Verification
export const verifyWalkInDocuments = async (req, res) => {
  try {
    const { customerId, citizenshipFront, citizenshipBack, license } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }
    
    // Validate we have the required docs
    if (!citizenshipFront || !citizenshipBack) {
      return res.status(400).json({ message: "Citizenship Front and Back are required." });
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
        }
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Walk-in documents verified immediately", user: updatedUser });
  } catch (error) {
    console.error("verifyWalkInDocuments error:", error);
    res.status(500).json({ message: "Server error verifying walk-in documents." });
  }
};

// GET /api/users/documents/pending - Admin Fetch Pending Documents
export const getPendingDocuments = async (req, res) => {
  try {
    const users = await User.find({ "documents.status": "PendingReview" })
      .select("-password")
      .sort({ createdAt: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("getPendingDocuments error:", error);
    res.status(500).json({ message: "Server error fetching pending documents." });
  }
};

// PATCH /api/users/:id/documents/review - Admin Review Documents
export const reviewDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const newStatus = action === "approve" ? "Verified" : "Rejected";
    const rejectionReason = action === "reject" ? (reason || "Your documents were rejected.") : "";

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "documents.status": newStatus,
          "documents.rejectionReason": rejectionReason,
        }
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: `Documents ${newStatus.toLowerCase()}`, user });
  } catch (error) {
    console.error("reviewDocuments error:", error);
    res.status(500).json({ message: "Server error reviewing documents." });
  }
};
