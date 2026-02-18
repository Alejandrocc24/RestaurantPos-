# 🧪 Guía de Pruebas - Sistema de Grupos Modificadores

## 📋 Checklist de Implementación

### ✅ **Paso 1: Verificar que los Grupos Modificadores están en la BD**

1. Abre el componente **Grupos Modificadores** en el sistema
2. Verifica que existan grupos con modificadores activos
3. Ejemplo de grupos necesarios:
   - **Sabores de Helado** (min: 1, max: 3)
   - **Toppings** (min: 0, max: 5)
   - **Salsas** (min: 0, max: 2)

### ✅ **Paso 2: Crear un Producto Especial**

1. Ve al componente **Productos**
2. Crea o edita un producto
3. Marca el checkbox **"Producto Especial"**
4. Selecciona los grupos modificadores que quieres asociar
5. Configura min/max selecciones por cada grupo
6. Guarda el producto

**Ejemplo de configuración:**
```json
{
  "nombre": "Copa Especial",
  "precio": 8.500,
  "especial": true,
  "gruposModificadores": [1, 2, 3],
  "configuracionGrupos": [
    { "grupoId": 1, "minSelecciones": 1, "maxSelecciones": 3 },
    { "grupoId": 2, "minSelecciones": 0, "maxSelecciones": 5 },
    { "grupoId": 3, "minSelecciones": 0, "maxSelecciones": 2 }
  ]
}
```

### ✅ **Paso 3: Probar en el Componente de Mesas**

#### **3.1. Abrir Consola del Navegador**
Presiona `F12` y ve a la pestaña **Console** para ver los logs.

#### **3.2. Verificar Carga Inicial**
Al cargar el componente de mesas, deberías ver en consola:
```
🔄 Cargando grupos modificadores desde DB...
✅ 3 grupos modificadores cargados
  📦 Grupo 1: Sabores de Helado (5 modificadores, obligatorio)
  📦 Grupo 2: Toppings (8 modificadores, opcional)
  📦 Grupo 3: Salsas (4 modificadores, opcional)

🔄 Cargando productos desde DB...
✅ 25 productos cargados (3 especiales con grupos modificadores)
📋 Productos especiales: [
  { id: 15, nombre: "Copa Especial", grupos: 3, config: 3 },
  { id: 16, nombre: "Sundae Premium", grupos: 2, config: 2 },
  { id: 20, nombre: "Hamburguesa Personalizada", grupos: 3, config: 3 }
]
```

#### **3.3. Iniciar un Pedido**
1. Haz clic en una mesa disponible
2. Clic en **"Iniciar Pedido"**
3. Selecciona la categoría del producto especial
4. Haz clic en el producto especial

#### **3.4. Verificar Modal Especial**
En consola deberías ver:
```
🎨 Abriendo modal especial para: Copa Especial
  - Grupos modificadores: [1, 2, 3]
  - Configuración grupos: [{grupoId: 1, ...}, {grupoId: 2, ...}, {grupoId: 3, ...}]
  ✅ Producto tiene grupos modificadores configurados
    📦 Paso creado: Sabores de Helado (min: 1, max: 3)
    📦 Paso creado: Toppings (min: 0, max: 5)
    📦 Paso creado: Salsas (min: 0, max: 2)
  ✅ 3 pasos de modificadores + 1 paso de confirmación
```

#### **3.5. Navegar por los Pasos**
1. **Paso 1: Sabores de Helado**
   - Deberías ver una barra de progreso con 4 pasos
   - Título: "Sabores de Helado"
   - Descripción del grupo
   - Grid de modificadores (helados)
   - Contador: "0 de 3 seleccionados"
   - Botón "Siguiente" deshabilitado (porque min: 1)

2. **Seleccionar Modificadores**
   - Haz clic en 1-3 sabores
   - Cada clic debería marcar/desmarcar el modificador
   - El contador se actualiza
   - El botón "Siguiente" se habilita cuando seleccionas al menos 1

3. **Paso 2: Toppings**
   - Puedes seleccionar 0-5 toppings
   - Botón "Siguiente" siempre habilitado (min: 0)
   - Botón "Anterior" disponible

4. **Paso 3: Salsas**
   - Puedes seleccionar 0-2 salsas
   - Botón "Siguiente" habilitado

5. **Paso 4: Confirmación**
   - Muestra resumen de todas las selecciones
   - Muestra precio total calculado
   - Botón "Confirmar" disponible

#### **3.6. Confirmar Producto**
Al hacer clic en "Confirmar", en consola deberías ver:
```
✅ Confirmando producto especial: Copa Especial
  📦 Procesando grupos modificadores...
    - Sabores de Helado: 3 seleccionados
      Precio adicional: $0.000
    - Toppings: 2 seleccionados
      Precio adicional: $3.000
    - Salsas: 1 seleccionados
      Precio adicional: $0.500
  💰 Precio total: $12.000
  ✅ Producto personalizado creado: {
    id: 15,
    nombre: "Copa Especial (Sabores de Helado: Vainilla, Chocolate, Fresa; Toppings: Chispas, Nueces; Salsas: Caramelo;)",
    precio: 12.000,
    cantidad: 1,
    subtotal: 12.000,
    personalizacion: "Sabores de Helado: Vainilla, Chocolate, Fresa; Toppings: Chispas, Nueces; Salsas: Caramelo;",
    modificadores: [...]
  }
```

#### **3.7. Verificar en el Carrito**
- El producto debería aparecer en el carrito del pedido
- Con el nombre completo incluyendo la personalización
- Con el precio total calculado

#### **3.8. Confirmar Pedido**
1. Haz clic en "Confirmar Pedido"
2. El pedido se guarda en la BD
3. La mesa cambia a estado "ocupado"
4. Los productos aparecen en la mesa

---

## 🐛 Problemas Comunes y Soluciones

### **Problema 1: No se muestran los grupos modificadores**

**Síntomas:**
- Modal se abre pero usa el fallback (frutas y helado)
- En consola: "Producto especial sin grupos modificadores, usando fallback"

**Soluciones:**
1. Verifica que el producto tenga `especial: true`
2. Verifica que tenga `gruposModificadores` con IDs válidos
3. Verifica que tenga `configuracionGrupos` con la configuración
4. Verifica que los grupos existan en la BD

**Verificación en consola:**
```javascript
// En la consola del navegador
console.log(this.productos.find(p => p.id === 15));
// Debería mostrar gruposModificadores y configuracionGrupos
```

### **Problema 2: Grupos no encontrados**

**Síntomas:**
- En consola: "⚠️ Grupo X no encontrado en gruposModificadores"

**Soluciones:**
1. Verifica que los grupos estén cargados en `this.gruposModificadores`
2. Verifica que los IDs coincidan
3. Recarga la página para cargar los grupos nuevamente

### **Problema 3: Modificadores no aparecen**

**Síntomas:**
- El paso se muestra pero sin modificadores

**Soluciones:**
1. Verifica que el grupo tenga modificadores en la BD
2. Verifica que los modificadores estén en estado "activo"
3. El código filtra modificadores inactivos automáticamente

### **Problema 4: No se puede continuar al siguiente paso**

**Síntomas:**
- Botón "Siguiente" deshabilitado

**Causas:**
- No has seleccionado el mínimo requerido
- Has excedido el máximo permitido

**Solución:**
- Verifica el contador de selecciones
- Ajusta tus selecciones según min/max

### **Problema 5: Precio no se calcula correctamente**

**Síntomas:**
- El precio total no incluye los modificadores

**Verificación:**
```javascript
// En confirmarProductoEspecial(), verifica en consola:
console.log('Precio base:', this.productoEspecial.precio);
console.log('Modificadores seleccionados:', this.modificadoresSeleccionados);
console.log('Precio total:', precioTotal);
```

---

## 📊 Datos de Prueba Sugeridos

### **Grupo 1: Sabores de Helado**
```json
{
  "id": 1,
  "nombre": "Sabores de Helado",
  "descripcion": "Elige tus sabores favoritos",
  "obligatorio": true,
  "modificadores": [
    { "id": 1, "nombre": "Vainilla", "precio": 0.000, "estado": "activo" },
    { "id": 2, "nombre": "Chocolate", "precio": 0.000, "estado": "activo" },
    { "id": 3, "nombre": "Fresa", "precio": 0.000, "estado": "activo" },
    { "id": 4, "nombre": "Menta", "precio": 0.500, "estado": "activo" },
    { "id": 5, "nombre": "Cookies & Cream", "precio": 1.000, "estado": "activo" }
  ]
}
```

### **Grupo 2: Toppings**
```json
{
  "id": 2,
  "nombre": "Toppings",
  "descripcion": "Agrega tus toppings favoritos",
  "obligatorio": false,
  "modificadores": [
    { "id": 10, "nombre": "Chispas de Chocolate", "precio": 0.500, "estado": "activo" },
    { "id": 11, "nombre": "Nueces", "precio": 1.000, "estado": "activo" },
    { "id": 12, "nombre": "M&M's", "precio": 1.500, "estado": "activo" },
    { "id": 13, "nombre": "Oreo Triturado", "precio": 1.000, "estado": "activo" },
    { "id": 14, "nombre": "Frutas Frescas", "precio": 2.000, "estado": "activo" }
  ]
}
```

### **Grupo 3: Salsas**
```json
{
  "id": 3,
  "nombre": "Salsas",
  "descripcion": "Elige tus salsas",
  "obligatorio": false,
  "modificadores": [
    { "id": 20, "nombre": "Chocolate", "precio": 0.000, "estado": "activo" },
    { "id": 21, "nombre": "Caramelo", "precio": 0.500, "estado": "activo" },
    { "id": 22, "nombre": "Fresa", "precio": 0.500, "estado": "activo" },
    { "id": 23, "nombre": "Dulce de Leche", "precio": 1.000, "estado": "activo" }
  ]
}
```

### **Producto de Prueba**
```json
{
  "id": 15,
  "codigo": "COPA-ESP-001",
  "nombre": "Copa Especial",
  "precio": 8.500,
  "categoria": "helados",
  "subcategoria": "Copas",
  "descripcion": "Copa de helado personalizable",
  "estado": "activo",
  "especial": true,
  "grupos_modificadores": [1, 2, 3],
  "configuracion_grupos": [
    { "grupoId": 1, "minSelecciones": 1, "maxSelecciones": 3 },
    { "grupoId": 2, "minSelecciones": 0, "maxSelecciones": 5 },
    { "grupoId": 3, "minSelecciones": 0, "maxSelecciones": 2 }
  ]
}
```

---

## ✅ Checklist de Funcionalidades

- [ ] Grupos modificadores se cargan desde BD
- [ ] Productos especiales se identifican correctamente
- [ ] Modal especial se abre con los pasos correctos
- [ ] Barra de progreso muestra todos los pasos
- [ ] Modificadores se muestran en grid
- [ ] Click en modificador lo selecciona/deselecciona
- [ ] Contador de selecciones se actualiza
- [ ] Validación de min/max funciona
- [ ] Botón "Siguiente" se habilita/deshabilita correctamente
- [ ] Navegación entre pasos funciona
- [ ] Resumen final muestra todas las selecciones
- [ ] Precio total se calcula correctamente
- [ ] Producto se agrega al carrito con personalización
- [ ] Pedido se guarda en BD con modificadores
- [ ] Toast de confirmación aparece

---

## 🎯 Casos de Prueba

### **Caso 1: Producto con todos los grupos obligatorios**
- Configurar todos los grupos con `minSelecciones > 0`
- Verificar que no se puede avanzar sin seleccionar

### **Caso 2: Producto con grupos opcionales**
- Configurar grupos con `minSelecciones = 0`
- Verificar que se puede avanzar sin seleccionar

### **Caso 3: Límite máximo**
- Intentar seleccionar más del máximo permitido
- Verificar que no se puede seleccionar más

### **Caso 4: Modificadores con precio**
- Seleccionar modificadores con precio > 0
- Verificar que el precio total se calcula correctamente

### **Caso 5: Sin seleccionar nada en grupos opcionales**
- No seleccionar nada en grupos opcionales
- Verificar que se puede confirmar el pedido

### **Caso 6: Cancelar en medio del proceso**
- Avanzar algunos pasos
- Hacer clic en "Cancelar"
- Verificar que el modal se cierra sin agregar al carrito

### **Caso 7: Navegar hacia atrás**
- Avanzar varios pasos
- Usar botón "Anterior"
- Verificar que las selecciones se mantienen

---

## 📝 Notas Importantes

1. **Los modificadores inactivos no se muestran** - El sistema filtra automáticamente modificadores con `estado !== 'activo'`

2. **El paso de confirmación no cuenta como grupo** - Tiene `grupoId: 0` y se excluye del procesamiento

3. **La personalización se guarda como texto** - Para mostrar en el nombre del producto y en el resumen

4. **Los modificadores se guardan como array** - Para poder reconstruir el pedido si es necesario

5. **El precio se calcula sumando todos los modificadores** - Precio base + suma de precios de modificadores seleccionados

---

**¡Sistema listo para probar! 🚀**
