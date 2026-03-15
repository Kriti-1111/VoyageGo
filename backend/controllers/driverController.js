// backend/controllers/driverController.js
import User from '../models/User.js';

// ================= GET DRIVER PROFILE =================
export const getDriverProfile = async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select(
      'id name email role isDriverVerified'
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE DRIVER AVAILABILITY =================
export const updateAvailability = async (req, res) => {
  const { isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({ message: 'isAvailable must be a boolean' });
  }

  try {
    const driver = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true }
    ).select('isAvailable');

    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};