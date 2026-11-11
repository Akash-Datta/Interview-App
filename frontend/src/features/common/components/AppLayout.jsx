import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import TopBar from './TopBar'
import Chatbot from '../../chat/components/Chatbot'

// Mobile browsers restore the previous scroll position when navigating, so a
// freshly opened report can land mid-page. Always start each route at the top.
const ScrollToTop = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, [ pathname ])

    return null
}

// Small toast that tells phone users (often on flaky mobile data) when the
// connection drops while they are filling in a form or waiting on the AI.
const NetworkStatus = () => {
    const [ offline, setOffline ] = useState(!navigator.onLine)
    const [ justReconnected, setJustReconnected ] = useState(false)

    useEffect(() => {
        let reconnectTimer
        let wasOffline = !navigator.onLine

        const handleOffline = () => {
            clearTimeout(reconnectTimer)
            setJustReconnected(false)
            setOffline(true)
            wasOffline = true
        }

        const handleOnline = () => {
            setOffline(false)
            if (wasOffline) {
                setJustReconnected(true)
                reconnectTimer = setTimeout(() => setJustReconnected(false), 2600)
                wasOffline = false
            }
        }

        window.addEventListener('offline', handleOffline)
        window.addEventListener('online', handleOnline)
        return () => {
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('online', handleOnline)
            clearTimeout(reconnectTimer)
        }
    }, [])

    if (!offline && !justReconnected) return null

    return (
        <div
            role='status'
            aria-live='polite'
            className={`net-status ${offline ? '' : 'net-status--online'}`}
        >
            <span className='net-status__dot' aria-hidden='true' />
            {offline
                ? "You're offline — your work is kept, but new requests will fail."
                : "You're back online."}
        </div>
    )
}

const AppLayout = () => {
    const { pathname } = useLocation()
    const isAuthRoute = pathname === '/login' || pathname === '/register'

    return (
        <div className='app-shell'>
            {!isAuthRoute && <TopBar />}
            <div className={`app-content ${isAuthRoute ? 'app-content--auth' : ''}`}>
                <Outlet />
            </div>
            {!isAuthRoute && <Chatbot />}
            <ScrollToTop />
            <NetworkStatus />
        </div>
    )
}

export default AppLayout
