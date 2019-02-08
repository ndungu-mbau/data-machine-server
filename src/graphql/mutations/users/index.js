import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newUser {
    id: String,
    firstName: String,
    middleName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    mobileMoneyNumber: String,
    password: String,
    client: String
  }

  type userMutations {
    create (user:newUser!):user,
    update (user:newUser):user,
    destroy (user:newUser):user,
    restore (user:newUser):user
  }
`;

const queries = `
  userMutations:userMutations
`;


const root = {
  userMutations: () => ({
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
