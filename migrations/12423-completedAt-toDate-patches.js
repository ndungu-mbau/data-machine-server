/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */


const { ObjectId } = require('mongodb');

module.exports = {
  async up(db) {
    const Submisions = db.collection('submision');

    const cursor = Submisions.find({});
    const count = await cursor.count();
    let index = 1;

    // console.log(cursor);

    while (await cursor.hasNext()) {
      // will return false when there are no more results
      const submision = await cursor.next(); // actually gets the document
      // do something, possibly async with the current document
      // eslint-disable-next-line no-underscore-dangle
      console.log(index, '/', count, ' : ', submision._id);

      console.log('processing with', {
        client: submision.client,
        completedAt: submision.completedAt,
      });

      // add the following fields
      const newInfo = {
        completedAt: new Date(submision.completedAt),
        startedAt: new Date(submision.startedAt),
        createdAt: new Date(submision.createdAt)
      };

      console.log({ newInfo });

      // eslint-disable-next-line no-underscore-dangle
      await Submisions.updateOne({ _id: submision._id }, { $set: newInfo });

      index += 1;
    }
  },
};
