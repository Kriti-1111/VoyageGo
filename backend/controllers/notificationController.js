import Notification from "../models/Notification.js";

// GET /api/notifications — logged-in user's notifications (newest first, max 30)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("booking", "totalPrice startDate endDate");
    res.status(200).json(notifications);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/notifications/:id/read — mark a single notification as read
export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("markRead error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/notifications/read-all — mark all as read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true },
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("markAllRead error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
