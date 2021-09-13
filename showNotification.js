import notifier from "node-notifier";

const nc = new notifier.NotificationCenter();
const Sleep = "Sleep 1 day";

async function showNotification({ passiveAction, action }) {
  return new Promise((resolve, reject) => {
    nc.notify(
      {
        title: "Harvest Timer",
        message: "You forgot to set a timer",
        closeLabel: "Set Timer",
        actions: Sleep,
        timeout: 300,
      },
      (err, response, metadata) => {
        if (err) {
          reject(err);
        }
        if (metadata.activationValue == Sleep) {
          action();
          resolve();
        } else {
          //todo handle timeout
          console.log({ response, metadata });
          passiveAction();
          resolve();
        }
      }
    );
  });
}

export { showNotification };
