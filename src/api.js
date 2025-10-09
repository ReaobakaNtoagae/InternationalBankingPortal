import axios from "axios";

export const registerUser = async (userData) => {
  try {
    const response = await axios.post("http://localhost:5000/api/auth/signup", userData);
    return response.data;
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    throw error;
  }
};
