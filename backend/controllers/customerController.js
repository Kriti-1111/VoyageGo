import User from "../models/User.js";

// Returns all users with role CUSTOMER
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "CUSTOMER" })
      .select("name email phone permanentAddress temporaryAddress createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json(customers);
  } catch (error) {
    console.error("getAllCustomers:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: "CUSTOMER",
    }).select("name email phone permanentAddress temporaryAddress createdAt");

    if (!customer)
      return res.status(404).json({ message: "Customer not found." });

    res.status(200).json(customer);
  } catch (error) {
    console.error("getCustomerById:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findOneAndDelete({
      _id: req.params.id,
      role: "CUSTOMER",
    });
    if (!customer)
      return res.status(404).json({ message: "Customer not found." });
    res.status(200).json({ message: "Customer deleted successfully." });
  } catch (error) {
    console.error("deleteCustomer:", error);
    res.status(500).json({ message: "Server error." });
  }
};
