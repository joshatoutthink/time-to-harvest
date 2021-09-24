import { Handler } from "@netlify/functions";
import { createCanvas } from "canvas";

const handler: Handler = async (event, context) => {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "reen'";
  ctx.fillRect(20, 10, 150, 100);

  const buf = canvas.toBuffer();

  return {
    statusCode: 200,
    body: buf.toString("base64"),
    isBase64Encoded: true,
  };
};
export { handler };
