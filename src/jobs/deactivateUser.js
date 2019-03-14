import cron from "node-cron";
import config from "../config";
import * as moment from "moment";
import { ObjectId } from "mongodb";

const parameters = {
  time_unit: "months",
  time_ammount: "2",
  mail_name: "registration"
};

export default {
  name: "DEACTIVATE_USERS",
  schedule: "* * * * *",
  emediate: true,
  async work({ db }) {
    console.log("running a task every minute");
    const col = db.collection("user");
    // Show that duplicate records got dropped
    const users = await col.find({}).toArray();
    users.map(user => {
   console.log(user)
      var dateB = moment(new Date());
      var dateC = moment(ObjectId(String(user._id)).getTimestamp());
    //   var dateC = moment("2019-01-11");
    var diff=dateB.diff(dateC, 'days')
      if (diff === 40){
        
          console.log('user created 6 days ago',user)
      }else{
          console.log('')
      }
    });
  },
  opts: {
    schedule: true
  }
};
