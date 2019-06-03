const type = `
  type cpd {
    id: String,
    dashboard: String,
    name: String,
    formular: String,
    type: String,
    field: String,
    filters:[dataFilter]
  }
`;

const queries = `
  cpd(id:String!):cp,
  cpds(filter:filter!):[cp]
`;

const cp = () => { };

const cps = () => { };

const root = {
  cp,
  cps,
};

export { type, queries, root };
