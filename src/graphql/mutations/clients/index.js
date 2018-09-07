import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newclient {
    id: String,
    email	: String,
    firstName	: String,
    lastName	: String,
    middleName	: String,
    mobileMoneyNumber: String,	
    password: String,
    phone	: String,
    phoneNumber: String,
  }

  type clientMutations {
    create (client:newclient!):client,
    update (client:newclient):client,
    destroy (client:newclient):client,
    restore (client:newclient):client
  }
`;

const queries = `
  clientMutations:clientMutations
`;


const root = {
  clientMutations: () => ({
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
