import connexion from "../dbConnection.mjs";
import { OBJECT_NOT_FOUND } from "../constants.js";
import { fetchSites } from "./site_helpers.js";

export const fetchEntities = async () => {
  const [entities] = await connexion.query("select * from param_entite");
  if (entities.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  //todo check if no res
  return entities;
};

export const fetchEntitiesWithSites = async () => {
  const [entities, sites] = await Promise.all([fetchEntities(), fetchSites()]);
  const result = entities.map((entity) => {
    const entitySites = sites.filter(
      (site) => site.id_entite === entity.id_entite
    );
    return {
      id: entity.id_entite,
      libelle: entity.libelle_entite,
      pic: entity.pic_entite,
      sites: entitySites,
    };
  });
  return result;
};

export const fetchEntiteById = async (id) => {
  const [entite] = await connexion.query(
    `select * from param_entite where id_entite='${id}'`
  );
  if (entite.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  return entite[0];
};

export const entiteToJson = (entite) => {
  return {
    id: entite.id_entite,
    libelle: entite.libelle_entite,
    pic: entite.pic_entite,
  };
};
