export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          slug: string
          title: string
          author: string
          description: string | null
          long_description: string | null
          price: number
          cover_url: string | null
          preview_pdf_url: string | null
          preview_pages: number
          pdf_path: string | null
          epub_path: string | null
          page_count: number | null
          language: string
          publisher: string | null
          published_year: number | null
          tags: string[]
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          author: string
          description?: string | null
          long_description?: string | null
          price: number
          cover_url?: string | null
          preview_pdf_url?: string | null
          preview_pages?: number
          pdf_path?: string | null
          epub_path?: string | null
          page_count?: number | null
          language?: string
          publisher?: string | null
          published_year?: number | null
          tags?: string[]
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          author?: string
          description?: string | null
          long_description?: string | null
          price?: number
          cover_url?: string | null
          preview_pdf_url?: string | null
          preview_pages?: number
          pdf_path?: string
          epub_path?: string | null
          page_count?: number | null
          language?: string
          publisher?: string | null
          published_year?: number | null
          tags?: string[]
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          book_id: string
          buyer_email: string
          buyer_name: string
          payment_id: string | null
          payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
          amount_paid: number | null
          currency: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          confirmed_at: string | null
          is_gift: boolean
          recipient_email: string | null
          recipient_name: string | null
        }
        Insert: {
          id?: string
          book_id: string
          buyer_email: string
          buyer_name: string
          payment_id?: string | null
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          amount_paid?: number | null
          currency?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          confirmed_at?: string | null
          is_gift?: boolean
          recipient_email?: string | null
          recipient_name?: string | null
        }
        Update: {
          id?: string
          book_id?: string
          buyer_email?: string
          buyer_name?: string
          payment_id?: string | null
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          amount_paid?: number | null
          currency?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          confirmed_at?: string | null
          is_gift?: boolean
          recipient_email?: string | null
          recipient_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchases_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          }
        ]
      }
      download_tokens: {
        Row: {
          id: string
          purchase_id: string
          token_hash: string
          format: 'viewer' | 'pdf' | 'epub'
          expires_at: string
          used_count: number
          max_uses: number
          last_used_at: string | null
          created_at: string
          revoked: boolean
        }
        Insert: {
          id?: string
          purchase_id: string
          token_hash: string
          format: 'viewer' | 'pdf' | 'epub'
          expires_at: string
          used_count?: number
          max_uses?: number
          last_used_at?: string | null
          created_at?: string
          revoked?: boolean
        }
        Update: {
          id?: string
          purchase_id?: string
          token_hash?: string
          format?: 'viewer' | 'pdf' | 'epub'
          expires_at?: string
          used_count?: number
          max_uses?: number
          last_used_at?: string | null
          created_at?: string
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'download_tokens_purchase_id_fkey'
            columns: ['purchase_id']
            isOneToOne: false
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          }
        ]
      }
      watermark_cache: {
        Row: {
          id: string
          purchase_id: string
          format: 'pdf' | 'epub'
          storage_path: string
          generated_at: string
          expires_at: string
          file_size_bytes: number | null
        }
        Insert: {
          id?: string
          purchase_id: string
          format: 'pdf' | 'epub'
          storage_path: string
          generated_at?: string
          expires_at?: string
          file_size_bytes?: number | null
        }
        Update: {
          id?: string
          purchase_id?: string
          format?: 'pdf' | 'epub'
          storage_path?: string
          generated_at?: string
          expires_at?: string
          file_size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'watermark_cache_purchase_id_fkey'
            columns: ['purchase_id']
            isOneToOne: false
            referencedRelation: 'purchases'
            referencedColumns: ['id']
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          name: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          unsubscribe_token: string
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          unsubscribe_token?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          unsubscribe_token?: string
          is_active?: boolean
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_monthly_revenue: {
        Args: Record<string, never>
        Returns: { month: string; revenue: number }[]
      }
      get_purchases_per_book: {
        Args: Record<string, never>
        Returns: { book_title: string; purchase_count: number; total_revenue: number }[]
      }
      get_daily_purchases: {
        Args: { days_back?: number }
        Returns: { day: string; count: number }[]
      }
      consume_token: {
        Args: { p_token_hash: string; p_format: string }
        Returns: {
          id: string
          purchase_id: string
          token_hash: string
          format: string
          expires_at: string
          used_count: number
          max_uses: number
          last_used_at: string | null
          created_at: string
          revoked: boolean
        }
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
