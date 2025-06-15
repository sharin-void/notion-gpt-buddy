export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          created_at: string
          title: string
          last_updated: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          last_updated?: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          last_updated?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for our application
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type NewConversation = Database['public']['Tables']['conversations']['Insert']
export type NewMessage = Database['public']['Tables']['messages']['Insert']

export type UpdateConversation = Database['public']['Tables']['conversations']['Update']
export type UpdateMessage = Database['public']['Tables']['messages']['Update'] 
