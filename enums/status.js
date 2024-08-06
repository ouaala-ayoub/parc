export const STATUS = [
  {
    id: 1,
    libelle: "Opérationnel",
  },
  {
    id: 2,
    libelle: "En Panne",
  },
  {
    id: 3,
    libelle: "Reserve",
  },
  {
    id: 4,
    libelle: "Accidenté",
  },
  {
    id: 5,
    libelle: "En Maintenance préventive",
  },
];

export const validStatus = (status) => {
  const intValue = parseInt(status);
  return STATUS.map((item) => {
    return item.id;
  }).includes(intValue);
};
