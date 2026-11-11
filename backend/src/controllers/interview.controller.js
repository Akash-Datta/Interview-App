const mongoose = require("mongoose")
const { PDFParse } = require("pdf-parse")
const {
    generateInterviewReport,
    generateResumePdf,
    generateMoreQuestions,
    generatePreparationPlan
} = require("../services/ai.service")
const InterviewReportModel = require("../models/interviewReport.model")

// The interview page shows 10 technical and 5 behavioral questions by default,
// so every report must store at least that many questions.
const MIN_TECHNICAL_QUESTIONS = 10
const MIN_BEHAVIORAL_QUESTIONS = 5
const MAX_QUESTIONS_PER_TYPE = 40

// Roadmap durations are capped so a plan always stays actionable.
const MIN_PLAN_DAYS = 1
const MAX_PLAN_DAYS = 60

async function extractResumeText(file) {
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) })
    try {
        const resumeContent = await parser.getText()
        return (resumeContent.text || "").trim()
    } finally {
        await parser.destroy().catch(() => { })
    }
}

// ── Question / plan helpers ────────────────────────────────────────────────────

function normalizeQuestionText(question) {
    return String(question || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
}

function normalizeQuestions(list) {
    if (!Array.isArray(list)) return []
    return list
        .filter(item => item
            && typeof item.question === "string" && item.question.trim()
            && typeof item.intention === "string" && item.intention.trim()
            && typeof item.answer === "string" && item.answer.trim())
        .map(item => ({
            question: item.question.trim(),
            intention: item.intention.trim(),
            answer: item.answer.trim()
        }))
}

// Appends incoming questions to an existing list, dropping anything that is
// invalid or a near-duplicate of a question the candidate already has.
function mergeQuestions(existing, incoming) {
    const merged = [...(existing || [])]
    const seen = new Set(merged.map(item => normalizeQuestionText(item.question)))

    for (const item of incoming || []) {
        if (merged.length >= MAX_QUESTIONS_PER_TYPE) break
        const key = normalizeQuestionText(item.question)
        if (!key || seen.has(key)) continue
        seen.add(key)
        merged.push(item)
    }

    return merged
}

// Renumbers the days sequentially so the roadmap always reads Day 1, Day 2, ...
function normalizePlan(plan) {
    if (!Array.isArray(plan)) return []
    return plan
        .filter(day => day
            && typeof day.focus === "string" && day.focus.trim()
            && Array.isArray(day.tasks))
        .map((day, index) => ({
            day: index + 1,
            focus: day.focus.trim(),
            tasks: day.tasks.map(task => String(task || "").trim()).filter(Boolean)
        }))
        .filter(day => day.tasks.length > 0)
}

// Generates up to `count` questions the candidate has not seen yet. The model
// sometimes returns fewer than asked or repeats itself, so keep asking until
// the batch is full or the attempts run out.
async function generateUniqueQuestions({ context, type, count, existing }) {
    const base = Array.isArray(existing) ? existing : []
    let added = []
    const MAX_ATTEMPTS = 3

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && added.length < count; attempt++) {
        const remaining = count - added.length
        const batch = await generateMoreQuestions({
            ...context,
            type,
            // Ask for a couple extra on retries so duplicates still fill the batch.
            count: Math.min(10, remaining + (attempt > 1 ? 2 : 0)),
            existingQuestions: [...base, ...added]
        })

        added = mergeQuestions([...base, ...added], normalizeQuestions(batch)).slice(base.length)
    }

    return added.slice(0, count)
}

// Safety net: the model is asked for more questions than the UI shows by
// default, but it occasionally returns fewer. Tops the list up so every report
// opens with at least the minimum number of questions.
async function topUpQuestions({ context, type, minimum, existing }) {
    const missing = minimum - existing.length
    if (missing <= 0) return existing

    const added = await generateUniqueQuestions({ context, type, count: missing, existing })
    return [...existing, ...added]
}

// ── Controllers ────────────────────────────────────────────────────────────────

async function generateInterviewReportController(req, res) {
    const { selfDescription, jobDescription } = req.body

    if (!jobDescription) {
        return res.status(400).json({
            success: false,
            message: "Job description is required"
        })
    }

    if (String(jobDescription).length > 20000) {
        return res.status(400).json({
            success: false,
            message: "Job description is too long. Please keep it under 20,000 characters."
        })
    }

    if (!req.file && !selfDescription) {
        return res.status(400).json({
            success: false,
            message: "Either a resume PDF or a self description is required"
        })
    }

    let resumeText = ""

    if (req.file) {
        try {
            resumeText = await extractResumeText(req.file)
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Could not read the uploaded PDF. Please upload a valid PDF file."
            })
        }

        if (!resumeText) {
            return res.status(400).json({
                success: false,
                message: "No readable text was found in the uploaded PDF. Try a text-based PDF or add a self description."
            })
        }
    }

    const interviewReportByAi = await generateInterviewReport({
        resume: resumeText,
        selfDescription: selfDescription || "",
        jobDescription
    })

    let technicalQuestions = normalizeQuestions(interviewReportByAi.technicalQuestions)
    let behavioralQuestions = normalizeQuestions(interviewReportByAi.behavioralQuestions)

    // Top up the question lists if the model returned fewer than the minimum
    // the UI shows by default. A failure here is not fatal — the report is
    // still saved and the user can generate more from the interview page.
    if (technicalQuestions.length < MIN_TECHNICAL_QUESTIONS
        || behavioralQuestions.length < MIN_BEHAVIORAL_QUESTIONS) {
        const context = {
            title: interviewReportByAi.title,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            skillGaps: interviewReportByAi.skillGaps
        }

        try {
            if (technicalQuestions.length < MIN_TECHNICAL_QUESTIONS) {
                technicalQuestions = await topUpQuestions({
                    context,
                    type: "technical",
                    minimum: MIN_TECHNICAL_QUESTIONS,
                    existing: technicalQuestions
                })
            }
            if (behavioralQuestions.length < MIN_BEHAVIORAL_QUESTIONS) {
                behavioralQuestions = await topUpQuestions({
                    context,
                    type: "behavioral",
                    minimum: MIN_BEHAVIORAL_QUESTIONS,
                    existing: behavioralQuestions
                })
            }
        } catch (error) {
            console.warn("Question top-up after report generation failed:", error.message)
        }
    }

    const preparationPlan = normalizePlan(interviewReportByAi.preparationPlan)

    const interviewReport = await InterviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription,
        jobDescription,
        ...interviewReportByAi,
        technicalQuestions,
        behavioralQuestions,
        preparationPlan,
        planDays: preparationPlan.length > 0 ? preparationPlan.length : undefined,
        title: interviewReportByAi.title || "Interview Report"
    })

    res.status(201).json({
        success: true,
        message: "Interview report generated successfully",
        data: interviewReport
    })
}

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params

    if (!mongoose.isValidObjectId(interviewId)) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: req.user.id })
    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }
    res.status(200).json({
        success: true,
        message: "Interview report found",
        data: interviewReport
    })
}

async function getAllInterviewReportsController(req, res) {
    const interviewReports = await InterviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        success: true,
        message: "Interview reports found",
        data: interviewReports
    })
}

// Generates and stores additional interview questions of one type so the
// "Show me more questions" flow always has something new to reveal.
async function generateMoreQuestionsController(req, res) {
    const { interviewId } = req.params

    if (!mongoose.isValidObjectId(interviewId)) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: req.user.id })
    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const type = req.body?.type
    if (type !== "technical" && type !== "behavioral") {
        return res.status(400).json({
            success: false,
            message: "type must be either 'technical' or 'behavioral'"
        })
    }

    const count = Number.parseInt(req.body?.count, 10)
    if (!Number.isInteger(count) || count < 1 || count > 10) {
        return res.status(400).json({
            success: false,
            message: "count must be a whole number between 1 and 10"
        })
    }

    const questionKey = `${type}Questions`
    const existing = Array.isArray(interviewReport[questionKey])
        ? interviewReport[questionKey]
        : []

    // Stop early when this list is already full — the AI cannot add anything.
    if (existing.length >= MAX_QUESTIONS_PER_TYPE) {
        return res.status(400).json({
            success: false,
            message: `This report already holds the maximum of ${MAX_QUESTIONS_PER_TYPE} ${type} questions.`
        })
    }

    // Generate exactly the number of fresh questions asked for (retries the
    // model when it returns fewer than requested or repeats itself).
    const added = await generateUniqueQuestions({
        context: {
            title: interviewReport.title,
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription,
            jobDescription: interviewReport.jobDescription,
            skillGaps: interviewReport.skillGaps
        },
        type,
        count: Math.min(count, MAX_QUESTIONS_PER_TYPE - existing.length),
        existing
    })

    if (added.length === 0) {
        return res.status(502).json({
            success: false,
            message: "The AI service could not create new questions right now. Please try again."
        })
    }

    // AI generation takes a while, so another request may have appended
    // questions to this report meanwhile. Re-read the stored list, drop
    // anything that is no longer new, and push the rest with one atomic
    // update. Atomic updates cannot hit the Mongoose version conflicts
    // ("No matching document found for id ... version N") that
    // document.save() causes when two requests finish close together.
    const stored = await InterviewReportModel
        .findOne({ _id: interviewId, user: req.user.id })
        .select(questionKey)
        .lean()
    const storedList = stored?.[questionKey] || []
    const known = new Set(storedList.map(item => normalizeQuestionText(item.question)))
    const room = Math.max(0, MAX_QUESTIONS_PER_TYPE - storedList.length)
    const fresh = added
        .filter(item => !known.has(normalizeQuestionText(item.question)))
        .slice(0, room)

    if (fresh.length === 0) {
        return res.status(502).json({
            success: false,
            message: "The AI service could not create new questions right now. Please try again."
        })
    }

    const updatedReport = await InterviewReportModel.findOneAndUpdate(
        { _id: interviewId, user: req.user.id },
        { $push: { [questionKey]: { $each: fresh } } },
        { new: true, select: questionKey }
    )
    if (!updatedReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    res.status(200).json({
        success: true,
        message: "New questions generated successfully",
        data: {
            questions: fresh,
            total: updatedReport[questionKey].length
        }
    })
}

// Generates a preparation roadmap for the exact number of days the candidate
// has left before the interview.
async function generatePreparationPlanController(req, res) {
    const { interviewId } = req.params

    if (!mongoose.isValidObjectId(interviewId)) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: req.user.id })
    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const days = Number.parseInt(req.body?.days, 10)
    if (!Number.isInteger(days) || days < MIN_PLAN_DAYS || days > MAX_PLAN_DAYS) {
        return res.status(400).json({
            success: false,
            message: `days must be a whole number between ${MIN_PLAN_DAYS} and ${MAX_PLAN_DAYS}`
        })
    }

    const plan = normalizePlan(await generatePreparationPlan({
        title: interviewReport.title,
        resume: interviewReport.resume,
        selfDescription: interviewReport.selfDescription,
        jobDescription: interviewReport.jobDescription,
        skillGaps: interviewReport.skillGaps,
        days
    }))

    if (plan.length === 0) {
        return res.status(502).json({
            success: false,
            message: "The AI service could not build the preparation plan. Please try again."
        })
    }

    // Write the plan with an atomic update. document.save() can fail with a
    // Mongoose version conflict when a "more questions" request saves the
    // same report while the plan is being generated.
    await InterviewReportModel.updateOne(
        { _id: interviewId, user: req.user.id },
        { $set: { preparationPlan: plan, planDays: days } }
    )

    res.status(200).json({
        success: true,
        message: "Preparation plan generated successfully",
        data: {
            plan,
            days
        }
    })
}

// Removes one of the candidate's saved interview reports.
async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params

    if (!mongoose.isValidObjectId(interviewId)) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const deletedReport = await InterviewReportModel.findOneAndDelete({
        _id: interviewId,
        user: req.user.id
    })
    if (!deletedReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    res.status(200).json({
        success: true,
        message: "Interview report deleted successfully",
        data: { deletedId: interviewId }
    })
}

async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    if (!mongoose.isValidObjectId(interviewReportId)) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const interviewReport = await InterviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
    if (!interviewReport) {
        return res.status(404).json({
            success: false,
            message: "Interview report not found"
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport
    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume_${interviewReportId}.pdf"`
    })
    res.send(pdfBuffer)
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateMoreQuestionsController,
    generatePreparationPlanController,
    generateResumePdfController,
    deleteInterviewReportController
}
