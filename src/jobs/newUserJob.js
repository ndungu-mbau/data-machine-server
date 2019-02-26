import cron from "node-cron";
import config from "../config";
import validator from "validator";
import { checkDocument } from "apollo-utilities";

export default {
  name: "NEW_USER",
  schedule: "* * * * *",
  async work({ db }) {
    console.log("running a NEW_USER every minute");
    //use user collection
    const col = db.collection("user");
    //fetch all users in the collection
    const users = await col.find({}).toArray();
    //loop through each collection
    let validatedUserobj = users.map(el => {
      validateUserObj(el);

       function validateUserObj(el) {
        let checkMail = new Promise((resolve,reject) => {
          if (!validator.isEmail(el.email)) {
            resolve({ ...el, EmailCheck: "Invalid email", flagged: true }) ;
          } else {
            resolve( { ...el });
          }
        });
        checkMail.then((el)=>{
            if (el.firstName.length === 0  ) {
                return({ ...el, firstNameCheck: "empty firstName", flagged: true }) ;
              } else {
                return( { ...el });
              }
        }).then((el)=>{
            if (el.lastName.length === 0  ) {
                return({ ...el, lastNameCheck: "empty lastName", flagged: true }) ;
              } else {
                return( { ...el });
              }
        }).then((el)=>{
            if (el.middleName.length === 0  ) {
                return({ ...el, middleNameCheck: "empty lastName", flagged: true }) ;
              } else {
                return( { ...el });
              }
        }).then((el)=>{
            console.log(el)
        })
      }
    });
  },
  opts: {
    schedule: true
  }
};
