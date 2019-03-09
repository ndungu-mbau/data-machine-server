import fs from 'fs'
import path from 'path'
import {
  createPage,
  createGroup,
  createQuestion,
  createProject,
  createQuestionnaire
} from './db'

import { ObjectId } from 'mongodb'

fs.readAsync = (path) => new Promise((resolve, reject) => fs.readFile(path, (err, data) => {
  if (err) reject(err)
  resolve(data)
})
)

export const bulkAdd = async ({ db, files: [filename], client, user }) => {

  const filepath = path.resolve('.', 'src', 'app', 'etl-pipeline', filename)
  const projectData = await fs.readAsync(filepath)
  const {
    items: {
      name,
      pages
    }
  } = JSON.parse(projectData)

  const project = {
    _id: new ObjectId(),
    destroyed: false,
    name,
    client
  }

  const team = {
    _id: new ObjectId(),
    name: 'Sample team',
    client,
    destroyed: false,
  };

  const project_team = {
    project: project._id.toString(),
    team: team._id.toString(),
    destroyed: false,
  };

  const user_teams = {
    user: user,
    team: team._id.toString(),
    destroyed: false,
  };

  await db.collection('team').insertOne(team);
  await db.collection('project_teams').insertOne(project_team);
  await db.collection('user_teams').insertOne(user_teams);

  const questionnaire = {
    _id: new ObjectId(),
    name,
    project: project._id.toString(),
    destroyed: false,
    client
  }

  questionnaire.id = questionnaire._id
  await createQuestionnaire(questionnaire)

  project.questionnaire = new ObjectId(questionnaire._id.toString())

  //console.log(`ETL-PIPE: Project data ${JSON.stringify(project)}`)

  for (const { name, groups } of pages) {

    const page = {
      _id: new ObjectId(),
      destroyed: false,
      name,
      questionnaire: questionnaire._id.toString()
    }

    page.id = page._id;
    await createPage(page)

    for (const { name, questions } of groups) {

      const group = {
        _id: new ObjectId(),
        name,
        page: page.id.toString(),
        destroyed: false
      }

      group.id = group._id
      await createGroup(group);

      for (const question of questions) {

        Object.assign(question, {
          _id: new ObjectId(),
          group: group.id.toString(),
          destroyed: false
        })

        question.id = question._id;
        await createQuestion(question);
      }
    }
  }

  project.id = project._id
  await createProject(project)
}