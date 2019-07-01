/* eslint-disable no-loop-func */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */

module.exports = {
  async up(db, done) {
    const Submisions = db.collection('submision');

    const cursor = Submisions.find({});
    const count = await cursor.count();
    let index = 1;

    // console.log(cursor);

    while (await cursor.hasNext()) {
      // will return false when there are no more results
      const submission = await cursor.next(); // actually gets the document

      console.log(index, '/', count, ' : ', submission._id);

      await db.collection(`${submission.__clientName}.${submission.__projectName}`).insertOne(submission);

      index += 1;
    }

    done();
  },
};
