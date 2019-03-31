import {
  create,
  update,
  destroy,
  restore,
  addSubmission,
  removeSubmission,
} from './entity';

const type = `
  input newSubmissionGroup {
    name: String
  }

  type submissionGroupMutations {
    create (submissionGroup:newSubmissionGroup!):submissionGroup,
    update (submissionGroup:newSubmissionGroup!):submissionGroup,
    destroy (submissionGroup:newSubmissionGroup!):submissionGroup,
    restore (submissionGroup:newSubmissionGroup!):submissionGroup,
    addSubmission (submissionGroup:String!, submission:String!):String
    removeSubmission (submissionGroup:String!, submission:String!):String,
  }
`;

const queries = `
  submissionGroupMutations:submissionGroupMutations
`;


const root = {
  submissionGroupMutations: () => ({
    create,
    update,
    destroy,
    restore,
    addSubmission,
    removeSubmission,
  }),
};

export {
  type,
  queries,
  root,
};
