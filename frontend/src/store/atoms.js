import { atom } from "recoil";

export const user = atom({
  key: "user",
  default: null
});

export const isAuthenticated = atom({
  key: "isAuthenticated",
  default: localStorage.getItem("token") ? true : false
});