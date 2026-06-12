import api from "./api";

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post(`account/login/`, { username, password });
    console.log("Login successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const register = async (username: string, email: string, password: string) => {
    try {
        const response = await api.post(`account/register/`, { username, email, password });
        console.log("Registration successful:", response.data);
        return response.data;

    }
    catch (error){
        console.error("Registration failed:", error);
        throw error;
    }
}