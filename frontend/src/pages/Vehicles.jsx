import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaTimes, FaPlus, FaCar, FaGasPump, FaUsers, FaDollarSign, FaCalendarAlt } from "react-icons/fa";
import Footer from "../components/Footer";

const VehicleCard = ({ vehicle, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg w-2xs transition-shadow duration-300 border border-gray-100 flex flex-col h-full transition-all hover:-translate-y-1">
      <div className="relative">
        {vehicle.imageUrl ? (
          <div className="w-full h-52 overflow-hidden">
            <img
              src={`http://localhost:4000/${vehicle.imageUrl}`}
              alt={vehicle.vehicleName}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                e.target.src = '/placeholder-vehicle.jpg';
              }}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <FaCar className="text-gray-300 text-6xl opacity-70" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
          Rs {vehicle.pricePerHour}/hr
        </div>
      </div>

      <div className="p-5 flex-grow">
        <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
          {vehicle.vehicleName}
        </h2>

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <FaCar className="text-blue-500 min-w-[16px]" />
            <span className="text-sm line-clamp-1">{vehicle.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-blue-500 min-w-[16px]" />
            <span className="text-sm line-clamp-1">{vehicle.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaGasPump className="text-blue-500 min-w-[16px]" />
            <span className="text-sm line-clamp-1">{vehicle.fuelType || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUsers className="text-blue-500 min-w-[16px]" />
            <span className="text-sm line-clamp-1">{vehicle.passengerSeat || "N/A"} seats</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-500">Available</span>
            <span className={`font-semibold text-sm ${parseInt(vehicle.available) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {vehicle.available} unit(s)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${parseInt(vehicle.available) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(parseInt(vehicle.available) * 10, 100)}%` }}
            ></div>
          </div>
        </div>

        {vehicle.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {vehicle.description}
          </p>
        )}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEdit(vehicle)}
            className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 text-sm font-medium"
            aria-label="Edit vehicle"
          >
            <FaEdit className="text-base" /> <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(vehicle.id)}
            className="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-sm font-medium"
            aria-label="Delete vehicle"
          >
            <FaTrash className="text-base" /> <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const VehicleForm = ({ vehicle, onInputChange, onFileChange, onSubmit, onCancel, isEditing = false }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name*</label>
          <input
            type="text"
            name="vehicleName"
            value={vehicle.vehicleName}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="e.g. Toyota Camry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
          <input
            type="text"
            name="type"
            value={vehicle.type}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="e.g. Sedan, SUV"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model*</label>
          <input
            type="text"
            name="model"
            value={vehicle.model}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="e.g. 2023"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company*</label>
          <input
            type="text"
            name="company"
            value={vehicle.company}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="e.g. Toyota"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type*</label>
          <select
            name="fuelType"
            value={vehicle.fuelType}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Fuel Type</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Seats*</label>
          <input
            type="number"
            name="passengerSeat"
            value={vehicle.passengerSeat}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            min="1"
            placeholder="e.g. 5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Available Count*</label>
          <input
            type="number"
            name="available"
            value={vehicle.available}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
            placeholder="e.g. 3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price/Hour (Rs)*</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            </div>
            <input
              type="number"
              name="pricePerHour"
              value={vehicle.pricePerHour}
              onChange={onInputChange}
              className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              min="1"
              step="0.01"
              placeholder="e.g. 25.00"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Image{!isEditing && '*'}</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="image"
                    type="file"
                    className="sr-only"
                    onChange={onFileChange}
                    required={!isEditing}
                    accept="image/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              {vehicle.image && (
                <p className="text-xs text-green-600 font-medium">
                  Selected: {vehicle.image.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={vehicle.description}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="4"
            placeholder="Enter vehicle description..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-5 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <FaEdit /> Update Vehicle
            </>
          ) : (
            <>
              <FaPlus /> Add Vehicle
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const Snackbar = ({ open, message, severity, onClose }) => {
  if (!open) return null;

  const bgColor = severity === "success" ? "bg-green-50" : "bg-red-50";
  const textColor = severity === "success" ? "text-green-800" : "text-red-800";
  const borderColor = severity === "success" ? "border-green-200" : "border-red-200";
  const iconBg = severity === "success" ? "bg-green-100" : "bg-red-100";
  const iconColor = severity === "success" ? "text-green-500" : "text-red-500";

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${bgColor} ${textColor} border ${borderColor} max-w-md animate-fade-in-up`}>
      <div className="flex items-center">
        <div className={`mr-3 flex-shrink-0 ${iconBg} rounded-full p-1 ${iconColor}`}>
          {severity === "success" ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 text-lg font-semibold focus:outline-none hover:text-gray-600"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

// Modal component for better reusability
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-center mb-4">
      <div className="bg-blue-50 p-4 rounded-full">
        <FaCar className="text-blue-500 text-5xl" />
      </div>
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">No vehicles found</h3>
    <p className="text-gray-500 max-w-md mx-auto mb-6">Add your first vehicle to start managing your fleet</p>
    <button
      onClick={() => window.handleOpenModal?.()}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300 flex items-center gap-2 mx-auto"
    >
      <FaPlus /> Add New Vehicle
    </button>
  </div>
);

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    vehicleName: "",
    type: "",
    model: "",
    company: "",
    fuelType: "",
    passengerSeat: "",
    available: 1,
    pricePerHour: "",
    image: null,
    description: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:4000/vehicle/get");
        if (!response.ok) throw new Error("Failed to fetch vehicles");
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        showSnackbar("Error fetching vehicles", "error");
        console.error("Error fetching vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
    
    // For EmptyState component to access handleOpenModal
    window.handleOpenModal = handleOpenModal;
    
    // Cleanup
    return () => {
      delete window.handleOpenModal;
    };
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 5000);
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleCloseModal = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleEditModalOpen = (vehicle) => {
    setCurrentVehicle(vehicle);
    setNewVehicle({
      vehicleName: vehicle.vehicleName,
      type: vehicle.type,
      model: vehicle.model,
      company: vehicle.company,
      fuelType: vehicle.fuelType,
      passengerSeat: vehicle.passengerSeat,
      available: vehicle.available,
      pricePerHour: vehicle.pricePerHour,
      image: null,
      description: vehicle.description,
    });
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setCurrentVehicle(null);
    resetForm();
  };

  const resetForm = () => {
    setNewVehicle({
      vehicleName: "",
      type: "",
      model: "",
      company: "",
      fuelType: "",
      passengerSeat: "",
      available: 1,
      pricePerHour: "",
      image: null,
      description: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewVehicle(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const createFormData = (vehicle) => {
    const formData = new FormData();
    formData.append("vehicleName", vehicle.vehicleName);
    formData.append("type", vehicle.type);
    formData.append("model", vehicle.model);
    formData.append("company", vehicle.company);
    formData.append("fuelType", vehicle.fuelType);
    formData.append("passengerSeat", vehicle.passengerSeat);
    formData.append("available", vehicle.available);
    formData.append("pricePerHour", vehicle.pricePerHour);
    formData.append("description", vehicle.description);
    if (vehicle.image) formData.append("image", vehicle.image);
    return formData;
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const formData = createFormData(newVehicle);

    try {
      const response = await fetch("http://localhost:4000/vehicle/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add vehicle");
      }

      const data = await response.json();
      setVehicles(prev => [...prev, data]);
      showSnackbar("Vehicle added successfully!");
      handleCloseModal();
    } catch (error) {
      showSnackbar(error.message || "Failed to add vehicle", "error");
      console.error("Error adding vehicle:", error);
    }
  };

  const handleEditVehicle = async (e) => {
    e.preventDefault();
    const formData = createFormData(newVehicle);

    try {
      const response = await fetch(
        `http://localhost:4000/vehicle/update/${currentVehicle.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update vehicle");
      }

      const data = await response.json();
      setVehicles(prev => 
        prev.map(vehicle => vehicle.id === currentVehicle.id ? data : vehicle)
      );
      showSnackbar("Vehicle updated successfully!");
      handleEditModalClose();
    } catch (error) {
      showSnackbar(error.message || "Failed to update vehicle", "error");
      console.error("Error updating vehicle:", error);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const response = await fetch(`http://localhost:4000/vehicle/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete vehicle");
      }

      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      showSnackbar("Vehicle deleted successfully!");
    } catch (error) {
      showSnackbar(error.message || "Failed to delete vehicle", "error");
      console.error("Error deleting vehicle:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaCar className="mr-3 text-blue-600" /> Vehicle Inventory
            </h1>
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleOpenModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center gap-2 shadow-sm"
              >
                <FaPlus /> <span>Add Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-700">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} {searchTerm && `matching "${searchTerm}"`}
            </h2>
            <div className="text-sm text-gray-500">
              {vehicles.length} total vehicles
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState />
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 text-lg">No vehicles matching your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={handleEditModalOpen}
                onDelete={handleDeleteVehicle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      <Modal 
        isOpen={openModal} 
        onClose={handleCloseModal}
        title="Add New Vehicle"
      >
        <VehicleForm
          vehicle={newVehicle}
          onInputChange={handleInputChange}
          onFileChange={handleFileChange}
          onSubmit={handleAddVehicle}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={handleEditModalClose}
        title="Edit Vehicle"
      >
        <VehicleForm
          vehicle={newVehicle}
          onInputChange={handleInputChange}
          onFileChange={handleFileChange}
          onSubmit={handleEditVehicle}
          onCancel={handleEditModalClose}
          isEditing={true}
        />
      </Modal>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />

    </div>
  );
};

export default Vehicles;