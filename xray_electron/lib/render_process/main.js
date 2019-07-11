process.env.NODE_ENV = "production";

const { React, ReactDOM, App, buildViewRegistry } = require("xray_ui");
const XrayClient = require("../shared/xray_client");
const QueryString = require("querystring");
const $ = React.createElement;

async function start() {
  const url = window.location.search.replace("?", "");
  const { socketPath, windowId } = QueryString.parse(url);

  const xrayClient = new XrayClient();
  await xrayClient.start(socketPath);
  const viewRegistry = buildViewRegistry(xrayClient);

  let initialRender = true;
  xrayClient.addMessageListener(message => {
    switch (message.type) {
      case "UpdateWindow":
        viewRegistry.update(message);
        if (initialRender) {
          ReactDOM.render(
            $(App, { inBrowser: false, viewRegistry }),
            document.getElementById("app")
          );
          initialRender = false;
        }
        break;
      default:
        console.warn("Received unexpected message", message);
    }
  });

  xrayClient.sendMessage({
    type: "StartWindow",
    window_id: Number(windowId),
    height: window.innerHeight
  });
}

start();
