import {
  type as projectType,
  queries as projectQueries,
  nested as projectQueriesNested,
  root as projectRoot,
} from './projects';

import {
  type as userType,
  queries as userQueries,
  nested as userNested,
  root as userRoot,
} from './users';

import {
  type as clientType,
  queries as clientQueries,
  nested as clientQueriesNested,
  root as clientRoot,
} from './clients';

import {
  type as billingType,
  queries as billingQueries,
  nested as billingQueriesNested,
  root as billingRoot,
} from './billing';

import {
  type as teamType,
  queries as teamQueries,
  nested as teamUsersNested,
  root as teamRoot,
} from './teams';

import {
  type as questionnaireType,
  queries as questionnaireQueries,
  nested as questionnaireNested,
  root as questionnaireRoot,
} from './questionnaires';

import {
  type as pageType,
  queries as pageQueries,
  root as pageRoot,
  nested as pagesNested,
} from './questionnaires/pages';

import {
  type as dashboardsType,
  queries as dashboardsQueries,
  root as dashboardsRoot,
} from './questionnaires/dashboards';

import {
  type as layoutsType,
  queries as layoutsQueries,
  root as layoutsRoot,
} from './questionnaires/dashboards/layouts';

import {
  type as cpType,
  queries as cpQueries,
  root as cpRoot,
} from './questionnaires/dashboards/cps';

import {
  type as cpdType,
  queries as cpdQueries,
  root as cpdRoot,
} from './questionnaires/dashboards/cpd';

import {
  type as chartsType,
  queries as chartsQueries,
  root as chartsRoot,
} from './questionnaires/dashboards/charts';

import {
  type as constantsType,
  queries as constantsQueries,
  root as constantsRoot,
} from './questionnaires/dashboards/constants';

import {
  type as aliasesType,
  queries as aliasesQueries,
  root as aliasesRoot,
} from './questionnaires/dashboards/aliases';

import {
  type as groupType,
  queries as groupQueries,
  root as groupRoot,
  nested as groupsNested,
} from './questionnaires/pages/groups';

import {
  type as questionType,
  queries as questionQueries,
  root as questionRoot,
} from './questionnaires/pages/groups/questions';

import {
  type as optionsType,
  queries as optionsQueries,
  root as optionsRoot,
} from './questionnaires/pages/groups/questions/options';

import {
  type as sentencesType,
  queries as sentencesQueries,
  root as sentencesRoot,
} from './questionnaires/pages/groups/questions/sentences';


import {
  type as roleType,
  queries as roleQueries,
  root as rolesRoot,
} from './roles/index';


const typeQueries = ` 
  ${roleType}
  ${clientType},
  ${billingType},
  ${teamType},
  ${dashboardsType},
  ${layoutsType},
  ${cpType},
  ${cpdType},
  ${chartsType},
  ${constantsType},
  ${aliasesType},
  ${userType},
  ${projectType},
  ${questionnaireType},
  ${pageType},
  ${groupType},
  ${questionType},
  ${optionsType},
  ${sentencesType},
  type Query {
      hello: String,
      ${roleQueries},
      ${clientQueries},
      ${billingQueries},
      ${teamQueries},
      ${dashboardsQueries},
      ${layoutsQueries},
      ${cpQueries},
      ${cpdQueries},
      ${chartsQueries},
      ${constantsQueries},
      ${aliasesQueries},
      ${projectQueries},
      ${userQueries},
      ${clientQueries},
      ${questionnaireQueries},
      ${pageQueries}
      ${questionQueries}
      ${groupQueries}
      ${optionsQueries}
      ${sentencesQueries}
  }`;

const Query = {
  hello: () => 'Hello too!',
};

const Nested = {};

Object.assign(
  Nested,
  clientQueriesNested,
  teamUsersNested,
  projectQueriesNested,
  userNested,
  questionnaireNested,
  pagesNested,
  groupsNested,
  billingQueriesNested,
);


Object.assign(
  Query,
  rolesRoot,
  projectRoot,
  userRoot,
  pageRoot,
  groupRoot,
  questionRoot,
  optionsRoot,
  clientRoot,
  sentencesRoot,
  dashboardsRoot,
  layoutsRoot,
  cpRoot,
  cpdRoot,
  chartsRoot,
  constantsRoot,
  aliasesRoot,
  questionnaireRoot,
  teamRoot,
  billingRoot,
);

const queryRoot = { Query, Nested };

export { typeQueries, queryRoot };
