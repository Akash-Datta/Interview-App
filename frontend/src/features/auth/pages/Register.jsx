import { useState } from 'react'
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import "../auth.form.scss"
import LoadingScreen from '../../common/components/LoadingScreen.jsx';

const Register=()=>{
    const navigate= useNavigate();
    const [username, setUsername]= useState("")
    const [email, setEmail]= useState("")
    const [password, setPassword]= useState("")
    const [error, setError]= useState("")
    const [submitting, setSubmitting]= useState(false)
    const {loading, handleRegister} = useAuth()

    const handleSubmit= async(e)=>{
        e.preventDefault();
        setError("")
        setSubmitting(true)
        try {
            await handleRegister({username, email, password})
            navigate("/")
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to register. Please try again.")
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
                <h1>Create your account</h1>
                <p className='auth-subtitle'>Start turning job descriptions into a personal interview strategy.</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">User Name</label>
                        <input onChange={(e)=>{setUsername(e.target.value)}} value={username} type="text" name="username" id="username" placeholder='Enter user name' required/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input onChange={(e)=>{setEmail(e.target.value)}}
                        value={email}
                        type="email" name="email" id="email" placeholder='Enter email address' required/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input onChange={(e)=>{ setPassword(e.target.value)}}
                         value={password}
                         type="password" name="password" id="password" placeholder='Enter password' required/>
                    </div>
                    {error && <p className="form-error">{error}</p>}
                    <button type='submit' className='button primary-button auth-submit' disabled={submitting}>
                        {submitting ? "Creating account..." : "Register"}
                    </button>
                </form>
                <p className='auth-switch'>Already have an account? <Link to={"/login"}>Login</Link> </p>
            </div>
        </main>
    )
}
export default Register;
