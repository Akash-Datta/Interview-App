import { useEffect, useRef, useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { Link, useParams } from 'react-router'
import LoadingScreen from '../../common/components/LoadingScreen.jsx'



const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// Every list opens showing between MIN_INITIAL_QUESTIONS and
// MAX_INITIAL_QUESTIONS questions. Reports always store more than the
// minimum, so the lists open with a full page of questions and a
// "show more" flow reveals the rest.
const MIN_INITIAL_QUESTIONS = 5
const MAX_INITIAL_QUESTIONS = 10
// How many stored questions "Show more" reveals at a time, and how many
// brand-new ones "Generate more questions" adds per click.
const QUESTION_STEP = 5

// Preparation roadmap duration options (in days) offered as cards.
const ROADMAP_OPTIONS = [
    { days: 5, title: 'Sprint', tagline: 'High-impact essentials only' },
    { days: 10, title: 'Focused', tagline: 'Balanced daily prep with practice' },
    { days: 15, title: 'Steady', tagline: 'Close skill gaps, then drill' },
    { days: 20, title: 'Committed', tagline: 'Deep skills, projects and mocks' },
    { days: 25, title: 'Thorough', tagline: 'Full syllabus plus company research' },
    { days: 30, title: 'Complete', tagline: 'Mastery track with regular mock interviews' },
]
const MAX_CUSTOM_DAYS = 60

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card' style={{ '--i': index }}>
            <button
                type='button'
                className='q-card__header'
                onClick={() => setOpen(current => !current)}
                aria-expanded={open}
            >
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </button>

            <div className={`q-card__collapse ${open ? 'q-card__collapse--open' : ''}`}>
                <div className='q-card__body'>
                    <div className='q-card__body-inner'>
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--intention'>Intention</span>
                            <p>{item.intention}</p>
                        </div>
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                            <p>{item.answer}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const QuestionListFooter = ({ hidden, shown, initial, loading, error, onShowMore, onCollapse, onGenerate }) => (
    <div className='q-controls'>
        {loading ? (
            <p className='q-controls__loading'>
                <span className='q-controls__spinner' aria-hidden='true' />
                Generating more questions for you…
            </p>
        ) : (
            <div className='q-controls__actions'>
                {hidden > 0 && (
                    <button type='button' className='q-controls__btn q-controls__btn--primary' onClick={onShowMore}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        Show {Math.min(QUESTION_STEP, hidden)} more questions
                        <span className='q-controls__count'>{hidden} remaining</span>
                    </button>
                )}
                {hidden === 0 && shown > initial && (
                    <button type='button' className='q-controls__btn' onClick={onCollapse}>
                        Show fewer questions
                    </button>
                )}
                {hidden === 0 && (
                    <button type='button' className='q-controls__btn q-controls__btn--accent' onClick={onGenerate}>
                        <svg height="0.8rem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Generate more questions
                    </button>
                )}
            </div>
        )}
        {error && <p className='form-error q-controls__error'>{error}</p>}
    </div>
)

const RoadMapDay = ({ day, index }) => (
    <div className='roadmap-day' style={{ '--i': index }}>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const [ visibleTechnical, setVisibleTechnical ] = useState(MAX_INITIAL_QUESTIONS)
    const [ visibleBehavioral, setVisibleBehavioral ] = useState(MAX_INITIAL_QUESTIONS)
    const [ questionsErrors, setQuestionsErrors ] = useState({ technical: '', behavioral: '' })
    const [ roadmapDays, setRoadmapDays ] = useState(0)
    const [ roadmapPlans, setRoadmapPlans ] = useState({})
    const [ roadmapError, setRoadmapError ] = useState('')
    const [ customDays, setCustomDays ] = useState('')
    const [ showBackToTop, setShowBackToTop ] = useState(false)
    const topUpAttempted = useRef({})

    const {
        report, loading, error, pdfLoading, getResumePdf,
        generateMoreQuestions, getRoadmap,
        questionsLoading, roadmapLoading
    } = useInterview()
    const { interviewId } = useParams()

    const technicalQuestions = report?.technicalQuestions || []
    const behavioralQuestions = report?.behavioralQuestions || []
    const shownTechnical = technicalQuestions.slice(0, visibleTechnical)
    const shownBehavioral = behavioralQuestions.slice(0, visibleBehavioral)
    const technicalHidden = technicalQuestions.length - shownTechnical.length
    const behavioralHidden = behavioralQuestions.length - shownBehavioral.length

    const activePlan = roadmapDays > 0 ? (roadmapPlans[roadmapDays] || []) : []
    const isCustomDays = roadmapDays > 0 && !ROADMAP_OPTIONS.some(option => option.days === roadmapDays)

    // Reset the per-report UI state whenever a different report is opened.
    useEffect(() => {
        const savedDays = report?.planDays || report?.preparationPlan?.length || 0
        setRoadmapDays(savedDays)
        setRoadmapPlans(savedDays > 0 && report?.preparationPlan?.length
            ? { [savedDays]: report.preparationPlan }
            : {})
        setRoadmapError('')
        setQuestionsErrors({ technical: '', behavioral: '' })
        setVisibleTechnical(MAX_INITIAL_QUESTIONS)
        setVisibleBehavioral(MAX_INITIAL_QUESTIONS)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ interviewId, report?._id ])

    // Older reports can hold fewer questions than the page must show at
    // minimum. Quietly top them up once per report so both lists always open
    // with at least MIN_INITIAL_QUESTIONS questions.
    useEffect(() => {
        if (!report?._id) return
        const reportId = report._id

        const topUp = (type, total) => {
            const missing = MIN_INITIAL_QUESTIONS - total
            if (missing <= 0) return
            if (topUpAttempted.current[`${reportId}:${type}`]) return
            topUpAttempted.current[`${reportId}:${type}`] = true

            generateMoreQuestions(type, Math.min(10, Math.max(missing, QUESTION_STEP))).catch(() => {
                setQuestionsErrors(current => ({
                    ...current,
                    [type]: `We could not add more ${type} questions automatically. Use "Generate more questions" to retry.`
                }))
            })
        }

        topUp('technical', technicalQuestions.length)
        topUp('behavioral', behavioralQuestions.length)
    }, [ report?._id, technicalQuestions.length, behavioralQuestions.length, generateMoreQuestions ])

    const handleGenerateMore = async (type) => {
        setQuestionsErrors(current => ({ ...current, [type]: '' }))
        try {
            const added = await generateMoreQuestions(type, QUESTION_STEP)
            if (!added || added.length === 0) {
                setQuestionsErrors(current => ({
                    ...current,
                    [type]: 'No new questions could be generated right now. Please try again.'
                }))
            } else {
                // Reveal the fresh questions straight away instead of hiding
                // them behind another "show more" click.
                if (type === 'technical') {
                    setVisibleTechnical(count => count + added.length)
                } else {
                    setVisibleBehavioral(count => count + added.length)
                }
            }
        } catch (err) {
            setQuestionsErrors(current => ({
                ...current,
                [type]: err?.response?.data?.message || 'Unable to generate more questions. Please try again.'
            }))
        }
    }

    const handleSelectDays = async (days) => {
        if (roadmapLoading || !report?._id) return

        const previousDays = roadmapDays
        setRoadmapError('')
        setRoadmapDays(days)

        // Already generated for this duration — show it instantly.
        if (roadmapPlans[days]) return

        try {
            const plan = await getRoadmap(days)
            if (!plan || plan.length === 0) throw new Error('empty plan')
            setRoadmapPlans(current => ({ ...current, [days]: plan }))
        } catch (err) {
            setRoadmapDays(previousDays)
            setRoadmapError(err?.response?.data?.message || 'We could not build this plan right now. Please try again.')
        }
    }

    const handleCustomDays = (event) => {
        event.preventDefault()
        if (roadmapLoading) return

        const days = Number.parseInt(customDays, 10)
        if (!Number.isInteger(days) || days < 1 || days > MAX_CUSTOM_DAYS) {
            setRoadmapError(`Please enter a number of days between 1 and ${MAX_CUSTOM_DAYS}.`)
            return
        }
        handleSelectDays(days)
    }

    // On phones the question lists and roadmap scroll the whole page, so offer
    // a floating shortcut back to the section tabs once the user scrolls deep.
    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.scrollY > 520)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (loading) {
        return (
            <LoadingScreen
                title='Loading your interview plan'
                subtitle='Fetching your questions, skill gaps, and preparation roadmap.'
            />
        )
    }

    if (!report) {
        return (
            <main className='interview-error'>
                <div className='interview-error__card'>
                    <span className='interview-error__icon'>!</span>
                    <h1>{error || "This interview report could not be found."}</h1>
                    <Link to='/' className='button primary-button'>Back to home</Link>
                </div>
            </main>
        )
    }

    const matchScore = report.matchScore ?? 0
    const scoreColor =
        matchScore >= 80 ? 'score--high' :
            matchScore >= 60 ? 'score--mid' : 'score--low'


    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                                aria-current={activeNav === item.id ? 'page' : undefined}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { getResumePdf(interviewId).catch(() => { }) }}
                        className='button primary-button download-btn'
                        disabled={pdfLoading}>
                        <svg height={"0.8rem"} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        {pdfLoading ? "Generating PDF..." : "Download Resume"}
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {error && <p className='form-error' style={{ marginBottom: '1rem' }}>{error}</p>}
                    {activeNav === 'technical' && (
                        <section key='technical' className='content-section'>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>
                                    {technicalHidden > 0
                                        ? `showing ${shownTechnical.length} of ${technicalQuestions.length}`
                                        : `${technicalQuestions.length} questions`}
                                </span>
                            </div>
                            <div className='q-list'>
                                {shownTechnical.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                                {technicalQuestions.length === 0 && !questionsLoading.technical && (
                                    <p className='q-empty'>No technical questions yet — generate some below.</p>
                                )}
                            </div>
                            <QuestionListFooter
                                hidden={technicalHidden}
                                shown={shownTechnical.length}
                                initial={MAX_INITIAL_QUESTIONS}
                                loading={questionsLoading.technical}
                                error={questionsErrors.technical}
                                onShowMore={() => setVisibleTechnical(count => Math.min(count + QUESTION_STEP, technicalQuestions.length))}
                                onCollapse={() => setVisibleTechnical(MAX_INITIAL_QUESTIONS)}
                                onGenerate={() => handleGenerateMore('technical')}
                            />
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section key='behavioral' className='content-section'>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>
                                    {behavioralHidden > 0
                                        ? `showing ${shownBehavioral.length} of ${behavioralQuestions.length}`
                                        : `${behavioralQuestions.length} questions`}
                                </span>
                            </div>
                            <div className='q-list'>
                                {shownBehavioral.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                                {behavioralQuestions.length === 0 && !questionsLoading.behavioral && (
                                    <p className='q-empty'>No behavioral questions yet — generate some below.</p>
                                )}
                            </div>
                            <QuestionListFooter
                                hidden={behavioralHidden}
                                shown={shownBehavioral.length}
                                initial={MAX_INITIAL_QUESTIONS}
                                loading={questionsLoading.behavioral}
                                error={questionsErrors.behavioral}
                                onShowMore={() => setVisibleBehavioral(count => Math.min(count + QUESTION_STEP, behavioralQuestions.length))}
                                onCollapse={() => setVisibleBehavioral(MAX_INITIAL_QUESTIONS)}
                                onGenerate={() => handleGenerateMore('behavioral')}
                            />
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section key='roadmap' className='content-section'>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                {activePlan.length > 0 && (
                                    <span className='content-header__count'>{activePlan.length}-day plan</span>
                                )}
                            </div>

                            <p className='roadmap-intro'>
                                How many days do you have before your interview? Pick a pace and your AI coach will build the plan.
                            </p>

                            <div className='roadmap-options'>
                                {ROADMAP_OPTIONS.map(option => (
                                    <button
                                        key={option.days}
                                        type='button'
                                        className={`roadmap-card ${roadmapDays === option.days ? 'roadmap-card--active' : ''}`}
                                        onClick={() => handleSelectDays(option.days)}
                                        disabled={roadmapLoading}
                                    >
                                        <span className='roadmap-card__days'>
                                            {option.days}
                                            <span className='roadmap-card__unit'>days</span>
                                        </span>
                                        <span className='roadmap-card__title'>{option.title} prep</span>
                                        <span className='roadmap-card__tagline'>{option.tagline}</span>
                                        <span className='roadmap-card__check' aria-hidden='true'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        </span>
                                    </button>
                                ))}

                                {/* Custom duration card */}
                                <form
                                    className={`roadmap-card roadmap-card--custom ${isCustomDays ? 'roadmap-card--active' : ''}`}
                                    onSubmit={handleCustomDays}
                                >
                                    <span className='roadmap-card__title'>Custom plan</span>
                                    <span className='roadmap-card__tagline'>
                                        Have a different timeline? Tell us exactly how many days you have left.
                                    </span>
                                    <div className='roadmap-card__row'>
                                        <input
                                            type='number'
                                            min={1}
                                            max={MAX_CUSTOM_DAYS}
                                            value={customDays}
                                            onChange={event => setCustomDays(event.target.value)}
                                            placeholder='e.g. 7'
                                            aria-label='Number of days before your interview'
                                            disabled={roadmapLoading}
                                        />
                                        <span className='roadmap-card__days-label'>days</span>
                                        <button
                                            type='submit'
                                            className='roadmap-card__build'
                                            disabled={roadmapLoading || !customDays.trim()}
                                        >
                                            Build my plan
                                        </button>
                                    </div>
                                    {isCustomDays && (
                                        <span className='roadmap-card__current'>
                                            Currently viewing your {roadmapDays}-day plan
                                        </span>
                                    )}
                                </form>
                            </div>

                            {roadmapLoading && (
                                <div className='roadmap-loading'>
                                    <span className='roadmap-loading__spinner' aria-hidden='true' />
                                    <p>Building your {roadmapDays}-day preparation plan…</p>
                                    <span>The AI coach is pacing out your days. This usually takes 10–20 seconds.</span>
                                </div>
                            )}

                            {roadmapError && <p className='form-error'>{roadmapError}</p>}

                            {!roadmapLoading && activePlan.length > 0 && (
                                <div className='roadmap-list'>
                                    {activePlan.map((day, i) => (
                                        <RoadMapDay key={`${roadmapDays}-${day.day}`} day={day} index={i} />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <svg className='match-score__svg' viewBox='0 0 120 120' aria-hidden='true'>
                                <circle className='match-score__track' cx='60' cy='60' r='52' />
                                <circle
                                    className='match-score__progress'
                                    cx='60'
                                    cy='60'
                                    r='52'
                                    style={{ '--score': matchScore }}
                                />
                            </svg>
                            <span className='match-score__value'>{matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>
                            {matchScore >= 80 ? 'Strong match for this role' :
                                matchScore >= 60 ? 'Good match with room to grow' :
                                    'Focus on the gaps below'}
                        </p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {(report.skillGaps || []).map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>

            {/* Floating back-to-top shortcut (mobile only, bottom-left so it
                never collides with the Coach chat button on the right). */}
            <button
                type='button'
                className={`to-top-fab ${showBackToTop ? 'to-top-fab--visible' : ''}`}
                onClick={handleBackToTop}
                aria-label='Back to top'
                tabIndex={showBackToTop ? 0 : -1}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
            </button>
        </div>
    )
}

export default Interview
