import { readable, writable } from "svelte/store";
import { v4 as uuidv4 } from 'uuid';

let user = localStorage.getItem("userUuid");

if (!user) {
  // user = crypto.randomUUID().toString();
  user = uuidv4();
  localStorage.setItem("userUuid", user);

} 

const userUuid = readable(user);

let storedCurrentAssignment = localStorage.getItem("currentAssignment")

if(!storedCurrentAssignment) {
  storedCurrentAssignment = 1;
  localStorage.setItem("currentAssignment", storedCurrentAssignment);
}

const currentAssignment = writable(storedCurrentAssignment)

currentAssignment.subscribe(value => {
  localStorage.setItem("currentAssignment", value);
})


export {userUuid, currentAssignment};