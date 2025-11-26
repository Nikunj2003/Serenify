import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/components/AuthProvider";
import DocumentUpload from "@/components/DocumentUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { Calendar, TrendingUp, Award, Edit2, LogOut, Moon, Sun, CheckCircle2, User, Settings, RefreshCw, Trophy, Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useTheme } from "@/components/ThemeProvider";

import AchievementSystem from "@/components/AchievementSystem";

interface PrivacySettings {
  share_journal: boolean;
  share_mood: boolean;
  share_activities: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.user_metadata?.full_name || "User");
  const [isEditingName, setIsEditingName] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    checkInsThisMonth: 0,
    activitiesCompleted: 0
  });
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(true);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    share_journal: true,
    share_mood: true,
    share_activities: true
  });

  useEffect(() => {
    if (user) {
      fetchRecentEntries();
      fetchStats();
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_settings')
      .eq('id', user.id)
      .single();

    if (data?.privacy_settings) {
      setPrivacySettings(data.privacy_settings as PrivacySettings);
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user) return;

    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);

    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: newSettings })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update privacy settings");
      // Revert on error
      setPrivacySettings(privacySettings);
    } else {
      toast.success("Privacy settings updated");
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 1. Fetch Check-ins (Mood Logs) this month
    const { count: checkInsCount } = await supabase
      .from("mood_logs")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth);

    // 2. Fetch Activities completed this month
    const { count: activitiesCount } = await supabase
      .from("user_activities")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .gte("completed_at", startOfMonth);

    // 3. Calculate Streak
    // Fetch all dates with activity (mood or journal)
    const { data: moodDates } = await supabase
      .from("mood_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: journalDates } = await supabase
      .from("journal_entries")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const dates = [
      ...(moodDates?.map(d => d.created_at.split('T')[0]) || []),
      ...(journalDates?.map(d => d.created_at.split('T')[0]) || [])
    ];

    // Unique sorted dates
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();

    let currentStreak = 0;
    let maxStreak = 0; // Ideally this would be stored/tracked historically, but for now we calculate current

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      currentStreak = 1;
      let checkDate = new Date(uniqueDates.includes(today) ? today : yesterday);

      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const expectedDate = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(expectedDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStats({
      streak: currentStreak,
      longestStreak: Math.max(currentStreak, stats.longestStreak), // Simple logic for now
      checkInsThisMonth: checkInsCount || 0,
      activitiesCompleted: activitiesCount || 0
    });
  };

  const fetchRecentEntries = async () => {
    setLoadingJournal(true);
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) setJournalEntries(data);
    setLoadingJournal(false);
  };

  const handleUpdateName = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });

      if (error) throw error;

      toast.success("Profile updated successfully");
      setIsEditingName(false);
    } catch (error: any) {
      toast.error("Error updating profile");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleDownloadData = async () => {
    if (!user) return;

    try {
      toast.info("Preparing your PDF report...");

      // Fetch all user data
      const [
        { data: moodLogs },
        { data: journalEntries },
        { data: activities }
      ] = await Promise.all([
        supabase.from("mood_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("journal_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("user_activities").select("*").order("completed_at", { ascending: false })
      ]);

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;

      // Helper function to check page break
      const checkPageBreak = (height: number) => {
        if (yPos + height > pageHeight - margin) {
          doc.addPage();
          yPos = 20;
        }
      };

      // Title
      doc.setFontSize(24);
      doc.setTextColor(99, 102, 241); // Primary color
      doc.text("MindCompanion", margin, yPos);
      yPos += 10;

      doc.setFontSize(16);
      doc.setTextColor(100, 100, 100);
      doc.text("Personal Data Report", margin, yPos);
      yPos += 15;

      // User Profile Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("User Profile", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Name: ${user.user_metadata?.full_name || "User"}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Email: ${user.email}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin + 5, yPos);
      yPos += 12;

      // Statistics Section
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Overview Statistics", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Current Streak: ${stats.streak} days`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Longest Streak: ${stats.longestStreak} days`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Check-ins This Month: ${stats.checkInsThisMonth}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Activities Completed: ${stats.activitiesCompleted}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Total Mood Logs: ${moodLogs?.length || 0}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Total Journal Entries: ${journalEntries?.length || 0}`, margin + 5, yPos);
      yPos += 12;

      // Mood Trends Section
      if (moodLogs && moodLogs.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Recent Mood Trends (Last 10)", margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        moodLogs.slice(0, 10).forEach((log: any) => {
          checkPageBreak(6);
          const date = new Date(log.created_at).toLocaleDateString();
          doc.text(`${date}: ${log.mood.charAt(0).toUpperCase() + log.mood.slice(1)}`, margin + 5, yPos);
          yPos += 5;
        });
        yPos += 7;
      }

      // Wellness Activities Section
      if (activities && activities.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Recent Wellness Activities (Last 10)", margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        activities.slice(0, 10).forEach((activity: any) => {
          checkPageBreak(6);
          const date = new Date(activity.completed_at).toLocaleDateString();
          const duration = Math.round(activity.duration_seconds / 60);
          doc.text(`${date}: ${activity.activity_type} (${duration} min)`, margin + 5, yPos);
          yPos += 5;
        });
        yPos += 7;
      }

      // Journal Entries Section (Summary)
      if (journalEntries && journalEntries.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Recent Journal Entries (Last 5)", margin, yPos);
        yPos += 8;

        doc.setFontSize(9);
        journalEntries.slice(0, 5).forEach((entry: any) => {
          checkPageBreak(20);
          const date = new Date(entry.created_at).toLocaleDateString();
          doc.setTextColor(99, 102, 241);
          doc.text(`${date} - ${entry.mood}`, margin + 5, yPos);
          yPos += 5;

          doc.setTextColor(60, 60, 60);
          const preview = entry.content.substring(0, 100) + (entry.content.length > 100 ? "..." : "");
          const lines = doc.splitTextToSize(preview, 160);
          lines.forEach((line: string) => {
            checkPageBreak(5);
            doc.text(line, margin + 5, yPos);
            yPos += 4;
          });
          yPos += 3;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${totalPages} | Generated by MindCompanion`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Download PDF
      doc.save(`mindcompanion-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case "great": return "😄";
      case "good": return "😊";
      case "okay": return "😐";
      case "difficult": return "😔";
      case "struggling": return "😢";
      default: return "😐";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex w-full justify-start overflow-x-auto md:grid md:grid-cols-6 h-auto p-1 gap-1 bg-muted/50 no-scrollbar">
            <TabsTrigger value="overview" className="flex-shrink-0 px-3">Overview</TabsTrigger>
            <TabsTrigger value="history" className="flex-shrink-0 px-3">Journal History</TabsTrigger>
            <TabsTrigger value="documents" className="flex-shrink-0 px-3">Documents</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-shrink-0 px-3">Achievements</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-shrink-0 px-3">Privacy</TabsTrigger>
            <TabsTrigger value="settings" className="flex-shrink-0 px-3">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                    {name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    {isEditingName ? (
                      <div className="flex gap-2">
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="max-w-xs"
                        />
                        <Button size="sm" onClick={handleUpdateName}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{name}</h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditingName(true)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-5 h-5 text-accent" />
                    <span className="font-medium">Current streak: {stats.streak} days in a row! 🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <CardDescription>This Month</CardDescription>
                  </div>
                  <CardTitle className="text-3xl">{stats.checkInsThisMonth}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total check-ins</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <CardDescription>Activities</CardDescription>
                  </div>
                  <CardTitle className="text-3xl">{stats.activitiesCompleted}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Award className="w-4 h-4" />
                    <CardDescription>Streak</CardDescription>
                  </div>
                  <CardTitle className="text-3xl">{stats.streak} days</CardTitle>
                </CardHeader>
                <CardContent>
                </CardContent>
              </Card>
            </div>

            {/* Mood Goals removed */}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Journal History</CardTitle>
                <CardDescription>Your latest journal entries</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingJournal ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : journalEntries.length > 0 ? (
                  <div className="space-y-4">
                    {journalEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{new Date(entry.created_at).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{entry.content}</p>
                        </div>
                        <div className="text-sm font-medium capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {entry.mood}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No recent activity</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Upload and manage your health documents</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <AchievementSystem />
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Privacy Controls</CardTitle>
                </div>
                <CardDescription>Control what data the AI can access to personalize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Journal Entries</Label>
                    <p className="text-sm text-muted-foreground">Allow AI to read your journals for better advice</p>
                  </div>
                  <Switch
                    checked={privacySettings.share_journal}
                    onCheckedChange={(checked) => updatePrivacySetting('share_journal', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Mood Logs</Label>
                    <p className="text-sm text-muted-foreground">Allow AI to analyze your mood patterns</p>
                  </div>
                  <Switch
                    checked={privacySettings.share_mood}
                    onCheckedChange={(checked) => updatePrivacySetting('share_mood', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Activities</Label>
                    <p className="text-sm text-muted-foreground">Allow AI to recommend activities based on history</p>
                  </div>
                  <Switch
                    checked={privacySettings.share_activities}
                    onCheckedChange={(checked) => updatePrivacySetting('share_activities', checked)}
                  />
                </div>

                <div className="bg-muted/30 p-4 rounded-lg flex gap-3 text-sm text-muted-foreground">
                  <Lock className="h-5 w-5 shrink-0" />
                  <p>Your data is private and secure. The AI only accesses what you explicitly allow here to provide personalized support. We do not sell your data.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditingName}
                    />
                    {isEditingName ? (
                      <Button onClick={handleUpdateName}>Save</Button>
                    ) : (
                      <Button variant="outline" onClick={() => setIsEditingName(true)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive daily reminders</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Data Management</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadData} className="w-full sm:w-auto">
                      Export Health Report (PDF)
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
