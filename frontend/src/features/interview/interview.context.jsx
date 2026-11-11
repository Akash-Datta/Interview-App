import { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)
    const [questionsLoading, setQuestionsLoading] = useState({ technical: false, behavioral: false })
    const [roadmapLoading, setRoadmapLoading] = useState(false)
    const [error, setError] = useState("")
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    return (
        <InterviewContext.Provider value={{
            loading, setLoading,
            pdfLoading, setPdfLoading,
            questionsLoading, setQuestionsLoading,
            roadmapLoading, setRoadmapLoading,
            error, setError,
            report, setReport,
            reports, setReports
        }}>
            {children}
        </InterviewContext.Provider>
    )
}
