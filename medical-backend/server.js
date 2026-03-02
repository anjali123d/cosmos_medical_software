require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(
    cors({
        origin: ["http://localhost:5173", "https://cosmos-medical-software.vercel.app"],
        methods: ["GET", "POST", "PUT", "DELETE"], // optional: specify allowed HTTP methods
        credentials: true, // optional: if you want to allow cookies/auth headers
    })
);
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://cosmos-medical-software.vercel.app"
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true
//   })
// );
app.use(express.json());
app.get('/', (req, res) => {
    res.send("server is running ");
})
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/issues", require("./routes/issueRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));

const PORT = 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));


