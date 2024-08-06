import express from "express";
import { fetchEngines } from "../../helpers/engine_helpers.js";
import { STATUS } from "../../enums/status.js";

export const dashboardRoute = express.Router();

dashboardRoute.get("/:content?", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  var content = req.params.content;

  var params = {};
  if (!content) {
    content = "home";
  }
  console.log(content);
  switch (content) {
    case "parc":
      console.log("this is a parc");
      const count = req.query.count ?? 50;
      const engines = await fetchEngines(count);
      params.engines = engines;
      params.STATUS = STATUS;
      break;
    default:
      params = ["entites"];
  }
  console.log(params);
  res.render("dashboard", {
    user: req.session.user,
    content: content,
    params,
  });
});
