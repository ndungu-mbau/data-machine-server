const type = `
  type dashboard {
    id: String,
    name: String,
    questionnaire:questionnaire!,

    layout:layout,
    cps:[cp],
    cpds:[cpd],
    aliases:[alias],
    constants:[constant],
    charts:[chart]
  }
`;

const queries = `
  dashboard(id:String!):dashboard,
  dashboards(filter:filter!):[dashboard]
`;

const dashboard = () => { };

const dashboards = () => { };

const root = {
  dashboard,
  dashboards,
};

export { type, queries, root };
