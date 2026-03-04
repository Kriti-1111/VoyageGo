import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['CUSTOMER', 'DRIVER', 'ADMIN'], 
    default: 'CUSTOMER'
  },
  
  // Driver-specific fields
  licenseNo: { 
    type: String 
  },
  languages: [{ 
    type: String 
  }],
  vehicleSpecialization: [{ 
    type: String 
  }],
  isDriverVerified: { 
    type: Boolean, 
    default: false 
  },
  shiftStart: { 
    type: String 
  },
  shiftEnd: { 
    type: String 
  },
  
  // Address fields
  permanentAddress: String,
  temporaryAddress: String
}, {
  timestamps: true  // This will automatically add createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);
export default User;