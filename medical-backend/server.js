require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://cosmos-medical-software.vercel.app",
            "https://cosmos-medical-software-x72z.vercel.app"
        ],
        credentials: true,
    })
);

app.options("*", cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("server is running");
});

app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/issues", require("./routes/issueRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));