/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */

const { ObjectId } = require("mongodb");

module.exports = {
  async up(db, done) {
    const Submisions = db.collection("submision");
    const Clients = db.collection("client");
    const Projects = db.collection("project");
    const Company = db.collection("company");
    const Users = db.collection("user");

    const cursor = Submisions.find({});
    const count = await cursor.count();
    let index = 1;

    // console.log(cursor);

    while (await cursor.hasNext()) {
      // will return false when there are no more results
      const submision = await cursor.next(); // actually gets the document
      // do something, possibly async with the current document
      // eslint-disable-next-line no-underscore-dangle
      console.log(index, "/", count, " : ", submision._id);

      const cleanSubmission = {};

      const fieldsToIgnore = [
        "startedAt",
        "completedAt",
        "userId",
        "__buildNumber",
        "__firstInstallTime",
        "__freeDiskStorage",
        "__ip",
        "__lastUpdateTime",
        "createdAt",
        "__agentPhoneNumber",
        "destroyed",
        "__agentMetaData",
        "__isEmulator"
      ];

      Object.keys(submision).map(key => {
        const number = Number(submision[key]);
        if (
          !isNaN(number) &&
          !fieldsToIgnore.includes(key) &&
          typeof submision[key] !== Boolean
        ) {
          cleanSubmission[key] = number;
          cleanSubmission[`${key}_original`] = submision[key];
        } else {
          cleanSubmission[key] = submision[key];
        }
      });

      delete cleanSubmission._id;

      // eslint-disable-next-line no-underscore-dangle
      await Submisions.updateOne(
        { _id: submision._id },
        { $set: cleanSubmission }
      );

      index += 1;
    }

    done();
  }
};
