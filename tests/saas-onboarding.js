let chai = require("chai");
let chaiHttp = require("chai-http");
var DatabaseCleaner = require('database-cleaner');
var { map } = require("async");

let { default: server } = require("../dist");

var expect = require('chai').expect;
var should = require('chai').should();
var { MongoClient } = require("mongodb");
const HemeraTestsuite = require('hemera-testsuite')

const {
  MONGO_URL = 'mongodb://localhost:27017',
  PORT = '6242'
} = process.env

let db;

chai.use(chaiHttp);

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: process.env.NATS_URL,
});
const hemera = new Hemera(nats, {
  logLevel: 'silent'
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

    MongoClient.connect(
      MONGO_URL,
      {
        useNewUrlParser: true,
        server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
      },
      (err, database) => {
        if (err) throw err;
        console.log("Database connection created!");
        db = database;
        var dbo = db.db("besak");
        // delete the test collections then call done
        dbo.listCollections()
          .toArray(function (err, items) {
            if (err) throw err;

            if (items.length == 0) {
              console.log("No collections in database")
              return done()
            }

            map(items, (item, next) => {
              dbo.dropCollection(item.name, function (err, delOK) {
                if (err) throw err;
                next()
              });
            }, err => {
              if (err) console.error(err.message);
              console.log("All collections dropped");
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
    it("should login to a saas user", done => {
      chai
        .request(server)
        .post("/graphql")
        .set('auth', token)
        .send({
          query: `query {
            user {
              client {
                name
              }
            }
          }`,
          variables: JSON.stringify({})
        })
        .end((err, res) => {
          if (res.body.errors)
            console.log(JSON.stringify(res.body.errors[0], null, '\t'))
            
          expect(res.body.errors).to.be.null
          res.should.have.status(200);
          res.body.should.be.a("object");

          done();
        });
    });
    // it("graph should fetch all the demo items needed", done => { done() })
  });
});
