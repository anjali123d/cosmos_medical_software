import axios from "axios";

const API = axios.create({
    baseURL: "https://cosmos-medical-software.onrender.com/api",
});

export default API;