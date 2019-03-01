import cron from "node-cron";
import config from "../config";
import validator from "validator";
import { checkDocument } from "apollo-utilities";
import { string } from "postcss-selector-parser";

const _email = async (x) =>{
  const flags = []

  if(x === ''){
    flags.push({
      message:'blank'
    })
  }

  return {
    _email_flags:flags
  }
}

const _firstname = async (x) =>{
  const flags = []

  if(x === ''){
    flags.push({
      message:'blank'
    })
  }

  return {
    _firstname_flag:flags
  }
}

const _middlename = async (x) =>{
  const flags = []

  if(x === ''){
    flags.push({
      message:'blank'
    })
  }

  return {
    _middlename_flag:flags
  }
}

const _lastname = async (x) =>{
  const flags = []

  if(x === ''){
    flags.push({
      message:'blank'
    })
  }

  return {
    _lastname_flag:flags
  }
}

export default {
  name: "NEW_USER",
  schedule: "* * * * *",
  emediate:false,
  async work({ db }) {
    // first store all validations on a map for access when running
    const validationsMap = {}
    const users = await db.collection("user").find({}).toArray();
    const user_validations = await db.collection("user_validation").find({}).toArray();

    user_validations.map(val=>validationsMap[val.email]=val)

    console.log("working with ",users.length )
    for (const i in users){
          const user = users[i]

          const {
            email,
            firstName,
            middleName,
            lastName
          } = user

          if(!email){
            return;
          }

          const issues = {};

          Object.assign(
            issues,
            await _email(email),
            await _firstname(firstName),
            await _middlename(middleName),
            await _lastname(lastName)
          )

          let validusers = await db
            .collection("user_validation")
            .updateOne(
              { email },
              { $set:issues },
              { upsert:true }
            )
    }
  },
  opts: {
    schedule: true
  }
};
