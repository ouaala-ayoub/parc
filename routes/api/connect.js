import express from "express";
import { connect } from "../../helpers/user_helpers.js";

export const connectRoute = express.Router();

connectRoute
  .route("/")

  .post(async (req, res) => {
    try {
      const connectResult = await connect(req);
      res.json(connectResult);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
