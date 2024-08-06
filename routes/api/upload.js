import express from "express";
import { saveImage } from "../../helpers/uploader.js";

export const uploadRouter = express.Router();

uploadRouter.post("/", async (req, res) => {
  const body = req.body;
  const name = body.name;
  const blob = body.blob;
  try {
    if (!name || !blob) {
      return res.status(400).json({ error: "Requete non valide" });
    }

    await saveImage(name, blob, "./images");

    // await Promise.all(
    //   body.images.map((image) => {
    //     return saveImage(image.name, image.blob, "./images");
    //   })
    // );

    res.json({ success: 1 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
