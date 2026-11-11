import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { InterviewContext } from '../../interview/interview.context'
import { sendChatMessage } from '../services/chat.api'
import '../style/chatbot.scss'

const createId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const ChatIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
    </svg>
)

const CloseIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <line x1='18' y1='6' x2='6' y2='18' />
        <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
)

const SendIcon = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <line x1='22' y1='2' x2='11' y2='13' />
        <polygon points='22 2 15 22 11 13 2 9 22 2' />
    </svg>
)

const Chatbot = () => {
    const { user } = useAuth()
    const { pathname } = useLocation()
    const interviewContext = useContext(InterviewContext)
    const report = interviewContext?.report
    const isInterviewPage = pathname.startsWith('/interview/')

    const [ open, setOpen ] = useState(false)
    const [ input, setInput ] = useState("")
    const [ sending, setSending ] = useState(false)
    const [ messages, setMessages ] = useState([])
    const listRef = useRef(null)
    const inputRef = useRef(null)

    const activeReport = isInterviewPage ? report : null

    const welcomeText = activeReport
        ? `Hi! I'm Coach. I can help you prepare for the ${activeReport.title || 'role'} interview, explain your skill gaps, or run a quick mock question.`
        : "Hi! I'm Coach, your AI interview assistant. Ask me about interview prep, resumes, or paste a question you're stuck on."

    // Scroll to the newest message whenever the conversation changes.
    useEffect(() => {
        if (!open || !listRef.current) return
        listRef.current.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth'
        })
    }, [ messages, sending, open ])

    useEffect(() => {
        if (!open) return
        const timer = setTimeout(() => inputRef.current?.focus(), 180)
        return () => clearTimeout(timer)
    }, [ open ])

    // On phones the chat covers the whole screen — freeze the page behind it
    // so swipes inside the chat never scroll the report underneath.
    useEffect(() => {
        if (!open) return
        document.body.classList.add('chat-open')
        return () => document.body.classList.remove('chat-open')
    }, [ open ])

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [ open ])

    const buildContext = () => {
        if (!activeReport) return null
        return {
            title: activeReport.title,
            matchScore: activeReport.matchScore,
            skillGaps: (activeReport.skillGaps || []).map(gap => ({
                skill: gap.skill,
                severity: gap.severity
            })),
            questions: [
                ...(activeReport.technicalQuestions || []).slice(0, 5).map(question => question.question),
                ...(activeReport.behavioralQuestions || []).slice(0, 5).map(question => question.question)
            ]
        }
    }

    const quickPrompts = activeReport
        ? [
            "Ask me a mock interview question",
            "What are my biggest skill gaps?",
            "Help me craft a 60-second intro",
            "How should I answer behavioral questions?"
        ]
        : [
            "How do I prepare for an interview?",
            "Help me write a self-description",
            "What makes a strong resume?",
            "Ask me a mock interview question"
        ]

    const sendMessage = async (rawText) => {
        const content = (rawText ?? input).trim()
        if (!content || sending) return

        const userMessage = { id: createId(), role: 'user', content }
        const nextMessages = [ ...messages, userMessage ]

        setMessages(nextMessages)
        setInput("")
        setSending(true)

        try {
            const data = await sendChatMessage({
                messages: nextMessages.map(message => ({ role: message.role, content: message.content })),
                context: buildContext()
            })

            const reply = data?.data?.reply || "I couldn't generate a reply. Please try again."
            setMessages(current => [ ...current, { id: createId(), role: 'assistant', content: reply } ])
        } catch (error) {
            const message = error?.response?.data?.message
                || "I couldn't reach the coach right now. Please check your connection and try again."
            setMessages(current => [ ...current, { id: createId(), role: 'assistant', content: message, error: true } ])
        } finally {
            setSending(false)
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        sendMessage()
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            sendMessage()
        }
    }

    if (!user) return null

    const showPrompts = messages.filter(message => message.role === 'user').length === 0

    return (
        <>
            <button
                type='button'
                className={`chat-fab ${open ? 'chat-fab--open' : ''}`}
                onClick={() => setOpen(current => !current)}
                aria-label={open ? 'Close AI interview coach' : 'Open AI interview coach'}
                aria-expanded={open}
            >
                {open ? <CloseIcon /> : <ChatIcon />}
                {!open && <span className='chat-fab__pulse' aria-hidden='true' />}
            </button>

            {open && (
                <section className='chat-panel' role='dialog' aria-label='AI interview coach'>
                    <header className='chat-panel__header'>
                        <div className='chat-panel__avatar'>AI</div>
                        <div>
                            <h2>Coach</h2>
                            <p><span className='chat-panel__status' aria-hidden='true' /> Online &middot; Interview prep</p>
                        </div>
                        <button
                            type='button'
                            className='chat-panel__close'
                            onClick={() => setOpen(false)}
                            aria-label='Close chat'
                        >
                            <CloseIcon />
                        </button>
                    </header>

                    <div className='chat-panel__messages' ref={listRef} role='log' aria-live='polite'>
                        <div className='chat-bubble chat-bubble--assistant'>
                            <p>{welcomeText}</p>
                        </div>

                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`chat-bubble chat-bubble--${message.role} ${message.error ? 'chat-bubble--error' : ''}`}
                            >
                                <p>{message.content}</p>
                            </div>
                        ))}

                        {sending && (
                            <div className='chat-bubble chat-bubble--assistant chat-bubble--typing' aria-label='Coach is typing'>
                                <span /><span /><span />
                            </div>
                        )}
                    </div>

                    {showPrompts && (
                        <div className='chat-panel__prompts'>
                            {quickPrompts.map(prompt => (
                                <button
                                    key={prompt}
                                    type='button'
                                    onClick={() => sendMessage(prompt)}
                                    disabled={sending}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <form className='chat-panel__composer' onSubmit={handleSubmit}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            maxLength={2000}
                            placeholder='Ask Coach anything...'
                            aria-label='Message Coach'
                        />
                        <button
                            type='submit'
                            disabled={!input.trim() || sending}
                            aria-label='Send message'
                        >
                            <SendIcon />
                        </button>
                    </form>
                </section>
            )}
        </>
    )
}

export default Chatbot
