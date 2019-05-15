/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */


const { ObjectId } = require('mongodb');

module.exports = {
  async up(db, done) {
    const Submisions = db.collection('submision');
    const Clients = db.collection('client');
    const Projects = db.collection('project');
    const Company = db.collection('company');
    const Users = db.collection('user');

    const cursor = Submisions.find({});
    const count = await cursor.count();
    const index = 1;

    // console.log(cursor);

    while (await cursor.hasNext()) {
      // will return false when there are no more results
      const submision = await cursor.next(); // actually gets the document
      // do something, possibly async with the current document
      // eslint-disable-next-line no-underscore-dangle
      console.log(index, '/', count, ' : ', submision._id);

      console.log('processing with', {
        client: submision.client,
        phone: submision.__agentPhoneNumber,
        project: submision.projectId,
      });

      const agentInfo = await Users.findOne({
        phoneNumber: submision.__agentPhoneNumber,
      });

      const projectInfo = await Projects.findOne({
        _id: new ObjectId(submision.projectId),
      });

      const clientInfo = await Clients.findOne({
        _id: new ObjectId(projectInfo.client),
      });

      const companyInfo = await Company.findOne({
        _id: new ObjectId(projectInfo.client),
      });

      // console.log(submision.__agentPhoneNumber, submision.client);

      // console.log(clientInfo, agentInfo, companyInfo);

      // add the following fields
      const newInfo = {
        __agentMetaData: agentInfo.other,
        __clientName: clientInfo ? clientInfo.name : companyInfo.company_name,
        // eslint-disable-next-line no-underscore-dangle
        client: projectInfo.client,
        userId: new ObjectId(agentInfo._id),
      };

      // console.log({ newInfo });

      // eslint-disable-next-line no-underscore-dangle
      await Submisions.updateOne({ _id: submision._id }, { $set: newInfo });
    }

    done();
  },
};
