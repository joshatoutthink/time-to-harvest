import { Handler, HandlerEvent } from "@netlify/functions";
import { createCanvas } from "canvas";

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

const handler: Handler = async (event: HandlerEvent) => {
  const { queryStringParameters } = event;

  const entries = decodeURIComponent(queryStringParameters.entries).split(",")
    .map(
      (entry: string) => {
        const [label, hours] = entry.split(":");
        return ({ label, hours: parseInt(hours) });
      },
    );

  const biggestRect = entries.reduce(
    (
      m: { label: string; hours: number },
      c: { label: string; hours: number },
    ) => m.hours >= c.hours ? m : c,
    { hours: 0, label: "first" },
  ).hours;

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

  entries.filter((entry) => Boolean(entry.label)).sort((a, b) =>
    a.hours > b.hours ? -1 : 1
  )
    .filter((e, i) => i < MAX_ENTRIES) // just gets the first five TODO use slice
    .map((entry: { label: string; hours: number }, i: number) => {
      const x = rectWidth * i;
      const rectHeight = getHeight(
        isNaN(entry.hours) ? 0 : entry.hours,
        biggestRect,
      );
      const y = GRAPH_HEIGHT - rectHeight;

      const color = getColor();
      return {
        x,
        y,
        label: entry.label,
        hours: entry.hours,
        height: rectHeight,
        color,
      };
    }).forEach(
      (
        rect: {
          label: string;
          hours: number;
          color: string;
          x: number;
          y: number;
          height: number;
        },
        i,
      ) => {
        //Draw your image.

        //graph
        ctx.fillStyle = rect.color;
        ctx.fillRect(
          PADDING + rect.x,
          PADDING + rect.y,
          rectWidth,
          rect.height,
        );

        //legend
        ctx.fillRect(
          (CANVAS_WIDTH - LEGEND_WIDTH) + PADDING,
          PADDING + (i * 20),
          LEGEND_COLOR_SIZE,
          LEGEND_COLOR_SIZE,
        ); // color block uses the same fillStyle

        // label
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "white";
        ctx.fillText(
          rect.label,
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

function getHeight(rect: number, max: number) {
  const maxRatio = GRAPH_HEIGHT * max;
  const ratio = GRAPH_HEIGHT * rect;
  return (ratio / maxRatio) * GRAPH_HEIGHT;
}

function colorGenerator() {
  const cache = new Map();
  const getHue = (): number => {
    const attempt = Math.floor((Math.random() * 360));
    if (cache.has(attempt)) {
      return getHue();
    }
    return attempt;
  };
  return function getColor() {
    const hue = getHue();
    return `hsl(${hue}, 75%, 70%)`;
  };
}
