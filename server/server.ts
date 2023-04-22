import express from 'express';
const {Configuration, OpenAIApi} = require('openai')
const WebSocket = require('ws')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
const PORT = process.env.PORT || 6823;

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Listen for WebSocket connections
wss.on('connection', (ws) => {
  // Handle incoming messages from the client
  ws.on('message', async (message) => {
    try {
      // Parse the message from the client
      const data = JSON.parse(message);

      // Call the OpenAI API and wait for the response
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        stream: true,
        prompt: data.prompt,
        max_tokens: 500,
        temperature: 0.1,
      }, {responseType: 'stream'});

      // Handle streaming data from the OpenAI API
      response.data.on("data", (data) => {
          const lines = data
            ?.toString()
            ?.split("\n")
            .filter((line) => line.trim() !== "");
          for (const line of lines) {
            const message = line.replace(/^data: /, "");
            if (message === "[DONE]") {
              break; // Stream finished
            }
            try {
              const parsed = JSON.parse(message);
              console.log(parsed.choices[0].text);
              ws.send(parsed.choices[0].text);
            } catch (error) {
              console.error("Could not JSON parse stream message", message, error);
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
      response.data.on('end', () => {
        // Notify the client that the stream has ended
        ws.send('[DONE]');
      });
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error('Error:', error);
      ws.send('An error occurred.');
    }
  });
});

// Upgrade HTTP connections to WebSocket connections
app.use((req, res, next) => {
  if (req.url === '/ws') {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    next();
  }
});

app.get('/api/completion', (req, res) => {
  const prompt = req.query.prompt as string;
  // OpenAI request
  // Respond with a JSON object that includes the received "prompt" value
  res.json({ receivedPrompt: prompt });
})

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});