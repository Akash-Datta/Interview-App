import { generateInterviewReport, getAllInterviewReports, getInterviewReportById, generateResumePdf as generateResumePdfApi, generateMoreQuestions as generateMoreQuestionsApi, generateRoadmap as generateRoadmapApi, deleteInterviewReport as deleteInterviewReportApi } from "../services/interview.api"
import { useContext, useEffect, useCallback } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const {
        loading, setLoading,
        pdfLoading, setPdfLoading,
        questionsLoading, setQuestionsLoading,
        roadmapLoading, setRoadmapLoading,
        error, setError,
        report, setReport,
        reports, setReports
    } = context

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError("")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.data)
            return response.data
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to generate the interview plan. Please try again.")
            throw err
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReport, setError])

    const getReportById = useCallback(async (reportId) => {
        setLoading(true)
        setError("")
        // Drop any previously loaded report so a failed fetch cannot show stale data.
        setReport(null)
        try {
            const response = await getInterviewReportById(reportId)
            setReport(response.data)
            return response.data
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to load this interview report.")
            throw err
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReport, setError])

    const getReports = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const response = await getAllInterviewReports()
            setReports(response.data)
            return response.data
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to load your interview plans.")
            throw err
        } finally {
            setLoading(false)
        }
    }, [setLoading, setReports, setError])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setPdfLoading(true)
        setError("")
        try {
            const pdfBlob = await generateResumePdfApi({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to generate the resume PDF. Please try again.")
            throw err
        } finally {
            setPdfLoading(false)
        }
    }, [setPdfLoading, setError])

    // Fetches and stores additional AI-generated questions of one type.
    // Errors are rethrown so the caller can show them next to the question list.
    const generateMoreQuestions = useCallback(async (type, count = 5) => {
        const interviewReportId = report?._id
        if (!interviewReportId) return []

        setQuestionsLoading(current => ({ ...current, [type]: true }))
        try {
            const response = await generateMoreQuestionsApi({ interviewId: interviewReportId, type, count })
            const added = response.data?.questions || []

            if (added.length > 0) {
                const questionKey = `${type}Questions`
                setReport(current => current
                    ? { ...current, [questionKey]: [...(current[questionKey] || []), ...added] }
                    : current)
            }
            return added
        } finally {
            setQuestionsLoading(current => ({ ...current, [type]: false }))
        }
    }, [report, setReport, setQuestionsLoading])

    // Builds a preparation roadmap for the given number of days. Errors are
    // rethrown so the caller can show them next to the roadmap cards.
    const getRoadmap = useCallback(async (days) => {
        const interviewReportId = report?._id
        if (!interviewReportId) return null

        setRoadmapLoading(true)
        try {
            const response = await generateRoadmapApi({ interviewId: interviewReportId, days })
            const plan = response.data?.plan || []

            setReport(current => current
                ? { ...current, preparationPlan: plan, planDays: days }
                : current)
            return plan
        } finally {
            setRoadmapLoading(false)
        }
    }, [report, setReport, setRoadmapLoading])

    // Deletes a saved interview report and drops it from the local lists.
    // Errors are rethrown so the caller can show them near the deleted card.
    const deleteReport = useCallback(async (reportId) => {
        const response = await deleteInterviewReportApi({ interviewId: reportId })
        setReports(current => current.filter(item => item._id !== reportId))
        setReport(current => (current?._id === reportId ? null : current))
        return response
    }, [setReports, setReport])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId).catch(() => { })
        } else {
            getReports().catch(() => { })
        }
    }, [interviewId, getReportById, getReports])

    return {
        loading, pdfLoading, error,
        questionsLoading, roadmapLoading,
        report, reports,
        generateReport, getReportById, getReports, getResumePdf,
        generateMoreQuestions, getRoadmap, deleteReport
    }
}
