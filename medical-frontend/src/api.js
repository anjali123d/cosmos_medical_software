import axios from "axios";

const API = axios.create({
    baseURL: "https://cosmos-medical-software-backend.onrender.com/api",
});

export default API;