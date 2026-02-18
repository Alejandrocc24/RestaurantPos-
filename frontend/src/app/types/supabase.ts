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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cajas: {
        Row: {
          estado: string | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: number
          monto_final: number | null
          monto_inicial: number
          observaciones: string | null
          usuario_apertura_id: number | null
        }
        Insert: {
          estado?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: number
          monto_final?: number | null
          monto_inicial: number
          observaciones?: string | null
          usuario_apertura_id?: number | null
        }
        Update: {
          estado?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: number
          monto_final?: number | null
          monto_inicial?: number
          observaciones?: string | null
          usuario_apertura_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cajas_usuario_apertura_id_fkey"
            columns: ["usuario_apertura_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      comentarios_preestablecidos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string | null
          id: number
          texto: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: number
          texto: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          id?: number
          texto?: string
        }
        Relationships: []
      }
      detalles_pedido: {
        Row: {
          cantidad: number
          comentario: string | null
          id: number
          modificadores: Database['public']['Tables']['modificadores']['Row'][] | null
          notas: string | null
          pedido_id: number | null
          personalizacion: string | null
          precio_unitario: number
          producto_id: number | null
          subtotal: number
        }
        Insert: {
          cantidad: number
          comentario?: string | null
          id?: number
          modificadores?: Database['public']['Tables']['modificadores']['Row'][] | null
          notas?: string | null
          pedido_id?: number | null
          personalizacion?: string | null
          precio_unitario: number
          producto_id?: number | null
          subtotal: number
        }
        Update: {
          cantidad?: number
          comentario?: string | null
          id?: number
          modificadores?: Database['public']['Tables']['modificadores']['Row'][] | null
          notas?: string | null
          pedido_id?: number | null
          personalizacion?: string | null
          precio_unitario?: number
          producto_id?: number | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalles_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalles_pedido_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string
          fecha: string
          id: number
          monto: number
          proveedor: string | null
          salio_de_caja: boolean | null
          usuario_id: number | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descripcion: string
          fecha: string
          id?: number
          monto: number
          proveedor?: string | null
          salio_de_caja?: boolean | null
          usuario_id?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string
          fecha?: string
          id?: number
          monto?: number
          proveedor?: string | null
          salio_de_caja?: boolean | null
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_modificadores: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: number
          max_selecciones: number | null
          min_selecciones: number | null
          nombre: string
          obligatorio: boolean | null
          tipo: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          max_selecciones?: number | null
          min_selecciones?: number | null
          nombre: string
          obligatorio?: boolean | null
          tipo?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          max_selecciones?: number | null
          min_selecciones?: number | null
          nombre?: string
          obligatorio?: boolean | null
          tipo?: string | null
        }
        Relationships: []
      }
      mesas: {
        Row: {
          activo: boolean | null
          capacidad: number | null
          created_at: string | null
          estado: string | null
          id: number
          numero: number
          posicion: string | null
          ubicacion: string | null
        }
        Insert: {
          activo?: boolean | null
          capacidad?: number | null
          created_at?: string | null
          estado?: string | null
          id?: number
          numero: number
          posicion?: string | null
          ubicacion?: string | null
        }
        Update: {
          activo?: boolean | null
          capacidad?: number | null
          created_at?: string | null
          estado?: string | null
          id?: number
          numero?: number
          posicion?: string | null
          ubicacion?: string | null
        }
        Relationships: []
      }
      modificadores: {
        Row: {
          activo: boolean | null
          created_at: string | null
          grupo_modificador_id: number | null
          id: number
          nombre: string
          precio: number | null
          categoria: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          grupo_modificador_id?: number | null
          id?: number
          nombre: string
          precio?: number | null
          categoria?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          grupo_modificador_id?: number | null
          id?: number
          nombre?: string
          precio?: number | null
          categoria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modificadores_grupo_modificador_id_fkey"
            columns: ["grupo_modificador_id"]
            isOneToOne: false
            referencedRelation: "grupos_modificadores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_caja: {
        Row: {
          comentario: string | null
          fecha: string | null
          id: number
          monto: number
          tipo_movimiento: string
          tipo_pago: string
          usuario_id: number | null
        }
        Insert: {
          comentario?: string | null
          fecha?: string | null
          id?: number
          monto: number
          tipo_movimiento: string
          tipo_pago: string
          usuario_id?: number | null
        }
        Update: {
          comentario?: string | null
          fecha?: string | null
          id?: number
          monto?: number
          tipo_movimiento?: string
          tipo_pago?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente: string | null
          created_at: string | null
          estado: string | null
          id: number
          mesa_id: number | null
          total: number
          usuario_id: number | null
        }
        Insert: {
          cliente?: string | null
          created_at?: string | null
          estado?: string | null
          id?: number
          mesa_id?: number | null
          total: number
          usuario_id?: number | null
        }
        Update: {
          cliente?: string | null
          created_at?: string | null
          estado?: string | null
          id?: number
          mesa_id?: number | null
          total?: number
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria: string
          codigo: string
          created_at: string | null
          especial: boolean | null
          estado: string | null
          id: number
          nombre: string
          precio: number
          subcategoria: string | null
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string | null
          especial?: boolean | null
          estado?: string | null
          id?: number
          nombre: string
          precio: number
          subcategoria?: string | null
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string | null
          especial?: boolean | null
          estado?: string | null
          id?: number
          nombre?: string
          precio?: number
          subcategoria?: string | null
        }
        Relationships: []
      }
      productos_comentarios: {
        Row: {
          comentario_id: number | null
          id: number
          notas: string | null
          producto_id: number | null
        }
        Insert: {
          comentario_id?: number | null
          id?: number
          notas?: string | null
          producto_id?: number | null
        }
        Update: {
          comentario_id?: number | null
          id?: number
          notas?: string | null
          producto_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_comentarios_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios_preestablecidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_comentarios_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_grupos_modificadores: {
        Row: {
          id: number
          max_selecciones: number | null
          min_selecciones: number | null
          grupo_modificador_id: number | null
          producto_id: number | null
        }
        Insert: {
          id?: number
          max_selecciones?: number | null
          min_selecciones?: number | null
          grupo_modificador_id?: number | null
          producto_id?: number | null
        }
        Update: {
          id?: number
          max_selecciones?: number | null
          min_selecciones?: number | null
          grupo_modificador_id?: number | null
          producto_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_grupos_modificadores_grupo_modificador_id_fkey"
            columns: ["grupo_modificador_id"]
            isOneToOne: false
            referencedRelation: "grupos_modificadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_grupos_modificadores_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean | null
          contacto: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          id: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          permisos: Json | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
          permisos?: Json | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
          permisos?: Json | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean | null
          email: string
          fecha_creacion: string | null
          id: number
          nombre: string
          password_hash: string
          rol_id: number | null
          ultimo_acceso: string | null
        }
        Insert: {
          activo?: boolean | null
          email: string
          fecha_creacion?: string | null
          id?: number
          nombre: string
          password_hash: string
          rol_id?: number | null
          ultimo_acceso?: string | null
        }
        Update: {
          activo?: boolean | null
          email?: string
          fecha_creacion?: string | null
          id?: number
          nombre?: string
          password_hash?: string
          rol_id?: number | null
          ultimo_acceso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          created_at: string | null
          estado: string | null
          id: number
          mesa_id: number | null
          total: number
          usuario_id: number | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: number
          mesa_id?: number | null
          total: number
          usuario_id?: number | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: number
          mesa_id?: number | null
          total?: number
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      categorias_con_subcategorias: {
        Row: {
          categoria_id: number | null
          categoria_nombre: string | null
          subcategoria_id: number | null
          subcategoria_nombre: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      exec_sql: {
        Args: {
          sql_query: string
        }
        Returns: Json
      }
      obtener_productos_categorias_y_mesas: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      obtener_productos_por_categoria: {
        Args: {
          categoria_nombre: string
        }
        Returns: Json
      }
      update_updated_at_column: {
        Args: {
          _tbl: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
