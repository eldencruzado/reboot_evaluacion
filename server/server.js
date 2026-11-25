require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "..")));

app.post("/api/ai-diagnosis", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI is not configured. Add OPENAI_API_KEY to .env." });

  const { language, category, answers, causes, summary } = req.body || {};
  if (!category || !Array.isArray(answers) || answers.length > 8) {
    return res.status(400).json({ error: "Invalid diagnostic data." });
  }

  try {
    const prompt = [
      "You are REBOOT, an educational computer troubleshooting assistant.",
      "Explain likely causes and safe, beginner-friendly next steps.",
      "Do not claim to have measured hardware or accessed the user's computer.",
      "Never recommend opening a power supply, bypassing safety protections, deleting unknown system files, or running destructive commands.",
      "If symptoms suggest electrical damage, burning smell, liquid damage, or extreme heat, advise stopping use and seeking a qualified technician.",
      `Respond in ${language === "en" ? "English" : "Spanish"}.`,
      `Issue category: ${category}`,
      `Answers: ${JSON.stringify(answers)}`,
      `Rule-engine possible causes: ${JSON.stringify(causes)}`,
      `Context: ${summary}`
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 500
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: "AI provider request failed. Check server configuration." });

    const answer = data.output?.flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text).join("\n").trim();

    if (!answer) return res.status(502).json({ error: "The AI provider returned an empty response." });
    res.json({ answer });
  } catch (error) {
    console.error("AI diagnosis error:", error.message);
    res.status(500).json({ error: "Unable to contact the AI service." });
  }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "REBOOT API" }));
app.listen(PORT, () => console.log(`REBOOT running at http://localhost:${PORT}`));
