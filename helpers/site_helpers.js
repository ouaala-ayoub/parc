import connexion from "../dbConnection.mjs";
import { engineToJson } from "./engine_helpers.js";
import { OBJECT_NOT_FOUND } from "../constants.js";
import { entiteToJson, fetchEntiteById } from "./entity_helpers.js";

export const fetchSites = async () => {
  const [sites] = await connexion.query("select * from param_site");
  if (sites.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  //todo check if no res
  return sites;
};

export const fetchSiteById = async (id) => {
  const [site] = await connexion.query(
    `select * from param_site where id_sites='${id}'`
  );
  if (site.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  //todo check if no res
  return site[0];
};

export const siteToJson = async (site, entiteProvided) => {
  const entite = entiteProvided ?? (await fetchEntiteById(site.id_entite));
  const jsonEntite = entiteToJson(entite);

  return {
    id: site.id_sites,
    libelle: site.libelle_site,
    entite: jsonEntite,
  };
};
