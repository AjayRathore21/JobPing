import express from "express";
import connectDB from "./model/db.js";
import routes from "./routes/index.js";
import dotenv from "dotenv";

dotenv.config();
const server = express();
const port = 3000;
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use("/", routes);

console.log("is this working?");

connectDB(); // Connect to the database

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
