import { useEffect, useState } from 'react'

const STEPS = [
    'Reading the job description...',
    'Comparing your profile to the role...',
    'Finding your strongest talking points...',
    'Writing tailored interview questions...',
    'Building your preparation roadmap...'
]

const LoadingScreen = ({
    title = 'Building your interview plan',
    subtitle = 'Our AI is analysing the role and your profile to create a strategy that fits you.'
}) => {
    const [ step, setStep ] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setStep(current => (current + 1) % STEPS.length)
        }, 2200)
        return () => clearInterval(timer)
    }, [])

    return (
        <main className='loading-screen' role='status' aria-live='polite'>
            <div className='loading-orb' aria-hidden='true'>
                <span />
                <span />
                <span />
            </div>

            <h1>
                {title}
                <span className='loading-dots' aria-hidden='true'>
                    <i /><i /><i />
                </span>
            </h1>

            <p>{subtitle}</p>
            <p className='loading-step'>{STEPS[step]}</p>
        </main>
    )
}

export default LoadingScreen
