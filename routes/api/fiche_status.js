import express from "express";
import { fetchEngineById } from "../../helpers/engine_helpers.js";
import { fetchEnginesFicheStatuses } from "../../helpers/fiche_engine_helpers.js";

const ficheStatusRouter = express.Router();

ficheStatusRouter.get("/", async (req, res) => {
  try {
    const idEngine = req.query.idEngine;
    if (!idEngine) {
      throw new Error("id_engine not provided");
    }
    await fetchEngineById(idEngine);
    const fiches = await fetchEnginesFicheStatuses(idEngine);
    console.log(fiches);
    return res.json(fiches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default ficheStatusRouter;
