import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newAction {
    id: String,
    type: String,
    name:String,
    phone:String,
    to:String,
    cc:String,
    bcc:String,
    message:String,
    requestType:String,
    headers:String,
    url:String
  }

  type actionMutations {
    create (action:newAction!):action,
    update (action:newAction):action,
    destroy (action:newAction):action,
    restore (action:newAction):action,
  }
`;

const queries = `
  actionMutations:actionMutations
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
