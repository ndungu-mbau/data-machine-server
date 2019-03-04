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
    if(err) reject(err)
    resolve(data)
  })
)

export const bulkAdd = async ({ files:[filename], client }) => {

  const filepath = path.resolve('.', 'src', 'app', 'etl-pipeline', filename)
  const projectData = await fs.readAsync(filepath)
  const {
    items:{
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

  //console.log(`ETL-PIPE: Project data ${JSON.stringify(project)}`)

  project.id = project._id
  await createProject(project)

  pages.forEach(async ({ name, groups }) => {

    const questionnaire = {
      _id: new ObjectId(),
      name,
      project: project._id.toString(),
      destroyed: false,
      client
    }
  
    questionnaire.id = questionnaire._id
    await createQuestionnaire(questionnaire)

    const page = {
      _id: new ObjectId(),
      destroyed: false,
      name,
      questionnaire: questionnaire._id.toString()
    }

    page.id = page._id;
    await createPage(page)

    groups.forEach(async ({ name, questions }) => {

      const group = {
        _id : new ObjectId(),
        name,
        page: page.id
      }

      group.id = group._id
      await createGroup(group);

      questions.forEach(async (question) => {

        Object.assign(question,{
          _id: new ObjectId(),
          group:group.id,
        })

        question.id = question._id;
        await createQuestion(question);
      })
    })
  })
}