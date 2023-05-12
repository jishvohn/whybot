export const SERVER_HOST = import.meta.env.DEV
  ? "http://localhost:6823"
  : "https://whybot.herokuapp.com";

export const SERVER_HOST_WS = import.meta.env.DEV
  ? "ws://localhost:6823"
  : "wss://whybot.herokuapp.com";
