import connexion from "../dbConnection.mjs";

export const fetchTypes = async () => {
  const [types] = await connexion.query("select * from param_type_engin");
  return types;
};
