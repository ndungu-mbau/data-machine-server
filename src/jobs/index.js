import testJob from "./testJob"
import newUser from "./newUserJob"
import emailJob from "./emailJob"
import  deactivateUser from  './deactivateUser'
import { from } from "apollo-link";
const jobs = [
    emailJob,
    testJob,
    newUser,
    deactivateUser
]

export default jobs
