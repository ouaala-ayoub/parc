export const FREQUENCE = Object.freeze({
  1: {
    id: 1,
    libelle: "Journalière",
  },
  2: {
    id: 2,
    libelle: "Hebdomadaire",
  },
  3: {
    id: 3,
    libelle: "Mensuelle",
  },
});

export const getFrequecesList = (input) => {
  const list = input
    .slice(1, -1)
    .split(";")
    .map((number) => {
      return FREQUENCE[number];
    });
  return list;
};
