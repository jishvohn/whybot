import express from "express";
import { Configuration, OpenAIApi } from "openai";
import WebSocket from "ws";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
const PORT = process.env.PORT || 6823;

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
          model: "gpt-3.5-turbo",
          stream: true,
          messages: [{ role: "user", content: data.prompt }],
          max_tokens: 100,
          temperature: data.temperature,
          n: 1,
        },
        { responseType: "stream" }
      );

      // Handle streaming data from the OpenAI API
      response.data.on("data", (data) => {
        console.log("\nDATA", data.toString());
        let lines = data?.toString()?.split("\n");
        lines = lines.filter((line) => line.trim() !== "");
        console.log("\nLINES", lines);
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
      console.error("Error:", error);
      ws.send("An error occurred.");
    }
  });
});

// Upgrade HTTP connections to WebSocket connections
app.use((req, res, next) => {
  if (req.url === "/ws") {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    next();
  }
});

app.get("/api/completion", (req, res) => {
  const prompt = req.query.prompt as string;
  // OpenAI request
  // Respond with a JSON object that includes the received "prompt" value
  res.json({ receivedPrompt: prompt });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
