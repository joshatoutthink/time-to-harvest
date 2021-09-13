import { execSync } from "child_process";

import { showNotification } from "./showNotification.js";
import { isTimerRunning } from "./harvest.js";
import { canCheck } from "./nextCheck.js";

async function run() {
  if (canCheck()) {
    const hasTimer = await isTimerRunning();
    if (!hasTimer) {
      await showNotification({
        passiveAction: () => execSync("open /Applications/Harvest.app"),
        action: () => console.log("sleepAction"),
      });
    }
  }
  console.log("running again");
  setTimeout(run, 1000 * 60 * 30); //run every 30 minutes
}
run();
