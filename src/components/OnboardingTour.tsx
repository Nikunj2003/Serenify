import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

const OnboardingTour = () => {
    const { user } = useAuth();
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_tour_completed")
                .eq("id", user.id)
                .single();

            if (profile && !profile.onboarding_tour_completed) {
                // Delay to let page load
                setTimeout(() => setRun(true), 1000);
            }
        };

        checkOnboarding();
    }, [user]);

    const steps: Step[] = [
        {
            target: "body",
            content: "Welcome to MindCompanion! Let's take a quick tour of your dashboard.",
            placement: "center",
        },
        {
            target: "[data-tour='daily-checkin']",
            content: "Start each day by checking in. Click a mood to log details like Triggers, Energy, and Anxiety levels.",
        },
        {
            target: "[data-tour='mood-trends']",
            content: "See your emotional journey visualized in this mood trends chart.",
        },
        {
            target: "[data-tour='chat-button']",
            content: "Need someone to talk to? Chat with your AI companion anytime, 24/7.",
        },
        {
            target: "[data-tour='wellness']",
            content: "Explore wellness activities like meditation, breathing exercises, and more.",
        },
        {
            target: "[data-tour='journal']",
            content: "Keep a private journal to reflect on your thoughts and track your progress.",
        },
    ];

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            if (user) {
                await supabase
                    .from("profiles")
                    .update({ onboarding_tour_completed: true })
                    .eq("id", user.id);
            }
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            stepIndex={stepIndex}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: "hsl(210, 85%, 58%)",
                    zIndex: 10000,
                },
            }}
        />
    );
};

export default OnboardingTour;
