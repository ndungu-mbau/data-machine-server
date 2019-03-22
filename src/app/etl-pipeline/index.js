import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import bunyan from 'bunyan';
import {
  createPage,
  createGroup,
  createQuestion,
  createProject,
  createQuestionnaire,
} from './db';

const log = bunyan.createLogger({ name: 'etl-pipeline' });

fs.readAsync = url => new Promise((resolve, reject) => fs.readFile(url, (err, data) => {
  if (err) reject(err);
  resolve(data);
}));

// eslint-disable-next-line import/prefer-default-export
export const bulkAdd = async ({ files: [filename], client }) => {
  log.info('importing', filename, 'for', client);
  const filepath = path.resolve('.', 'src', 'app', 'etl-pipeline', filename);
  const projectData = await fs.readAsync(filepath);
  const {
    items: {
      name,
      pages,
    },
  } = JSON.parse(projectData);

  const project = {
    _id: new ObjectId(),
    destroyed: false,
    name,
    client,
  };

  const questionnaire = {
    _id: new ObjectId(),
    name,
    // eslint-disable-next-line no-underscore-dangle
    project: project._id.toString(),
    destroyed: false,
    client,
  };

  // eslint-disable-next-line no-underscore-dangle
  questionnaire.id = questionnaire._id;
  await createQuestionnaire(questionnaire);

  // eslint-disable-next-line no-underscore-dangle
  project.questionnaire = new ObjectId(questionnaire._id.toString());

  // eslint-disable-next-line no-restricted-syntax
  for (const { name: pageName, groups } of pages) {
    const page = {
      _id: new ObjectId(),
      destroyed: false,
      name: pageName,
      // eslint-disable-next-line no-underscore-dangle
      questionnaire: questionnaire._id.toString(),
    };

    // eslint-disable-next-line no-underscore-dangle
    page.id = page._id;
    createPage(page);

    // eslint-disable-next-line no-restricted-syntax
    for (const { name: groupName, questions } of groups) {
      const group = {
        _id: new ObjectId(),
        name: groupName,
        page: page.id.toString(),
        destroyed: false,
      };

      // eslint-disable-next-line no-underscore-dangle
      group.id = group._id;
      createGroup(group);

      // eslint-disable-next-line no-restricted-syntax
      for (const question of questions) {
        Object.assign(question, {
          _id: new ObjectId(),
          group: group.id.toString(),
          destroyed: false,
        });

        // eslint-disable-next-line no-underscore-dangle
        question.id = question._id;
        createQuestion(question);
      }
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  project.id = project._id;
  createProject(project);
};
