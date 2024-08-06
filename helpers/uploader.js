import fs from "fs-extra";
import path from "path";

/**
 * Stores a Blob in a directory with the provided name.
 * @param {string} imageName - The name to save the image as.
 * @param {Blob} blob - The Blob representing the image data.
 * @param {string} directory - The directory where the image will be stored.
 * @returns {Promise<void>} - A promise that resolves when the file is saved.
 */
export const saveImage = async (imageName, imageBlob, directory) => {
  try {
    await fs.ensureDir(directory);

    const imageBuffer = Buffer.from(imageBlob, "base64");
    const filePath = path.join(directory, imageName);

    await fs.writeFile(filePath, imageBuffer);
  } catch (error) {
    throw error;
  }
};
