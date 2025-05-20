const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = process.env.OPENROUTER_API_URL;

// Helper function to call OpenRouter
async function callAI(messages) {
  const response = await axios.post(
    API_URL,
    {
      model: "openai/gpt-3.5-turbo", // Or another OpenRouter model
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.choices[0].message.content;
}
const memoryStore = {};

app.post("/ask", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  try {
    // Initialize memory for session if not exists
    if (!memoryStore[sessionId]) {
      memoryStore[sessionId] = [];
    }

    // Add the new question to memory
    memoryStore[sessionId].push({ role: "user", content: message });

    // Student agent messages (including memory)
    const studentMessages = [
      {
        role: "system",
        content:
          "You are an enthusiastic student trying to answer AI questions.",
      },
      ...memoryStore[sessionId],
    ];
    const studentResponse = await callAI(studentMessages);

    // Add student's answer to memory
    memoryStore[sessionId].push({
      role: "assistant",
      content: studentResponse,
    });

    // Teacher agent messages
    const teacherMessages = [
      {
        role: "system",
        content: `You are an expert AI teacher. 
Review and improve the student's answer.
Respond in a structured and beautifully formatted way using:

- Bold titles (e.g. **Mistake:** or **Good Job:**)
- Bullet points
- Headings if needed
- Simple clear explanations
- Use <ul><li> and <b> tags when appropriate.

Return HTML-ready content.`,
      },
      {
        role: "user",
        content: `Student's answer: ${studentResponse}. Original question: ${message}`,
      },
    ];
    const teacherResponse = await callAI(teacherMessages);

    // Add teacher's response to memory
    memoryStore[sessionId].push({
      role: "assistant",
      content: teacherResponse,
    });

    res.json({ student: studentResponse, teacher: teacherResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🧠 AI Classroom backend running at http://localhost:${PORT}`);
});
