import { supabase } from "./supabase";

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    tags?: string[];
    is_archived?: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    user_id: string;
    sender: 'user' | 'ai';
    content: string;
    is_pinned?: boolean;
    created_at: string;
}

export const chatService = {
    // Create a new chat session
    async createSession(userId: string, title: string = "New Chat"): Promise<ChatSession | null> {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({ user_id: userId, title })
            .select()
            .single();

        if (error) {
            console.error("Error creating chat session:", error);
            return null;
        }
        return data;
    },

    // Get all chat sessions for a user
    async getSessions(userId: string): Promise<ChatSession[]> {
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Error fetching chat sessions:", error);
            return [];
        }
        return data || [];
    },

    // Get messages for a session
    async getMessages(sessionId: string): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return [];
        }
        return data || [];
    },

    // Save a message to the database
    async saveMessage(sessionId: string, userId: string, sender: 'user' | 'ai', content: string): Promise<ChatMessage | null> {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({ session_id: sessionId, user_id: userId, sender, content })
            .select()
            .single();

        if (error) {
            console.error("Error saving message:", error);
            return null;
        }

        // Update session updated_at
        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        return data;
    },

    // Update session title (e.g., after first message)
    async updateSessionTitle(sessionId: string, title: string) {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);

        if (error) {
            console.error("Error updating session title:", error);
        }
    },

    // Delete a session
    async deleteSession(sessionId: string) {
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error("Error deleting session:", error);
            throw error;
        }
    },

    // Update session tags
    async updateSessionTags(sessionId: string, tags: string[]) {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ tags })
            .eq('id', sessionId);

        if (error) {
            console.error("Error updating session tags:", error);
        }
    },

    // Toggle pin status of a message
    async togglePinMessage(messageId: string, isPinned: boolean) {
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_pinned: isPinned })
            .eq('id', messageId);

        if (error) {
            console.error("Error toggling pin status:", error);
        }
    }
};
