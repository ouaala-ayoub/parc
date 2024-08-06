import connexion from "../dbConnection.mjs";
import { engineToJson } from "./engine_helpers.js";
import { OBJECT_NOT_FOUND } from "../constants.js";
import { entiteToJson, fetchEntiteById } from "./entity_helpers.js";

export const fetchMarqueById = async (id) => {
  const [marque] = await connexion.query(
    `select * from param_marque where id_marque='${id}'`
  );
  if (marque.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  //todo check if no res
  return marque[0];
};

export const marqueToJson = async (marque) => {
  return {
    id: marque.id_marque,
    libelle: marque.libelle_marque,
    pic: marque.pic_marque,
  };
};
