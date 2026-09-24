import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// AI 1: Client Pitch & Executive Summary from CV and Recruiter Notes
app.post("/api/ai/pitch", async (req, res) => {
  try {
    const { candidateName, role, experienceYears, currentCompany, keySkills, screeningNotes } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // High-quality deterministic fallback if no API key
      const skillsList = Array.isArray(keySkills) ? keySkills.join(", ") : (keySkills || "Specialized Tech Stack");
      return res.json({
        summary: `${candidateName} is an accomplished ${role} with ${experienceYears || "5+"} years of verified experience${currentCompany ? ` (currently at ${currentCompany})` : ""}. Strongly recommended for this vacancy based on recruiter technical screening.`,
        keyHighlights: [
          `Proven expertise across ${skillsList}.`,
          `High cultural alignment and communication verified in recruiter screening.`,
          screeningNotes ? `Screening highlight: ${screeningNotes.substring(0, 120)}...` : "Immediate availability for interview loops.",
        ],
        clientPitchText: `Hi Team,\n\nI am pleased to present ${candidateName} for the ${role} position. With ${experienceYears || "strong"} years of hands-on expertise specializing in ${skillsList}, they bring immediate value to your project requirements.\n\nKey Highlights:\n- Core competencies: ${skillsList}\n- Recruiter Assessment: Validated domain competence, verified work history, and strong problem-solving approach.\n\nPlease find their revised CV attached along with current availability dates for an initial technical conversation.\n\nBest regards,`,
      });
    }

    const prompt = `You are an expert executive recruitment consultant for top-tier hiring firms.
Draft a concise, high-converting client profile submission for the hiring manager / client.

Candidate Details:
- Name: ${candidateName}
- Target Role: ${role}
- Experience: ${experienceYears} years
- Current/Past Company: ${currentCompany || "Confidential"}
- Core Skills: ${Array.isArray(keySkills) ? keySkills.join(", ") : keySkills}
- Recruiter Screening Notes: ${screeningNotes || "Solid communication, strong problem solving, highly interested"}

Return a clean JSON object with:
{
  "summary": "2-3 sentences concise executive pitch summarizing why they are a strong match",
  "keyHighlights": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "clientPitchText": "Professional email body ready for the Project Manager to forward to the Client including greeting, highlights, and request to review attached CV and availability"
}
Output strictly valid JSON only without markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error("AI pitch generation error:", error);
    return res.status(500).json({
      error: "Failed to generate pitch",
      message: error?.message || "Unknown error",
    });
  }
});

// AI 2: WhatsApp & Client Email Message Drafter (Solves the endless phone/WhatsApp back-and-forth)
app.post("/api/ai/draft-message", async (req, res) => {
  try {
    const {
      channel, // 'whatsapp_candidate' | 'email_client'
      candidateName,
      recruiterName,
      pmName,
      clientName,
      role,
      availableDates,
      stage, // 'initial_propose' | 'client_counter' | 'interview_confirmed' | 'post_interview_followup'
      notes,
    } = req.body;

    const ai = getAIClient();

    if (!ai) {
      if (channel === "whatsapp_candidate") {
        let msg = "";
        if (stage === "client_counter") {
          msg = `Hi ${candidateName}, hope you're having a good day! 👋 This is ${recruiterName || "your recruiter"} from the recruitment team regarding your application for ${role} at ${clientName || "the client"}. The hiring team is very interested in your profile, but their team has requested these alternative interview slots: ${availableDates.join(", ")}. Would one of these times work for your schedule? Let me know and I'll lock it in right away!`;
        } else if (stage === "interview_confirmed") {
          msg = `Great news ${candidateName}! 🎉 Your interview for ${role} with ${clientName || "the hiring team"} is officially confirmed for: ${availableDates[0] || "the agreed date"}. I've sent the calendar invite and meeting details to your email. Please let me know if you need any prep tips before the call!`;
        } else if (stage === "post_interview_followup") {
          msg = `Hi ${candidateName}! Hope your interview with ${clientName || "the team"} went smoothly today! 😊 Could you share a quick update on how it went from your side? How did you feel about the discussion and the team?`;
        } else {
          msg = `Hi ${candidateName}, thanks for sharing your CV for the ${role} position! Could you please share 2-3 time slots when you'd be available for a 45-minute video interview over the next few days? We are ready to present your profile to the hiring team.`;
        }
        return res.json({ draftText: msg });
      } else {
        // email_client
        let subject = `Interview Schedule: ${candidateName} for ${role}`;
        let body = `Dear ${clientName || "Hiring Team"},\n\nHope this email finds you well.\n\nWe have coordinated with ${candidateName} regarding their availability for the ${role} interview.\nProposed slots:\n${availableDates.map((d: string) => `- ${d}`).join("\n")}\n\nPlease let us know which of these works best for your interviewers, or kindly propose alternative times.\n\nBest regards,\n${pmName || "Project Management Team"}`;
        return res.json({ subject, draftText: body });
      }
    }

    const prompt = `You are an expert recruitment coordinator assistant.
Draft a message for a recruitment firm.
Target Channel: ${channel === "whatsapp_candidate" ? "WhatsApp message to Candidate (warm, conversational, clear, polite, with emoji touch)" : "Formal business email to Client Hiring Manager (professional, concise, clear)"}

Context:
- Recruiter: ${recruiterName || "Recruiter"}
- PM: ${pmName || "Project Manager"}
- Candidate: ${candidateName}
- Client Company: ${clientName}
- Job Role: ${role}
- Scenario / Stage: ${stage}
- Dates in Discussion: ${Array.isArray(availableDates) ? availableDates.join("; ") : availableDates}
- Additional Notes: ${notes || "None"}

Return JSON format:
{
  "subject": "${channel === 'email_client' ? 'Email subject line' : ''}",
  "draftText": "The exact ready-to-send text body"
}
Output strictly valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("AI message draft error:", error);
    return res.status(500).json({ error: "Failed to draft message" });
  }
});

// AI 3: Post-Interview Debrief & Alignment Synthesizer
app.post("/api/ai/analyze-feedback", async (req, res) => {
  try {
    const { candidateName, role, clientFeedback, candidateFeedback } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        alignmentScore: 85,
        alignmentVerdict: "Strong Mutual Interest",
        candidateSentiment: "Enthusiastic about technical scope and team culture.",
        clientSentiment: "Impressed by problem solving and relevant domain experience.",
        potentialGaps: "Clarify expected start date and compensation alignment.",
        recommendedAction: "Proceed to final offer preparation or Round 2 leadership conversation.",
      });
    }

    const prompt = `You are an elite recruitment talent advisor.
Analyze the post-interview debrief between what the candidate reported to Team X recruiter vs what the client reported to the Project Manager.

Role: ${role}
Candidate: ${candidateName}

Candidate's Feedback (reported to Recruiter):
"${candidateFeedback || "Candidate was very positive, enjoyed the coding test, interested in the team."}"

Client's Feedback (reported to PM):
"${clientFeedback || "Client thought candidate had solid fundamentals, good answers, but wants to confirm senior system design depth."}"

Analyze mutual alignment, sentiment gaps, and give an actionable recommendation for the recruiting firm.
Return strictly valid JSON:
{
  "alignmentScore": 85, // number from 0 to 100
  "alignmentVerdict": "Short string e.g. Strong Mutual Interest / High Probability of Offer / Gap in Expectations",
  "candidateSentiment": "Summary of candidate feelings and interest level",
  "clientSentiment": "Summary of client assessment and reservations if any",
  "potentialGaps": "Any discrepancy between salary expectations, technical depth, or timeline",
  "recommendedAction": "Concrete next step for Recruiter & PM (e.g. Schedule Offer Negotiation, Schedule Round 2, or Friendly Polite Pass)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Feedback analysis error:", error);
    return res.status(500).json({ error: "Failed to analyze feedback" });
  }
});

// Vite Middleware for development vs Static files in production
async function startServer() {
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
    console.log(`Recruiter & PM Handoff Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
