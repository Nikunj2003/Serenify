import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MoodSelector from "@/components/MoodSelector";
import { ArrowLeft, Save, Sparkles, Loader2, RefreshCw, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import { generateJournalPrompt, generateJournalTags } from "@/lib/ai-service";
import { getRandomPrompt } from "@/lib/journal-prompts";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { checkAndUnlockAchievements } from "@/lib/achievement-service";

const JournalNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mood, setMood] = useState<number>(3);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  // Initial prompts from static list (random 3)
  const [displayPrompts, setDisplayPrompts] = useState<string[]>(() => {
    return [getRandomPrompt().text, getRandomPrompt().text, getRandomPrompt().text];
  });

  const getMoodLabel = (moodValue: number) => {
    const labels = ["", "struggling", "difficult", "okay", "good", "great"];
    return labels[moodValue] || "okay";
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Please write something before saving");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to save entries");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        content,
        mood: getMoodLabel(mood),
        sentiment_score: 0.5, // Placeholder for now
        tags: tags,
        is_favorite: isFavorite,
        is_private: isPrivate
      });

      if (error) throw error;

      toast.success("Journal entry saved! 🎉");

      // Check for achievements
      checkAndUnlockAchievements(user.id);

      navigate("/journal");
    } catch (error: any) {
      toast.error("Failed to save entry: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!user) return;
    setIsGeneratingPrompts(true);
    try {
      const aiPrompts = await generateJournalPrompt(user.id);
      setGeneratedPrompts(aiPrompts);
      setDisplayPrompts(aiPrompts);
      toast.success("Generated new prompts for you! ✨");
    } catch (error) {
      toast.error("Failed to generate prompts");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleRefreshStaticPrompts = () => {
    setDisplayPrompts([getRandomPrompt().text, getRandomPrompt().text, getRandomPrompt().text]);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/journal")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>New Journal Entry</CardTitle>
            </div>
            <CardDescription>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            {/* Mood Selection */}
            <div className="space-y-3">
              <Label>How are you feeling right now?</Label>
              <MoodSelector selectedMood={mood} onSelectMood={setMood} />
            </div>

            {/* Writing Prompts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Need inspiration? Try one of these prompts:
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshStaticPrompts}
                    className="h-8 w-8 p-0"
                    title="Refresh prompts"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePrompts}
                    disabled={isGeneratingPrompts}
                    className="h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  >
                    {isGeneratingPrompts ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    AI Prompts
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {displayPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setContent((prev) => (prev ? prev + "\n\n" : "") + prompt + "\n")}
                    className="text-xs h-auto py-2 px-3 whitespace-normal text-left hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex gap-4">
              <Button
                variant={isFavorite ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFavorite(!isFavorite)}
                className="gap-2"
              >
                <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>
              <Button
                variant={isPrivate ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPrivate(!isPrivate)}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                {isPrivate ? "Private Entry" : "Make Private"}
              </Button>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag and press Enter..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    if (!content.trim()) {
                      toast.error("Please write something first");
                      return;
                    }
                    toast.info("Generating tags...");
                    try {
                      const newTags = await generateJournalTags(content);
                      if (newTags.length > 0) {
                        const uniqueNewTags = newTags.filter(t => !tags.includes(t));
                        setTags([...tags, ...uniqueNewTags]);
                        toast.success(`Added ${uniqueNewTags.length} tags`);
                      } else {
                        toast.info("No relevant tags found");
                      }
                    } catch (e) {
                      toast.error("Failed to generate tags");
                    }
                  }}
                  title="Auto-generate tags"
                  className="text-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Journal Content */}
            <div className="space-y-3">
              <Label htmlFor="journal-content">Your thoughts</Label>
              <div className="bg-card rounded-md overflow-hidden border border-border">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  placeholder="Write freely... there's no right or wrong way to journal. This is your safe space to express yourself."
                  className="h-[300px] mb-12"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/journal")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2 text-sm">✨ Journaling Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Write without judging yourself</li>
              <li>• Focus on how you feel, not just what happened</li>
              <li>• It's okay to be messy - this is just for you</li>
              <li>• Try to journal regularly to see patterns over time</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JournalNew;
