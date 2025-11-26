import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import MoodSelector from "@/components/MoodSelector";
import MoodDimensionsSelector from "@/components/MoodDimensionsSelector";
import MoodTriggerSelector from "@/components/MoodTriggerSelector";
import { CheckCircle, Shield, Lock, Target, User, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { generateInitialPersona } from "@/lib/ai-service";
import { toast } from "sonner";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateOnboardingStatus } = useAuth();

  // Step 2: Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [understoodSupport, setUnderstoodSupport] = useState(false);

  // Step 3: Privacy
  const [privacySettings, setPrivacySettings] = useState({
    share_journal: true,
    share_mood: true,
    share_activities: true
  });

  // Step 4: Goals & Persona
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  // Step 5: Mood
  const [selectedMood, setSelectedMood] = useState<number>();
  const [moodDimensions, setMoodDimensions] = useState({ energy: 5, anxiety: 3, stress: 3 });
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const GOAL_OPTIONS = [
    "Reduce Anxiety",
    "Improve Sleep",
    "Track Mood Patterns",
    "Build a Journaling Habit",
    "Manage Stress",
    "Practice Gratitude",
    "Just Exploring"
  ];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Save Privacy Settings
        await supabase
          .from('profiles')
          .update({ privacy_settings: privacySettings })
          .eq('id', user.id);

        // 2. Save Initial Mood with Details
        if (selectedMood) {
          const moodLabel = ["", "struggling", "difficult", "okay", "good", "great"][selectedMood];
          await supabase.from("mood_logs").insert({
            user_id: user.id,
            mood: moodLabel,
            energy_level: moodDimensions.energy,
            anxiety_level: moodDimensions.anxiety,
            stress_level: moodDimensions.stress,
            triggers: selectedTriggers,
            note: additionalNotes || "Initial check-in",
            context_note: additionalNotes // Save to both for consistency
          });
        }

        // 3. Generate Initial Persona (Async - don't block too long, but good to have)
        const moodLabel = selectedMood ? ["", "struggling", "difficult", "okay", "good", "great"][selectedMood] : "unknown";
        await generateInitialPersona(user.id, selectedGoals, bio, moodLabel);

        // 4. Complete Onboarding
        await updateOnboardingStatus(true);

        toast.success("Setup complete! Welcome to your dashboard.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong, but let's get you to the dashboard.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep2 = agreedToTerms && understoodSupport;
  const canProceedStep4 = selectedGoals.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${i === step
                  ? "w-12 bg-primary"
                  : i < step
                    ? "w-8 bg-primary/50"
                    : "w-8 bg-muted"
                  }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground font-medium">
            Step {step} of 5
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl">
          <CardContent className="p-8 md:p-12">

            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center mb-8">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                    <img
                      src="/logo.png"
                      alt="Serenify Logo"
                      className="w-32 h-32 rounded-full shadow-2xl relative z-10 animate-bounce-slow"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Welcome to Serenify
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Your personal AI assistant for mental wellness. Let's tailor the experience just for you.
                  </p>
                </div>
                <Button size="lg" onClick={() => setStep(2)} className="w-full md:w-auto min-w-[200px] text-lg h-12 rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Step 2: Privacy & Consent */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Shield className="h-6 w-6 text-primary" /> Privacy First
                  </h2>
                  <p className="text-muted-foreground">
                    We believe in transparency and control.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer select-none">
                      I agree to the terms of service and understand that my data is stored securely.
                    </label>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id="support"
                      checked={understoodSupport}
                      onCheckedChange={(checked) => setUnderstoodSupport(checked === true)}
                      className="mt-1"
                    />
                    <label htmlFor="support" className="text-sm leading-relaxed cursor-pointer select-none">
                      I understand this AI is for support and self-reflection, <strong>not a replacement for professional medical advice</strong>.
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Privacy Configuration */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Lock className="h-6 w-6 text-primary" /> Data Controls
                  </h2>
                  <p className="text-muted-foreground">
                    Decide what the AI can access to personalize your experience. You can change this later.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-base">Share Journal Entries</Label>
                      <p className="text-xs text-muted-foreground">Allow AI to read journals for insights</p>
                    </div>
                    <Switch
                      checked={privacySettings.share_journal}
                      onCheckedChange={(c) => setPrivacySettings(prev => ({ ...prev, share_journal: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-base">Share Mood Logs</Label>
                      <p className="text-xs text-muted-foreground">Allow AI to track mood trends</p>
                    </div>
                    <Switch
                      checked={privacySettings.share_mood}
                      onCheckedChange={(c) => setPrivacySettings(prev => ({ ...prev, share_mood: c }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-base">Share Activities</Label>
                      <p className="text-xs text-muted-foreground">Allow AI to recommend activities</p>
                    </div>
                    <Switch
                      checked={privacySettings.share_activities}
                      onCheckedChange={(c) => setPrivacySettings(prev => ({ ...prev, share_activities: c }))}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Goals & Persona */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Target className="h-6 w-6 text-primary" /> Your Goals
                  </h2>
                  <p className="text-muted-foreground">
                    What brings you to Serenify? Select all that apply.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {GOAL_OPTIONS.map((goal) => (
                    <div
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedGoals.includes(goal)
                        ? "bg-primary/10 border-primary shadow-inner"
                        : "bg-card hover:bg-muted/50 border-border"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${selectedGoals.includes(goal) ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                          {selectedGoals.includes(goal) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm font-medium ${selectedGoals.includes(goal) ? "text-primary" : "text-foreground"}`}>
                          {goal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" /> Anything else we should know?
                  </Label>
                  <Textarea
                    placeholder="I'm feeling a bit overwhelmed lately and want to find balance..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-none min-h-[80px]"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                  <Button onClick={() => setStep(5)} disabled={!canProceedStep4} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Initial Check-In */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">How are you feeling right now?</h2>
                  <p className="text-muted-foreground">
                    Let's start your journey with a quick check-in.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-center">
                    <MoodSelector selectedMood={selectedMood} onSelectMood={setSelectedMood} size="lg" />
                  </div>

                  {selectedMood && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">Deeper Dive</h3>
                        <MoodDimensionsSelector
                          dimensions={moodDimensions}
                          onChange={setMoodDimensions}
                          className="bg-muted/30 p-4 rounded-xl"
                        />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">Context</h3>
                        <MoodTriggerSelector
                          selectedTriggers={selectedTriggers}
                          onTriggersChange={setSelectedTriggers}
                          contextNote={additionalNotes}
                          onContextNoteChange={setAdditionalNotes}
                          className="bg-muted/30 p-4 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
                  <Button
                    onClick={handleFinish}
                    disabled={!selectedMood || loading}
                    className="flex-1 gap-2 shadow-lg hover:shadow-primary/25"
                  >
                    {loading ? "Setting up..." : (
                      <>
                        Finish Setup <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
