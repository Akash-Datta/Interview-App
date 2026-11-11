import LegalLayout from '../components/LegalLayout.jsx'

const LAST_UPDATED = 'November 11, 2026'
const OWNER_NAME = 'Akash Datta'
const SUPPORT_PHONE_DISPLAY = '+91 98754 35901'
const SUPPORT_PHONE_TEL = '+919875435901'

const PrivacyPolicy = () => (
    <LegalLayout
        eyebrow='Legal'
        title='Privacy Policy'
        subtitle='How AI Interview Coach collects, uses, and protects your information while you prepare for interviews.'
        updated={LAST_UPDATED}
    >
        <section className='legal-page__section'>
            <h2>1. Overview</h2>
            <p>
                AI Interview Coach (&quot;we&quot;, &quot;this service&quot;) is built and operated by <strong>{OWNER_NAME}</strong>. It
                helps you prepare for interviews by turning the job descriptions, resumes, and self-descriptions you
                provide into AI-generated study plans, practice questions, and preparation roadmaps.
            </p>
            <p>
                This policy explains what information we collect, why we collect it, who we share it with, and the
                choices you have. It applies whenever you use this website.
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>2. Information We Collect</h2>
            <ul>
                <li><strong>Account information</strong> — the username, email address, and password you provide when you register. Passwords are stored only as secure hashes, never in plain text.</li>
                <li><strong>Career content</strong> — the job descriptions you paste, the text extracted from resume PDFs you upload, and the quick self-descriptions you write.</li>
                <li><strong>Generated content</strong> — the interview plans, match scores, practice questions, preparation roadmaps, and resume drafts the AI creates for you.</li>
                <li><strong>Chat messages</strong> — the messages you send to the built-in AI coach chatbot.</li>
                <li><strong>Technical data</strong> — a signed, httpOnly session cookie that keeps you logged in, plus basic server logs (such as request timestamps and status codes).</li>
            </ul>
        </section>

        <section className='legal-page__section'>
            <h2>3. How We Use Your Information</h2>
            <ul>
                <li>To create and manage your account and keep you signed in securely.</li>
                <li>To generate your personalized interview plans, questions, roadmaps, and resume drafts.</li>
                <li>To power the coaching chatbot when you ask follow-up questions.</li>
                <li>To keep the service working, debug issues, and prevent abuse.</li>
            </ul>
            <p>
                We do <strong>not</strong> sell your information, run advertising on it, or use it to train our own models.
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>4. AI Processing and Third-Party Providers</h2>
            <p>
                To build your plans, the career content you provide (job description, resume text, or self-description) is
                sent to a third-party AI provider (<strong>Google Gemini</strong>). The AI uses it only to produce your
                results.
            </p>
            <p>
                Your data is also stored on a hosted database (<strong>MongoDB Atlas</strong>) and served through a cloud
                hosting provider. These providers process data on our behalf solely to run the service.
            </p>
            <p>
                Please do not paste information you would not want processed by an AI service — for example, other
                people&apos;s personal details or documents your interview prep does not need.
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>5. Storage and Retention</h2>
            <p>
                Your plans stay in your account until you delete them. When you remove a plan from &quot;My Recent
                Interview Plans&quot;, you get a short undo window of a few seconds — after that, the plan and everything in
                it are <strong>permanently deleted</strong> and cannot be recovered.
            </p>
            <p>
                Account information is kept while your account is active. If you ask us to delete your account, we
                remove or anonymize your information within a reasonable time, except where we are legally required to
                keep it (for example, security logs).
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>6. Data Sharing</h2>
            <p>We share your information only with:</p>
            <ul>
                <li><strong>AI and infrastructure providers</strong> — Google Gemini, MongoDB Atlas, and our hosting provider, strictly to run the service.</li>
                <li><strong>Legal requirements</strong> — if we are compelled by law or to protect the rights and safety of our users.</li>
            </ul>
            <p>No data brokers, no ad networks, no selling. That&apos;s it.</p>
        </section>

        <section className='legal-page__section'>
            <h2>7. Data Security</h2>
            <ul>
                <li>Passwords are hashed — even we cannot read your actual password.</li>
                <li>Sessions use httpOnly cookies that JavaScript cannot steal.</li>
                <li>Production traffic runs over HTTPS, and database access is restricted.</li>
            </ul>
            <p>
                No system is perfectly secure. If a data breach ever affects you, we will notify you and work to fix it
                as quickly as possible.
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>8. Your Rights and Choices</h2>
            <ul>
                <li><strong>Access and update</strong> your account details at any time.</li>
                <li><strong>Delete plans</strong> whenever you want — your stored career content is always one click away from being removed.</li>
                <li><strong>Request account deletion</strong> by contacting support (details below) and we will wipe your account and plans.</li>
            </ul>
            <p>
                If you are in the EU or UK, you also have rights under the GDPR, including access, rectification,
                erasure, and objection. Contact us and we will honor them.
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>9. Children&apos;s Privacy</h2>
            <p>
                This service is intended for people preparing for jobs and internships, and is not directed at children
                under 13. We do not knowingly collect information from children under 13. If you believe a child has
                created an account, contact us and we will remove it.
            </p>
        </section>

        <section className='legal-page__section'>
            <h2>10. Changes to This Policy</h2>
            <p>
                If we update this policy, we will change the &quot;Last updated&quot; date at the top of this page.
                Significant changes will be called out on the site itself.
            </p>
        </section>

        <aside className='legal-page__contact'>
            <span className='legal-page__contact-icon'>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </span>
            <p>
                <strong>Questions about your data?</strong> Contact <strong>{OWNER_NAME}</strong> at{' '}
                <a href={`tel:${SUPPORT_PHONE_TEL}`}>{SUPPORT_PHONE_DISPLAY}</a> (call or WhatsApp).
            </p>
        </aside>
    </LegalLayout>
)

export default PrivacyPolicy
