import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newUserGroup {
    id: String,
    name: String
  }

  type userGroupMutations {
    create (userGroup:newUserGroup!):userGroup,
    update (userGroup:newUserGroup):userGroup,
    destroy (userGroup:newUserGroup):userGroup,
    restore (userGroup:newUserGroup):userGroup
  }
`;

const queries = `
  userGroupMutations:userGroupMutations
`;

const root = {
  userGroupMutations: () => ({
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
