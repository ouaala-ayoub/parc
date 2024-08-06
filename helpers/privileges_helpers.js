import { OBJECT_NOT_FOUND } from "../constants.js";
import connexion from "../dbConnection.mjs";

export const fetchPrivileges = async (type) => {
  const [[categories], [privileges]] = await Promise.all([
    connexion.query("select * from param_privilege_category"),
    connexion.query("select * from param_privilege"),
  ]);
  if (categories.length === 0 || privileges === 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  var returnCategories = categories.map((category) => {
    const currentPrivileges = privileges.filter(
      (privileges) =>
        privileges.id_privilege_category === category.id_privilege_category
    );
    return {
      ...category,
      privileges: currentPrivileges,
    };
  });

  if (type) {
    returnCategories = returnCategories.filter((category) =>
      category.type_in_privilege_category.includes(type)
    );
  }
  return returnCategories;
};
