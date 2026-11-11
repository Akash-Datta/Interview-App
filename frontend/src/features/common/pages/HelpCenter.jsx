import { Link } from 'react-router'
import LegalLayout from '../components/LegalLayout.jsx'

const LAST_UPDATED = 'November 11, 2026'
const OWNER_NAME = 'Akash Datta'
const SUPPORT_PHONE_DISPLAY = '+91 98754 35901'
const SUPPORT_PHONE_TEL = '+919875435901'

const QUICK_START_STEPS = [
    { text: <>Paste the <strong>job description</strong> of the role you are targeting.</> },
    { text: <>Upload your <strong>resume PDF</strong> for the best results, or write a quick self-description.</> },
    { text: <>Hit <strong>Generate</strong> — your strategy is ready in about 30 seconds.</> },
    { text: <>Explore your <strong>questions, roadmap, and resume draft</strong>, then start practicing.</> }
]

const FAQS = [
    {
        question: 'How do I create an interview plan?',
        answer: 'On the home page, paste the job description (required), then upload your resume PDF or write a quick self-description. Click "Generate My Interview Strategy" and your plan will be ready in roughly 30 seconds.'
    },
    {
        question: 'What files can I upload as my resume?',
        answer: 'Only PDF files up to 5MB are accepted. The text is extracted and used by the AI to build your plan — the file itself never needs to be a specific template or format.'
    },
    {
        question: 'What does the Match Score mean?',
        answer: 'The Match Score (0–100%) estimates how well your profile aligns with the job description. Green (80%+) means strong alignment, amber (60–79%) means moderate alignment with clear strengths, and red (below 60%) highlights bigger skill gaps to work on. Treat it as a study guide, not a verdict.'
    },
    {
        question: 'How do I delete a plan, and what does Undo do?',
        answer: 'Click the ✕ on a card under "My Recent Interview Plans". The card will blur and show an Undo button for a few seconds with a countdown bar — this is your safety window. Click Undo to keep the plan; if the bar runs out, the plan is permanently deleted and cannot be recovered.'
    },
    {
        question: 'Can I recover a plan after it is deleted?',
        answer: 'No. Once the undo window closes, the deletion is permanent. If you still need that plan, simply generate it again from the same job description and resume.'
    },
    {
        question: 'How do I get more practice questions?',
        answer: 'Open a plan and go to the Technical or Behavioral Questions tab, then use "Generate more questions". Each click adds a fresh batch of AI-written questions for that category.'
    },
    {
        question: 'What is the Road Map tab?',
        answer: 'The Road Map builds a day-by-day preparation schedule for 5, 10, 15, 20, 25, or 30 days — or a custom duration up to 60 days. Each day lists a focus area and concrete tasks so you always know what to study next.'
    },
    {
        question: 'How do I download my resume?',
        answer: 'Open your interview plan and use the resume download option. The AI tailors a clean, ATS-friendly PDF resume based on your profile and the target role.'
    },
    {
        question: 'What can the AI Coach chatbot help with?',
        answer: 'The chat icon opens your AI coach. On a report page it knows your plan, so you can ask it to explain skill gaps, expand on questions, or run a quick mock interview. Everywhere else it answers general interview prep and resume questions.'
    },
    {
        question: 'Is my data safe?',
        answer: 'Your password is stored only as a secure hash, and your session uses an httpOnly cookie. Your job description and resume text are sent to our AI provider to generate your results and are deleted along with the plan when you remove it. See the Privacy Policy for the full picture.'
    },
    {
        question: 'Something is not working. What should I try first?',
        answer: 'Check the error message shown on screen — it usually tells you exactly what is missing (for example, no job description, or a non-PDF resume). Then retry. If it keeps failing, note what you were doing and contact support below so we can help quickly.'
    },
    {
        question: 'How do I log out or switch accounts?',
        answer: 'Use the Logout button in the top bar. To switch accounts, log out and sign in with the other account — your plans stay saved per account.'
    }
]

const HelpCenter = () => (
    <LegalLayout
        eyebrow='Support'
        title='Help Center'
        subtitle='Answers to common questions about building plans, understanding your results, and managing your account.'
        updated={LAST_UPDATED}
    >
        {/* ── Getting started ─────────────────────────────────────────────── */}
        <section className='legal-page__section'>
            <h2>Getting started</h2>
            <p>
                From an empty account to a full interview strategy in four steps:
            </p>
            <div className='help-steps'>
                {QUICK_START_STEPS.map((step, index) => (
                    <div className='help-steps__item' key={index}>
                        <span className='help-steps__num'>{index + 1}</span>
                        <p className='help-steps__text'>{step.text}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className='legal-page__section'>
            <h2>Frequently asked questions</h2>
            <div className='help-faq'>
                {FAQS.map((faq, index) => (
                    <details className='help-faq__item' key={index}>
                        <summary>
                            {faq.question}
                            <span className='help-faq__chevron'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                            </span>
                        </summary>
                        <div className='help-faq__body'>
                            <p>{faq.answer}</p>
                        </div>
                    </details>
                ))}
            </div>
        </section>

        {/* ── Contact support ─────────────────────────────────────────────── */}
        <section className='legal-page__section'>
            <h2>Still stuck? Talk to us directly</h2>
            <p>
                {OWNER_NAME} runs this service personally — when you reach out, you talk to the person who built it.
                To speed things up, include your username, what you were trying to do, and any error message you saw.
            </p>
            <div className='help-contact'>
                <div className='help-contact__card'>
                    <span className='help-contact__card-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </span>
                    <div>
                        <p className='help-contact__card-label'>Call or WhatsApp</p>
                        <p className='help-contact__card-value'>
                            <a href={`tel:${SUPPORT_PHONE_TEL}`}>{SUPPORT_PHONE_DISPLAY}</a>
                        </p>
                        <p className='help-contact__card-hint'>Available 9 AM – 9 PM IST</p>
                    </div>
                </div>
                <div className='help-contact__card'>
                    <span className='help-contact__card-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </span>
                    <div>
                        <p className='help-contact__card-label'>Owner &amp; Support</p>
                        <p className='help-contact__card-value'>{OWNER_NAME}</p>
                        <p className='help-contact__card-hint'>Typical response within 24–48 hours</p>
                    </div>
                </div>
            </div>
            <p>
                Before contacting support, also check the <Link to='/privacy'>Privacy Policy</Link> and{' '}
                <Link to='/terms'>Terms of Service</Link> — many account and data questions are answered there.
            </p>
        </section>
    </LegalLayout>
)

export default HelpCenter
