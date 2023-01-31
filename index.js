const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
// middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

const users = require("./routes/users");
const messages = require("./routes/messages");

app.use("/users", users);
app.use("/messages", messages);

require("dotenv").config();
const dbConnData = {
  host: process.env.MONGO_HOST,
  port: process.env.MONGO_PORT,
  database: process.env.MONGO_DATABASE,
};

// Connect to MongoDB
mongoose.connect(
  // `mongodb://${dbConnData.host}:${dbConnData.port}/${dbConnData.database}`,
  `${process.env.RAILWAY_MONGO_DB}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
// Start server
app.listen(4000, () => {
  console.log("Server started on port 4000");
});
