import {
  type as projectType,
  queries as projectQueries,
  root as projectRoot,
} from './projects';

import {
  type as userType,
  queries as userQueries,
  root as userRoot,
} from './users';

import {
  type as userGroupsType,
  queries as userGroupsQueries,
  root as userGroupsRoot,
} from './userGroups';

import {
  type as clientType,
  queries as clientQueries,
  root as clientRoot,
} from './clients';

import {
  type as teamType,
  queries as teamQueries,
  root as teamRoot,
} from './teams';

import {
  type as questionnaireType,
  queries as questionnaireQueries,
  root as questionnaireRoot,
} from './questionnaires';

import {
  type as pageType,
  queries as pageQueries,
  root as pageRoot,
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

const typeQueries = `
  ${clientType},
  ${teamType},
  ${dashboardsType},
  ${layoutsType},
  ${cpType},
  ${chartsType},
  ${constantsType},
  ${aliasesType},
  ${userType},
  ${projectType},
  ${questionnaireType},
  ${userGroupsType},
  ${pageType},
  ${groupType},
  ${questionType},
  ${optionsType},
  ${sentencesType},
  type Query {
      hello: String,
      ${clientQueries},
      ${teamQueries},
      ${dashboardsQueries},
      ${layoutsQueries},
      ${cpQueries},
      ${chartsQueries},
      ${constantsQueries},
      ${aliasesQueries},
      ${projectQueries},
      ${userQueries},
      ${clientQueries},
      ${questionnaireQueries},
      ${userGroupsQueries},
      ${pageQueries}
      ${questionQueries}
      ${groupQueries}
      ${optionsQueries}
      ${sentencesQueries}
  }`;

const Query = {
  hello: () => 'Hello world students!'
};

const Nested = {

}

Object.assign(Query, projectRoot);
Object.assign(Query, questionnaireRoot);
Object.assign(Query, userRoot);
Object.assign(Query, userGroupsRoot);
Object.assign(Query, pageRoot);
Object.assign(Query, groupRoot);
Object.assign(Query, questionRoot);
Object.assign(Query, optionsRoot);
Object.assign(Query, clientRoot);
Object.assign(Query, sentencesRoot);
Object.assign(Query, dashboardsRoot);
Object.assign(Query, dashboardsRoot);
Object.assign(Query, layoutsRoot);
Object.assign(Query, cpRoot);
Object.assign(Query, chartsRoot);
Object.assign(Query, constantsRoot);
Object.assign(Query, aliasesRoot);

const queryRoot = { Query, Nested }

export { typeQueries, queryRoot };
