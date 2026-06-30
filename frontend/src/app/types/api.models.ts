// Tipos de respuesta del backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error?: string;
  data?: T;
  pagination?: {
    skip: number;
    take: number;
    total: number;
  };
}

// Usuario
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  name?: string; // Alias for legacy support
  roles: string[];
  rol?: string; // Legacy support
  rol_id?: number; // Legacy support
  permisos?: string[];
  activo: boolean;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Respuesta de login
export interface LoginResponse {
  accessToken: string;
  user: Usuario;
}

// Producto
export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  categoriaId?: string;
  categoria?: string | null; // Support for legacy/MesasComponent
  subcategoria?: string | null;
  icono?: string | null;
  especial?: boolean;
  gruposModificadores?: number[];
  configuracionGrupos?: any[];
  comentarios?: string[];
  activo: boolean;
  estado?: string; // Support for legacy usage
  createdAt?: string;
  updatedAt?: string;
}

// Mesa
export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: 'disponible' | 'ocupada' | 'ocupado' | 'reservada' | 'cuenta';
  ubicacion?: string;
  posicion?: string | null;
  forma?: 'rounded' | 'circle' | 'square' | 'rectangle' | 'hexagon' | 'diamond';
  productos?: any[]; // Frontend temporary state
  cliente?: string;
  totalCuenta?: number;
  tiempoOcupacion?: Date; // Frontend state
  horaApertura?: Date; // Frontend state
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Orden/Venta
export interface Orden {
  id: string;
  mesaId: string;
  productos: OrdenProducto[];
  estado: 'pendiente' | 'en-curso' | 'completada' | 'cancelada';
  total: number;
  items?: OrdenProducto[]; // Alias for products to support both naming conventions if needed
  createdAt?: string;
  updatedAt?: string;
}

export interface OrdenProducto {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  notas?: string;
  estado?: string;
}

// Gasto
export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoriaId: string;
  categoria?: string; // Nombre de la categoría
  proveedor?: string; // Nombre del proveedor
  proveedor_personalizado?: string;
  salio_de_caja?: boolean;
  usuario?: string;
  fecha?: string | Date;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Categoría de Gasto
export interface CategoriaGasto {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Rol (para configuración)
export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  permisos: string[];
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Categoría de Producto
export interface CategoriaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  subcategorias?: string[];
  icono?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Tenant (para administración)
export interface Tenant {
  id: string;
  nombre: string;
  ciudad?: string;
  telefono?: string;
  correo?: string;
  dirección?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Caja
export interface Caja {
  id: string;
  monto_inicial: number;
  monto_final?: number;
  estado: 'abierta' | 'cerrada';
  usuario_apertura_id?: string;
  usuario_cierre_id?: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  total_gastos?: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
