import express from "express";
import "./loadEnvironment.mjs";
import "./dbConnection.mjs";
import path from "path";
import { engineRoute } from "./routes/api/engine.js";
import { connectRoute } from "./routes/api/connect.js";
import { uploadRouter } from "./routes/api/upload.js";
import ficheStatusRouter from "./routes/api/fiche_status.js";
// import { loginRoute } from "./routes/pages/login.js";
// import { dashboardRoute } from "./routes/pages/dashboard.js";
import crypto from "crypto";
import session from "express-session";
import cors from "cors";
import pannesRouter from "./routes/api/pannes.js";
import sitesRouter from "./routes/api/sites.js";
import agentsRouter from "./routes/api/agents.js";
import privilegesRouter from "./routes/api/privileges.js";
import checklistRouter from "./routes/api/checklist.js";

const app = express();
const PORT = process.env.PORT;
const secret_key = crypto.randomBytes(64).toString("hex");

app.set("view engine", "ejs");
app.use(express.static(path.join("./", "public")));
app.set("views", path.join("./", "views"));
app.use(
  session({
    secret: secret_key,
    resave: false,
    saveUninitialized: true,
    //todo change
    cookie: { secure: false },
  })
);
app.use(
  cors({
    origin: "http://localhost:3000", // Allow only this origin
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

// app.use((req, res) => {});

app.use("/api/connect", connectRoute);
app.use("/api/engine", engineRoute);
app.use("/api/upload", uploadRouter);
app.use("/api/fiche-status", ficheStatusRouter);
app.use("/api/pannes", pannesRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/privileges", privilegesRouter);
app.use("/api/checklist", checklistRouter);
// app.use("/login", loginRoute);
// app.use("/dashboard", dashboardRoute);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
