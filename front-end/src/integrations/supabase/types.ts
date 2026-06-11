export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      estoque: {
        Row: {
          criado_em: string
          data_contagem: string | null
          entradas: number
          id: string
          lote: string
          material_id: string
          saidas: number
          saldo_atual: number
          saldo_inicial: number
          ultima_movimentacao: string | null
          validade: string | null
        }
        Insert: {
          criado_em?: string
          data_contagem?: string | null
          entradas?: number
          id?: string
          lote: string
          material_id: string
          saidas?: number
          saldo_atual?: number
          saldo_inicial?: number
          ultima_movimentacao?: string | null
          validade?: string | null
        }
        Update: {
          criado_em?: string
          data_contagem?: string | null
          entradas?: number
          id?: string
          lote?: string
          material_id?: string
          saidas?: number
          saldo_atual?: number
          saldo_inicial?: number
          ultima_movimentacao?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      historico: {
        Row: {
          cirurgia_id: string | null
          convenio: string | null
          criado_em: string
          hospital: string | null
          id: string
          lote: string | null
          material_id: string | null
          material_nome: string | null
          paciente: string | null
          procedimento: string | null
          quantidade: number
          referencia_cfn: string | null
          tamanho: string | null
          tipo: string
          validade: string | null
        }
        Insert: {
          cirurgia_id?: string | null
          convenio?: string | null
          criado_em?: string
          hospital?: string | null
          id?: string
          lote?: string | null
          material_id?: string | null
          material_nome?: string | null
          paciente?: string | null
          procedimento?: string | null
          quantidade?: number
          referencia_cfn?: string | null
          tamanho?: string | null
          tipo: string
          validade?: string | null
        }
        Update: {
          cirurgia_id?: string | null
          convenio?: string | null
          criado_em?: string
          hospital?: string | null
          id?: string
          lote?: string | null
          material_id?: string | null
          material_nome?: string | null
          paciente?: string | null
          procedimento?: string | null
          quantidade?: number
          referencia_cfn?: string | null
          tamanho?: string | null
          tipo?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          criado_em: string
          estoque_minimo: number
          fornecedor_padrao: string | null
          id: string
          nome: string
          referencia_cfn: string | null
          tamanho: string | null
          unidade: string
        }
        Insert: {
          criado_em?: string
          estoque_minimo?: number
          fornecedor_padrao?: string | null
          id?: string
          nome: string
          referencia_cfn?: string | null
          tamanho?: string | null
          unidade?: string
        }
        Update: {
          criado_em?: string
          estoque_minimo?: number
          fornecedor_padrao?: string | null
          id?: string
          nome?: string
          referencia_cfn?: string | null
          tamanho?: string | null
          unidade?: string
        }
        Relationships: []
      }
      procedimentos: {
        Row: {
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      reposicao_chegadas: {
        Row: {
          criado_em: string
          data_chegada: string
          id: string
          observacao: string | null
          quantidade: number
          reposicao_id: string
        }
        Insert: {
          criado_em?: string
          data_chegada?: string
          id?: string
          observacao?: string | null
          quantidade?: number
          reposicao_id: string
        }
        Update: {
          criado_em?: string
          data_chegada?: string
          id?: string
          observacao?: string | null
          quantidade?: number
          reposicao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposicao_chegadas_reposicao_id_fkey"
            columns: ["reposicao_id"]
            isOneToOne: false
            referencedRelation: "reposicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      reposicoes: {
        Row: {
          criado_em: string
          data_chegada: string | null
          data_pedido: string
          fornecedor: string | null
          id: string
          material_id: string | null
          material_nome: string | null
          observacoes: string | null
          quantidade: number
          tamanho: string | null
        }
        Insert: {
          criado_em?: string
          data_chegada?: string | null
          data_pedido?: string
          fornecedor?: string | null
          id?: string
          material_id?: string | null
          material_nome?: string | null
          observacoes?: string | null
          quantidade?: number
          tamanho?: string | null
        }
        Update: {
          criado_em?: string
          data_chegada?: string | null
          data_pedido?: string
          fornecedor?: string | null
          id?: string
          material_id?: string | null
          material_nome?: string | null
          observacoes?: string | null
          quantidade?: number
          tamanho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reposicoes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
