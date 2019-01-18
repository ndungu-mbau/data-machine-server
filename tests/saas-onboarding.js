let chai = require("chai");
let chaiHttp = require("chai-http");

let server = require("../dist");

console.log(server);
let should = chai.should();
var { MongoClient } = require("mongodb");

const testMongoUrl = process.env.MONGO_URL;
let db;

chai.use(chaiHttp);

describe("Books", () => {
  beforeEach(done => {
    MongoClient.connect(
      testMongoUrl,
      { useNewUrlParser: true },
      (err, database) => {
        if (err) throw err;
        console.log("Database created!");
        db = database;

        // delete the test database then call done
        done();
      }
    );
  });
  describe("/GET book", () => {
    it("it should GET all the books", done => {
      chai
        .request(server)
        .post("/register")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.length.should.be.eql(0);
          done();
        });
    });
  });
});
