import express from "express";
import connectDB from "./model/db.js";
import routes from "./routes/index.js";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import configurePassport from "./configs/passportConfig.js";

dotenv.config();
const server = express();
const port = 3000;
server.use(express.json());
server.use(cookieParser());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.use(passport.initialize());
//set up passport
configurePassport(passport);

server.use("/", routes);

console.log("is this working?");

connectDB(); // Connect to the database

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
