import express from "express";
import { rateLimit, MemoryStore } from "express-rate-limit";
import { Configuration, OpenAIApi } from "openai";
import WebSocket from "ws";
import cors from "cors";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
config();

const store = new MemoryStore();

const PROMPT_LIMITS = {
  "openai/gpt3.5": 5,
  "openai/gpt4": 1,
};
const PORT = process.env.PORT || 6823;

function rateLimiterKey(model: string, fingerprint: string) {
  return model + "/" + fingerprint;
}

const rateLimiters = {
  "openai/gpt3.5": rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    max: PROMPT_LIMITS["openai/gpt3.5"],
    message: "You have exceeded the 5 requests in 24 hours limit!", // message to send when a user has exceeded the limit
    keyGenerator: (req) => {
      return rateLimiterKey(req.query.model as string, req.query.fp as string);
    },
    store,
    legacyHeaders: false,
    standardHeaders: true,
  }),
  "openai/gpt4": rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    max: PROMPT_LIMITS["openai/gpt4"],
    message: "You have exceeded the 1 request per day limit!", // message to send when a user has exceeded the limit
    keyGenerator: (req) => {
      return req.query.fp + "";
    },
    store: store,
    legacyHeaders: false,
    standardHeaders: true,
  }),
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Listen for WebSocket connections
wss.on("connection", (ws) => {
  // Handle incoming messages from the client
  ws.on("message", async (message) => {
    try {
      // Parse the message from the client
      const data = JSON.parse(message.toString());

      console.log("data", data);

      // Call the OpenAI API and wait for the response
      const response = await openai.createChatCompletion(
        {
          model: data.model,
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Non-JSON answers should be short, with a _max_ of 100 words.",
            },
            { role: "user", content: data.prompt },
          ],
          max_tokens: 200,
          temperature: data.temperature,
          n: 1,
        },
        { responseType: "stream" }
      );

      // Handle streaming data from the OpenAI API
      response.data.on("data", (data) => {
        // console.log("\nDATA", data.toString());
        let lines = data?.toString()?.split("\n");
        lines = lines.filter((line) => line.trim() !== "");
        // console.log("\nLINES", lines);
        for (const line of lines) {
          const message = line.replace(/^data: /, "");
          if (message === "[DONE]") {
            break; // Stream finished
          }
          try {
            const payload = JSON.parse(message);
            const completion = payload.choices[0].delta.content;
            if (completion != null) {
              ws.send(completion);
            }
          } catch (error) {
            console.error(
              "Could not JSON parse stream message",
              message,
              error
            );
          }
        }
      });

      // response.data.on('data', (chunk) => {
      //   // Extract the text from the chunk
      //   console.log("chunk", chunk);
      //   const result = JSON.parse(chunk.toString()).choices[0]?.text?.trim();
      //   console.log("result", result);
      //
      //   // Forward the result to the client via the WebSocket connection
      //   if (result) {
      //     ws.send(result);
      //   }
      // });

      // Handle the end of the stream
      response.data.on("end", () => {
        // Notify the client that the stream has ended
        ws.send("[DONE]");
      });
    } catch (error) {
      // Handle any errors that occur during the API call
      // console.error("Error:", error);
      ws.send(error + "");
    }
  });
});

// Upgrade HTTP connections to WebSocket connections
app.use("/ws", (req, res, next) => {
  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
    wss.emit("connection", ws, req);
  });
});

app.get("/api/completion", (req, res) => {
  const prompt = req.query.prompt as string;
  // OpenAI request
  // Respond with a JSON object that includes the received "prompt" value
  res.json({ receivedPrompt: prompt });
});

app.get("/api/prompts-remaining", (req, res) => {
  const key = rateLimiterKey(req.query.model as string, req.query.fp as string);
  console.log("KEY", key);

  const remaining = Math.max(
    (PROMPT_LIMITS[req.query.model as keyof typeof PROMPT_LIMITS] ?? 5) -
      (store.hits[key] ?? 0),
    0
  );

  res.json({
    remaining: remaining,
  });
});

app.get("/api/moar-prompts", (req, res) => {
  const key = rateLimiterKey(req.query.model as string, req.query.fp as string);
  store.hits[key] = (store.hits[key] ?? 0) - 3;
  console.log("Got moar prompts for", req.query.fp);
  res.json({
    message: "Decremented",
  });
});

app.get("/api/use-prompt", (req, res) => {
  const key = rateLimiterKey(req.query.model as string, req.query.fp as string);
  store.increment(key);
  res.json({
    message: `Used a token: ${key}`,
  });
});

app.get("/api/examples", (req, res) => {
  const examplesDir = path.join(__dirname, "examples");
  const exampleFiles = fs.readdirSync(examplesDir);
  const examples = exampleFiles.map((filename) => {
    const filePath = path.join(examplesDir, filename);
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  });
  res.json(examples);
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
