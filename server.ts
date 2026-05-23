import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to initialize Gemini API safely per request
  function getAIClient(): GoogleGenAI {
    try {
      const envKey = process.env.GEMINI_API_KEY;
      const apiKey = (envKey && envKey !== "MY_GEMINI_API_KEY") ? envKey : "AIzaSyAelp-l1r-jc-ioly9Ss2O5uG65JdQ9wp4";
      
      if (!apiKey) {
         throw new Error("Missing API Key");
      }
      return new GoogleGenAI({ apiKey });
    } catch (e: any) {
      throw new Error(`Failed to initialize Gemini API: ${e.message}`);
    }
  }

  async function generateContentWithRetry(ai: GoogleGenAI, params: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const currentParams = { ...params };
            if (i >= 1) {
               currentParams.model = 'gemini-2.5-flash';
            }
            return await ai.models.generateContent(currentParams);
        } catch (error: any) {
            console.error(`Gemini generation error (attempt ${i+1}/${retries}):`, error.message || error);
            const isRetryable = error.status === 503 || error.status === 429 || (error.message && (error.message.includes("503") || error.message.includes("429")));
            if (i === retries - 1 || !isRetryable) {
                if (isRetryable) {
                    throw new Error("The AI model is currently experiencing high demand. Please try again in a few moments.");
                }
                throw error;
            }
            const delay = Math.pow(2, i) * 1500;
            console.warn(`Retrying in ${delay}ms...`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    throw new Error("Failed to generate content after retries");
  }

  // --- API Routes ---

  const upload = multer({ storage: multer.memoryStorage() });

  // 0. Parse PDF
  app.post("/api/parse-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const parser = new pdfParse.PDFParse(new Uint8Array(req.file.buffer));
      const data = await parser.getText();
      res.json({ text: data.text });
    } catch (e: any) {
      console.error("PDF Parsing Error:", e);
      res.status(500).json({ error: "Failed to parse PDF", details: e.message });
    }
  });

  // 1. Generate Interview Question
  app.post("/api/interview/generate", async (req, res) => {
    try {
      const ai = getAIClient();
      
      const { interviewType, role, history, resume, jobDescription } = req.body;
      
      // History could be an array of prior Q&A.
      let prompt = `You are an expert HR interviewer. The user is interviewing for a ${role} position, and this is a ${interviewType} interview.`;
      
      let contextText = "";
      if (resume && resume.trim() !== '') {
        contextText += `\nCandidate Resume:\n${resume.substring(0, 15000)}`;
      }
      if (jobDescription && jobDescription.trim() !== '') {
        contextText += `\nJob Description:\n${jobDescription.substring(0, 15000)}`;
      }
      
      if (contextText) {
        prompt += `\n\nHere is the Job Description or User Resume context to tailor your questions:\n${contextText}`;
      }

      if (history && history.length > 0) {
        prompt += `\n\nHere is the interview history so far:\n`;
        prompt += history.map((h: any) => `Interviewer: ${h.question}\nCandidate: ${h.answer}`).join("\n\n");
      }
      
      prompt += `\n\nBased on the history, ask the *next* logical interview question. If it's the very first question, introduce yourself briefly and ask an opening question (like 'Tell me about yourself' or something relevant to ${role}).
Return ONLY the text of the question you want to ask. Do not include suggestions or formatting.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ question: response.text });
    } catch (error: any) {
      console.error("Error generating question:", error);
      res.status(500).json({ error: error.message || "Failed to generate question" });
    }
  });

  // 2. Evaluate User Response & Feedback
  app.post("/api/interview/feedback", async (req, res) => {
    try {
      const ai = getAIClient();
      
      const { history, role, interviewType, resume, jobDescription } = req.body;
      
      let prompt = `You are an expert Interview Coach. The user just completed a ${interviewType} interview for the role of ${role}.`;

      if (jobDescription && jobDescription.trim() !== '') {
        prompt += `\nHere is the Job Description:\n${jobDescription.substring(0, 15000)}`;
      }
      if (resume && resume.trim() !== '') {
        prompt += `\nHere is the Candidate Resume for reference:\n${resume.substring(0, 15000)}`;
      }

      prompt += `\n\nHere is the sequence of questions and their answers:

${history.map((h: any, i: number) => `Q${i+1}: ${h.question}\nUser's Answer: ${h.answer}`).join("\n\n")}

Please provide a detailed evaluation. Analyze the clarity, confidence (based on text), correctness of technical points if applicable, and keyword usage. IMPORTANT: The user's answers were transcribed from speech. Ignore run-on sentences, missing punctuation, and capitalization errors. Do not penalize their score or provide negative feedback for grammatical issues related to missing punctuation. Focus entirely on the verbal content, structure, and argument of the answer.
Return a JSON object matching this schema:
{
  "summaryRating": number (1 to 100),
  "overallFeedback": "Overall feedback text",
  "questionReviews": [
    {
      "question": "The question asked",
      "userAnswer": "The user's answer",
      "feedback": "Specific feedback for this answer",
      "suggestionsForImprovement": "How to answer it better"
    }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryRating: { type: Type.NUMBER },
              overallFeedback: { type: Type.STRING },
              questionReviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    userAnswer: { type: Type.STRING },
                    feedback: { type: Type.STRING },
                    suggestionsForImprovement: { type: Type.STRING }
                  },
                  required: ["question", "userAnswer", "feedback", "suggestionsForImprovement"]
                }
              }
            },
            required: ["summaryRating", "overallFeedback", "questionReviews"]
          }
        }
      });
      
      res.json(JSON.parse(response.text || "{}"));
      
    } catch (error: any) {
      console.error("Error generating feedback:", error);
      res.status(500).json({ error: error.message || "Failed to generate feedback" });
    }
  });

  // 2.5 Generate Hint
  app.post("/api/interview/hint", async (req, res) => {
    try {
      const ai = getAIClient();
      
      const { question, role, interviewType, resume, jobDescription } = req.body;
      
      let prompt = `You are an expert Interview Coach. The user needs a hint for the following question in a ${interviewType} interview for a ${role} position:
Question: "${question}"`;

      if (jobDescription && jobDescription.trim() !== '') {
        prompt += `\n\nJob Description:\n${jobDescription.substring(0, 15000)}`;
      }
      if (resume && resume.trim() !== '') {
        prompt += `\n\nCandidate Resume:\n${resume.substring(0, 15000)}`;
      }

      prompt += `\n\nProvide a brief, 1-2 sentence hint on how to structure a good answer. Encourage the use of the STAR framework (Situation, Task, Action, Result) if it's a behavioral question. Do not write the full answer for them, just give them a mental framework or key points to touch upon based on the question and context provided.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ hint: response.text });
    } catch (error: any) {
      console.error("Error generating hint:", error);
      res.status(500).json({ error: error.message || "Failed to generate hint" });
    }
  });

  app.post("/api/interview/swot", async (req, res) => {
    try {
      const ai = getAIClient();
      
      const { sessions } = req.body;
      
      if (!sessions || sessions.length === 0) {
         return res.json({
            strengths: ["You haven't completed any interviews yet."],
            weaknesses: ["Take your first interview to get personalized feedback."],
            opportunities: ["Practice with different roles to see where you shine."],
            threats: ["Delaying practice might make you unprepared for real interviews."],
            skills: [
              { subject: 'Communication', A: 0, fullMark: 100 },
              { subject: 'Technical', A: 0, fullMark: 100 },
              { subject: 'Behavioral', A: 0, fullMark: 100 },
              { subject: 'Confidence', A: 0, fullMark: 100 },
              { subject: 'Clarity', A: 0, fullMark: 100 }
            ]
         });
      }

      let prompt = `You are an expert Career Coach analyzing a user's past interview performances.
Here are the user's past interview sessions with their roles and scores:
${sessions.slice(0, 10).map((s: any, i: number) => `Session ${i+1}: Role: ${s.role}, Type: ${s.type}, Score: ${s.score}, Summary: ${s.summary}`).join("\n\n")}

Based on this limited set of history data, generate a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis for this user.
Also evaluate their overall estimated proficiency in 5 predefined skills (Communication, Technical Experience, Behavioral/STAR Method, Confidence, Clarity) on a scale of 0 to 100.
Return ONLY a valid JSON object matching this schema:
{
  "strengths": [
    { "title": "Strength Title", "description": "Specific example or detail based on history" }
  ],
  "weaknesses": [
    { "title": "Weakness Title", "description": "Specific detail", "actionableResource": "Actionable advice or resource link" }
  ],
  "opportunities": [
    { "title": "Opportunity Title", "description": "Specific detail", "actionableResource": "Actionable advice" }
  ],
  "threats": [
    { "title": "Threat Title", "description": "Specific detail" }
  ],
  "skills": [
    { "subject": "Communication", "A": number, "fullMark": 100 },
    { "subject": "Technical", "A": number, "fullMark": 100 },
    { "subject": "Behavioral", "A": number, "fullMark": 100 },
    { "subject": "Confidence", "A": number, "fullMark": 100 },
    { "subject": "Clarity", "A": number, "fullMark": 100 }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      res.json(JSON.parse(response.text || "{}"));
      
    } catch (error: any) {
      console.error("Error generating SWOT:", error);
      res.status(500).json({ error: error.message || "Failed to generate SWOT analysis" });
    }
  });

  // 3. TTS using ElevenLabs
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      const apiKey = process.env.ELEVENLABS_API_KEY || "sk_b33efd39a58dea0fd834d94c7105fc6e0a85056b88d43f58";
      
      if (!apiKey) {
        return res.status(503).json({ error: "ElevenLabs API key not configured." });
      }

      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 401 || response.status === 402 || response.status === 429) {
          console.warn(`ElevenLabs API limit: ${response.status} - triggering fallback.`);
          return res.status(503).json({ error: "ElevenLabs API limit reached, use fallback." });
        }
        throw new Error(`ElevenLabs API error: ${response.status} ${errText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.set("Content-Type", "audio/mpeg");
      res.send(buffer);
      
    } catch (error: any) {
      console.error("TTS Error:", error);
      res.status(500).json({ error: error.message || "Failed to synthesize speech" });
    }
  });

  // Streaming GET endpoint for TTS
  app.get("/api/tts", async (req, res) => {
    try {
      const text = req.query.text as string;
      if (!text) return res.status(400).send("No text provided");
      
      const apiKey = process.env.ELEVENLABS_API_KEY || "sk_b33efd39a58dea0fd834d94c7105fc6e0a85056b88d43f58";
      if (!apiKey) {
        return res.status(503).send("ElevenLabs API key not configured.");
      }

      const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`ElevenLabs API error on GET: ${response.status} ${errText}`);
        return res.status(503).send("TTS Error");
      }
      
      res.set("Content-Type", "audio/mpeg");
      res.set("Transfer-Encoding", "chunked");
      
      if (response.body) {
        const { Readable } = require("stream");
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.status(500).send("No audio stream");
      }
      
    } catch (error: any) {
      console.error("TTS Stream Error:", error);
      res.status(500).send(error.message || "Failed to synthesize speech stream");
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
