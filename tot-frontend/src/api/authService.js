import apiClient from "./apiClient";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export const getCsrfToken = () => 
  axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true });

export const login = (email, password) => 
  apiClient.post("/login", { email, password });

export const register = (name, email, password, password_confirmation) => 
  apiClient.post("/register", { name, email, password, password_confirmation });

export const logout = () => 
  apiClient.post("/logout");