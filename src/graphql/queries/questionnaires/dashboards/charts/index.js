const type = `
type col {
  prop: String,
  label: String,
  color: String
}

type dataFilter {
  input: String,
  sign: String,
  value: String
}

type chart {
  id: String,
  name: String,
  label: String,
  type: String,
  html:String,
  cols:[col],
  dashboard:String,
  filters:[dataFilter]
}
`;

const queries = `
  chart(id:String!):chart,
  charts(filter:filter!):[chart]
`;

const chart = () => { };

const charts = () => { };

const root = {
  chart,
  charts,
};

export { type, queries, root };
