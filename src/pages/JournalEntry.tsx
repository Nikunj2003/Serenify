import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Save, Trash2, Loader2, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

type JournalEntryType = {
  id: string;
  content: string;
  mood: string;
  created_at: string;
  is_favorite: boolean;
  is_private: boolean;
};

const JournalEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState<JournalEntryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchEntry();
    }
  }, [user, id]);

  const fetchEntry = async () => {
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEntry(data);
      setContent(data.content);
    } catch (error) {
      console.error("Error fetching entry:", error);
      toast.error("Could not load journal entry");
    } finally {
      setLoading(false);
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

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("journal_entries")
        .update({ content })
        .eq("id", id);

      if (error) throw error;

      toast.success("Entry updated successfully!");
      setEntry(prev => prev ? { ...prev, content } : null);
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Failed to update entry: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavorite = async () => {
    if (!entry) return;
    try {
      const newStatus = !entry.is_favorite;
      const { error } = await supabase
        .from("journal_entries")
        .update({ is_favorite: newStatus })
        .eq("id", id);

      if (error) throw error;
      setEntry({ ...entry, is_favorite: newStatus });
      toast.success(newStatus ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  const togglePrivate = async () => {
    if (!entry) return;
    try {
      const newStatus = !entry.is_private;
      const { error } = await supabase
        .from("journal_entries")
        .update({ is_private: newStatus })
        .eq("id", id);

      if (error) throw error;
      setEntry({ ...entry, is_private: newStatus });
      toast.success(newStatus ? "Marked as private" : "Marked as public");
    } catch (error) {
      toast.error("Failed to update privacy status");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Entry deleted");
      navigate("/journal");
    } catch (error: any) {
      toast.error("Failed to delete entry: " + error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!entry) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
          <h2 className="text-2xl font-semibold mb-4">Entry not found</h2>
          <Button onClick={() => navigate("/journal")}>Back to Journal</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/journal")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Journal
        </Button>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getMoodEmoji(entry.mood)}</span>
                <div>
                  <CardTitle className="capitalize">{entry.mood}</CardTitle>
                  <CardDescription>
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                {!isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFavorite}
                      className={entry.is_favorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground"}
                    >
                      <Star className={`w-4 h-4 ${entry.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePrivate}
                      className={entry.is_private ? "text-primary" : "text-muted-foreground"}
                    >
                      <Lock className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your journal entry.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="bg-card rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
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
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setContent(entry.content);
                      setIsEditing(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div
                  className="text-base leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JournalEntry;
