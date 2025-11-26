import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2, MessageSquare, Plus, Trash2, Menu, Pin, Sparkles, Settings, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { chatWithAI, getRecommendedActivities, generateChatTags } from "@/lib/ai-service";
import { chatService, ChatSession, ChatMessage } from "@/lib/chat-service";
import MarkdownMessage from "@/components/MarkdownMessage";
import { useAuth } from "@/components/AuthProvider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";
import { toast } from "sonner";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const starterPrompts = [
  "I'm feeling anxious today",
  "Help me relax",
  "I want to talk about my day",
  "Give me a coping strategy",
];

const crisisKeywords = ["suicide", "kill myself", "end it all", "don't want to live", "hurt myself"];

interface SidebarContentProps {
  onNewChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

const SidebarContent = ({
  onNewChat,
  searchQuery,
  onSearchChange,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession
}: SidebarContentProps) => (
  <div className="flex flex-col h-full">
    <div className="mb-4 space-y-2">
      <Button onClick={onNewChat} className="w-full gap-2">
        <Plus className="w-4 h-4" /> New Chat
      </Button>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${currentSessionId === session.id
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted text-muted-foreground"
            }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <div className="truncate text-sm font-medium">
              {session.title || "New Chat"}
              <div className="text-xs opacity-70 font-normal flex gap-2">
                <span>{format(new Date(session.updated_at), "MMM d")}</span>
                {session.tags && session.tags.length > 0 && (
                  <span className="bg-primary/10 px-1 rounded text-[10px]">{session.tags.length} tags</span>
                )}
              </div>
            </div>
          </div>
          {session.title !== "New Chat" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => onDeleteSession(e, session.id)}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          )}
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4">
          No chats found
        </div>
      )}
    </div>
  </div>
);

const Chat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const scrollToBottom = (smooth = false) => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }
  };

  useEffect(() => {
    // Scroll to bottom on initial load and when messages change
    // Use smooth scroll only if it's not the initial load (optional, but good UX)
    scrollToBottom(messages.length > 0);
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    if (!user) return;
    const data = await chatService.getSessions(user.id);
    setSessions(data);

    // Select most recent session if available, otherwise create new
    // Only auto-select if we don't have a session selected yet
    if (data.length > 0 && !currentSessionId) {
      setCurrentSessionId(data[0].id);
    }
    // Only create new chat if there are no sessions AND no current session
    // This prevents double-loading when a new session is being created
    if (data.length === 0 && !currentSessionId) {
      handleNewChat();
    }
  };

  const loadMessages = async (sessionId: string) => {
    setIsLoadingHistory(true);
    const data = await chatService.getMessages(sessionId);
    setMessages(data);
    setIsLoadingHistory(false);
  };

  const handleNewChat = async () => {
    if (!user) return;

    // Check if the most recent session is already an empty "New Chat"
    if (sessions.length > 0 && sessions[0].title === "New Chat") {
      // If we are currently on this session and it has messages, we should create a new one
      // regardless of the title being "New Chat" (e.g. if title update failed or manual rename)
      if (currentSessionId === sessions[0].id && messages.length > 0) {
        // Proceed to create new session
      } else {
        // Otherwise, switch to the existing empty "New Chat"
        if (currentSessionId !== sessions[0].id) {
          setCurrentSessionId(sessions[0].id);
        }
        return;
      }
    }

    const newSession = await chatService.createSession(user.id, "New Chat");
    if (newSession) {
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
    }
  };

  const confirmDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await chatService.deleteSession(sessionToDelete);
      setSessions(sessions.filter(s => s.id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast.success("Chat deleted");
    } catch (error) {
      toast.error("Failed to delete chat");
    } finally {
      setSessionToDelete(null);
    }
  };

  const detectCrisis = (text: string) => {
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || !user || !currentSessionId) return;

    // Check for crisis keywords
    if (detectCrisis(messageText)) {
      setShowCrisisAlert(true);
    }

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      session_id: currentSessionId,
      user_id: user.id,
      sender: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Save user message to DB
      await chatService.saveMessage(currentSessionId, user.id, 'user', messageText);

      // Update session title and tags if it's the first message
      if (messages.length === 0) {
        const newTitle = messageText.slice(0, 30) + (messageText.length > 30 ? "..." : "");
        await chatService.updateSessionTitle(currentSessionId, newTitle);

        // Generate and save tags
        const tags = await generateChatTags(messageText);
        await chatService.updateSessionTags(currentSessionId, tags);

        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle, tags: tags } : s));
      }

      // Get AI response
      const response = await chatWithAI(messageText, user.id, currentSessionId);

      // Save AI message to DB
      const aiMsg = await chatService.saveMessage(currentSessionId, user.id, 'ai', response || "I'm having trouble connecting.");

      if (aiMsg) {
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Error in chat flow:", error);
      toast.error("Failed to send message");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleOpenSettings = () => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession) {
      setEditingTitle(currentSession.title);
      setEditingTags(currentSession.tags || []);
      setIsSettingsOpen(true);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentSessionId) return;

    try {
      if (editingTitle.trim()) {
        await chatService.updateSessionTitle(currentSessionId, editingTitle);
      }
      await chatService.updateSessionTags(currentSessionId, editingTags);

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: editingTitle, tags: editingTags } : s));
      setIsSettingsOpen(false);
      toast.success("Chat settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editingTags.includes(newTag.trim())) {
      setEditingTags([...editingTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  const handleExportChat = () => {
    if (!currentSessionId) return;

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const exportContent = messages.map(m => {
      const role = m.sender === 'user' ? 'You' : 'AI Companion';
      const time = new Date(m.created_at).toLocaleString();
      return `[${time}] ${role}:\n${m.content}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Chat exported successfully");
  };

  return (
    <Layout hideMobileHeader={true}>
      <div className="container mx-auto px-4 py-6 max-w-6xl h-[calc(100dvh-120px)] md:h-[calc(100vh-100px)] flex gap-6">
        {/* Sidebar for Desktop */}
        <div className="hidden md:block w-64 shrink-0 border-r pr-6">
          <SidebarContent
            onNewChat={handleNewChat}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sessions={filteredSessions}
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onDeleteSession={confirmDeleteSession}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="mt-6 h-full">
                  <SidebarContent
                    onNewChat={handleNewChat}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sessions={filteredSessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={setCurrentSessionId}
                    onDeleteSession={confirmDeleteSession}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold truncate max-w-[150px]">
              {sessions.find(s => s.id === currentSessionId)?.title || "Chat"}
            </span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={handleOpenSettings} disabled={!currentSessionId}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleNewChat}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Desktop Header Actions */}
          <div className="hidden md:flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="font-semibold text-lg truncate max-w-md">
              {sessions.find(s => s.id === currentSessionId)?.title || "Chat"}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleOpenSettings} disabled={!currentSessionId}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>

          {showCrisisAlert && (
            <Card className="mb-4 p-4 bg-destructive/10 border-destructive shrink-0">
              <div className="space-y-3">
                <p className="font-semibold text-destructive">
                  We're concerned about you. Help is available 24/7.
                </p>
                <Button variant="destructive" asChild>
                  <Link to="/crisis">View Crisis Resources</Link>
                </Button>
              </div>
            </Card>
          )}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
          >

            {isLoadingHistory ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <LoadingSkeleton className="h-16 w-2/3 rounded-2xl" />
                </div>
                <div className="flex justify-start">
                  <LoadingSkeleton className="h-24 w-3/4 rounded-2xl" />
                </div>
                <div className="flex justify-end">
                  <LoadingSkeleton className="h-12 w-1/2 rounded-2xl" />
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 p-8">
                <div className="text-6xl mb-4 animate-float">💬</div>
                <div>
                  <h2 className="text-3xl font-bold mb-3 text-balance">Start a conversation</h2>
                  <p className="text-muted-foreground text-lg mb-8 max-w-md">
                    Share what's on your mind. I'm here to listen without judgment.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {starterPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      onClick={() => handleSend(prompt)}
                      className="text-left justify-start h-auto py-4 px-5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all group"
                    >
                      <MarkdownMessage content={prompt} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in group`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm relative ${message.sender === "user"
                      ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground"
                      : "bg-gradient-to-br from-card to-muted border"
                      } ${message.is_pinned ? "ring-2 ring-yellow-400/50" : ""}`}
                  >
                    {message.is_pinned && (
                      <div className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-600 rounded-full p-1 shadow-sm">
                        <Pin className="w-3 h-3" />
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      <MarkdownMessage content={message.content} />
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-4">
                      <p className={`text-xs ${message.sender === "user" ? "opacity-80" : "text-muted-foreground"}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${message.is_pinned ? "text-yellow-500 opacity-100" : "text-muted-foreground"}`}
                        onClick={async () => {
                          await chatService.togglePinMessage(message.id, !message.is_pinned);
                          setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_pinned: !message.is_pinned } : m));
                        }}
                        title={message.is_pinned ? "Unpin message" : "Pin message"}
                      >
                        <Pin className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-card to-muted/30 border rounded-2xl p-4 shadow-lg shrink-0">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="min-h-[60px] max-h-[120px] resize-none border-muted-foreground/20 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
                maxLength={500}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping || !currentSessionId}
                size="icon"
                className="h-[60px] w-[60px] shrink-0 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Press Enter to send • Shift+Enter for new line
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-full"
                  onClick={async () => {
                    if (!currentSessionId || !user) return;

                    const userPrompt = "Can you suggest some wellness activities for me based on our conversation?";

                    // Add user message first
                    const tempUserMsg: ChatMessage = {
                      id: Date.now().toString(),
                      session_id: currentSessionId,
                      user_id: user.id,
                      sender: 'user',
                      content: userPrompt,
                      created_at: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, tempUserMsg]);
                    setIsTyping(true);

                    try {
                      await chatService.saveMessage(currentSessionId, user.id, 'user', userPrompt);

                      // Update session title if it's the first message
                      if (messages.length === 0) {
                        const newTitle = "Wellness Activities";
                        await chatService.updateSessionTitle(currentSessionId, newTitle);

                        // Generate and save tags
                        const tags = await generateChatTags(userPrompt); // Use userPrompt as context for tags if it's the first message
                        await chatService.updateSessionTags(currentSessionId, tags);

                        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle, tags: tags } : s));
                      }

                      toast.info("Finding wellness activities...");
                      const lastMessages = messages.slice(-5).map(m => m.content).join("\n");
                      const activities = await getRecommendedActivities(lastMessages);

                      if (activities.length > 0) {
                        const activityText = "Here are some recommended activities for you:\n\n" +
                          activities.map(a => `**${a.title}** (${a.type}): ${a.reason}`).join("\n");

                        // Add as AI message
                        await chatService.saveMessage(currentSessionId, user.id, 'ai', activityText);
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          session_id: currentSessionId,
                          user_id: user.id,
                          sender: 'ai',
                          content: activityText,
                          created_at: new Date().toISOString()
                        }]);
                      } else {
                        const noRecText = "I couldn't find specific activities right now, but I'm here to listen.";
                        await chatService.saveMessage(currentSessionId, user.id, 'ai', noRecText);
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          session_id: currentSessionId,
                          user_id: user.id,
                          sender: 'ai',
                          content: noRecText,
                          created_at: new Date().toISOString()
                        }]);
                      }
                    } catch (error) {
                      toast.error("Failed to get recommendations");
                    } finally {
                      setIsTyping(false);
                    }
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Suggest Activities
                </Button>
                <p className={`text-xs transition-colors ${input.length > 450 ? "text-destructive font-semibold" : "text-muted-foreground"
                  }`}>
                  {input.length}/500
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md max-w-[90vw] mx-4">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Chat Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editingTags.map((tag, index) => (
                  <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="secondary" onClick={handleExportChat}>
              Export Chat
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout >
  );
};

export default Chat;
