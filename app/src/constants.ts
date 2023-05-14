export const SERVER_HOST =
  import.meta.env.DEV && window.location.hostname === "localhost"
    ? "http://localhost:6823"
    : "https://whybot.herokuapp.com";

export const SERVER_HOST_WS =
  import.meta.env.DEV && window.location.hostname === "localhost"
    ? "ws://localhost:6823"
    : "wss://whybot.herokuapp.com";
