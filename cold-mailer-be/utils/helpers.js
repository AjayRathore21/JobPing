import axios from "axios";
import csv from "csv-parser";
import { Readable } from "stream";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

/**
 * Downloads a CSV file from Cloudinary and parses it into an array of objects.
 * Uses axios for better compatibility and error reporting than node-fetch.
 */
async function loadCsvFromCloudinary(url) {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
      timeout: 10000, // 10 second timeout
    });

    const rows = [];
    return new Promise((resolve, reject) => {
      response.data
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", () => {
          console.log(`=> Successfully parsed ${rows.length} rows from CSV`);
          resolve(rows);
        })
        .on("error", (err) => {
          console.error("❌ Error parsing CSV stream:", err.message);
          reject(new Error(`Failed to parse CSV: ${err.message}`));
        });
    });
  } catch (error) {
    console.error("❌ Error fetching CSV from Cloudinary:", error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `Cloudinary download failed (${error.response.status}): ${error.response.statusText}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(
        "Cloudinary download failed: No response received from server"
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Cloudinary download setup failed: ${error.message}`);
    }
  }
}

/**
 * Reads a CSV file, adds a unique rowId (UUID) to each row, writes to a new temp file
 * @param {string} filePath - Path to the original CSV file
 * @returns {string} - Path to the modified CSV temp file
 */
function addUuidToCsv(filePath) {
  const fileData = fs.readFileSync(filePath, "utf8");

  const results = Papa.parse(fileData, { header: true, skipEmptyLines: true });
  const rows = results.data.map((row) => ({
    id: uuidv4(), // Add persistent UUID as first column
    ...row,
  }));

  // Convert back to CSV
  const newCsv = Papa.unparse(rows);

  // Write modified CSV to a temp file
  const tempFilePath = `${filePath}_modified.csv`;
  fs.writeFileSync(tempFilePath, newCsv);

  return tempFilePath;
}

export { loadCsvFromCloudinary, addUuidToCsv };
