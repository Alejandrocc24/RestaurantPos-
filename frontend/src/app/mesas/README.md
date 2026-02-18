# Sistema de Grupos Modificadores para Pedidos

## Descripción

Este sistema permite configurar productos con grupos modificadores que se configuran paso a paso durante la toma de pedidos. Es especialmente útil para productos como helados, waffles, o cualquier plato que requiera personalización.

## Características

- **Configuración paso a paso**: Los clientes seleccionan modificadores de cada grupo en secuencia
- **Validación de selecciones**: Controla el mínimo y máximo de selecciones por grupo
- **Grupos obligatorios y opcionales**: Algunos grupos pueden ser requeridos, otros opcionales
- **Cálculo automático de precios**: Suma automáticamente el precio base + modificadores seleccionados
- **Interfaz intuitiva**: Progreso visual y confirmación antes de agregar al pedido

## Estructura de Datos

### Producto con Grupos Modificadores

```typescript
{
  id: 20,
  nombre: 'Waffle Especial',
  precio: 8.50,
  categoria: 'helados',
  subcategoria: 'Especiales',
  descripcion: 'Waffle con helado y toppings personalizables',
  icono: '🧇',
  especial: true,
  gruposModificadores: [1, 2, 3], // IDs de los grupos
  configuracionGrupos: [
    { grupoId: 1, maxSelecciones: 3, minSelecciones: 1 }, // Frutas
    { grupoId: 2, maxSelecciones: 1, minSelecciones: 1 }, // Salsas
    { grupoId: 3, maxSelecciones: 2, minSelecciones: 0 }  // Toppings
  ]
}
```

### Grupo Modificador

```typescript
{
  id: 1,
  nombre: 'Frutas',
  descripcion: 'Selecciona las frutas que desees',
  tipo: 'multiple', // 'unico' o 'multiple'
  obligatorio: true,
  estado: 'activo',
  modificadores: [
    { id: 1, nombre: 'Fresa', precio: 0.50, estado: 'activo' },
    { id: 2, nombre: 'Plátano', precio: 0.50, estado: 'activo' }
  ],
  maxSelecciones: 3,
  minSelecciones: 1
}
```

## Flujo de Usuario

1. **Selección del producto**: El cliente selecciona un producto especial
2. **Modal paso a paso**: Se abre un modal con pasos para cada grupo modificador
3. **Selección de modificadores**: En cada paso, el cliente selecciona los modificadores deseados
4. **Validación**: El sistema valida que se cumplan los requisitos mínimos y máximos
5. **Resumen**: Se muestra un resumen de todas las selecciones y el precio total
6. **Confirmación**: El cliente confirma y el producto se agrega al pedido

## Configuración de Productos

### Agregar Grupos Modificadores a un Producto

1. **Definir los grupos**: Crear grupos modificadores en el sistema
2. **Asignar al producto**: Agregar `gruposModificadores` y `configuracionGrupos`
3. **Configurar límites**: Establecer `minSelecciones` y `maxSelecciones` por grupo

### Ejemplo de Configuración

```typescript
// Producto: Waffle Especial
{
  gruposModificadores: [1, 2, 3],
  configuracionGrupos: [
    // Grupo 1: Frutas (1-3 selecciones obligatorias)
    { grupoId: 1, maxSelecciones: 3, minSelecciones: 1 },
    // Grupo 2: Salsas (1 selección obligatoria)
    { grupoId: 2, maxSelecciones: 1, minSelecciones: 1 },
    // Grupo 3: Toppings (0-2 selecciones opcionales)
    { grupoId: 3, maxSelecciones: 2, minSelecciones: 0 }
  ]
}
```

## Tipos de Grupos

### Grupo Único
- Solo permite una selección
- Ejemplo: Sabor de helado, tipo de salsa
- `tipo: 'unico'`

### Grupo Múltiple
- Permite múltiples selecciones
- Ejemplo: Frutas, toppings, decoraciones
- `tipo: 'multiple'`

## Validaciones

### Selecciones Mínimas
- Los grupos obligatorios deben cumplir el mínimo
- Ejemplo: Si `minSelecciones: 1`, debe seleccionar al menos 1 modificador

### Selecciones Máximas
- No se pueden exceder el máximo permitido
- Ejemplo: Si `maxSelecciones: 3`, máximo 3 frutas

### Navegación
- No se puede continuar al siguiente paso sin cumplir los requisitos
- El botón "Siguiente" se habilita solo cuando es válido

## Precios

### Cálculo Automático
- **Precio base**: Precio del producto principal
- **Modificadores**: Suma de precios de todos los modificadores seleccionados
- **Total**: Precio base + modificadores

### Ejemplo
```
Waffle Especial: $8.50
Frutas: Fresa ($0.50) + Plátano ($0.50) + Kiwi ($0.75) = $1.75
Salsa: Chocolate ($0.75) = $0.75
Toppings: Nueces ($1.00) = $1.00
Total: $8.50 + $1.75 + $0.75 + $1.00 = $12.00
```

## Interfaz de Usuario

### Progreso Visual
- Indicador de pasos con números
- Paso actual resaltado en azul
- Pasos completados en verde
- Líneas conectoras entre pasos

### Selección de Modificadores
- Grid responsive de opciones
- Check visual cuando se selecciona
- Contador de selecciones actuales
- Información de precios adicionales

### Resumen Final
- Lista organizada por grupos
- Precios individuales y total
- Confirmación antes de agregar al pedido

## Responsive Design

- **Móvil**: Grid de 1 columna, botones apilados
- **Tablet**: Grid de 2 columnas, navegación horizontal
- **Desktop**: Grid de 3+ columnas, navegación completa

## Mantenimiento

### Agregar Nuevos Grupos
1. Crear el grupo en la base de datos
2. Agregar modificadores al grupo
3. Asignar a productos existentes o nuevos

### Modificar Configuraciones
1. Cambiar límites de selección
2. Agregar/quitar grupos de productos
3. Actualizar precios de modificadores

### Productos Legacy
- Los productos sin grupos modificadores usan el sistema anterior
- Compatibilidad total con productos existentes
- Migración gradual opcional

## Ventajas del Sistema

1. **Experiencia del cliente**: Proceso claro y organizado
2. **Flexibilidad**: Configuración ilimitada de opciones
3. **Control de costos**: Precios transparentes y calculados automáticamente
4. **Escalabilidad**: Fácil agregar nuevos grupos y modificadores
5. **Consistencia**: Interfaz uniforme para todos los productos especiales
