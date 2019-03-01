import cron from "node-cron";
import config from "../config";
import validator from "validator";
import { checkDocument } from "apollo-utilities";
import { string } from "postcss-selector-parser";

export default {
  name: "NEW_USER",
  schedule: "* * * * *",
  async work({ db }) {
    console.log("running a NEW_USER every minute");
    //use user collection
    const col = db.collection("user");
    //fetch all users in the collection
    const users = await col.find({}, { firstName: true, _id: false }).toArray();
    const validateUserObjcol = await db.createCollection("validateUsers");

    //loop through each collection
    users.map(el => {
      validateUserObj(el);

      function validateUserObj(el) {
        //check user mail field and return a promise
        let checkMail = new Promise((resolve, reject) => {
          if (!validator.isEmail(el.email)) {
            resolve({ ...el, EmailCheck: "Invalid email", flagged: true });
          } else {
            resolve({ ...el });
          }
        });

        checkMail
          //check firstmail and return a thenable
          .then(el => {
            if (el.firstName.length === 0) {
              return {
                ...el,
                firstNameCheck: "empty firstName",
                flagged: true
              };
            } else {
              return { ...el };
            }
          })
          //check lastname
          .then(el => {
            if (el.lastName.length === 0) {
              return { ...el, lastNameCheck: "empty lastName", flagged: true };
            } else {
              return { ...el };
            }
          })
          //check lastname
          .then(el => {
            if (el.middleName.length === 0) {
              return {
                ...el,
                middleNameCheck: "empty lastName",
                flagged: true
              };
            } else {
              return { ...el };
            }
          })
          //insert the object in validateUsers collection
          .then(el => {
            name(el);
            async function name(el) {
              console.log(
                db
                  .collection("validateUsers")
                  .replaceOne({ email: el.email }, { ...el }, { upsert: true })
              );
            }
          })
          .catch(err => {
            return err;
          });
      }
      let validusers = db
        .collection("validateUsers")
        .find({})
        .toArray();
      console.log(validusers);

      //  db.collection("validateUserObjcol").drop()
    });
  },
  opts: {
    schedule: true
  }
};
