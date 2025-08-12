import axios from "axios";
export const baseURL = "https://room-chat-backend-ic7o.onrender.com";
export const httpClient = axios.create({
  baseURL: baseURL,
});
