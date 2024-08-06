import express from "express";
import { USER_NOT_FOUND, OBJECT_NOT_FOUND } from "../../constants.js";
import {
  engineToJson,
  fetchEngineById,
  fetchEngines,
  getEngineByNumParcEngine,
  handleExport,
  handleImport,
  updateEngineOfId,
} from "../../helpers/engine_helpers.js";
import {
  getFicheTransfertCategoriesOrdered,
  fetchCheckListByEngineType,
  fetchChecklistByCategory,
  categoryToJson,
} from "../../helpers/checklist_helpers.js";
import { STATUS, validStatus } from "../../enums/status.js";
import {
  fetchFicheEngineByStatus,
  ficheEngineToJson,
  insertFicheEngine,
} from "../../helpers/fiche_engine_helpers.js";
import { fetchFicheTransfertById } from "../../helpers/fiche_transfert_helpers.js";
import { getEntries } from "../../helpers/function_helpers.js";
import {
  fetchAgentByAccountId,
  fetchCompteByLogin,
  agentHasSite,
} from "../../helpers/user_helpers.js";
import multer from "multer";
import { UserType } from "../../enums/usertype.js";
import { fetchPrivileges } from "../../helpers/privileges_helpers.js";
import { PRIVILEGES_MOBILE } from "../../enums/privileges_mobile.js";
import { FREQUENCE } from "../../enums/frequence.js";

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Example: Check if the file name meets your criteria
    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      return cb(new Error("Only Excel files are allowed!"));
    }
    cb(null, true);
  },
});

const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    res.status(400).json({ error: `File import error ${err.message}` });
  } else if (err) {
    // Custom or other errors
    res.status(400).json({ error: ` ${err.message}` });
  } else {
    next();
  }
};

export const engineRoute = express.Router();

engineRoute.get("", async (req, res) => {
  try {
    const count = req.query.count;
    const engines = await fetchEngines(count);
    res.json(engines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

engineRoute.get("/search", async (req, res) => {
  const queries = req.query;
  try {
    const login = queries.login;
    //todo add login check1
    if (!login) {
      return res.json({ error: "Login non trouvée" });
    }
    const [engines, compte] = await Promise.all([
      getEngineByNumParcEngine(queries.q),
      fetchCompteByLogin(login, false, UserType["agent"]),
    ]);

    const [agent, privilegesData] = await Promise.all([
      fetchAgentByAccountId(compte.id_compte),
      fetchPrivileges(UserType["agent"]),
    ]);

    const mobilePrivilegesData = privilegesData.filter(
      (category) => category.id_privilege_category === 9
    );

    const privileges = getEntries(agent.privileges_agent);
    const agentPrivileges = mobilePrivilegesData[0].privileges.filter(
      (privilege) => privileges.includes(privilege.id_privilege)
    );

    if (!engines) {
      throw new Error(OBJECT_NOT_FOUND);
    }
    const engine = engines[engines.length - 1];

    // const ficheTransfert = await ficheTransfertToJson(results[1]);

    //todo
    // if (ficheTransfert.id <= 0) {
    // }

    res.json({
      success: 1,
      status: STATUS,
      engine: await engineToJson(engine),
      // checklist,
      // ficheEngine,
      privileges: agentPrivileges,
      // ficheTransfert,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

engineRoute.post("/update-status", async (req, res) => {
  try {
    const queries = req.query;
    const body = req.body;

    //todo check for the queries+
    console.log(body.saisies.checklist);

    if (!body.saisies) {
      return res.status(400).json({ error: "Pas de saisies " });
    }

    const account = await fetchCompteByLogin(queries.login, true, 1);
    const agent = await fetchAgentByAccountId(account.id_compte);

    if (!agent) {
      return res.status(400).json({ error: USER_NOT_FOUND });
    }

    if (!parseInt(queries?.engine)) {
      return res.status(400).json({ error: "Engin introuvable" });
    }

    const engine = await fetchEngineById(queries?.engine);
    if (!engine) {
      return res.status(400).json({ error: OBJECT_NOT_FOUND });
    }
    const hasSite = agentHasSite(agent, engine.id_sites);
    if (!hasSite) {
      return res.status(401).json({
        error: "Opération non autorisée, Vous n'avez pas d'access a ce site",
      });
    }

    if (!validStatus(queries?.status)) {
      return res.status(400).json({
        error: "État invalide. Veuillez contacter l'administrateur système.",
      });
    }

    const lastFiche = await fetchFicheEngineByStatus(
      engine.id_current_fiche_status
    );
    const checklist = body.saisies.checklist;
    const fiche = await insertFicheEngine(
      queries?.status,
      JSON.stringify(checklist),
      //todo
      undefined,
      queries?.frequence ?? -1,
      lastFiche?.id_status ?? -1,
      engine.id_engine,
      agent.id_agent
    );

    if (!fiche.insertId) {
      throw new Error("Erreur d'insertion du nouvelle fiche d'engin");
    }

    //todo update
    await updateEngineOfId(
      engine.id_engine,
      !lastFiche ? fiche.insertId : -1,
      queries?.status
    );

    res.json({
      success: `État de ${engine.num_parc_engine} modifée avec succès.`,
      id: fiche.insertId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

engineRoute.post(
  "/import",
  upload.single("file"),
  handleMulterErrors,
  handleImport
);

engineRoute.get("/export", handleExport);

engineRoute.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const engine = await fetchEngineById(id);
    return res.json(engine);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

engineRoute.get("/:id/fiches-mobile", async (req, res) => {
  try {
    //todo add add fiche transfert
    const id = req.params.id;
    const privilege = parseInt(req.query.privilege);
    const frequence = req.query.frequence;
    console.log(frequence);
    console.log(privilege);
    if (
      !frequence ||
      (frequence && !Object.keys(FREQUENCE).includes(frequence))
    ) {
      return res.status(400).json({ error: "Frequence Invalide" });
    }

    if (privilege && !PRIVILEGES_MOBILE.includes(privilege)) {
      return res.status(400).json({ error: "Privilege Invalide" });
    }

    const engine = await fetchEngineById(id);
    //todo fetch by privilege

    const [ficheEngine, ficheTransfert] = await Promise.all([
      fetchFicheEngineByStatus(engine.id_current_fiche_status),
      fetchFicheTransfertById(engine.id_current_fiche_transfert),
    ]);
    const [checklistDb, categories] = await Promise.all([
      fetchCheckListByEngineType(engine.id_type_engin),
      getFicheTransfertCategoriesOrdered(),
    ]);

    const checklistDbIds = getEntries(
      checklistDb.entries_engin_fiche_transfert_checklist
    );
    const checklist = [];
    for (const category of categories) {
      const checklists = await fetchChecklistByCategory(
        category.id_fiche_category,
        frequence
      );

      //   console.log(checklists);
      category.entries = checklists.filter((ck) =>
        checklistDbIds.includes(ck.id_fiche_category)
      );

      if (category.entries.length > 0) {
        checklist.push(categoryToJson(category));
      }
    }
    return res.json({
      engine,
      checklist,
      ficheEngine: await ficheEngineToJson(ficheEngine, engine),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
