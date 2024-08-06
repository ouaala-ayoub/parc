import connexion from "../dbConnection.mjs";

export const fetchFicheTransfertById = async (id) => {
  //   await fetchById("engine_daily_status", "id_status", id);
  const [results] = await connexion.query(
    `select * from engine_fiche_transfert where id_fiche_transfert='${id}'`
  );
  return results[0];
};
export const ficheTransfertToJson = async (ficheTransfert) => {
  return {
    id: ficheTransfert?.id_fiche_transfert ?? -1,
    date: ficheTransfert?.date_insertion_fiche_transfert ?? null,
    reception: ficheTransfert?.date_related_fiche_transfert ?? null,
    // status: STATUS[ficheTransfert?.value_status - 1] ?? {},
    checklist: JSON.parse(ficheTransfert?.json_checklist ?? "[]"),
    // engine: (await engineToJson(engine)) ?? {},
  };
};
