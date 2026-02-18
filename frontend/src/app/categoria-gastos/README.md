# Componente de Categoría de Gastos

Este componente permite la gestión completa de categorías de gastos de la heladería.

## Funcionalidades

- **Gestión de Categorías**: Crear, editar y eliminar categorías de gastos
- **Selector de Colores**: Elegir colores personalizados o usar colores predefinidos
- **Estados**: Activación/desactivación de categorías
- **Información Estadística**: Vista general de categorías activas e inactivas

## Estructura

- `categoria-gastos.component.ts` - Lógica principal del componente
- `categoria-gastos.component.html` - Template HTML con tabla y navegación
- `categoria-gastos.component.css` - Estilos CSS del componente principal
- `categoria-gasto-modal.component.ts` - Modal para crear/editar categorías
- `categoria-gasto-modal.component.html` - Template del modal
- `categoria-gasto-modal.component.css` - Estilos del modal
- `index.ts` - Archivo de exportación

## Campos de la Categoría

- **ID**: Identificador único (auto-generado)
- **Nombre**: Nombre de la categoría
- **Descripción**: Descripción detallada de la categoría
- **Color**: Color de identificación visual
- **Estado**: Activo/Inactivo
- **Fecha de Creación**: Fecha de creación (auto-generada)

## Navegación

El componente está integrado en el sistema de navegación del dashboard y se puede acceder a través de:
- Botón "Categoría de Gastos" en el componente de gastos
- Navegación desde otros componentes relacionados

## Características del Diseño

- **Responsive**: Adaptado para móviles, tablets y desktop
- **Sidebar**: Información estadística colapsable
- **Tabla**: Vista completa de todas las categorías
- **Modal**: Formulario para crear/editar categorías
- **Selector de Colores**: Interfaz visual para elegir colores
- **Estados**: Badges visuales para estado activo/inactivo

## Uso

1. **Ver Categorías**: Lista completa con información detallada
2. **Crear Categoría**: Botón "Nueva categoría" → Modal de formulario
3. **Editar Categoría**: Clic en botón editar → Modal con datos pre-llenados
4. **Cambiar Estado**: Clic en badge de estado para activar/desactivar
5. **Eliminar Categoría**: Botón eliminar con confirmación
6. **Seleccionar Color**: Usar selector de color o colores predefinidos

## Colores Predefinidos

El componente incluye una paleta de colores predefinidos para facilitar la selección:
- Azul (#3498db)
- Rojo (#e74c3c)
- Naranja (#f39c12)
- Púrpura (#9b59b6)
- Gris (#95a5a6)
- Verde (#1abc9c)
- Azul Oscuro (#34495e)
- Naranja Oscuro (#e67e22)
- Verde Claro (#2ecc71)
- Púrpura Oscuro (#8e44ad)
