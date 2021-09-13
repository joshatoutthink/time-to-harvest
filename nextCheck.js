import fs from "fs";
import path from "path";
import { dirname } from "./dirname.js";

export function canCheck() {
  return isWeekDay() && isWorkHours();
}

function isWorkHours() {
  const time = new Date().getHours();
  return time >= 9 && time <= 17;
}

function isWeekDay(dateString = Date.now()) {
  const weekend = [0, 6];
  const now = new Date(dateString);
  const day = now.getDay();
  return !weekend.some((d) => d === day);
}

// ONE DAY MAYBE USE THIS INSTEAD OF JUST CHECKING IF ITS WORKDAY CAN BE HELPFUL WHEN IMPLEMENTING SLEEP
const dayInMilli = 1000 * 60 * 60 * 24;
//-- STORGE --//
const configPath = path.resolve(dirname(import.meta), ".tthConfig.json");

async function readFromStorage() {
  const content = await read(configPath).catch(async () => {
    return read(
      path.resolve(dirname(import.meta), "./defaultConfig.json")
    ).catch((e) => {
      throw e;
    });
  });

  return content;
}

function read(file) {
  return new Promise((res, rej) => {
    fs.readFile(file, { encoding: "utf-8" }, (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });
}
