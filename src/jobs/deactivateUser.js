'use strict'
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
  emediate:false,
  async work({ db }) {
    console.log("running a task every minute");
    const col = db.collection("user");
    // Show that duplicate records got dropped
    const users = await col.find({}).toArray();
    users.map(user => {
      //get dates
      var dateB = moment(new Date()); //current date
      var dateC = moment(ObjectId(String(user._id)).getTimestamp()); //date when object was created

      var diff = dateB.diff(dateC, "days"); //get the difference

      if (diff === 40) {
        //if user was created 40 day ago check if he has been activated
        user.userActivated == false
          ? db
              .collection("user_deactivation") //if not activated add in user_deactivation
              .replaceOne({ user }, { user }, { upsert: true })
          : "";
      } else {
        db.collection("user_activated").replaceOne(
          //else add in user_activated
          { user },
          { user },
          { upsert: true }
        );
      }
    });
  },
  opts: {
    schedule: true
  }
};
