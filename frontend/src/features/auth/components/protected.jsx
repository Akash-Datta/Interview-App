import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import LoadingScreen from "../../common/components/LoadingScreen.jsx";

const Protected= ({children})=>{
    const {loading, user} = useAuth();
    if(loading){
        return <LoadingScreen title='Checking your session' subtitle='Just a moment while we get things ready.' />
    }

    if(!user){
        return <Navigate to={'/login'}/>
    }
    return children;
}
export default Protected;
