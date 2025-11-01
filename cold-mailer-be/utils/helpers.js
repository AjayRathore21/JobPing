import fetch from "node-fetch";
import csv from "csv-parser";
import { Readable } from "stream";

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
export { loadCsvFromCloudinary };
