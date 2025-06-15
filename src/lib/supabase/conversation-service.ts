import { supabase } from './client'
import type { Conversation, Message, NewConversation, NewMessage } from '@/types/database'

export class ConversationService {
  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .order('last_updated', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Update a conversation
   */
  async updateConversation(id: string, updates: Partial<NewConversation>): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      })
      .select()
      .single()

    if (error) throw error

    // Update conversation's last_updated timestamp
    await this.updateConversation(conversationId, {
      last_updated: new Date().toISOString()
    })

    return data
  }

  /**
   * Get all messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
} 
