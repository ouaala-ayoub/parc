import express from "express";
import {
  categoryToJson,
  deleteAllCategoryEntries,
  deleteCategory,
  deleteEntryById,
  fetchCategoryById,
  fetchChecklistByCategory,
  fetchChecklistEntries,
  fetchEntryHighestOrder,
  getFicheTransfertCategoriesOrdered,
  insertCategory,
  insertEntry,
  updateCategory,
  updateEntry,
} from "../../helpers/checklist_helpers.js";
import { generateArray } from "../../helpers/function_helpers.js";

const checklistRouter = express.Router();

checklistRouter
  .route("")
  .get(async (req, res) => {
    try {
      const [entries, categories] = await Promise.all([
        fetchChecklistEntries(),
        getFicheTransfertCategoriesOrdered(),
      ]);

      const ficheChecklist = categories.map((category) => {
        const checklist = [];
        entries.forEach((entry) => {
          if (entry.id_fiche_category === category.id_fiche_category) {
            checklist.push(entry);
          }
        });
        return categoryToJson({
          ...category,
          entries: checklist,
        });
      });

      return res.json(ficheChecklist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      const category = req.body;
      console.log(category);
      if (!category) {
        throw new Error("Category is required");
      }

      const insertedCategoryRes = await insertCategory(category);
      if (!insertedCategoryRes) {
        throw new Error(
          "Une erreur est survenue dans l'insertion de la categorie"
        );
      }

      const currentOrder = await fetchEntryHighestOrder();
      const ordersArray = generateArray(currentOrder, category.entries.length);

      if (category.entries && category.entries.length > 0) {
        await Promise.all(
          category.entries.map(async (entry, index) => {
            await insertEntry(
              {
                ...entry,
                idFicheCategory: insertedCategoryRes.insertId,
              },
              ordersArray[index]
            );
          })
        );
      }

      res.json({ success: "Données inserée avec succès" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  })
  .put(async (req, res) => {
    try {
      const category = req.body;
      if (!category || !category.id || !category.libelle) {
        throw new Error("Request body not valid");
      }

      const oldCategory = await fetchCategoryById(category.id);
      const oldEntries = await fetchChecklistByCategory(
        oldCategory.id_fiche_category
      );

      await updateCategory(category.id, category.libelle);

      // Process the entries in parallel, awaiting each operation properly
      await Promise.all(
        category.entries.map(async (entryReq) => {
          const foundEntry = oldEntries.find(
            (entry) => entry.id_fiche_checklist === entryReq.id
          );

          if (foundEntry) {
            // Update existing entry
            await updateEntry(foundEntry.id_fiche_checklist, entryReq);
          } else {
            // Insert new entry
            await insertEntry({ ...entryReq, idFicheCategory: category.id });
          }
        })
      );

      // Identify entries that need to be deleted
      const newIds = category.entries.map((entry) => entry.id);
      const oldIds = oldEntries.map((entry) => entry.id_fiche_checklist);

      const idsToDelete = oldIds.filter((id) => !newIds.includes(id));

      if (idsToDelete.length > 0) {
        // Delete entries that are no longer present
        await Promise.all(idsToDelete.map((id) => deleteEntryById(id)));
      }

      return res.json({ success: "Categorie mis a jour avec success" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  });

checklistRouter.route("/:id").delete(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(id);
    if (!id) {
      throw new Error("Id non valide");
    }
    //to check if category exists
    await fetchCategoryById(id);
    const deleted = await Promise.all([
      deleteCategory(id),
      deleteAllCategoryEntries(id),
    ]);

    if (!deleted) {
      throw new Error("Error deleting");
    }

    return res.json({ success: "Categorie Supprimée avec succès" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

export default checklistRouter;
