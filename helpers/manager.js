import connexion from "../dbConnection.mjs";
import { OBJECT_NOT_FOUND } from "../constants.js";

export const fetchById = async (table, id_string, id, errorMessage) => {
  try {
    const [results] = await connexion.query(
      `select * from ${table} where ${id_string}=${id}`
    );
    if (results.length == 0) {
      throw new Error(errorMessage ?? OBJECT_NOT_FOUND);
    }
    return results[0];
  } catch (error) {
    throw error;
  }
};

// export const insert = async ()=>{}
