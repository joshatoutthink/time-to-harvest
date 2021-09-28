import { Handler, HandlerEvent } from "@netlify/functions";
import { createCanvas } from "canvas";

console.log("hey");
const handler: Handler = async (event: HandlerEvent) => {
  const { queryStringParameters } = event;

  const entries = queryStringParameters.entries.split(",").map(
    (entry: string) => {
      const [label, hours] = entry.split(":");
      return ({ label, hours: parseInt(hours) });
    },
  );
  const canvas = createCanvas(200, 200);
  const rectWidth = 200 / entries.length;
  const biggestRect = entries.reduce(
    (
      m: { label: string; hours: number },
      c: { label: string; hours: number },
    ) => m.hours >= c.hours ? m : c,
    0,
  ).hours;

  const ctx = canvas.getContext("2d");

  const getColor = colorGenerator();
  entries.map((entry: { label: string; hours: number }, i: number) => {
    const x = rectWidth * i;
    const rectHeight = getHeight(entry.hours, biggestRect);
    const y = 200 - rectHeight;

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
    ) => {
      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x, rect.y, rectWidth, rect.height);
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
  const maxRatio = 200 * max;
  const ratio = 200 * rect;
  return (ratio / maxRatio) * 200;
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
