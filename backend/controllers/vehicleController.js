import Vehicle from "../models/Vehicle.js";

// GET /api/vehicles — public
export const getAllVehicles = async (req, res) => {
  try {
    // Populate drivers so admin dashboard can show driver count + names on cards
    const vehicles = await Vehicle.find()
      .populate("drivers", "name isAvailable isDriverVerified")
      .sort({ createdAt: -1 });
    res.status(200).json(vehicles);
  } catch (error) {
    console.error("getAllVehicles error:", error);
    res.status(500).json({ message: "Server error fetching vehicles." });
  }
};

// GET /api/vehicles/:id — public
export const getVehicleById = async (req, res) => {
  try {
    // Populate drivers only on single vehicle fetch (needed for booking page driver list)
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "drivers",
      "name email phone isAvailable isDriverVerified languages vehicleSpecialization",
    );
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("getVehicleById error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/vehicles — Admin/Owner
export const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("createVehicle error:", error);
    res.status(500).json({ message: "Server error creating vehicle." });
  }
};

// PUT/PATCH /api/vehicles/:id — Admin/Owner
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("updateVehicle error:", error);
    res.status(500).json({ message: "Server error updating vehicle." });
  }
};

// DELETE /api/vehicles/:id — Admin/Owner
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    res.status(200).json({ message: "Vehicle deleted." });
  } catch (error) {
    console.error("deleteVehicle error:", error);
    res.status(500).json({ message: "Server error deleting vehicle." });
  }
};

// PATCH /api/vehicles/:id/toggle — Admin: toggle isActive on/off
export const toggleVehicleActive = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("toggleVehicleActive error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/vehicles/:id/drivers — Admin: assign/remove drivers from vehicle
// Body: { driverIds: ["id1", "id2"] }  — replaces the entire drivers array
export const updateVehicleDrivers = async (req, res) => {
  try {
    const { driverIds } = req.body;
    if (!Array.isArray(driverIds)) {
      return res.status(400).json({ message: "driverIds must be an array." });
    }
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { drivers: driverIds },
      { new: true },
    ).populate("drivers", "name email isAvailable isDriverVerified");
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("updateVehicleDrivers error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
