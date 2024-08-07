export const getEntries = (toParse) => {
  if (toParse?.length === 0) return [];
  return toParse
    ?.slice(1, -1)
    ?.split(";")
    ?.map((idString) => parseInt(idString));
};
export const normalizeColumnNames = (data) => {
  // Check if data is an array and contains objects
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    typeof data[0] !== "object"
  ) {
    return data; // Return as is if not valid
  }

  // Get the normalized column names from the first row
  const normalizedData = data.map((row) => {
    const normalizedRow = {};

    // Normalize each key in the row
    for (const key in row) {
      if (row.hasOwnProperty(key)) {
        // Normalize key by trimming spaces and converting to lowercase (optional)
        const normalizedKey = key.trim(); // Optional: .toLowerCase() if you want case-insensitivity
        normalizedRow[normalizedKey] = row[key];
      }
    }

    return normalizedRow;
  });

  return normalizedData;
};
export const generateArray = (start, length) => {
  const result = [];
  for (let i = 1; i <= length; i++) {
    result.push(start + i);
  }
  return result;
};
