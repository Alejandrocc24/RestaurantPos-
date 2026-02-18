# Pantalla de Cocina (Kitchen Display System)

## Descripción
El componente de Pantalla de Cocina es un sistema de visualización diseñado para que el personal de cocina pueda gestionar y hacer seguimiento de las órdenes de manera eficiente.

## Características Principales

### 🎯 Gestión de Estados
- **Pendiente**: Órdenes que esperan ser preparadas
- **En Preparación**: Órdenes que están siendo elaboradas
- **Completada**: Órdenes finalizadas y listas para servir

### ⏱️ Control de Tiempos
- Tiempo transcurrido desde que se creó la orden
- Tiempo estimado de preparación
- Alertas visuales para órdenes que exceden el tiempo estimado

### 🚨 Sistema de Prioridades
- **Alta**: Órdenes urgentes (cliente esperando, etc.)
- **Media**: Órdenes normales
- **Baja**: Órdenes que pueden esperar

### 🔍 Filtros y Ordenamiento
- Filtrado por estado de la orden
- Ordenamiento por tiempo, prioridad o número de mesa
- Vista en tiempo real de todas las órdenes

## Funcionalidades

### Para el Personal de Cocina
1. **Ver Órdenes Pendientes**: Lista completa de órdenes que esperan preparación
2. **Iniciar Preparación**: Cambiar estado de pendiente a en preparación
3. **Marcar Completada**: Finalizar una orden cuando esté lista
4. **Ajustar Prioridades**: Cambiar la prioridad de una orden según sea necesario
5. **Ver Detalles**: Información completa de cada orden incluyendo modificadores y notas

### Gestión de Órdenes
- **Número de Mesa**: Identificación clara de dónde va la orden
- **Items de la Orden**: Lista detallada de productos con cantidades
- **Modificadores**: Toppings, extras y personalizaciones
- **Notas Especiales**: Instrucciones específicas del cliente
- **Tiempo de Creación**: Cuándo se generó la orden

## Interfaz de Usuario

### Header Principal
- Título del sistema con icono de chef
- Hora actual en tiempo real
- Contadores de órdenes por estado

### Panel de Controles
- Selector de filtros por estado
- Botones de ordenamiento con indicadores visuales
- Botón para limpiar órdenes completadas

### Tarjetas de Órdenes
- Diseño de tarjetas con colores según el estado
- Información clara y organizada
- Botones de acción contextuales
- Indicadores visuales de prioridad y estado

## Responsive Design
- Interfaz adaptada para diferentes tamaños de pantalla
- Optimizada para tablets y pantallas táctiles
- Navegación intuitiva en dispositivos móviles

## Tecnologías Utilizadas
- **Angular 17**: Framework principal
- **TypeScript**: Tipado estático
- **CSS Grid**: Layout responsivo
- **CSS Variables**: Sistema de colores consistente
- **RxJS**: Manejo de tiempo en tiempo real

## Uso en Producción
Este componente está diseñado para funcionar en:
- Pantallas de cocina dedicadas
- Tablets para el personal de cocina
- Monitores en estaciones de trabajo
- Dispositivos móviles para supervisores

## Integración
El componente se integra perfectamente con:
- Sistema de gestión de mesas
- Sistema de ventas
- Base de datos de productos
- Sistema de autenticación

## Mantenimiento
- Código modular y bien estructurado
- Fácil de extender con nuevas funcionalidades
- Documentación completa del código
- Tests unitarios incluidos
