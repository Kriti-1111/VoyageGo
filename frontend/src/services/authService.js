import axios from "axios";
import { ENDPOINTS } from "./api.js";

const authService = {
  register: async (userData) => {
    const response = await axios.post(ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;
