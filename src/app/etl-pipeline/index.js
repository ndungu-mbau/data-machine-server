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

export const bulkAdd = async filename => {

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
    name:name
  }

  //console.log(`ETL-PIPE: Project data ${JSON.stringify(project)}`)

  project.id = project._id
  await createProject(project)

  const questionnaire = {
    _id: new ObjectId(),
    name,
    project: project._id.toString(),
    destroyed: false
  }

  questionnaire.id = questionnaire._id
  await createQuestionnaire(questionnaire)

  pages.forEach(async ({ name, groups }) => {

    const page = {
      _id: new ObjectId(),
      destroyed: false,
      name,
      questionnaire
    }

    page.id = page._id;
    await createPage(page)

    groups.forEach(async ({ name, questions }) => {

      const group = {
        _id : new ObjectId(),
        name,
        page: createdPage.id
      }

      const createdGroup = await createGroup(group);
      group.id = createdGroup.id;

      questions.forEach(async (question) => {

        Object.assign(question,{
          _id: new ObjectId(),
          group: createdGroup.id,
        })

        const createdQuestion = await createQuestion(question);
        question.id = createdQuestion.id;
      })
    })
  })
}