import { Link } from "react-router";

const NotFound = () => (
    <main className='interview-error'>
        <div className='interview-error__card'>
            <span className='interview-error__icon'>?</span>
            <h1>Page not found</h1>
            <p style={{ color: '#7d8590', fontSize: '0.9rem', lineHeight: 1.6 }}>
                The page you are looking for does not exist or has moved.
            </p>
            <Link to="/" className="button primary-button">Back to home</Link>
        </div>
    </main>
);

export default NotFound;
