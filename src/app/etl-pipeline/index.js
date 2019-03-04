import { items as projectData } from './job-sheet.json';
import {
  createPage,
  createGroup,
  createQuestion,
  createProject,
  createQuestionnaire
} from './db'

import { ObjectId } from 'mongodb'

const bulkAdd = async () => {
  const {
    name,
    pages
  } = projectData

  const project = {
    _id: new ObjectId(),
    destroyed: false,
    name
  }

  project.id = project._id
  await createProject(project)

  pages.forEach(({ name }) => {
    const questionnaire = {
      _id: new ObjectId(),
      name,
      project: newProject._id.toString(),
      destroyed: false
    }

    questionnaire.id = questionnaire._id
    await createQuestionnaire(questionnaire)

    const page = {
      _id: new ObjectId(),
      destroyed: false,
      name,
      questionnaire
    }

    page.id = page._id;
    await createPage(page)

    page.groups.forEach(({ name }) => {

      const group = {
        _id : new ObjectId(),
        name,
        page: createdPage.id
      }

      const createdGroup = await createGroup(group);
      group.id = createdGroup.id;

      group.questions.forEach((question) => {

        const question = Object.assign(question,{
          _id: new ObjectId(),
          group: createdGroup.id,
        })

        const createdQuestion = await createQuestion();
        question.id = createdQuestion.id;
      })
    })
  })
}

export default {
  bulkAdd
}