import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    const { user, setUser, loading, setLoading } = context;

    // These handlers deliberately do not touch `loading`: that flag is reserved
    // for the initial session restore so pages do not flash a loader on submit.
    const handleLogin = async ({ email, password }) => {
        const data = await login({ email, password });
        setUser(data.user);
        return data;
    };

    const handleRegister = async ({ username, email, password }) => {
        const data = await register({ username, email, password });
        setUser(data.user);
        return data;
    };

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            setUser(null);
        }
    };

    return { user, loading, setLoading, handleLogin, handleLogout, handleRegister };
};
