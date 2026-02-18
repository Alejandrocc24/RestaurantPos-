# Componente de Usuarios

Este componente proporciona la gestión completa de usuarios del sistema Dulce Momento.

## Características

- **Agregar usuarios**: Formulario para crear nuevos usuarios
- **Editar usuarios**: Modal para modificar información de usuarios existentes
- **Eliminar usuarios**: Función para remover usuarios del sistema
- **Gestión de roles**: Asignación de roles (Admin, Gerente, Cajero, Cocina, Usuario)
- **Estado de usuarios**: Activar/desactivar usuarios
- **Tabla responsiva**: Vista organizada de todos los usuarios

## Funcionalidades

### Formulario de Nuevo Usuario
- Nombre completo
- Email
- Selección de rol
- Estado activo/inactivo

### Gestión de Usuarios
- Lista de usuarios con información completa
- Acciones de edición, eliminación y cambio de estado
- Badges visuales para roles y estados
- Filtrado y búsqueda (futuro)

### Roles Disponibles
- **Administrador**: Acceso completo al sistema
- **Gerente**: Gestión de operaciones
- **Cajero**: Procesamiento de ventas
- **Cocina**: Gestión de pedidos
- **Usuario**: Acceso básico

## Uso

El componente se puede acceder desde el menú de configuración y proporciona una interfaz intuitiva para la administración de usuarios del sistema.

## Estructura

- `usuarios.component.ts` - Lógica del componente
- `usuarios.component.html` - Template HTML
- `usuarios.component.css` - Estilos CSS
- `index.ts` - Exportaciones del módulo
