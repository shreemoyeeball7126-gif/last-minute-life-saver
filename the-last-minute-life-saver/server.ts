import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Lazy initialization check or fallback
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY environment variable is not defined.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY_IF_MISSING",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API route first
app.post("/api/breakdown", async (req, res) => {
  try {
    const { title, deadline } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server. Please set it in Settings > Secrets." 
      });
    }

    // Prompt the model to break it down
    const prompt = `Break down the following task or deadline into 3 to 5 short, actionable, bite-sized sub-steps. 
For each sub-step, provide a clear task title and a realistic time estimate in minutes (as an integer).

Task Title: "${title}"
Deadline: ${deadline || "unspecified"}

The sub-steps should be extremely practical, chronological, and aimed at avoiding last-minute panic.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Bite-sized, clear description of the sub-step"
              },
              duration: {
                type: Type.INTEGER,
                description: "Estimated duration to complete this sub-step in minutes"
              }
            },
            required: ["title", "duration"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    const steps = JSON.parse(text.trim());
    return res.json({ steps });
  } catch (error: any) {
    console.error("Error generating breakdown:", error);
    return res.status(500).json({ error: error?.message || "Failed to generate AI breakdown. Please try again." });
  }
});

// Vite Integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
