import fetch from "node-fetch";
import csv from "csv-parser";
import { Readable } from "stream";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

async function loadCsvFromCloudinary(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const stream = Readable.from(Buffer.from(buffer));

  const rows = [];
  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
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
