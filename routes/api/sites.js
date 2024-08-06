import express from "express";
import { fetchEntitiesWithSites } from "../../helpers/entity_helpers.js";

const sitesRouter = express.Router();

sitesRouter.get("", async (req, res) => {
  try {
    //todo add queries
    const sites = await fetchEntitiesWithSites();

    return res.json(sites);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default sitesRouter;
