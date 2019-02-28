import cron from "node-cron";
import config from "../config";
import * as moment from "moment";
import { ObjectId } from "mongodb";
import { strict } from "assert";
export default {
  name: "EMAIL_JOB",
  schedule: "* * * * *",
  async work({ db }) {
    console.log("running a email job task every minute");
    const col = db.collection("user");
    // Show that duplicate records got dropped
    const users = await col.find({}).toArray();
    let userWithTimestamps = users.map(el => {
      return { ...el, UserCreatedAt:new Date(ObjectId(String(el._id)).getTimestamp() ).toLocaleString() ,welcomeMail:false ,verificatioMail:false ,resetpasswordMail:false,accountDormantMail:false  };
    });
var dateB = moment('2019-02-30T07:46:39.000Z').format();
var dateC = moment('2019-02-26T07:46:39.000Z').format();

userWithTimestamps.map((el)=>{
    console.log(el)
})
// console.log('Difference is ', dateB.diff(dateC), 'milliseconds');
// console.log('Difference is ', dateB.diff(dateC, 'days'), 'days');

},
  opts: {
    schedule: true
  }
};
