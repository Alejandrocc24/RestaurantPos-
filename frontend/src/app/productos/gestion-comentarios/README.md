# Componente de Gestión de Comentarios

## Descripción
Este componente permite gestionar comentarios preestablecidos que se pueden asignar a productos. Es un componente independiente que se puede navegar desde cualquier vista de productos.

## Características
- **Navegación independiente**: Se puede acceder desde Productos, Categoría de Productos y Grupos Modificadores
- **Gestión CRUD completa**: Crear, leer, editar y eliminar comentarios
- **Categorización**: Los comentarios se organizan por categorías
- **Estado activo/inactivo**: Control de visibilidad de comentarios
- **Persistencia**: Los datos se guardan en localStorage
- **Responsive**: Diseño adaptativo para móviles y desktop

## Funcionalidades

### Navegación
- Navegar a Productos
- Navegar a Categoría de Productos  
- Navegar a Grupos Modificadores
- Vista actual: Gestión de Comentarios

### Gestión de Comentarios
- **Crear**: Nuevo comentario con categoría, texto y estado
- **Editar**: Modificar comentarios existentes
- **Eliminar**: Remover comentarios no deseados
- **Activar/Desactivar**: Cambiar estado de comentarios

### Estructura de Datos
```typescript
interface Comentario {
  id: string;
  categoria: string;
  texto: string;
  activo: boolean;
}
```

## Uso
El componente se integra automáticamente en el sistema de navegación de productos y mantiene sincronizados los comentarios entre todas las vistas.

## Dependencias
- CommonModule
- FormsModule
- Font Awesome (iconos)
