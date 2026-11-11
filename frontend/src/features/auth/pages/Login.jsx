import { useState } from 'react'
import "../auth.form.scss"
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router';
import LoadingScreen from '../../common/components/LoadingScreen.jsx';

const Login=()=>{
    const {loading, handleLogin}= useAuth();
    const navigate= useNavigate();
    const [email, setEmail]=useState("")
    const [password, setPassword]=useState("")
    const [error, setError]=useState("")
    const [submitting, setSubmitting]=useState(false)

    const handleSubmit=async (e)=>{
        e.preventDefault();
        setError("")
        setSubmitting(true)
        try {
            await handleLogin({email, password})
            navigate('/')
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to login. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if(loading){
        return <LoadingScreen title='Checking your session' subtitle='Just a moment while we get things ready.' />
    }
    return(
        <main className='auth-page'>
            <div className='auth-card'>
                <span className='auth-eyebrow'>AI Interview Coach</span>
                <h1>Welcome back</h1>
                <p className='auth-subtitle'>Sign in to build your next interview plan.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input onChange={(e)=>{setEmail(e.target.value)}}
                        value={email}
                        type="email" name="email" id="email" placeholder='Enter email address' required/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input onChange={(e)=>{setPassword(e.target.value)}}
                        value={password}
                        type="password" name="password" id="password" placeholder='Enter password' required/>
                    </div>
                    {error && <p className="form-error">{error}</p>}
                    <button type='submit' className='button primary-button auth-submit' disabled={submitting}>
                        {submitting ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p className='auth-switch'>Don't have an account? <Link to={"/register"}>Create one</Link> </p>
            </div>
        </main>
    )
}
export default Login
