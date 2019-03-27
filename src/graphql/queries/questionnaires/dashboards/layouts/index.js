const type = `
  type layout {
    id: String,
    name: String,
    page:page!,
    questions:[question]
  }
`;

const queries = `
  layout(id:String!):layout,
  layouts(filter:filter!):[layout]
`;

const layout = () => { };

const layouts = () => { };

const root = {
  layout,
  layouts,
};

export {
  type,
  queries,
  root,
};
