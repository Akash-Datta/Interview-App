import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import '../style/topbar.scss'

const TopBar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()
    const [ loggingOut, setLoggingOut ] = useState(false)

    const onLogout = async () => {
        setLoggingOut(true)
        try {
            await handleLogout()
            navigate('/login')
        } finally {
            setLoggingOut(false)
        }
    }

    return (
        <header className='topbar'>
            <Link to='/' className='topbar__brand' aria-label='AI Interview Coach home'>
                <span className='topbar__mark'>AI</span>
                <span className='topbar__name'>Interview Coach</span>
            </Link>

            <div className='topbar__actions'>
                {user && (
                    <span className='topbar__user'>
                        Hi, <strong>{user.username}</strong>
                    </span>
                )}
                {user && (
                    <button
                        type='button'
                        className='topbar__logout'
                        onClick={onLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? 'Signing out...' : 'Logout'}
                    </button>
                )}
            </div>
        </header>
    )
}

export default TopBar
