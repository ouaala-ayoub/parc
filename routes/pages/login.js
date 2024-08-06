import express from "express";
import { connect } from "../../helpers/user_helpers.js";

export const loginRoute = express.Router();

loginRoute
  .route("")
  .get((req, res) => {
    res.render("login");
  })
  .post(async (req, res) => {
    try {
      const connectResult = await connect(req);
      req.session.user = connectResult.user;
      res.redirect("dashboard");
    } catch (error) {
      //todo add error and login/pass params
      res.render("login");
    }
  });
