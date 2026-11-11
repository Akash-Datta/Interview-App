import { useEffect, useRef, useState } from 'react'
import "../style/Home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { Link, useNavigate } from 'react-router'
import LoadingScreen from '../../common/components/LoadingScreen.jsx'

const MAX_RESUME_SIZE = 5 * 1024 * 1024

// How long a removed plan stays blurred with an "Undo" button before it is
// deleted permanently on the server.
const UNDO_WINDOW_MS = 5000

const formatBytes = (bytes) => {
    if (!bytes) return "0 KB"
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
}

const Home = () => {

    const { generateReport, deleteReport, reports } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ isDragging, setIsDragging ] = useState(false)
    const [ generating, setGenerating ] = useState(false)
    const [ removingReportId, setRemovingReportId ] = useState("")
    // Plans whose deletion countdown is running (nothing deleted on the server yet).
    const [ pendingDeleteIds, setPendingDeleteIds ] = useState([])
    const deleteTimersRef = useRef({})
    const [ error, setError ] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const acceptResume = (file) => {
        if (!file) return

        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
        if (!isPdf) {
            setError("Please upload a PDF file.")
            return
        }

        if (file.size > MAX_RESUME_SIZE) {
            setError("That file is too large. Please upload a PDF under 5MB.")
            return
        }

        setError("")
        setResumeFile(file)
    }

    const handleFileChange = (event) => {
        const file = event.target.files?.[ 0 ]
        acceptResume(file)
        // Clear the native input so choosing the same file again still fires onChange.
        event.target.value = ""
    }

    const handleDrop = (event) => {
        event.preventDefault()
        setIsDragging(false)
        acceptResume(event.dataTransfer.files?.[ 0 ])
    }

    const handleDragOver = (event) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (event) => {
        event.preventDefault()
        setIsDragging(false)
    }

    const clearResume = () => {
        setResumeFile(null)
        if (resumeInputRef.current) {
            resumeInputRef.current.value = ""
        }
    }

    // ── Removing a plan (with an undo window) ──────────────────────────────
    // Clicking ✕ does not delete anything right away. The card blurs so it
    // clearly feels like it is being removed, and an Undo button replaces
    // the ✕ for UNDO_WINDOW_MS. Only if that window runs out is the plan
    // actually deleted on the server. Undoing just cancels the countdown.

    const clearDeleteTimer = (reportId) => {
        const timer = deleteTimersRef.current[reportId]
        if (timer) clearTimeout(timer)
        delete deleteTimersRef.current[reportId]
    }

    // The undo window ran out — remove the plan for real.
    const finalizeDelete = (reportId) => {
        clearDeleteTimer(reportId)
        setPendingDeleteIds(current => current.filter(id => id !== reportId))
        setRemovingReportId(reportId)
        deleteReport(reportId)
            .catch((err) => {
                setError(err?.response?.data?.message || "Unable to remove this interview plan. Please try again.")
            })
            .finally(() => setRemovingReportId(""))
    }

    // Starts the countdown for one of the saved interview plans.
    const handleRemoveReport = (reportId) => {
        if (pendingDeleteIds.includes(reportId) || removingReportId === reportId) return
        setError("")
        setPendingDeleteIds(current => [...current, reportId])
        deleteTimersRef.current[reportId] = setTimeout(() => {
            finalizeDelete(reportId)
        }, UNDO_WINDOW_MS)
    }

    // Cancels a pending deletion — the card un-blurs and nothing was sent
    // to the server.
    const handleUndoDelete = (reportId) => {
        clearDeleteTimer(reportId)
        setPendingDeleteIds(current => current.filter(id => id !== reportId))
    }

    // Leaving the page cancels any countdowns still running, so a plan is
    // never deleted in the background while the user is away.
    useEffect(() => {
        const timers = deleteTimersRef.current
        return () => {
            Object.values(timers).forEach(timer => clearTimeout(timer))
        }
    }, [])

    const handleGenerateReport = async () => {
        setError("")

        if (!jobDescription.trim()) {
            setError("Please paste the job description before generating a plan.")
            return
        }

        if (!resumeFile && !selfDescription.trim()) {
            setError("Please upload a resume or add a quick self-description.")
            return
        }

        setGenerating(true)
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            if (data?._id) {
                navigate(`/interview/${data._id}`)
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to generate the interview plan. Please try again.")
        } finally {
            setGenerating(false)
        }
    }

    if (generating) {
        return (
            <LoadingScreen
                title='Creating your interview strategy'
                subtitle='We are analysing the role, your resume, and the best way to position you for this interview.'
            />
        )
    }

    return (
        <div className='home-page'>

            {/* Page Header */}
            <header className='page-header'>
                <span className='page-header__eyebrow'>AI-powered interview prep</span>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyse the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <div className='textarea-wrap'>
                            <textarea
                                onChange={(e) => { setJobDescription(e.target.value) }}
                                value={jobDescription}
                                className='panel__textarea'
                                placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                                maxLength={5000}
                            />
                            <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                        </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>

                            <div
                                className={`dropzone ${resumeFile ? 'dropzone--uploaded' : ''} ${isDragging ? 'dropzone--dragging' : ''}`}
                                onClick={() => resumeInputRef.current?.click()}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        resumeInputRef.current?.click()
                                    }
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                role='button'
                                tabIndex={0}
                                aria-label={resumeFile ? `Resume uploaded: ${resumeFile.name}. Click to replace.` : 'Click to upload or drag and drop a resume PDF'}
                            >
                                <input
                                    ref={resumeInputRef}
                                    hidden
                                    type='file'
                                    id='resume'
                                    name='resume'
                                    accept='.pdf,application/pdf'
                                    onChange={handleFileChange}
                                />

                                {resumeFile ? (
                                    <>
                                        <span className='dropzone__icon dropzone__icon--success'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                        </span>
                                        <p className='dropzone__title'>Document uploaded</p>
                                        <p className='dropzone__filename'>{resumeFile.name}</p>
                                        <p className='dropzone__subtitle'>{formatBytes(resumeFile.size)} &middot; PDF</p>
                                        <button
                                            type='button'
                                            className='dropzone__remove'
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                clearResume()
                                            }}
                                            onKeyDown={(event) => event.stopPropagation()}
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className='dropzone__icon'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                        </span>
                                        <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                        <p className='dropzone__subtitle'>PDF (Max 5MB)</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                value={selfDescription}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    {error && <p className='form-error'>{error}</p>}
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'
                        disabled={generating}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map((report, index) => {
                            const isPendingDelete = pendingDeleteIds.includes(report._id)

                            return (
                                <li
                                    key={report._id}
                                    className={`report-item ${isPendingDelete ? 'report-item--removing' : ''}`}
                                    style={{ '--i': index, '--undo-window': `${UNDO_WINDOW_MS}ms` }}
                                    aria-disabled={isPendingDelete || undefined}
                                    onClick={() => {
                                        // A card that is being deleted no longer opens the report.
                                        if (!isPendingDelete) navigate(`/interview/${report._id}`)
                                    }}
                                >
                                    {isPendingDelete ? (
                                        // While the countdown runs, the ✕ becomes an Undo button
                                        // that saves the plan before the deletion becomes permanent.
                                        <button
                                            type='button'
                                            className='report-item__undo'
                                            aria-label={`Undo removal of the ${report.title || 'interview'} plan`}
                                            title='Keep this plan'
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                handleUndoDelete(report._id)
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                                            Undo
                                        </button>
                                    ) : (
                                        <button
                                            type='button'
                                            className='report-item__remove'
                                            aria-label={`Remove the ${report.title || 'interview'} plan`}
                                            title='Remove this plan'
                                            disabled={removingReportId === report._id}
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                handleRemoveReport(report._id)
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    )}
                                    <h3>{report.title || 'Untitled Position'}</h3>
                                    <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                    <p className={`report-score ${(report.matchScore ?? 0) >= 80 ? 'score--high' : (report.matchScore ?? 0) >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore ?? 0}%</p>
                                    {/* Shrinking bar showing how long until the plan is gone for good. */}
                                    {isPendingDelete && <span className='report-item__undo-bar' aria-hidden='true' />}
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <Link to='/privacy'>Privacy Policy</Link>
                <Link to='/terms'>Terms of Service</Link>
                <Link to='/help'>Help Center</Link>
            </footer>
        </div>
    )
}

export default Home
