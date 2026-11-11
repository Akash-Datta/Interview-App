const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    httpOptions: {
        timeout: Number(process.env.GEMINI_TIMEOUT_MS) || 120000
    }
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3.1-flash-lite")
    .split(",")
    .map(model => model.trim())
    .filter(Boolean);

class AiServiceError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.name = "AiServiceError";
        this.status = status;
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getErrorCode(error) {
    if (typeof error?.status === "number") return error.status;
    if (typeof error?.code === "number") return error.code;
    if (typeof error?.error?.code === "number") return error.error.code;
    const match = String(error?.message || "").match(/"code"\s*:\s*(\d+)/);
    return match ? Number(match[1]) : undefined;
}

const RETRYABLE_CODES = [429, 500, 502, 503, 504];

async function generateContentWithFallback(request) {
    const models = [MODEL, ...FALLBACK_MODELS];
    let lastError;

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                return await ai.models.generateContent({ ...request, model });
            } catch (error) {
                lastError = error;
                const code = getErrorCode(error);

                // A missing model will never succeed on retry, so move on.
                if (code === 404) {
                    console.warn(`Model ${model} was not found. Trying the next model...`);
                    break;
                }

                // Anything that is not an availability problem is a real failure.
                if (!RETRYABLE_CODES.includes(code)) {
                    console.error("AI request failed:", error.message);
                    throw new AiServiceError("The AI service could not process this request. Please try again.", 502);
                }

                if (attempt < 2) {
                    console.warn(`Model ${model} is busy (${code}). Retrying once...`);
                    await sleep(1500 * attempt);
                } else {
                    console.warn(`Model ${model} is still unavailable (${code}). Trying the next model...`);
                }
            }
        }
    }

    console.error("All AI models failed. Last error:", lastError?.message);
    throw new AiServiceError("The AI service is temporarily busy. Please try again in a minute.", 503);
}

const questionSchema = z.object({
    question: z.string().describe("A question that can be asked in the interview"),
    intention: z.string().describe("The intention of the interviewer behind this question"),
    answer: z.string().describe("How to answer this question, which points to cover and which approach to take")
});

const preparationDaySchema = z.object({
    day: z.number().describe("The day number in the preparation plan, starting from 1"),
    focus: z.string().describe("The main focus of this day, e.g. data structures, system design, mock interviews"),
    tasks: z.array(z.string()).describe("List of tasks to be done on this day")
});

const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100).describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(questionSchema).describe("At least 12 (ideally 15) technical interview questions that are likely to be asked for this specific role, ordered from most to least likely, each with the interviewer's intention and how to answer it"),
    behavioralQuestions: z.array(questionSchema).describe("At least 8 (ideally 10) behavioral interview questions that are likely to be asked, ordered from most to least likely, each with the interviewer's intention and how to answer it"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of the skill gap, i.e. how important the missing skill is")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(preparationDaySchema).describe("A preparation plan spanning exactly 10 days (day 1 through day 10) that the candidate can follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated")
});

const moreQuestionsSchema = z.object({
    questions: z.array(questionSchema).describe("The newly generated interview questions")
});

const preparationPlanSchema = z.object({
    plan: z.array(preparationDaySchema).describe("The day-by-day preparation plan")
});

// Gemini expects JSON Schema. `z.toJSONSchema` is the Zod v4 native helper.
function toGeminiSchema(schema) {
    const jsonSchema = z.toJSONSchema(schema);
    delete jsonSchema.$schema;
    return jsonSchema;
}

// Models occasionally wrap JSON in markdown fences even when asked not to.
function parseJsonResponse(text) {
    const cleaned = String(text)
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end > start) {
            return JSON.parse(cleaned.slice(start, end + 1));
        }
        throw new Error("The AI model returned an invalid JSON response");
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Requirements:
- Generate at least 12 technical questions (aim for 15), ordered from most to least likely to be asked.
- Generate at least 8 behavioral questions (aim for 10), ordered from most to least likely to be asked.
- Make every question specific to this role, company and seniority level instead of generic.
- The preparation plan must span exactly 10 days (day 1 through day 10) with concrete, actionable daily tasks.`;

    const response = await generateContentWithFallback({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(interviewReportSchema)
        }
    });

    if (!response.text) {
        throw new Error("The AI model returned an empty response");
    }

    return parseJsonResponse(response.text);
}

// Generates additional interview questions of one type, avoiding the questions
// the candidate has already seen.
async function generateMoreQuestions({ title, resume, selfDescription, jobDescription, skillGaps, type, count, existingQuestions }) {
    const typeLabel = type === "behavioral" ? "behavioral" : "technical";
    const existingList = (existingQuestions || [])
        .map(item => `- ${item.question}`)
        .join("\n");
    const gaps = (skillGaps || [])
        .map(gap => (typeof gap === "string" ? gap : gap?.skill))
        .filter(Boolean)
        .join(", ");

    const prompt = `A candidate is preparing for an interview for the role: ${title || "the role described in the job description"}.
Resume: ${resume || "Not provided"}
Self description: ${selfDescription || "Not provided"}
Job description: ${jobDescription}
Skill gaps to target: ${gaps || "none reported"}

The candidate has already seen these ${typeLabel} questions:
${existingList || "(none yet)"}

Generate ${count} NEW ${typeLabel} interview questions for this role.
Rules:
- Every question must be different from the ones already seen above.
- Questions must be realistic for this specific role and seniority level instead of generic.
- ${typeLabel === "behavioral"
            ? "Focus on past experiences, situations, conflicts, leadership and teamwork, and answer using the STAR format."
            : "Cover the core skills, tools and scenarios from the job description, prioritising the skill gaps."}
- For each question include the interviewer's intention and a strong model answer.`;

    const response = await generateContentWithFallback({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(moreQuestionsSchema)
        }
    });

    if (!response.text) {
        throw new AiServiceError("The AI model returned an empty response", 502);
    }

    const parsed = parseJsonResponse(response.text);
    return Array.isArray(parsed.questions) ? parsed.questions : [];
}

// Generates a preparation roadmap for an exact number of days.
async function generatePreparationPlan({ title, resume, selfDescription, jobDescription, skillGaps, days }) {
    const gaps = (skillGaps || [])
        .map(gap => (typeof gap === "string" ? gap : `${gap?.skill}${gap?.severity ? ` (${gap.severity} priority)` : ""}`))
        .filter(Boolean)
        .join(", ");

    const prompt = `Create a ${days}-day interview preparation plan for a candidate targeting this role.
Job title: ${title || "the role described in the job description"}
Resume: ${resume || "Not provided"}
Self description: ${selfDescription || "Not provided"}
Job description: ${jobDescription}
Skill gaps to close: ${gaps || "none reported"}

Rules:
- The plan must contain exactly ${days} days, numbered 1 to ${days}.
- Spread the workload sensibly: start with fundamentals and closing the skill gaps, move on to hands-on practice, company research and mock interviews, and keep the final day light with revision, logistics and rest.
- Keep 3 to 5 concrete, specific tasks per day.
- Tasks should reference the candidate's actual skill gaps and the requirements in the job description.`;

    const response = await generateContentWithFallback({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(preparationPlanSchema)
        }
    });

    if (!response.text) {
        throw new AiServiceError("The AI model returned an empty response", 502);
    }

    const parsed = parseJsonResponse(response.text);
    return Array.isArray(parsed.plan) ? parsed.plan : [];
}

function buildChatContextSummary(context) {
    if (!context || typeof context !== "object") return "";

    const lines = [];

    if (typeof context.title === "string" && context.title.trim()) {
        lines.push(`Target role: ${context.title.trim().slice(0, 160)}`);
    }

    if (Number.isFinite(context.matchScore)) {
        lines.push(`Match score: ${Math.round(context.matchScore)}%`);
    }

    if (Array.isArray(context.skillGaps) && context.skillGaps.length > 0) {
        const gaps = context.skillGaps
            .slice(0, 10)
            .map(gap => {
                if (typeof gap === "string") return gap;
                if (gap && typeof gap.skill === "string") {
                    return `${gap.skill}${gap.severity ? ` (${gap.severity} priority)` : ""}`;
                }
                return "";
            })
            .filter(Boolean);

        if (gaps.length > 0) {
            lines.push(`Skill gaps: ${gaps.join(", ")}`);
        }
    }

    if (Array.isArray(context.questions) && context.questions.length > 0) {
        const questions = context.questions
            .slice(0, 8)
            .map(question => (typeof question === "string" ? question : question?.question))
            .filter(Boolean);

        if (questions.length > 0) {
            lines.push(`Questions already in the plan:\n- ${questions.join("\n- ")}`);
        }
    }

    return lines.join("\n");
}

async function generateChatReply({ messages, context }) {
    const contextSummary = buildChatContextSummary(context);

    const systemInstruction = [
        "You are Coach, a warm and concise interview-preparation assistant inside an AI interview coaching app.",
        "Help the candidate prepare for interviews, improve their answers, and understand their generated interview plan.",
        "Give practical, specific advice. Prefer short paragraphs and bullet points. Never invent credentials or experience.",
        "If the candidate asks something unrelated to careers or interviews, gently steer the conversation back.",
        contextSummary
            ? `Here is the candidate's current interview plan:\n${contextSummary}`
            : "The candidate has not generated an interview plan yet."
    ].join("\n\n");

    const contents = messages.map(message => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }]
    }));

    const response = await generateContentWithFallback({
        contents,
        config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1024
        }
    });

    const reply = (response.text || "").trim();
    if (!reply) {
        throw new AiServiceError("The AI coach returned an empty response. Please try again.", 502);
    }

    return reply;
}

async function generatePdfFromHtml(htmlContent) {
    if (!htmlContent) {
        throw new Error("The AI model returned an empty resume document");
    }

    const launchOptions = {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 30000 });
        return await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        });
    } finally {
        await browser.close();
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume, which can be converted to PDF using a library like puppeteer")
    });

    const prompt = `Generate a one-page, professional, ATS-friendly resume for a candidate with the following details.
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Return a JSON object with a single field "html" containing the complete HTML for the resume.
Use proper headings, sections and bullet points, keep the design simple and professional, and highlight relevant content with subtle colors.
The content should not sound AI-generated, should focus on quality over quantity, and should include the information most likely to increase the candidate's chance of getting an interview for the given job description.`;

    const response = await generateContentWithFallback({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: toGeminiSchema(resumePdfSchema)
        }
    });

    if (!response.text) {
        throw new Error("The AI model returned an empty response");
    }

    const jsonContent = parseJsonResponse(response.text);
    return generatePdfFromHtml(jsonContent.html);
}

module.exports = {
    generateInterviewReport,
    generateMoreQuestions,
    generatePreparationPlan,
    generateResumePdf,
    generateChatReply
};
