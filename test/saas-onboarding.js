/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const chai = require('chai');

const { assert } = chai;
const chaiHttp = require('chai-http');
const { map } = require('async');


const { expect } = require('chai');
require('chai').should();

const { MongoClient } = require('mongodb');

let db;

chai.use(chaiHttp);

let clientId;
let userId;
let roleId;

const { NATS_URL, NODE_ENV, LOG_LEVEL = 'silent' } = process.env;

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: NATS_URL,
});
const { httpServer: server, config } = require('../dist');

const hemera = new Hemera(nats, {
  logLevel: LOG_LEVEL,
});

const registrationData = {
  password: 'superSecret',
  email: 'org1@root.com',
  contact: '+2547 123 546 ',
  firstName: 'bran',
  orgName: 'org',
};

let token;

// eslint-disable-next-line func-names
describe('Onboarding Test Run', function () {
  this.timeout(5000);
  before((done) => {
    // connect to nats and mongodbi
    MongoClient.connect(
      config[NODE_ENV].db.url,
      {
        useNewUrlParser: true,
        // server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
      },
      (err, database) => {
        if (err) throw err;
        console.log('Database connection created!');
        db = database;
        const dbo = db.db(config[NODE_ENV].db.name);
        // delete the test collections then call done
        dbo.listCollections().toArray((err, items) => {
          if (err) throw err;

          if (items.length === 0) {
            console.log(
              `No collections in database ${config[NODE_ENV].db.name}`,
            );
            return done();
          }

          map(
            items,
            (item, next) => {
              dbo.dropCollection(item.name, (dropErr) => {
                if (dropErr) throw dropErr;
                console.log('Dropped ', item.name);
                next();
              });
            },
            (loopErr) => {
              if (loopErr) console.error(loopErr.message);
              console.log('All collections dropped \n');
              done();
            },
          );
        });
      },
    );
  });
  after((done) => {
    db.close();
    done();
  });
  describe('SAAS onboardding', () => {
    it('should register from saas register', (done) => {
      hemera.act(
        {
          topic: 'registration',
          cmd: 'saas-registration',
          data: registrationData,
        },
        () => {
          // give it a sec to finish creating everything on db
          setTimeout(done, 1000);
        },
      );
    });
    it('should login to a saas user', (done) => {
      chai
        .request(server)
        .post('/saasAuth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .end((err, res) => {
          if (err) {
            console.log(err);
          }
          if (res.body.message) {
            console.log(JSON.stringify(res.body.message, null, '\t'));
          }

          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body._id.should.exist;
          res.body.token.should.exist;
          res.body.token.should.be.a('string');

          // eslint-disable-next-line prefer-destructuring
          token = res.body.token;
          done();
        });
    });
    it('should login to a mobile user', (done) => {
      chai
        .request(server)
        .post('/auth/login')
        .send({
          phone: registrationData.contact,
          password: registrationData.password,
        })
        .end((err, res) => {
          if (res.body.message) {
            console.log(JSON.stringify(res.body.message, null, '\t'));
          }

          expect(err).to.be.null;
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body._id.should.exist;
          res.body.token.should.exist;
          res.body.token.should.be.a('string');

          // eslint-disable-next-line prefer-destructuring
          token = res.body.token;

          setTimeout(done, 2000);
        });
    });
    it('graph for org should be constructed', (done) => {
      chai
        .request(server)
        .post('/graphql')
        .set('auth', token)
        .send({
          query: `query {
            users{
              id,
              firstName
            }
            user {
              id,
              firstName,
              teams{
                id,
                name
              }
              roles{
                id,
                name
                company{
                  id
                }
              }
              client {
                id,
                name,
                roles{
                  id,
                  name
                }
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
          variables: JSON.stringify({}),
        })
        .end((err, res) => {
          if (res.body.errors) {
            console.log(JSON.stringify(res.body.errors[0], null, '\t'));
          }

          expect(res).to.be.json;
          expect(res.body.errors).to.be.undefined;
          res.should.have.status(200);
          expect(res.body).to.exist;
          res.body.should.be.a('object');
          res.body.data.users[0].should.exist;
          res.body.data.user.should.exist;
          res.body.data.user.id.should.exist;
          res.body.data.user.client.should.exist;
          res.body.data.user.client.id.should.exist;

          // user has been assigned the correct roles
          res.body.data.user.client.roles.should.exist;
          res.body.data.user.client.roles[0].id.should.exist;
          res.body.data.user.client.roles[0].name.should.exist;

          res.body.data.user.roles[0].name.should.exist;
          res.body.data.user.roles[0].id.should.exist;
          res.body.data.user.roles[0].company.id.should.exist;

          // project one
          res.body.data.user.client.projects[0].should.exist;
          res.body.data.user.client.projects[0].questionnaire.should.exist;
          res.body.data.user.client.projects[0].questionnaire.id.should.exist;
          res.body.data.user.client.projects[0].questionnaire.pages[0].id.should
            .exist;

          clientId = res.body.data.user.client.id;
          userId = res.body.data.user.id;

          done();
        });
    });
    // it("graph should fetch all the demo items needed", done => { done() })
    it('it should  insert a new user', (done) => {
      chai
        .request(server)
        .post('/graphql')
        .set('auth', token)
        .send({
          query: `
        mutation($user:newUser!){
          userMutations{
              create(user:$user){
            id
          }
          }
        }
        `,
          variables: JSON.stringify({
            user: {
              firstName: 'xxx',
              middleName: 'xxx',
              lastName: 'x',
              email: 'xx@gmail.com',
              city: 'xx',
              address: '12345',
              phoneNumber: '1234567',
              mobileMoneyNumber: '1234567',
              password: '1234567',
              client: clientId,
            },
          }),
        })
        .end((err, res) => {
          if (res.body.errors) {
            console.log(JSON.stringify(res.body.errors), null, '\t');
          }
          expect(res.body.errors).to.be.undefined;
        });

      done();
    });
    it('should insert a new role', (done) => {
      chai
        .request(server)
        .post('/graphql')
        .set('auth', token)
        .send({
          query: `mutation ($role:newRole!){
          roleMutations{
             create(role:$role){
               id
             }
          }
         }
          `,
          variables: JSON.stringify({
            role: {
              clientId,
              name: 'insertedtestAdmin',
            },
          }),
        })
        .end((err, res) => {
          if (err) { console.log(err); }
          res.body.data.roleMutations.create.id.should.exist;
          roleId = res.body.data.roleMutations.create.id;
        });

      done();
    });
    it('update the roles', (done) => {
      chai
        .request(server)
        .post('/graphql')
        .set('auth', token)
        .send({
          query: `mutation ($role:newRole!){
            roleMutations{
              update(role:$role){
                id
              }
            }
          }`,
          variables: JSON.stringify({
            role: {
              id: roleId,
              name: 'updateAdmin',
            },
          }),
        });
      done();
    });
  });
});
