/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import {
  createPage,
  createGroup,
  createQuestion,
  createProject,
  createQuestionnaire,
  updateQuestionnaire,
} from './db';


fs.readAsync = url => new Promise((resolve, reject) => fs.readFile(url, (err, data) => {
  if (err) reject(err);
  resolve(data);
}));

// eslint-disable-next-line import/prefer-default-export
export const bulkAdd = async ({
  db, files, client, user,
}) => {
  const team = {
    _id: new ObjectId(),
    name: 'Sample team',
    client,
    destroyed: false,
  };
  await db.collection('team').insertOne(team);
  files.map(async (filename) => {
    const filepath = path.resolve('.', 'src', 'app', 'etl-pipeline', 'samples', filename);
    const projectData = await fs.readAsync(filepath);
    const newOrder = [];
    const {
      items: {
        name,
        pages,
        order,
      },
    } = JSON.parse(projectData);

    const project = {
      _id: new ObjectId(),
      destroyed: false,
      name,
      client,
    };

    const projectTeam = {
      project: project._id.toString(),
      team: team._id.toString(),
      destroyed: false,
    };

    const userTeams = {
      user,
      team: team._id.toString(),
      destroyed: false,
    };

    await db.collection('project_teams').insertOne(projectTeam);
    await db.collection('user_teams').insertOne(userTeams);

    const questionnaire = {
      _id: new ObjectId(),
      name,
      // eslint-disable-next-line no-underscore-dangle
      project: project._id.toString(),
      destroyed: false,
      client,
    };

    project.questionnaire = questionnaire._id;

    // eslint-disable-next-line no-underscore-dangle
    await createQuestionnaire(questionnaire);

    for (const { name: pageName, groups } of pages) {
      const page = {
        _id: new ObjectId(),
        destroyed: false,
        name: pageName,
        // eslint-disable-next-line no-underscore-dangle
        questionnaire: questionnaire._id.toString(),
      };

      // eslint-disable-next-line no-underscore-dangle
      createPage(page);

      // eslint-disable-next-line no-restricted-syntax
      for (const { name: groupName } of groups) {
        // eslint-disable-next-line no-restricted-syntax
        for (const { questions } of groups) {
          const group = {
            _id: new ObjectId(),
            name: groupName,
            page: page._id.toString(),
            destroyed: false,
          };

          createGroup(group);

          // eslint-disable-next-line no-restricted-syntax
          for (const question of questions) {
            const oldId = question.id;

            Object.assign(question, {
              _id: new ObjectId(),
              group: group._id.toString(),
              destroyed: false,
            });

            // eslint-disable-next-line no-underscore-dangle
            createQuestion(question);

            // remake the order using the old position but with the new ids of the new questions
            newOrder[order.indexOf(oldId)] = question._id.toString();

            updateQuestionnaire(questionnaire._id, { order: newOrder });
          }
        }
      }

      // eslint-disable-next-line no-underscore-dangle
      createProject(project);
    }
  });
};
