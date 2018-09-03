import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newProject {
    id: String,
    name: String,
    client:String,
    questionnaire:String
  }

  type projectMutations {
    create (project:newProject!):project,
    update (project:newProject):project,
    destroy (project:newProject):project,
    restore (project:newProject):project
  }
`;

const queries = `
  projectMutations:projectMutations
`;

const root = {
  projectMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export {
  type,
  queries,
  root,
};
