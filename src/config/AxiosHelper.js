import axios from "axios";
export const baseURL = "http://localhost:5459";
export const httpClient = axios.create({
  baseURL: baseURL,
});
