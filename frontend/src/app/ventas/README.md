# Componente de Ventas

## Descripción
El componente de ventas proporciona una interfaz completa para gestionar y visualizar toda la información relacionada con las ventas de la heladería.

## Funcionalidades

### 💰 Recaudo Actual
- **Total Recaudado**: Muestra el monto total recaudado en el día
- **Ventas Hoy**: Número total de ventas realizadas
- **Promedio por Venta**: Valor promedio de cada transacción

### 🪑 Mesas Cerradas
- Lista de todas las mesas que han sido cerradas
- Información detallada: número de mesa, fecha, total, cantidad de productos
- Filtros por fecha y búsqueda por mesa
- Paginación para mejor rendimiento

### 💸 Reporte de Gastos
- Lista completa de gastos realizados
- Información: fecha, descripción, categoría, monto, proveedor
- Filtros por período de fechas
- Total acumulado de gastos

### 🍦 Estadísticas de Productos
- **Top 10 Productos Más Vendidos**: Ranking de productos por cantidad vendida
- **Gráfico de Barras**: Visualización de la distribución de ventas
- Métricas detalladas: cantidad vendida, precio unitario, total vendido

## Características Técnicas

### Arquitectura
- Componente standalone de Angular
- Uso de async/await para operaciones asíncronas
- Sistema de tabs para navegación entre secciones
- Diseño responsivo y moderno

### Estados de Carga
- Indicadores de carga para cada sección
- Manejo de errores con try-catch
- Carga paralela de datos para mejor rendimiento

### Filtros y Búsqueda
- Filtros por rango de fechas
- Búsqueda por número de mesa o total
- Botones para aplicar y limpiar filtros

### Paginación
- Sistema de paginación para tablas grandes
- Configurable (10 elementos por página por defecto)
- Navegación entre páginas

## Uso

### Navegación
El componente se accede desde el sidebar principal seleccionando "Ventas" (💰).

### Tabs Disponibles
1. **Mesas Cerradas**: Historial de mesas cerradas
2. **Reporte de Gastos**: Análisis de gastos
3. **Estadísticas de Productos**: Métricas de ventas por producto

### Acciones Disponibles
- **Actualizar**: Recarga todos los datos
- **Exportar**: Genera reportes (funcionalidad futura)
- **Filtros**: Aplicar filtros de fecha y búsqueda

## Dependencias

### Servicios
- `VentasService`: Maneja toda la lógica de negocio
- `ApiService`: Para futuras integraciones con API real

### Componentes
- Componente standalone sin dependencias externas

## Estilos

### Diseño
- Interfaz moderna con gradientes y sombras
- Paleta de colores consistente
- Iconos emoji para mejor UX
- Animaciones y transiciones suaves

### Responsividad
- Diseño adaptativo para móviles y tablets
- Grid system flexible
- Breakpoints para diferentes tamaños de pantalla

## Futuras Mejoras

### Funcionalidades Planificadas
- Exportación a Excel/PDF
- Gráficos más avanzados (Chart.js)
- Filtros adicionales por categoría
- Comparativas entre períodos
- Dashboard en tiempo real

### Integración
- Conexión con base de datos real
- API endpoints para datos en tiempo real
- Sistema de notificaciones
- Auditoría de cambios

## Mantenimiento

### Archivos del Componente
- `ventas.component.ts`: Lógica del componente
- `ventas.component.html`: Template HTML
- `ventas.component.css`: Estilos CSS
- `index.ts`: Exportaciones
- `README.md`: Documentación

### Servicios Relacionados
- `ventas.service.ts`: Lógica de negocio y datos
- `api.service.ts`: Comunicación con backend

## Autor
Sistema de Heladería Dulce Momento
