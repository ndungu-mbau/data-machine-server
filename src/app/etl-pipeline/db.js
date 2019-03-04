import { MongoClient } from 'mongodb'
import config from '../../config'

let db;

MongoClient.connect(config[NODE_ENV].db.url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db(config[NODE_ENV].db.name);
});

const dbWrite = async ({ collection, data }) => {
  await db.collection(collection).insertOne(data)
}

const createPage = async (page) => {
  await dbWrite({
    collection:'page',
    data: page
  })
}

const createGroup = async (group) => {
  await dbWrite({
    collection:'group',
    data: group
  })
}

const createQuestion = async (question) => {
  await dbWrite({
    collection:'question',
    data: question
  })
}

const createProject = async (project) => {
  await dbWrite({
    collection:'project',
    data: project
  })
}

const createQuestionnaire = async (questionnaire) => {
  await dbWrite({
    collection:'questionnaire',
    data: questionnaire
  })
}

export default {
  createGroup,
  createProject,
  createPage,
  createQuestion,
  createQuestionnaire
}