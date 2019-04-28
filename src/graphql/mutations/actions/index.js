import {
  create,
  update,
  destroy,
  restore,
  updateOrder,
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
    url:String,
    client:String,
    project:String,
    event:String
  }

  type actionMutations {
    create (action:newAction!):action,
    update (action:newAction):action,
    destroy (action:newAction):action,
    restore (action:newAction):action,
    updateOrder (name:String,project:String,client:String,order:[String]):action,
  }
`;

const queries = `
  actionMutations:actionMutations
`;

const root = {
  actionMutations: () => ({
    create,
    update,
    destroy,
    restore,
    updateOrder,
  }),
};

export {
  type,
  queries,
  root,
};
