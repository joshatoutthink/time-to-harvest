//TODO add Node Fetch
import dontenv from "dotenv";
dontenv.config();
import fetch from "node-fetch";

const USER_ID = 1289470;
const TOKEN = process.env.HARVEST_TOKEN;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

const BASE_API = "https://api.harvestapp.com";

async function isTimerRunning() {
  const { time_entries } = await fetch(
    `${BASE_API}/v2/time_entries?user_id=${USER_ID}&is_running=true&updated_since=${new Date(
      new Date().setHours(0, 0, 0)
    ).toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ["Harvest-Account-Id"]: `${ACCOUNT_ID}`,
        ["User-Agent"]: `TimeToHarvest(josh@outthinkgroup.com)`,
      },
    }
  ).then((res) => res.json());

  console.log(time_entries);
  if (time_entries.length) {
    return true;
  }
  return false;
}

export { isTimerRunning };
