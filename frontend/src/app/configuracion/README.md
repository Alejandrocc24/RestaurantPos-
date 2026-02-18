# Componente de Configuración - Modal de Usuario

## Descripción

Este componente incluye un modal moderno y responsive para crear nuevos usuarios en el sistema de gestión de la heladería.

## Características del Modal

### Funcionalidades
- ✅ Formulario completo para crear usuarios
- ✅ Validación de campos en tiempo real
- ✅ Diseño responsive y moderno
- ✅ Animaciones suaves
- ✅ Manejo de errores visual
- ✅ Integración con el componente de usuarios existente

### Campos del Formulario
- **Nombre Completo** (obligatorio)
- **Correo Electrónico** (obligatorio, con validación de formato)
- **Contraseña** (obligatorio, mínimo 6 caracteres)
- **Confirmar Contraseña** (obligatorio, debe coincidir)
- **Rol del Usuario** (selección de roles predefinidos)
- **Estado del Usuario** (checkbox para activar/desactivar)

### Roles Disponibles
- Administrador
- Gerente
- Cajero
- Cocina
- Usuario

## Uso

### En el Componente de Configuración

El modal se activa automáticamente cuando se hace clic en el botón "➕ Crear nuevo usuario" en la pestaña de Gestión de Usuarios.

### Eventos del Modal

- `usuarioCreado`: Se emite cuando se crea exitosamente un usuario
- `modalCerrado`: Se emite cuando se cierra el modal

### Ejemplo de Implementación

```typescript
// En el componente padre
mostrarFormularioUsuario(): void {
  this.mostrarModalUsuario = true;
}

onUsuarioCreado(usuario: any): void {
  console.log('Usuario creado:', usuario);
  // Lógica para manejar el usuario creado
  this.mostrarModalUsuario = false;
}
```

## Estilos y Diseño

### Características Visuales
- Header con gradiente azul-púrpura
- Campos de formulario con validación visual
- Botones con efectos hover y estados de carga
- Diseño responsive para dispositivos móviles
- Animaciones de entrada y salida

### Responsive Design
- **Desktop**: Formulario en 2 columnas
- **Tablet**: Formulario en 1 columna
- **Mobile**: Formulario apilado verticalmente

## Validaciones

### Reglas de Validación
- Nombre: No puede estar vacío
- Email: Formato válido de email
- Contraseña: Mínimo 6 caracteres
- Confirmar contraseña: Debe coincidir con la contraseña

### Manejo de Errores
- Mensajes de error debajo de cada campo
- Estilos visuales para campos con error
- Validación en tiempo real

## Integración

El modal está completamente integrado con:
- El sistema de gestión de usuarios existente
- El componente de configuración principal
- Los estilos globales de la aplicación

## Archivos del Componente

- `usuario-modal.component.ts` - Lógica del componente
- `usuario-modal.component.html` - Template del modal
- `usuario-modal.component.css` - Estilos del modal
- `index.ts` - Exportaciones del módulo

## Dependencias

- Angular Common Module
- Angular Forms Module
- Estilos CSS personalizados
- Iconos emoji para la interfaz
