import connexion from "../dbConnection.mjs";
import { fetchById } from "./manager.js";
import { UserType } from "../enums/usertype.js";
import { USER_NOT_FOUND, USERNAME_PASS_INCORRECT } from "../constants.js";
import { getEntries } from "./function_helpers.js";
import bcrypt from "bcrypt";
import { fetchSites } from "./site_helpers.js";

export const fetchAllAgents = async () => {
  const [[agents], sites] = await Promise.all([
    connexion.query(
      "select * from agent INNER JOIN compte  on compte.id_compte = agent.id_compte"
    ),
    fetchSites(),
  ]);
  return agents.map((agent) => agentToJson(agent, agent.login_compte, sites));
};

export const getUserPrivileges = async () => {};

export const fetchCompteByLogin = async (login, error, type) => {
  var query = `SELECT * FROM compte WHERE login_compte = '${login}'`;
  if (type) {
    query += `and type_compte=${type}`;
  }
  const [accounts] = await connexion.execute(query);
  if (accounts.length === 0 && error) {
    throw new Error(USER_NOT_FOUND);
  }

  return accounts[0];
};

export const updateAgentPrivileges = async (id, newPrivileges) => {
  const [result] = await connexion.query(
    `update agent set privileges_agent='${newPrivileges}' where id_agent=${id}`
  );
  return result;
};

export const fetchAgentById = async (id) =>
  await fetchById("agent", "id_agent", id, USER_NOT_FOUND);

export const fetchUserById = async (id) =>
  await fetchById("user", "id_user", id, USER_NOT_FOUND);

export const fetchUserByAccountId = async (id) =>
  await fetchById("user", "id_compte", id, USER_NOT_FOUND);

// todo add the params to the app
export const fetchAgentByAccountId = async (id) =>
  await fetchById("agent", "id_compte", id, USER_NOT_FOUND);

export const userToJson = (user, login) => {
  return {
    id: user?.id_user ?? -1,
    fullname: user?.fullname_user ?? null,
    phone: user?.phone_user ?? null,
    login: login,
  };
};
export const agentToJson = (agent, login, sites) => {
  // const sites = await fetchSites();
  const sitesJson = [];
  if (sites) {
    const userSites = getEntries(agent.id_sites);
    userSites.forEach((siteId) => {
      const site = sites.find((site) => site.id_sites === siteId);
      if (site) {
        sitesJson.push(site);
      }
    });
  }
  const agentJson = {
    id: agent?.id_agent ?? -1,
    pic: agent?.pic_agent ?? null,
    fullname: `${agent.first_name_agent} ${agent.last_name_agent}` ?? null,
    phone: agent?.telephone_agent ?? null,
    appVersion: agent.version_app_agent ?? null,
    login: login,
    privileges: getEntries(agent?.privileges_agent) ?? [],
  };

  if (sites) {
    agentJson["sites"] = sitesJson;
  }

  return agentJson;
};

export const agentHasSite = (agent, siteId) => {
  return getEntries(agent.id_sites).includes(siteId);
};

export const connect = async (req) => {
  const { login, password } = req.body;
  const type = req.query.type;

  if (!login || !password) {
    throw new Error("Login and password are required.");
  }

  if (!type) {
    throw new Error("Type du compte est requis");
  }

  // Fetch account details
  const compte = await fetchCompteByLogin(login, true, type);

  if (!compte) {
    throw new Error(USERNAME_PASS_INCORRECT);
  }

  const isMatch = await bcrypt.compare(password, compte.pass_compte);

  if (!isMatch) {
    throw new Error(USERNAME_PASS_INCORRECT);
  }

  // Fetch user details
  let user;

  if (type == UserType["user"]) {
    user = await fetchUserByAccountId(compte.id_compte);
    user = userToJson(user, login);
  } else if (type == UserType["agent"]) {
    user = await fetchAgentByAccountId(compte.id_compte);
    user = agentToJson(user, login);
  } else {
    throw new Error(USERNAME_PASS_INCORRECT);
  }
  console.log(user);
  return {
    success: 1,
    // user: userToJson(user, login),
    user: user,
  };
};
