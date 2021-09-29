import { Handler, HandlerEvent } from "@netlify/functions";
import { createCanvas, registerFont } from "canvas";
import fs from "fs";
const path = procees.env.IMAGE_PATH;
registerFont(`${path}/Roboto-Bold.ttf`, { family: "Roboto Bold" });

const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 236;
const MAX_ENTRIES = 5;

const PADDING = 5;

const GRAPH_HEIGHT = CANVAS_HEIGHT;
const GRAPH_WIDTH = CANVAS_WIDTH * .66; // 2/3s the width

const LEGEND_WIDTH = CANVAS_WIDTH - GRAPH_WIDTH + 1; //overlap a lil so we dont get faint white line
const LEGEND_HEIGHT = CANVAS_HEIGHT;
const LEGEND_COLOR_SIZE = 10;

const LINE_HEIGHT = 20;
const STROKE_WIDTH = 40;

const handler: Handler = async (event: HandlerEvent) => {
  const { queryStringParameters } = event;

  const entries = decodeURIComponent(queryStringParameters.entries).split(",")
    .map(
      (entry: string) => {
        const [label, hours] = entry.split(":");
        return ({ label, hours: parseInt(hours) });
      },
    );

  const totalHours = entries.reduce(
    (
      m: number,
      c: { label: string; hours: number },
    ) => m + c.hours,
    0,
  );

  //set up the canvas
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const rectWidth = GRAPH_WIDTH / MAX_ENTRIES;
  const ctx = canvas.getContext("2d");

  //Setup backgrounds
  //graph
  ctx.fillStyle = `#172636`;
  ctx.fillRect(
    0, //x
    0, //y
    GRAPH_WIDTH, // BG no padding thats why we cant use the GRAPH_WIDTH
    GRAPH_HEIGHT,
  );
  //legend
  ctx.fillStyle = `#0E141B`;
  ctx.fillRect(
    CANVAS_WIDTH - LEGEND_WIDTH,
    0, //y
    LEGEND_WIDTH,
    LEGEND_HEIGHT, //height
  );

  const getColor = colorGenerator();

  let startingAngle = 0; // some State to keep track of where we last left of in the pie chart
  let endingAngle = 0;
  entries.filter((entry) => Boolean(entry.label)).sort((a, b) =>
    a.hours > b.hours ? -1 : 1
  )
    .filter((e, i) => i < MAX_ENTRIES) // just gets the first five TODO use slice
    .map((entry: { label: string; hours: number }, i: number) => {
      const color = getColor();
      return {
        label: entry.label,
        hours: entry.hours,
        color,
      };
    }).forEach(
      (
        entry: {
          label: string;
          hours: number;
          color: string;
        },
        i,
      ) => {
        //Draw your image.

        //graph
        const radius = (GRAPH_HEIGHT - PADDING - STROKE_WIDTH) / 2;
        const center = [
          GRAPH_WIDTH / 2,
          GRAPH_HEIGHT / 2,
        ];
        startingAngle = endingAngle;
        endingAngle = endingAngle +
          ((Math.PI * 2) * (entry.hours / totalHours));

        ctx.fillStyle = entry.color;
        ctx.strokeStyle = entry.color;
        ctx.beginPath();
        ctx.lineWidth = STROKE_WIDTH;
        ctx.arc(
          center[0],
          center[1],
          radius,
          startingAngle,
          endingAngle,
          false,
        );
        ctx.stroke();

        //legend
        ctx.fillRect(
          (CANVAS_WIDTH - LEGEND_WIDTH) + PADDING,
          PADDING + (i * 20),
          LEGEND_COLOR_SIZE,
          LEGEND_COLOR_SIZE,
        ); // color block uses the same fillStyle

        // label
        ctx.font = "12px 'Roboto Bold'";
        ctx.fillStyle = "white";
        ctx.fillText(
          entry.label,
          (CANVAS_WIDTH - LEGEND_WIDTH) + PADDING + (LEGEND_COLOR_SIZE * 2), // double color block size for extra spacing
          PADDING + 9 + i * LINE_HEIGHT, //the 9 helps center the text with the color block
        );
      },
    );

  const buf = canvas.toBuffer();

  return {
    statusCode: 200,
    body: buf.toString("base64"),
    isBase64Encoded: true,
  };
};
export { handler };

function colorGenerator() {
  let hue = Math.floor(Math.random() * 360);
  const increment = 360 / MAX_ENTRIES;
  const getHue = (): number => {
    const currentHue = hue;
    hue = hue + increment;
    return currentHue;
  };
  return function getColor() {
    const hue = getHue();
    return `hsl(${hue}, 75%, 70%)`;
  };
}
