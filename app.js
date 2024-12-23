import express from "express";
import dotenv from "dotenv";


dotenv.config();


const app = express();

// Define a basic route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/add-artifact", async (req, res) => {
  res.send("Hello, artifact");
});

const port = process.env.PORT || 5050;

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
