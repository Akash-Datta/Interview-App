import { Link } from 'react-router'
import '../style/legal.scss'

// Shared shell for the Privacy Policy, Terms of Service, and Help Center
// pages: centered header, content card, and a footer with cross-links.
const LegalLayout = ({ eyebrow, title, subtitle, updated, children }) => (
    <main className='legal-page'>
        <header className='legal-page__header'>
            {eyebrow && <span className='legal-page__eyebrow'>{eyebrow}</span>}
            <h1>{title}</h1>
            {subtitle && <p className='legal-page__subtitle'>{subtitle}</p>}
            {updated && <span className='legal-page__updated'>Last updated: {updated}</span>}
        </header>

        <div className='legal-page__card'>
            {children}
        </div>

        <nav className='legal-page__footer' aria-label='Legal and support pages'>
            <Link to='/' className='button primary-button'>Back to home</Link>
            <div className='legal-page__footer-links'>
                <Link to='/privacy'>Privacy Policy</Link>
                <Link to='/terms'>Terms of Service</Link>
                <Link to='/help'>Help Center</Link>
            </div>
        </nav>
    </main>
)

export default LegalLayout
