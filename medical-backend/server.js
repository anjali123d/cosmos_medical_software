require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/issues", require("./routes/issueRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));

const PORT = 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));