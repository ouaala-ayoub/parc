import express from "express";
import {
  fetchAgentById,
  fetchAllAgents,
  fetchCompteByLogin,
  fetchUserByAccountId,
  updateAgentPrivileges,
} from "../../helpers/user_helpers.js";
import { USER_NOT_FOUND } from "../../constants.js";
import { fetchPrivileges } from "../../helpers/privileges_helpers.js";
import { UserType } from "../../enums/usertype.js";
import { getEntries } from "../../helpers/function_helpers.js";

const agentsRouter = express.Router();

agentsRouter.get("/", async (req, res) => {
  const agents = await fetchAllAgents();
  res.json(agents);
});

agentsRouter
  .route("/:id/privileges")
  .get(async (req, res) => {
    try {
      const id = req.params.id;
      const category = parseInt(req.query.category);

      const [agent, privileges] = await Promise.all([
        fetchAgentById(id),
        fetchPrivileges(UserType["agent"]),
      ]);

      const isValidCategory = privileges
        .map((category) => {
          return category.id_privilege_category;
        })
        .includes(category);

      if (category && !isValidCategory) {
        throw new Error("Invalid category");
      }

      const agentPrivilegesIds = getEntries(agent.privileges_agent) ?? [];

      var filteredData = privileges.map((category) => ({
        ...category,
        privileges: category.privileges.filter((privilege) =>
          agentPrivilegesIds.includes(privilege.id_privilege)
        ),
      }));

      if (category) {
        filteredData = filteredData.filter(
          (c) => c.id_privilege_category === category
        );
      }
      if (filteredData.length == 1) {
        filteredData = filteredData[0];
        return res.json(filteredData.privileges);
      }
      return res.json(filteredData);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
  .put(async (req, res) => {
    try {
      const privileges = req.body.privileges;
      const id = req.params.id;
      const login = req.query.login;

      //should be an array of privileges
      if (!privileges || !Array.isArray(privileges)) {
        return res.status(400).json({ error: "Privileges invalide" });
      }
      if (!login) {
        return res.status(400).json({ error: "Pas de login" });
      }
      privileges.sort();
      const result = `;${privileges.join(";")};`;

      const [agent, compte] = await Promise.all([
        fetchAgentById(id),
        fetchCompteByLogin(login),
      ]);

      const user = await fetchUserByAccountId(compte.id_compte);
      if (!user) {
        throw new Error(USER_NOT_FOUND);
      }
      //todo check user privileges

      const updated = await updateAgentPrivileges(agent.id_agent, result);

      if (!updated) {
        return res.status(400).json({ error: "error updating privileges" });
      }

      return res.json({
        success: `Les modifications apportés à '${agent.last_name_agent} ${agent.first_name_agent}' ont été sauvegardées avec succès.`,
      });
    } catch (error) {
      console.log(error);
      if (error.message === USER_NOT_FOUND) {
        return res.status(401).json({ error: "id d'Agent non valide" });
      }
      return res.status(500).json({ error: error.message });
    }
  });

export default agentsRouter;
