const type = `
  type cp {
    id: String,
    dashboard: String,
    name: String,
    formular: String,
  }
`;

const queries = `
  cp(id:String!):cp,
  cps(filter:filter!):[cp]
`;

const cp = () => { };

const cps = () => { };

const root = {
  cp,
  cps,
};

export { type, queries, root };
