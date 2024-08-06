import { OBJECT_NOT_FOUND } from "../constants.js";
import connexion from "../dbConnection.mjs";
import { RISK } from "../enums/risk.js";
import { STATUS } from "../enums/status.js";
import { fetchTypes } from "./engine_type_helpers.js";
import { fetchEntities, fetchEntitiesWithSites } from "./entity_helpers.js";
import { normalizeColumnNames } from "./function_helpers.js";
import { fetchById } from "./manager.js";
import { fetchMarqueById } from "./marque_helpers.js";
import { fetchSiteById, fetchSites, siteToJson } from "./site_helpers.js";
import moment from "moment";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { fetchUserById } from "./user_helpers.js";

//todo add more params
export const fetchEngines = async (count) => {
  //todo change limit
  var query = `SELECT * FROM _engine`;

  if (count) {
    query += ` LIMIT ${count}`;
  }

  // Execute the queries in parallel
  const [[enginesResponse], sites, entities] = await Promise.all([
    connexion.query(query),
    fetchSites(),
    fetchEntities(),
  ]);
  // Check if enginesResponse is not an empty array
  if (enginesResponse.length === 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }

  // Process each engine and convert site to JSON asynchronously
  const engines = await Promise.all(
    enginesResponse.map(async ({ id_sites, ...rest }) => {
      const mySite = sites.find((site) => site.id_sites === id_sites);
      const entite = entities.find(
        (entite) => (entite.id_entite = mySite.id_entite)
      );
      return {
        ...rest,
        site: await siteToJson(mySite || {}, entite), // Ensure `siteToJson` is awaited
      };
    })
  );

  console.log(engines);

  return engines;
};

export const fetchEngineById = async (id) =>
  await fetchById("_engine", "id_engine", id);

export const getEngineByNumParcEngine = async (numParc) => {
  const [results] = await connexion.query(
    `select * from _engine where _engine.num_parc_engine='${numParc}'`
  );

  return results;
};

export const updateEngineOfId = async (id, idCurrentFiche, currentStatus) => {
  const updated = await connexion.query(
    `update _engine set id_current_fiche_status = ${idCurrentFiche}, current_status_engine = ${currentStatus} where id_engine=${id}`
  );
  return updated;
};

export const engineToJson = async (engine) => {
  const results = await Promise.all([
    fetchSiteById(engine.id_sites),
    fetchMarqueById(engine.id_marque),
  ]);
  const siteJson = await siteToJson(results[0]);
  const marqueJson = results[1];
  return {
    id: engine.id_engine,
    num_parc: engine.num_parc_engine,
    matricule: engine.matricule_engine,
    num_chasis: engine.num_chassis_engine,
    type: engine.type_engine,
    num_ww: engine.num_ww_engine,
    date_prevue_last_panne: engine.date_prevue_last_panne_engine,
    current_status: STATUS[engine.current_status_engine - 1],
    current_risque: RISK[engine.current_risque_engine],
    marque: marqueJson,
    site: siteJson,
  };
};

const postEngine = async ({
  numParc,
  designation,
  idType,
  idSite,
  idCreateur,
  status,
}) => {
  const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");
  try {
    const posted = await connexion.query(
      `INSERT INTO _engine
       (num_parc_engine, designation_engine, id_type_engin, id_sites, id_createur, date_insertion_engine, current_status_engine) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [numParc, designation, idType, idSite, idCreateur, currentDate, status]
    );
    return posted;
  } catch (error) {
    console.error("Error posting engine:", error.message);
    throw error;
  }
};

export const handleImport = async (req, res) => {
  try {
    const file = req.file;
    const idCreateur = req.query.idCreateur;

    if (!file) {
      return res.status(400).json({ error: "No file found" });
    }
    if (!idCreateur) {
      return res.status(400).json({ error: "Creator ID is missing" });
    }
    const user = await fetchUserById(idCreateur);

    if (!user) {
      return res.status(400).json({ error: "Utilisateur introuvable" });
    }

    const enginesFile = xlsx.readFile(req.file.path);
    const sheetnames = enginesFile.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(enginesFile.Sheets[sheetnames]);
    const data = normalizeColumnNames(rawData);
    const [types, entities] = await Promise.all([
      fetchTypes(),
      fetchEntitiesWithSites(),
    ]);

    await Promise.all(
      data.map(async (engineData) => {
        const numParc = engineData["N° de parc"];
        const existingEngines = await getEngineByNumParcEngine(numParc);

        if (existingEngines.length != 0) {
          console.log(`Engine with parc number ${numParc} already exists`);
          return;
        }

        const designation = engineData["Description"];
        const type = types.find(
          (type) => type.libelle_type_engin === engineData["Type"]
        );
        if (!type) {
          console.log("Type not found");
          return;
        }

        const entity = entities.find(
          (entity) => entity.libelle === engineData["Entité"]
        );
        if (!entity) {
          console.log("Entity not found");
          return;
        }

        const idType = type.id_type_engin;
        console.log(engineData["Site"]);
        const site = entity.sites.find(
          (site) => site.libelle_site === engineData["Site"]
        );

        if (!site) {
          console.log("Site not found");
          return;
        }

        const idSite = site.id_sites;
        const status = STATUS.find(
          (status) => status.libelle === engineData["Etat"]
        );

        if (!status) {
          console.log("Status not found");
          return;
        }

        const body = {
          numParc,
          designation,
          idType,
          idSite,
          idCreateur: parseInt(idCreateur),
          status: status.id,
        };

        console.log(body);

        await postEngine(body);
      })
    );

    return res.json({ success: "Import successful" });
  } catch (error) {
    console.error("Error handling import:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const handleExport = async (req, res) => {
  try {
    const { q, statuses, sites } = req.query;
    const [engines, entities] = await Promise.all([
      searchEngineByQueries({ q, statuses, sites }),
      fetchEntitiesWithSites(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Engines");

    const headerStyle = {
      font: { bold: true, size: 12 },
      alignment: { horizontal: "center" },
    };

    const dataStyle = {
      font: { size: 8 },
      alignment: { horizontal: "left" },
    };

    worksheet
      .addRow([
        "N° de parc",
        "Description",
        "Type",
        "Entité",
        "Site",
        "Etat",
        "Date état",
        "Mise en marche Prévue",
        "Criticité",
      ])
      .eachCell({ includeEmpty: true }, (cell) => {
        cell.style = headerStyle;
      });

    engines.forEach((engine) => {
      const entite = entities.find((entite) =>
        entite.sites.some((site) => site.id_sites === engine.id_sites)
      );
      const site = entite?.sites.find(
        (site) => site.id_sites === engine.id_sites
      );
      const entry = [
        engine.num_parc_engine ?? "",
        engine.designation_engine ?? "",
        engine.libelle_type_engin ?? "",
        entite?.libelle ?? "",
        site?.libelle_site ?? "",
        STATUS[engine.current_status_engine - 1]?.libelle ?? "",
      ];
      worksheet.addRow(entry).eachCell({ includeEmpty: true }, (cell) => {
        cell.style = dataStyle;
      });
    });

    const autoFitColumns = (worksheet) => {
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = maxLength + 2; // Add padding
      });
    };

    // Auto-fit columns
    autoFitColumns(worksheet);

    const tempFilePath = path.join("./temp", `engines_${Date.now()}.xlsx`);

    if (!fs.existsSync(path.dirname(tempFilePath))) {
      fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    }

    await workbook.xlsx.writeFile(tempFilePath);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="engines_${Date.now()}.xlsx"`
    );

    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      fs.unlink(tempFilePath, (err) => {
        if (err) {
          console.error("Error deleting temporary file:", err);
        }
      });
    });
  } catch (error) {
    console.error("Error handling export:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

const searchEngineByQueries = async ({ q, sites, statuses }) => {
  try {
    const searchQuery = q ? `%${q}%` : null;
    const sitesArray = sites ? sites.split(";").map(Number) : [];
    const statusArray = statuses ? statuses.split(";").map(Number) : [];

    let query = `SELECT * FROM _engine INNER JOIN param_type_engin  on param_type_engin.id_type_engin = _engine.id_type_engin WHERE 1=1`;
    const queryParams = [];

    if (searchQuery) {
      query += ` AND num_parc_engine LIKE ?`;
      queryParams.push(searchQuery);
    }

    if (sitesArray.length > 0) {
      query += ` AND id_sites IN (?)`;
      queryParams.push(sitesArray);
    }

    if (statusArray.length > 0) {
      query += ` AND current_status_engine IN (?)`;
      queryParams.push(statusArray);
    }

    const [engines] = await connexion.query(query, queryParams);
    return engines;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};
