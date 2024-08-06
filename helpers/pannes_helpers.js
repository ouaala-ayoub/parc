import connexion from "../dbConnection.mjs";

export const fetchPannes = async () => {
  const query = `
    SELECT 
        ep.id_engine_panne,
        e.id_engine,
        e.num_parc_engine,
        e.designation_engine,
        e.current_status_engine,
        e.current_risque_engine,
        ps.id_sites,
        ps.libelle_site,
        pe.id_entite,
        pe.libelle_entite,
        pe.pic_entite
    FROM 
        engine_panne AS ep
    JOIN 
        _engine AS e
    ON 
        ep.id_engine = e.id_engine
    JOIN 
        param_site AS ps
    ON 
        e.id_sites = ps.id_sites
    JOIN 
        param_entite AS pe
    ON 
        ps.id_entite = pe.id_entite;
  `;

  const [pannes] = await connexion.query(query);
  return pannes;
};
