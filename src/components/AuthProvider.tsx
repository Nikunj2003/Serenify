import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    onboardingCompleted: boolean;
    updateOnboardingStatus: (status: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkOnboardingStatus(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const previousUser = user;
            setSession(session);
            setUser(session?.user ?? null);

            if (event === 'SIGNED_IN' || (session?.user && !previousUser)) {
                setLoading(true);
                checkOnboardingStatus(session.user.id);
            } else if (session?.user) {
                // For other events like TOKEN_REFRESHED, just ensure we have the status without setting loading
                // unless we don't have it yet
                if (!onboardingCompleted) {
                    checkOnboardingStatus(session.user.id);
                }
            } else {
                setLoading(false);
                setOnboardingCompleted(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkOnboardingStatus = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("id", userId)
                .single();

            if (!error && data) {
                setOnboardingCompleted(data.onboarding_completed || false);
            }
        } catch (error) {
            console.error("Error checking onboarding:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateOnboardingStatus = async (status: boolean) => {
        setOnboardingCompleted(status);
        if (user) {
            await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    onboarding_completed: status,
                    updated_at: new Date().toISOString()
                });
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setOnboardingCompleted(false);
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, onboardingCompleted, updateOnboardingStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
