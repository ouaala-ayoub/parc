import express from "express";
import { fetchPrivileges } from "../../helpers/privileges_helpers.js";
import { UserType } from "../../enums/usertype.js";

const privilegesRouter = express.Router();

privilegesRouter.get("", async (req, res) => {
  try {
    const type = req.query.type;
    if (type && !Object.values(UserType).includes(parseInt(type))) {
      throw new Error("Type invalide");
    }
    const privileges = await fetchPrivileges(type);
    res.json(privileges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default privilegesRouter;
