import { FREQUENCE } from "../enums/frequence.js";
import { STATUS } from "../enums/status.js";
import { engineToJson } from "./engine_helpers.js";
import moment from "moment/moment.js";
import connexion from "../dbConnection.mjs";
import { DEFAULT_DATE } from "../constants.js";

export const fetchFicheEngineByStatus = async (id) => {
  //   await fetchById("engine_daily_status", "id_status", id);
  const [results] = await connexion.query(
    `select * from engine_daily_status where id_status='${id}'`
  );
  return results[0];
};

export const fetchEnginesFicheStatuses = async (id_engine) => {
  const [fichesStatuses] = await connexion.query(
    `select * from engine_daily_status where id_engine=${id_engine}`
  );
  const fiches = fichesStatuses.map((fiche) => {
    const { json_checklist, ...rest } = fiche;
    return {
      ...rest,
      checklist: JSON.parse(json_checklist),
    };
  });

  return fiches;
};

export const insertFicheEngine = async (
  status,
  jsonChecklist,
  dateMarchePanne,
  freqStatus,
  idRelatedStatus,
  idEngine,
  idAgent
) => {
  const query =
    "insert into engine_daily_status " +
    "(date_insertion_status, value_status, json_checklist, date_mise_en_marche_en_panne_status, frequence_status, id_related_status, id_engine, id_agent)" +
    `values ('${moment().format(
      "YYYY-MM-DD HH:mm:ss"
    )}', ${status}, '${jsonChecklist}', '${dateMarchePanne ?? DEFAULT_DATE}', ${
      freqStatus ?? -1
    }, ${idRelatedStatus}, ${idEngine}, ${idAgent})`;

  const [inserted] = await connexion.query(query);
  return inserted;
};

export const ficheEngineToJson = async (engineStatus, engine) => {
  return {
    id: engineStatus?.id_status ?? -1,
    date: engineStatus?.date_insertion_status ?? null,
    date_mise_en_marche_panne: engineStatus?.date_mise_en_marche_panne ?? null,
    status: STATUS[engineStatus?.value_status - 1] ?? {},
    checklistState: JSON.parse(engineStatus?.json_checklist ?? "[]"),
    engine: (await engineToJson(engine)) ?? {},
  };
};
