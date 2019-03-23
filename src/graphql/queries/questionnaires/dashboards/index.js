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

export { type, queries, root };
