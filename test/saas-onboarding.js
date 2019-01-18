let chai = require("chai");
let chaiHttp = require("chai-http");
var { map } = require("async");

let {
  httpServer: server,
  config
} = require("../dist");

var expect = require('chai').expect;
require('chai').should();

var { MongoClient } = require("mongodb");

let db;

chai.use(chaiHttp);

const {
  NATS_URL,
  NODE_ENV,
  LOG_LEVEL = 'silent'
} = process.env

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: NATS_URL,
});
const hemera = new Hemera(nats, {
  logLevel: LOG_LEVEL
})

const registrationData = {
  "username": "branson",
  "password": "passw",
  "email": "sirbranson67@gmail.com",
  "name": "branson+gitomeh",
  "contact": "+254711657108",
  "address_1": "78024+nairobi",
  "city": [
    "nairobi",
    "nairobi"
  ],
  "state": [
    "Nairobi",
    "Nairobi"
  ],
  "address_2": "78024+nairobi,+NA",
  "zip": "78024",
  "country": "KE",
  "company_name": "braiven.io",
  "company_registration_id": "braiven.io",
  "company_email": "gitomehbranson@gmail.com",
  "company_contact": "sabek+systems",
  "communications.email": "on",
  "communications.sms": "on",
  "card_holder_name": "",
  "card_number": "",
  "billing_card_exp_month": "01",
  "billing_card_exp_year": "2018",
  "cvv": "",
  "address_line_1": "78024+nairobi,+NA",
  "address_line_2": "78024+nairobi",
  "zip_code": "78024",
  "billing_country": "KE",
  "membership": "premium",
  "promotions": "on",
  "accept": "on",
}

let token;

describe("Books", () => {
  before(done => {
    // connect to nats and mongodbi
    console.log(`${config[NODE_ENV].db.url}/${config[NODE_ENV].db.name}`)
    MongoClient.connect(
      `${config[NODE_ENV].db.url}/${config[NODE_ENV].db.name}`,
      {
        useNewUrlParser: true,
        // server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
      },
      (err, database) => {
        if (err) throw err;
        console.log("Database connection created!");
        db = database;
        var dbo = db.db(config[NODE_ENV].db.name);
        // delete the test collections then call done
        dbo.listCollections()
          .toArray(function (err, items) {
            if (err) throw err;

            if (items.length == 0) {
              console.log("No collections in database " + config[NODE_ENV].db.name)
              return done()
            }

            map(items, (item, next) => {
              dbo.dropCollection(item.name, function (err, delOK) {
                if (err) throw err;
                // console.log("Dropped ",item.name)
                next()
              });
            }, err => {
              if (err) console.error(err.message);
              console.log("All collections dropped \n");
              done()
            });
          });
      }
    );
  });
  after(done => {
    db.close();
    done()
  })
  describe("SAAS onboardding", () => {
    it("should register from saas register", done => {
      hemera.act(
        {
          topic: 'registratin',
          cmd: 'saas',
          data: registrationData
        },
        (err, resp) => {
          expect(err).to.be.null
          expect(err).to.be.null

          // this is called from the saas system so it redirects from there
          done()
        })
    });
    it("should login to a saas user", done => {
      chai
        .request(server)
        .post("/saasAuth/login")
        .send({
          email: registrationData.email,
          password: registrationData.password
        })
        .end((err, res) => {
          if (res.body.message)
            console.log(JSON.stringify(res.body.message, null, '\t'))

          expect(err).to.be.null
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body._id.should.exist
          res.body.token.should.exist
          res.body.token.should.be.a("string")

          token = res.body.token
          done();
        });
    });
    it("should login to a mobile user", done => {
      chai
        .request(server)
        .post("/auth/login")
        .send({
          phone: registrationData.contact,
          password: registrationData.password
        })
        .end((err, res) => {
          if (res.body.message)
            console.log(JSON.stringify(res.body.message, null, '\t'))

          expect(err).to.be.null
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body._id.should.exist
          res.body.token.should.exist
          res.body.token.should.be.a("string")

          token = res.body.token
          done();
        });
    });
    it("graph for org should be constructed", done => {
      chai
        .request(server)
        .post("/graphql")
        .set('auth', token)
        .send({
          query: `query {
            user {
              id,
              firstName,
              teams{
                id,
                name
              }
              client {
                id,
                name,
                teams{
                  id,
                  name,
                  projects{
                    id,
                    name,
                    questionnaire{
                      id,
                      name,
                      pages{
                        id,
                        name,
                        groups{
                          id,
                          name,
                          questions{
                            id,
                            tag,
                            position,
                            id,
                            type
                          }
                        }
                      }
                    }
                  }
                },
                projects{
                  id,
                  name,
                  teams{
                    id,
                    name
                  },
                  questionnaire{
                    id,
                    pages{
                      id,
                      name,
                      groups{
                        id,
                        name,
                        questions{
                          id,
                          tag,
                          position,
                          id,
                          type
                        }
                      }
                    }
                  }
                }
              }
            }
          }`,
          variables: JSON.stringify({})
        })
        .end((err, res) => {
          if (res.body.errors)
            console.log(JSON.stringify(res.body.errors[0], null, '\t'))

          expect(res).to.be.json;
          expect(res.body.errors).to.be.undefined
          res.should.have.status(200);
          res.body.should.be.a("object");

          console.log(JSON.stringify(res.body, null, '\t'))

          done();
        });
    });
    // it("graph should fetch all the demo items needed", done => { done() })
  });
});