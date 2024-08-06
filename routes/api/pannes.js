import express from "express";
import { fetchPannes } from "../../helpers/pannes_helpers.js";

const pannesRouter = express.Router();

pannesRouter.get("", async (req, res) => {
  try {
    const pannes = await fetchPannes();
    return res.json(pannes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default pannesRouter;
