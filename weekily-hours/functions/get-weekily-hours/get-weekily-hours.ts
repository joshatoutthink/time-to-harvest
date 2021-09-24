import { config } from "dotenv";
import fetch from "node-fetch";
import { Handler } from "@netlify/functions";
import { TimeEntry } from "./types.ts";

config();
console.log("WEEKILY HOURS");

const USER_ID = process.env.USER_ID;
const TOKEN = process.env.HARVEST_TOKEN;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const SLACK_URL = process.env.SLACK_URL;
const BASE_API = "https://api.harvestapp.com";
const oneWeek = 1000 * 60 * 60 * 24 * 7;

const example: Handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" }),
  };
};

const handler: Handler = async function app() {
  if (!USER_ID) return;
  const usersTimeSheet = await getTimeEntries(USER_ID);
  const userName = usersTimeSheet[0].user.name;
  const hours = userPastWeekHours(usersTimeSheet);
  const message = template({
    title: "My Week",
    text: `Some of what ${userName} did this past week`,
    data: hours,
  });
  const body = JSON.stringify({ text: "hello", ...message });
  await fetch(
    SLACK_URL,
    {
      "Content-type": "application/json",
      method: "POST",
      body,
    },
  ).then((res: Record<string, any>) => res.text()).catch(console.error);
  return {
    statusCode: 200,
    body,
  };
};
export { handler };

function userPastWeekHours(timeEntries: TimeEntry[]) {
  const totalHours = getTotalHours(timeEntries);

  const totalPercent = (totalHours / 35) * 100;
  const leftOver = 100 - totalPercent;

  const hoursByProject = projectHours(timeEntries, totalHours);

  return { totalHours, leftOver, hoursByProject };
}

function getTotalHours(timeEntries: TimeEntry[]) {
  return timeEntries.reduce((total, { hours }) => {
    return total + hours;
  }, 0);
}

async function getTimeEntries(userid: string) {
  const data: { time_entries: TimeEntry[] } = await fetch(
    `${BASE_API}/v2/time_entries?user_id=${userid}&from=${
      new Date(
        new Date().getTime() - oneWeek,
      ).toISOString()
    }`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ["Harvest-Account-Id"]: `${ACCOUNT_ID}`,
        ["User-Agent"]: `TimeToHarvest(josh@outthinkgroup.com)`,
      },
    },
  ).then((res) => res.json());
  const timeEntries = data.time_entries;
  return timeEntries;
}

function projectHours(timeEntries: TimeEntry[], totalHours: number) {
  const projectsWorkedOnHours = timeEntries.reduce((projects, entry) => {
    const { hours, project } = entry;
    const { name }: { name: string; id: number } = project;
    if (!projects[name]) {
      projects[name] = 0;
    }
    projects[name] += hours;
    return projects;
  }, {} as Record<string, number>);

  const projectsWorkedOn = Object.keys(projectsWorkedOnHours).reduce(
    (projects, key) => {
      return {
        ...projects,
        [key]: {
          hours: projectsWorkedOnHours[key],
          percent: projectsWorkedOnHours[key] / totalHours,
        },
      };
    },
    {} as Record<string, { hours: number; percent: number }>,
  );
  return projectsWorkedOn;
}

function format(
  args: {
    title: string;
    text: string;
    data: Record<string, any>;
  },
  debug = false,
) {
  if (debug) {
    console.log(JSON.stringify(template(args)));
  } else {
    console.log("TODO send to slack");
  }
}
function template({ title, text, data }: {
  title: string;
  text: string;
  data: Record<string, any>;
}) {
  return {
    blocks: [
      {
        type: "image",
        title: {
          type: "plain_text",
          text: text,
          emoji: true,
        },
        image_url:
          "https://is5-ssl.mzstatic.com/image/thumb/Purple3/v4/d3/72/5c/d3725c8f-c642-5d69-1904-aa36e4297885/source/256x256bb.jpg",
        alt_text: text,
      },
    ],
  };
}

function test() {
  return {
    text: "Danny Torrence left a 1 star review for your property.",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Danny Torrence left the following review for your property:",
        },
      },
      {
        type: "section",
        block_id: "section567",
        text: {
          type: "mrkdwn",
          text:
            "<https://example.com|Overlook Hotel> \n :star: \n Doors had too many axe holes, guest in room 237 was far too rowdy, whole place felt stuck in the 1920s.",
        },
        accessory: {
          type: "image",
          image_url:
            "https://is5-ssl.mzstatic.com/image/thumb/Purple3/v4/d3/72/5c/d3725c8f-c642-5d69-1904-aa36e4297885/source/256x256bb.jpg",
          alt_text: "Haunted hotel image",
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: "*Average Rating*\n1.0",
          },
        ],
      },
    ],
  };
}
