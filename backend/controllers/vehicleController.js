import Vehicle from '../models/Vehicle.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET all vehicles (public - no auth required for browsing)
// GET /api/vehicles
// ─────────────────────────────────────────────────────────────────────────────
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('assignedDriver', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json(vehicles);
  } catch (error) {
    console.error('getAllVehicles error:', error);
    res.status(500).json({ message: 'Server error fetching vehicles.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET single vehicle by ID
// GET /api/vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver', 'name email phone');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error('getVehicleById error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Create a new vehicle
// POST /api/vehicles
// ─────────────────────────────────────────────────────────────────────────────
export const createVehicle = async (req, res) => {
  try {
    const {
      name,
      type,
      model,
      company,
      fuelType,
      passengerSeat,
      plateNumber,
      pricePerHour,
      imageUrl,
      description,
      assignedDriver,
    } = req.body;

    // Validate required fields
    if (!name || !type || !model || !company || !fuelType || !passengerSeat || !plateNumber || !pricePerHour) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Check if plate number already exists
    const existing = await Vehicle.findOne({ plateNumber });
    if (existing) {
      return res.status(409).json({ message: 'A vehicle with this plate number already exists.' });
    }

    const vehicle = await Vehicle.create({
      name,
      type,
      model,
      company,
      fuelType,
      passengerSeat,
      plateNumber,
      pricePerHour,
      imageUrl: imageUrl || '',
      description: description || '',
      assignedDriver: assignedDriver || null,
      isActive: true,
    });

    const populated = await Vehicle.findById(vehicle._id)
      .populate('assignedDriver', 'name email phone');

    res.status(201).json(populated);
  } catch (error) {
    console.error('createVehicle error:', error);
    res.status(500).json({ message: 'Server error creating vehicle.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Update a vehicle
// PUT /api/vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    // If updating plate number, check uniqueness
    if (req.body.plateNumber && req.body.plateNumber !== vehicle.plateNumber) {
      const existing = await Vehicle.findOne({ plateNumber: req.body.plateNumber });
      if (existing) {
        return res.status(409).json({ message: 'A vehicle with this plate number already exists.' });
      }
    }

    // Update
    const updated = await Vehicle.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignedDriver', 'name email phone');

    res.status(200).json(updated);
  } catch (error) {
    console.error('updateVehicle error:', error);
    res.status(500).json({ message: 'Server error updating vehicle.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Delete a vehicle
// DELETE /api/vehicles/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.status(200).json({ message: 'Vehicle deleted successfully.' });
  } catch (error) {
    console.error('deleteVehicle error:', error);
    res.status(500).json({ message: 'Server error deleting vehicle.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Toggle vehicle availability (activate/deactivate)
// PATCH /api/vehicles/:id/toggle-active
// ─────────────────────────────────────────────────────────────────────────────
export const toggleVehicleActive = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();

    res.status(200).json({
      message: `Vehicle ${vehicle.isActive ? 'activated' : 'deactivated'} successfully.`,
      vehicle,
    });
  } catch (error) {
    console.error('toggleVehicleActive error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
