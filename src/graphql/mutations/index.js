import {
  type as projectType,
  queries as projectMutations,
  root as projectRoot,
} from './projects';

import {
  type as clientsType,
  queries as clientsMutations,
  root as clientsRoot,
} from './clients';

import {
  type as actionsType,
  queries as actionsMutations,
  root as actionsRoot,
} from './actions';

import {
  type as rolesType,
  queries as roleMutations,
  root as roleRoot,
} from './roles';

import {
  type as teamsType,
  queries as teamsMutations,
  root as teamsRoot,
} from './teams';

import {
  type as userType,
  queries as userMutations,
  root as userRoot,
} from './users';

import {
  type as questionnaireType,
  queries as questionnaireMutations,
  root as questionnaireRoot,
} from './questionnaires';

import {
  type as pageType,
  queries as pageMutations,
  root as pageRoot,
} from './questionnaires/pages';

import {
  type as dashboardType,
  queries as dashboardMutations,
  root as dashboardRoot,
} from './questionnaires/dashboards';

import {
  type as aliasType,
  queries as aliasMutations,
  root as aliasRoot,
} from './questionnaires/dashboards/aliases';

import {
  type as cpType,
  queries as cpMutations,
  root as cpRoot,
} from './questionnaires/dashboards/cps';

import {
  type as cpdType,
  queries as cpdMutations,
  root as cpdRoot,
} from './questionnaires/dashboards/cpd';

import {
  type as chartType,
  queries as chartMutations,
  root as chartRoot,
} from './questionnaires/dashboards/charts';

import {
  type as constantType,
  queries as constantMutations,
  root as constantRoot,
} from './questionnaires/dashboards/constants';

import {
  type as layoutType,
  queries as layoutMutations,
  root as layoutRoot,
} from './questionnaires/dashboards/layouts';

import {
  type as groupType,
  queries as groupMutations,
  root as groupRoot,
} from './questionnaires/pages/groups';

import {
  type as questionsType,
  queries as questionsMutations,
  root as questionsRoot,
} from './questionnaires/pages/groups/questions';

import {
  type as optionsType,
  queries as optionsMutations,
  root as optionsRoot,
} from './questionnaires/pages/groups/questions/options';

import {
  type as sentenceType,
  queries as sentenceMutations,
  root as sentenceRoot,
} from './questionnaires/pages/groups/questions/sentences';

import {
  type as submissionGroupsType,
  queries as submissionGroupsMutations,
  root as submissionGroupsRoot,
} from './submission-groups';

const typeMutations = `
${clientsType},
${actionsType}
${teamsType},
${projectType},
${dashboardType},
${userType},
${questionnaireType},
${pageType},
${groupType},
${aliasType},
${cpType},
${cpdType},
${layoutType},
${chartType},
${constantType},
${optionsType},
${questionsType},
${sentenceType},
${submissionGroupsType},
${rolesType},
type Mutation {
    honk: String,
    ${clientsMutations}
    ${actionsMutations}
    ${teamsMutations}
    ${projectMutations}
    ${dashboardMutations}
    ${userMutations}
    ${aliasMutations}
    ${cpMutations}
    ${cpdMutations}
    ${layoutMutations}
    ${chartMutations}
    ${constantMutations}
    ${questionnaireMutations}
    ${groupMutations},
    ${pageMutations},
    ${groupMutations},
    ${questionsMutations},
    ${optionsMutations},
    ${sentenceMutations},
    ${submissionGroupsMutations}
    ${roleMutations}
}`;

const mutationRoot = { honk: () => 'Hello world students!' };

Object.assign(mutationRoot, projectRoot);
Object.assign(mutationRoot, userRoot);
Object.assign(mutationRoot, questionnaireRoot);
Object.assign(mutationRoot, pageRoot);
Object.assign(mutationRoot, groupRoot);
Object.assign(mutationRoot, questionsRoot);
Object.assign(mutationRoot, optionsRoot);
Object.assign(mutationRoot, clientsRoot);
Object.assign(mutationRoot, teamsRoot);
Object.assign(mutationRoot, sentenceRoot);
Object.assign(mutationRoot, aliasRoot);
Object.assign(mutationRoot, cpRoot);
Object.assign(mutationRoot, cpdRoot);
Object.assign(mutationRoot, chartRoot);
Object.assign(mutationRoot, constantRoot);
Object.assign(mutationRoot, layoutRoot);
Object.assign(mutationRoot, dashboardRoot);
Object.assign(mutationRoot, submissionGroupsRoot);
Object.assign(mutationRoot, roleRoot);
Object.assign(mutationRoot, actionsRoot);

export { typeMutations, mutationRoot };
