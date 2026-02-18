# Componente de Grupos Modificadores

Este componente permite gestionar grupos de modificadores para productos en la heladería. Los grupos modificadores son conjuntos de opciones que los clientes pueden seleccionar para personalizar sus productos.

## Características

- **Gestión completa de grupos modificadores**: Crear, editar, eliminar y cambiar estado
- **Tipos de grupos**: Único (una selección) o Múltiple (varias selecciones)
- **Configuración flexible**: Obligatorio/opcional, límites de selección
- **Gestión de modificadores**: Agregar, editar y eliminar opciones individuales
- **Filtrado y búsqueda**: Por tipo y término de búsqueda
- **Interfaz responsive**: Adaptada para dispositivos móviles y de escritorio

## Estructura del Componente

### GruposModificadoresComponent
Componente principal que muestra la lista de grupos modificadores y maneja la navegación.

**Funcionalidades:**
- Lista de grupos modificadores con filtrado
- Sidebar para filtrar por tipo
- Búsqueda por nombre o descripción
- Acciones CRUD (Crear, Leer, Actualizar, Eliminar)
- Cambio de estado activo/inactivo

### GrupoModificadorModalComponent
Modal para crear y editar grupos modificadores.

**Funcionalidades:**
- Formulario para información básica del grupo
- Gestión de modificadores (agregar, editar, eliminar)
- Validación de formularios
- Configuración de límites de selección

## Modelos de Datos

### GrupoModificador
```typescript
interface GrupoModificador {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: 'unico' | 'multiple';
  obligatorio: boolean;
  estado: 'activo' | 'inactivo';
  modificadores: Modificador[];
  maxSelecciones?: number;
  minSelecciones?: number;
}
```

### Modificador
```typescript
interface Modificador {
  id: number;
  nombre: string;
  precio: number;
  estado: 'activo' | 'inactivo';
}
```

## Uso

### Navegación
El componente se accede desde la sección de Productos, en la barra de navegación superior.

### Crear un nuevo grupo
1. Hacer clic en "Nuevo grupo"
2. Completar la información básica del grupo
3. Agregar modificadores
4. Configurar opciones adicionales (si es tipo múltiple)
5. Guardar

### Editar un grupo existente
1. Hacer clic en el botón de editar (ícono de lápiz)
2. Modificar la información deseada
3. Guardar cambios

### Gestionar modificadores
- **Agregar**: Hacer clic en "Agregar Modificador" y completar el formulario
- **Editar**: Hacer clic en el botón de editar del modificador
- **Eliminar**: Hacer clic en el botón de eliminar del modificador

## Filtros Disponibles

- **Por tipo**: Todos, Único, Múltiple
- **Por búsqueda**: Nombre del grupo, descripción o nombre de modificadores

## Responsive Design

El componente incluye:
- Sidebar colapsible para dispositivos móviles
- Tabla adaptativa para pantallas pequeñas
- Navegación táctil con gestos de swipe
- Overlay para dispositivos móviles

## Servicios

### GrupoModificadorService
Servicio que maneja todas las operaciones CRUD con la base de datos Supabase:

- `getGruposModificadores()`: Obtener todos los grupos
- `crearGrupoModificador()`: Crear nuevo grupo
- `actualizarGrupoModificador()`: Actualizar grupo existente
- `eliminarGrupoModificador()`: Eliminar grupo
- `cambiarEstado()`: Cambiar estado activo/inactivo

## Estilos

Los estilos están organizados en:
- `grupos-modificadores.component.css`: Estilos del componente principal
- `grupo-modificador-modal.component.css`: Estilos del modal

### Características de diseño:
- Paleta de colores consistente con el resto de la aplicación
- Badges coloridos para tipos y estados
- Hover effects y transiciones suaves
- Diseño de tarjetas para modificadores
- Formularios bien estructurados y accesibles

## Testing

El componente incluye pruebas unitarias completas para:
- Funcionalidad básica del componente
- Validación de formularios
- Gestión de modificadores
- Eventos y emisiones
- Cambios de estado

## Dependencias

- Angular Common
- Angular Forms
- FontAwesome (para iconos)
- Servicio HTTP para comunicación con Supabase

## Notas de Implementación

- Los datos se cargan desde el servicio en tiempo real
- La validación se realiza tanto en el frontend como en el backend
- El componente es completamente standalone y puede ser reutilizado
- Incluye manejo de errores y estados de carga
- Soporte completo para internacionalización (i18n)
