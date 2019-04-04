import {
  create,
  update,
  destroy,
  restore,
  inviteUser,
} from './entity';

const type = `
  input newclient {
    id: String,
    name: String,
    comms_sms: String,
    contact_email: String,
    reg_id: String
  }

  input create_invitation {
    email: String!,
    client: String!,
    role: String
    name: String!,
    time: String
  }

  type clientMutations {
    create (client:newclient!):client,
    update (client:newclient):client,
    destroy (client:newclient):client,
    restore (client:newclient):client,
    inviteUser (invitation: create_invitation):String
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
    inviteUser,
  }),
};

export {
  type,
  queries,
  root,
};
