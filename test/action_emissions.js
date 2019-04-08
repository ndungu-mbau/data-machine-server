const { NATS_URL, NODE_ENV, LOG_LEVEL = 'silent' } = process.env;

const chai = require('chai');

var assert = chai.assert;
const chaiHttp = require('chai-http');
require("chai").should()
const { map } = require('async');
const Hemera = require('nats-hemera'); const nats = require('nats').connect({
    url: NATS_URL
});

const hemera = new Hemera(nats, {
    logLevel: LOG_LEVEL
});

describe('my suite', () => {
    it('it tests saas user created actions', () => {
        hemera.add(
            {
                pubsub$: true,
                topic: 'ACTION_EMMISION',
                cmd: 'SAAS_USER_CREATED'
            },
            function (req) {
                req.data._id.should.exist
            }
        )
    });
    it('it tests client user created actions', () => {
        hemera.add(
            {
                pubsub$: true,
                topic: 'ACTION_EMMISION',
                cmd: 'CLIENT_CREATED'
            },
            function (req) {
                req.data._id.should.exist
            }
        )
    });
    it("graph should be subscribe to a new user created", done => {
        hemera.add(
            {
                pubsub$: true,
                topic: 'ACTION_EMMISION',
                cmd: 'USER_CREATED'
            },
            function (req) {
                req.data._id.should.exist
            }
        )
        done()
    })
});


