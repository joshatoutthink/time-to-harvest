import { config } from "dotenv";
import fetch from "node-fetch";
import { Handler, HandlerEvent } from "@netlify/functions";
import { TimeEntry } from "./types.ts";

config();
console.log("WEEKILY HOURS");

const USER_ID = process.env.USER_ID;
const TOKEN = process.env.HARVEST_TOKEN;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const BASE_API = "https://api.harvestapp.com";
const oneWeek = 1000 * 60 * 60 * 24 * 7;

const handler: Handler = async function app(event: HandlerEvent) {
  const slackUserName = parseBody(event.body).user_name;

  if (!slackUserName) {
    return {
      statusCode: 409,
      body: "error",
    };
  }
  const harvestId = await findHarvestId(slackUserName);
  if (!harvestId) {
    return {
      statusCode: 500,
      body: "ok",
    };
  }
  const usersTimeSheet = await getTimeEntries(harvestId);
  if (!usersTimeSheet.length) {
    return {
      statusCode: 404,
      body: "ok",
    };
  }
  const userName = usersTimeSheet[0].user.name;
  const hours = userPastWeekHours(usersTimeSheet);
  const data = Object.keys(hours.hoursByProject).map((key) => ({
    label: key,
    hours: hours.hoursByProject[key].hours,
  }));

  const title = `${userName}'s Week`;
  const info = textTemplate(data, userName);
  const message = template({
    title,
    text: info,
    data,
  });
  const body = JSON.stringify({
    ...message,
  });

  return {
    headers: {
      "Content-Type": "application/json",
    },
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
  ).then((res: any) => res.json());
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
    data: { label: string; hours: number }[];
  },
  debug = false,
) {
  if (debug) {
    console.log(JSON.stringify(template(args)));
  } else {
    console.log("TODO send to slack");
  }
}

function setEntries(entries: { label: string; hours: number }[]) {
  return entries.reduce(
    (params, entry: { label: string; hours: number }, index: number) => {
      return `${params}${entry.label}:${entry.hours}${
        index !== entries.length - 1 ? "," : ""
      }`;
    },
    "",
  );
}

function template({ title, text, data }: {
  title: string;
  text: string;
  data: { label: string; hours: number }[];
}) {
  return {
    blocks: [
      {
        type: "image",
        title: {
          type: "plain_text",
          text: title,
          emoji: true,
        },
        image_url:
          `https://outthink-harvest-bot.netlify.app/.netlify/functions/image?entries=${
            encodeURIComponent(setEntries(data))
          }`,
        alt_text: title,
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      },
    ],
  };
}

function textTemplate(
  data: { label: string; hours: number }[],
  userName: string,
) {
  const totalHours = data.reduce((acc, entry) => acc + entry.hours, 0);
  return `
*This week what ${userName} logged in harvest: _${totalHours}_ hrs*

*These are the Projects that make up those hours*

${
    data.map(({ label, hours }) => {
      return `  -		${label}: ${hours.toFixed(2)} hrs`;
    }).join("\n")
  }
		`;
}

function parseBody(body: string | undefined) {
  if (!body) {
    return null;
  }

  return body.split("&").reduce((obj, q) => {
    const [key, value] = q.split("=");
    obj[key] = value;
    return obj;
  }, {} as any);
}
async function findHarvestId(name: string) {
  //fetch harvest userNames and ids
  const { users }: { users: Record<string, string>[] } = await fetch(
    `${BASE_API}/v2/users`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ["Harvest-Account-Id"]: `${ACCOUNT_ID}`,
        ["User-Agent"]: `TimeToHarvest(josh@outthinkgroup.com)`,
      },
    },
  ).then((res: any) => res.json());

  const user = users.find((user: Record<string, string>) =>
    user.first_name.toLowerCase() == name.toLowerCase() ||
    user.first_name.toLowerCase().includes(name.toLowerCase())
  );
  console.log(user);
  if (user) {
    return user.id;
  } else {
    return null;
  }
}
