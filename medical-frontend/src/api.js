import axios from "axios";

const API = axios.create({
    baseURL: "https://cosmos-medical-software-backend.onrender.com/api",
});

/* =========================
   ITEMS
========================= */

export const getItems = () => API.get("/items");

export const createItem = (data) => API.post("/items", data);

export const updateItem = (id, data) =>
    API.put(`/items/${id}`, data);

export const deleteItem = (id) =>
    API.delete(`/items/${id}`);


/* =========================
   PATIENTS
========================= */

export const getPatients = () => API.get("/patients");

export const createPatient = (data) =>
    API.post("/patients", data);


/* =========================
   ISSUES
========================= */

export const getIssues = () => API.get("/issues");

export const getActiveIssues = () =>
    API.get("/issues/active");

export const createIssue = (data) =>
    API.post("/issues", data);

export const updateIssue = (id, data) =>
    API.put(`/issues/${id}`, data);

export const deleteIssue = (id) =>
    API.delete(`/issues/${id}`);


/* =========================
   RETURNS
========================= */

export const returnItem = (data) =>
    API.post("/returns", data);

export const getReturns = () =>
    API.get("/returns");

export const getReturnHistory = () =>
    API.get("/returns/history");


export default API;