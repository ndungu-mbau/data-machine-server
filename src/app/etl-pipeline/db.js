import { MongoClient } from 'mongodb';
import config from '../../config';

const { NODE_ENV = 'development' } = process.env;

let db;

MongoClient.connect(config[NODE_ENV].db.url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db(config[NODE_ENV].db.name);
});

const dbWrite = async ({ collection, data }) => db.collection(collection).insertOne(data);
const dbUpdate = async ({ collection, _id, data }) => db.collection(collection)
  .updateOne({ _id }, { $set: data });

export const createPage = async page => dbWrite({ collection: 'page', data: page });

export const createGroup = async group => dbWrite({ collection: 'group', data: group });

export const createQuestion = async question => dbWrite({ collection: 'question', data: question });

export const createProject = async project => dbWrite({ collection: 'project', data: project });

export const createQuestionnaire = async questionnaire => dbWrite({ collection: 'questionnaire', data: questionnaire });

export const updateQuestionnaire = async (_id, data) => dbUpdate({ collection: 'questionnaire', _id, data });
