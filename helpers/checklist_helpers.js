import connexion from "../dbConnection.mjs";
import { getFrequecesList } from "../enums/frequence.js";
import { RISK } from "../enums/risk.js";
import { getEntries } from "./function_helpers.js";

export const insertCategory = async (category) => {
  const [highestOrderCategory] = await connexion.query(
    "select * from param_fiche_transfert_checklist_category order by order_fiche_category DESC limit 1"
  );
  if (highestOrderCategory.length === 0 || !highestOrderCategory) {
    throw new Error("Error selecting the highest order");
  }
  const categoryOrder = highestOrderCategory[0].order_fiche_category + 1;
  const [inserted] = await connexion.query(
    "insert into param_fiche_transfert_checklist_category (libelle_fr_fiche_category, order_fiche_category) values (?, ?)",
    [category.libelle, categoryOrder]
  );
  return inserted;
};

export const fetchEntryHighestOrder = async () => {
  const [highestOrderEntry] = await connexion.query(
    "select * from param_fiche_transfert_checklist order by order_fiche_checklist DESC limit 1"
  );
  if (highestOrderEntry.length === 0 || !highestOrderEntry) {
    throw new Error("Error selecting the highest order");
  }
  const highestOrder = highestOrderEntry[0].order_fiche_checklist;
  return highestOrder;
};

export const deleteCategory = async (id) => {
  const [deleted] = await connexion.query(
    "delete from param_fiche_transfert_checklist_category where id_fiche_category=?",
    [id]
  );
  return deleted;
};

export const deleteAllCategoryEntries = async (categoryId) => {
  const [deleted] = await connexion.query(
    "delete from param_fiche_transfert_checklist where id_fiche_category=?",
    [categoryId]
  );
  return deleted;
};

export const insertEntry = async (entry, order) => {
  const [inserted] = await connexion.query(
    "insert into param_fiche_transfert_checklist (libelle_fr_fiche_checklist, risque_fiche_checklist, privileges_fiche_checklist ,frequences_fiche_checklist, order_fiche_checklist ,should_verify_fiche_checklist, id_fiche_category) values (?, ?, ?, ?, ?, ?, ?)",
    [
      entry.libelle,
      entry.risk,
      entry.privileges,
      entry.frequence,
      order,
      entry.shouldVerify,
      entry.idFicheCategory,
    ]
  );
  return inserted;
};

export const fetchCheckListByEngineType = async (engineType) => {
  const [results] = await connexion.query(
    `select * from param_engin_fiche_transfert_checklist where id_type_engin=${engineType}`
  );

  if (results.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  return results[0];
};

export const fetchChecklistEntries = async () => {
  const [results] = await connexion.query(
    `select * from param_fiche_transfert_checklist`
  );

  if (results.length == 0) {
    throw new Error(OBJECT_NOT_FOUND);
  }
  return results;
};

export const fetchCategoryById = async (id) => {
  const [result] = await connexion.query(
    "SELECT * FROM param_fiche_transfert_checklist_category where id_fiche_category = ?",
    [id]
  );

  if (result.length == 0) {
    throw new Error("No Category with id " + id + " found");
  }

  return result[0];
};

export const updateCategory = async (id, libelle) => {
  const updated = await connexion.query(
    `update param_fiche_transfert_checklist_category set libelle_fr_fiche_category=? where id_fiche_category=?`,
    [libelle, id]
  );
  return updated;
};

export const updateEntry = async (id, entry) => {
  const updated = await connexion.query(
    `update param_fiche_transfert_checklist set libelle_fr_fiche_checklist=?, risque_fiche_checklist=?, privileges_fiche_checklist=? ,frequences_fiche_checklist=?, should_verify_fiche_checklist=? where id_fiche_checklist=?`,
    [
      entry.libelle,
      entry.risk,
      entry.privileges,
      entry.frequence,
      entry.shouldVerify,
      id,
    ]
  );
  return updated;
};

export const fetchChecklistByCategory = async (categoryId, frequency) => {
  try {
    var query =
      "SELECT * FROM param_fiche_transfert_checklist WHERE id_fiche_category = ?";
    if (frequency) {
      query += " AND frequences_fiche_checklist LIKE ?";
    }
    query += " ORDER BY order_fiche_checklist";
    const [checklists] = await connexion.query(query, [
      categoryId,
      `%${frequency}%`,
    ]);
    return checklists;
  } catch (error) {
    console.error("Error fetching checklists:", error);
    throw error;
  }
};

export const deleteEntryById = async (id) => {
  const [deleted] = await connexion.query(
    "delete from param_fiche_transfert_checklist where id_fiche_checklist=?",
    [id]
  );
  return deleted;
};

export const getFicheTransfertCategoriesOrdered = async () => {
  const [results] = await connexion.query(
    `select * from param_fiche_transfert_checklist_category order by order_fiche_category`
  );
  return results;
};

export const checkListToJson = (item) => {
  return {
    id: item.id_fiche_checklist,
    libelle_fr: item.libelle_fr_fiche_checklist,
    libelle_ar: item.libelle_ar_fiche_checklist,
    risque: RISK[item.risque_fiche_checklist],
    frequence: getFrequecesList(item.frequences_fiche_checklist),
    shouldVerify: item.should_verify_fiche_checklist,
    order: item.order_fiche_checklist,
    privileges: getEntries(item.privileges_fiche_checklist) ?? [],
  };
};

export const categoryToJson = (category) => {
  return {
    id: category.id_fiche_category,
    libelle_fr: category.libelle_fr_fiche_category,
    libelle_ar: category.libelle_ar_fiche_category,
    order: category.order_fiche_category,
    entries: category.entries.map((item) => {
      return checkListToJson(item);
    }),
  };
};
