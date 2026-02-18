# Componente de Proveedores

Este componente permite la gestión completa de proveedores de la heladería.

## Funcionalidades

- **Gestión de Proveedores**: Registro, edición y eliminación de proveedores
- **Filtrado por Categorías**: Organización por tipo de proveedor
- **Estado de Proveedores**: Activación/desactivación con un clic
- **Información Completa**: Datos de contacto, dirección y tipo de servicio

## Estructura

- `proveedores.component.ts` - Lógica principal del componente
- `proveedores.component.html` - Template HTML con tabla y navegación
- `proveedores.component.css` - Estilos CSS del componente principal
- `proveedor-modal.component.ts` - Modal para crear/editar proveedores
- `proveedor-modal.component.html` - Template del modal
- `proveedor-modal.component.css` - Estilos del modal
- `index.ts` - Archivo de exportación

## Campos del Proveedor

- **ID**: Identificador único (auto-generado)
- **Nombre**: Nombre del proveedor
- **Tipo**: Categoría (Insumos, Equipos, Servicios, Marketing, Otros)
- **Teléfono**: Número de contacto
- **Email**: Correo electrónico
- **Dirección**: Dirección física completa
- **Estado**: Activo/Inactivo
- **Fecha de Registro**: Fecha de creación (auto-generada)

## Navegación

El componente está integrado en el sistema de navegación del dashboard y se puede acceder a través de:
- Botón "Proveedores" en el sidebar principal
- Navegación desde el componente de gastos

## Características del Diseño

- **Responsive**: Adaptado para móviles, tablets y desktop
- **Sidebar**: Categorías de proveedores colapsable
- **Tabla**: Vista completa de todos los proveedores
- **Modal**: Formulario para crear/editar proveedores
- **Estados**: Badges visuales para estado activo/inactivo

## Uso

1. **Ver Proveedores**: Lista completa con filtrado por categorías
2. **Crear Proveedor**: Botón "Nuevo proveedor" → Modal de formulario
3. **Editar Proveedor**: Clic en botón editar → Modal con datos pre-llenados
4. **Cambiar Estado**: Clic en badge de estado para activar/desactivar
5. **Eliminar Proveedor**: Botón eliminar con confirmación
