import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newdashboard {
    id: String,
    name: String,
    questionnaire:String
  }

  type dashboardMutations {
    create (dashboard:newdashboard!):dashboard,
    update (dashboard:newdashboard):dashboard,
    destroy (dashboard:newdashboard):dashboard,
    restore (dashboard:newdashboard):dashboard
  }
`;

const queries = `
  dashboardMutations:dashboardMutations
`;


const root = {
  dashboardMutations: () => ({
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
