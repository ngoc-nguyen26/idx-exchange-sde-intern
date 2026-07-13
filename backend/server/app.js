require("dotenv").config();

const express = require("express");
const cors = require("cors");

const requestLogger = require("./middleware/requestLogger"); 
const healthRoute = require("./routes/health");
const propertiesRoute = require("./routes/properties");

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger); 

app.use("/api/health", healthRoute);
app.use("/api/properties", propertiesRoute);

module.exports = app;