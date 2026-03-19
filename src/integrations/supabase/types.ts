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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          role: string
          step_number: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          role: string
          step_number?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          step_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      editais: {
        Row: {
          active: boolean
          artistic_languages: string[] | null
          briefing: string | null
          checklist: Json | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          instrument_type: string
          max_budget: number | null
          name: string
          pdf_url: string | null
          requirements: Json | null
          state: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          artistic_languages?: string[] | null
          briefing?: string | null
          checklist?: Json | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          instrument_type: string
          max_budget?: number | null
          name: string
          pdf_url?: string | null
          requirements?: Json | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          artistic_languages?: string[] | null
          briefing?: string | null
          checklist?: Json | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          instrument_type?: string
          max_budget?: number | null
          name?: string
          pdf_url?: string | null
          requirements?: Json | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acao_cultural_publico: string[] | null
          acessibilidade_arquitetonica: string[] | null
          acessibilidade_atitudinal: string[] | null
          acessibilidade_comunicacional: string[] | null
          acessibilidade_descricao: string | null
          agencia: string | null
          ano_criacao_coletivo: string | null
          artistic_language: string | null
          avatar_url: string | null
          bairro: string | null
          banco: string | null
          bio: string | null
          categoria_inscricao: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          cnpj_mei: string | null
          complemento: string | null
          comunidade_tradicional: string | null
          concorre_cotas: boolean | null
          conta_bancaria: string | null
          cota_tipo: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email_contato: string | null
          endereco: string | null
          escolaridade: string | null
          experience_level: string | null
          full_name: string | null
          funcao_no_grupo: string | null
          funcao_profissao: string | null
          genero: string | null
          id: string
          lgbtqiapn: boolean | null
          lgbtqiapn_tipo: string | null
          locais_execucao: string | null
          membros_coletivo: Json | null
          nome_fantasia: string | null
          nome_grupo: string | null
          nome_social: string | null
          num_representantes_legais: string | null
          numero: string | null
          onboarding_completed: boolean
          pcd: boolean | null
          pcd_tipo: string | null
          perfil_publico: string | null
          person_type: string | null
          programa_social: string | null
          qtd_pessoas_coletivo: string | null
          raca_cor_etnia: string | null
          razao_social: string | null
          renda_mensal: string | null
          representa_coletivo: boolean | null
          rg: string | null
          rg_orgao: string | null
          state: string | null
          telefone: string | null
          tempo_residencia_municipio: string | null
          testemunha_cpf: string | null
          testemunha_endereco: string | null
          testemunha_nome: string | null
          testemunha_rg: string | null
          testemunha_telefone: string | null
          tipo_conta_bancaria: string | null
          trajetoria_acoes: string | null
          trajetoria_impacto: string | null
          trajetoria_inicio: string | null
          trajetoria_outras_areas: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acao_cultural_publico?: string[] | null
          acessibilidade_arquitetonica?: string[] | null
          acessibilidade_atitudinal?: string[] | null
          acessibilidade_comunicacional?: string[] | null
          acessibilidade_descricao?: string | null
          agencia?: string | null
          ano_criacao_coletivo?: string | null
          artistic_language?: string | null
          avatar_url?: string | null
          bairro?: string | null
          banco?: string | null
          bio?: string | null
          categoria_inscricao?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_mei?: string | null
          complemento?: string | null
          comunidade_tradicional?: string | null
          concorre_cotas?: boolean | null
          conta_bancaria?: string | null
          cota_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email_contato?: string | null
          endereco?: string | null
          escolaridade?: string | null
          experience_level?: string | null
          full_name?: string | null
          funcao_no_grupo?: string | null
          funcao_profissao?: string | null
          genero?: string | null
          id?: string
          lgbtqiapn?: boolean | null
          lgbtqiapn_tipo?: string | null
          locais_execucao?: string | null
          membros_coletivo?: Json | null
          nome_fantasia?: string | null
          nome_grupo?: string | null
          nome_social?: string | null
          num_representantes_legais?: string | null
          numero?: string | null
          onboarding_completed?: boolean
          pcd?: boolean | null
          pcd_tipo?: string | null
          perfil_publico?: string | null
          person_type?: string | null
          programa_social?: string | null
          qtd_pessoas_coletivo?: string | null
          raca_cor_etnia?: string | null
          razao_social?: string | null
          renda_mensal?: string | null
          representa_coletivo?: boolean | null
          rg?: string | null
          rg_orgao?: string | null
          state?: string | null
          telefone?: string | null
          tempo_residencia_municipio?: string | null
          testemunha_cpf?: string | null
          testemunha_endereco?: string | null
          testemunha_nome?: string | null
          testemunha_rg?: string | null
          testemunha_telefone?: string | null
          tipo_conta_bancaria?: string | null
          trajetoria_acoes?: string | null
          trajetoria_impacto?: string | null
          trajetoria_inicio?: string | null
          trajetoria_outras_areas?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acao_cultural_publico?: string[] | null
          acessibilidade_arquitetonica?: string[] | null
          acessibilidade_atitudinal?: string[] | null
          acessibilidade_comunicacional?: string[] | null
          acessibilidade_descricao?: string | null
          agencia?: string | null
          ano_criacao_coletivo?: string | null
          artistic_language?: string | null
          avatar_url?: string | null
          bairro?: string | null
          banco?: string | null
          bio?: string | null
          categoria_inscricao?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_mei?: string | null
          complemento?: string | null
          comunidade_tradicional?: string | null
          concorre_cotas?: boolean | null
          conta_bancaria?: string | null
          cota_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email_contato?: string | null
          endereco?: string | null
          escolaridade?: string | null
          experience_level?: string | null
          full_name?: string | null
          funcao_no_grupo?: string | null
          funcao_profissao?: string | null
          genero?: string | null
          id?: string
          lgbtqiapn?: boolean | null
          lgbtqiapn_tipo?: string | null
          locais_execucao?: string | null
          membros_coletivo?: Json | null
          nome_fantasia?: string | null
          nome_grupo?: string | null
          nome_social?: string | null
          num_representantes_legais?: string | null
          numero?: string | null
          onboarding_completed?: boolean
          pcd?: boolean | null
          pcd_tipo?: string | null
          perfil_publico?: string | null
          person_type?: string | null
          programa_social?: string | null
          qtd_pessoas_coletivo?: string | null
          raca_cor_etnia?: string | null
          razao_social?: string | null
          renda_mensal?: string | null
          representa_coletivo?: boolean | null
          rg?: string | null
          rg_orgao?: string | null
          state?: string | null
          telefone?: string | null
          tempo_residencia_municipio?: string | null
          testemunha_cpf?: string | null
          testemunha_endereco?: string | null
          testemunha_nome?: string | null
          testemunha_rg?: string | null
          testemunha_telefone?: string | null
          tipo_conta_bancaria?: string | null
          trajetoria_acoes?: string | null
          trajetoria_impacto?: string | null
          trajetoria_inicio?: string | null
          trajetoria_outras_areas?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_registrations: {
        Row: {
          acao_cultural_publico: string[] | null
          acessibilidade_arquitetonica: string[] | null
          acessibilidade_atitudinal: string[] | null
          acessibilidade_comunicacional: string[] | null
          acessibilidade_descricao: string | null
          agencia: string | null
          ano_criacao_coletivo: string | null
          bairro: string | null
          banco: string | null
          bio: string | null
          categoria_inscricao: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          cnpj_mei: string | null
          complemento: string | null
          comunidade_tradicional: string | null
          concorre_cotas: boolean | null
          conta_bancaria: string | null
          cota_tipo: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email_contato: string | null
          endereco: string | null
          escolaridade: string | null
          full_name: string | null
          funcao_no_grupo: string | null
          funcao_profissao: string | null
          genero: string | null
          id: string
          lgbtqiapn: boolean | null
          lgbtqiapn_tipo: string | null
          locais_execucao: string | null
          membros_coletivo: Json | null
          nome_fantasia: string | null
          nome_grupo: string | null
          nome_social: string | null
          num_representantes_legais: string | null
          numero: string | null
          pcd: boolean | null
          pcd_tipo: string | null
          perfil_publico: string | null
          person_type: string | null
          programa_social: string | null
          project_id: string
          qtd_pessoas_coletivo: string | null
          raca_cor_etnia: string | null
          razao_social: string | null
          renda_mensal: string | null
          representa_coletivo: boolean | null
          rg: string | null
          rg_orgao: string | null
          state: string | null
          telefone: string | null
          tempo_residencia_municipio: string | null
          testemunha_cpf: string | null
          testemunha_endereco: string | null
          testemunha_nome: string | null
          testemunha_rg: string | null
          testemunha_telefone: string | null
          tipo_conta_bancaria: string | null
          trajetoria_acoes: string | null
          trajetoria_impacto: string | null
          trajetoria_inicio: string | null
          trajetoria_outras_areas: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acao_cultural_publico?: string[] | null
          acessibilidade_arquitetonica?: string[] | null
          acessibilidade_atitudinal?: string[] | null
          acessibilidade_comunicacional?: string[] | null
          acessibilidade_descricao?: string | null
          agencia?: string | null
          ano_criacao_coletivo?: string | null
          bairro?: string | null
          banco?: string | null
          bio?: string | null
          categoria_inscricao?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_mei?: string | null
          complemento?: string | null
          comunidade_tradicional?: string | null
          concorre_cotas?: boolean | null
          conta_bancaria?: string | null
          cota_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email_contato?: string | null
          endereco?: string | null
          escolaridade?: string | null
          full_name?: string | null
          funcao_no_grupo?: string | null
          funcao_profissao?: string | null
          genero?: string | null
          id?: string
          lgbtqiapn?: boolean | null
          lgbtqiapn_tipo?: string | null
          locais_execucao?: string | null
          membros_coletivo?: Json | null
          nome_fantasia?: string | null
          nome_grupo?: string | null
          nome_social?: string | null
          num_representantes_legais?: string | null
          numero?: string | null
          pcd?: boolean | null
          pcd_tipo?: string | null
          perfil_publico?: string | null
          person_type?: string | null
          programa_social?: string | null
          project_id: string
          qtd_pessoas_coletivo?: string | null
          raca_cor_etnia?: string | null
          razao_social?: string | null
          renda_mensal?: string | null
          representa_coletivo?: boolean | null
          rg?: string | null
          rg_orgao?: string | null
          state?: string | null
          telefone?: string | null
          tempo_residencia_municipio?: string | null
          testemunha_cpf?: string | null
          testemunha_endereco?: string | null
          testemunha_nome?: string | null
          testemunha_rg?: string | null
          testemunha_telefone?: string | null
          tipo_conta_bancaria?: string | null
          trajetoria_acoes?: string | null
          trajetoria_impacto?: string | null
          trajetoria_inicio?: string | null
          trajetoria_outras_areas?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acao_cultural_publico?: string[] | null
          acessibilidade_arquitetonica?: string[] | null
          acessibilidade_atitudinal?: string[] | null
          acessibilidade_comunicacional?: string[] | null
          acessibilidade_descricao?: string | null
          agencia?: string | null
          ano_criacao_coletivo?: string | null
          bairro?: string | null
          banco?: string | null
          bio?: string | null
          categoria_inscricao?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          cnpj_mei?: string | null
          complemento?: string | null
          comunidade_tradicional?: string | null
          concorre_cotas?: boolean | null
          conta_bancaria?: string | null
          cota_tipo?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email_contato?: string | null
          endereco?: string | null
          escolaridade?: string | null
          full_name?: string | null
          funcao_no_grupo?: string | null
          funcao_profissao?: string | null
          genero?: string | null
          id?: string
          lgbtqiapn?: boolean | null
          lgbtqiapn_tipo?: string | null
          locais_execucao?: string | null
          membros_coletivo?: Json | null
          nome_fantasia?: string | null
          nome_grupo?: string | null
          nome_social?: string | null
          num_representantes_legais?: string | null
          numero?: string | null
          pcd?: boolean | null
          pcd_tipo?: string | null
          perfil_publico?: string | null
          person_type?: string | null
          programa_social?: string | null
          project_id?: string
          qtd_pessoas_coletivo?: string | null
          raca_cor_etnia?: string | null
          razao_social?: string | null
          renda_mensal?: string | null
          representa_coletivo?: boolean | null
          rg?: string | null
          rg_orgao?: string | null
          state?: string | null
          telefone?: string | null
          tempo_residencia_municipio?: string | null
          testemunha_cpf?: string | null
          testemunha_endereco?: string | null
          testemunha_nome?: string | null
          testemunha_rg?: string | null
          testemunha_telefone?: string | null
          tipo_conta_bancaria?: string | null
          trajetoria_acoes?: string | null
          trajetoria_impacto?: string | null
          trajetoria_inicio?: string | null
          trajetoria_outras_areas?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_registrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sections: {
        Row: {
          ai_draft: string | null
          ai_suggestions: string | null
          content: string | null
          created_at: string
          id: string
          is_completed: boolean
          project_id: string
          step_name: string
          step_number: number
          updated_at: string
        }
        Insert: {
          ai_draft?: string | null
          ai_suggestions?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          project_id: string
          step_name: string
          step_number: number
          updated_at?: string
        }
        Update: {
          ai_draft?: string | null
          ai_suggestions?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          project_id?: string
          step_name?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          conformity_score: number | null
          created_at: string
          edital_id: string | null
          id: string
          idea_description: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conformity_score?: number | null
          created_at?: string
          edital_id?: string | null
          id?: string
          idea_description?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conformity_score?: number | null
          created_at?: string
          edital_id?: string | null
          id?: string
          idea_description?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_edital_id_fkey"
            columns: ["edital_id"]
            isOneToOne: false
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_texts: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
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
