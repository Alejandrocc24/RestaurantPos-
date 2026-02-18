# 🎨 Sistema de Grupos Modificadores - Documentación Completa

## 📋 Índice
1. [Resumen del Sistema](#resumen-del-sistema)
2. [Arquitectura y Flujo](#arquitectura-y-flujo)
3. [Interfaces y Tipos](#interfaces-y-tipos)
4. [Componentes del Sistema](#componentes-del-sistema)
5. [Flujo de Usuario](#flujo-de-usuario)
6. [Métodos Principales](#métodos-principales)
7. [Validaciones](#validaciones)
8. [Ejemplo Completo](#ejemplo-completo)

---

## 🎯 Resumen del Sistema

El sistema de grupos modificadores permite crear **productos personalizables** donde el usuario puede seleccionar opciones adicionales organizadas en grupos. Por ejemplo:
- Un helado con selección de sabores, toppings y salsas
- Una hamburguesa con selección de ingredientes, extras y salsas
- Una pizza con selección de tamaño, masa y ingredientes

### **Características Principales:**
✅ Múltiples grupos de modificadores por producto  
✅ Configuración de mínimo y máximo de selecciones por grupo  
✅ Grupos obligatorios y opcionales  
✅ Cálculo automático de precio con modificadores  
✅ Interfaz paso a paso (wizard)  
✅ Validaciones en tiempo real  
✅ Resumen antes de confirmar  

---

## 🏗️ Arquitectura y Flujo

### **Flujo General:**

```
1. Usuario selecciona producto especial
   ↓
2. Sistema detecta que tiene gruposModificadores
   ↓
3. Abre modal especial con pasos
   ↓
4. Usuario selecciona modificadores en cada paso
   ↓
5. Sistema valida selecciones
   ↓
6. Muestra resumen final
   ↓
7. Usuario confirma
   ↓
8. Producto personalizado se agrega al pedido
```

### **Componentes Involucrados:**

```
mesas.component.ts (Lógica)
    ↓
mesas.component.html (Vista - Modal Especial)
    ↓
GrupoModificadorService (Datos de grupos)
    ↓
Base de Datos (grupos_modificadores, modificadores)
```

---

## 📦 Interfaces y Tipos

### **1. Producto con Grupos Modificadores**

```typescript
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string | null;
  subcategoria?: string | null;
  descripcion?: string | null;
  icono?: string | null;
  especial?: boolean;  // ← Marca que es un producto especial
  gruposModificadores?: number[];  // ← IDs de grupos asociados
  configuracionGrupos?: {  // ← Configuración por grupo
    grupoId: number;
    maxSelecciones: number;
    minSelecciones: number;
  }[];
}
```

**Ejemplo:**
```typescript
{
  id: 15,
  nombre: "Copa Especial",
  precio: 8.500,
  categoria: "helados",
  especial: true,
  gruposModificadores: [1, 2, 3],  // Sabores, Toppings, Salsas
  configuracionGrupos: [
    { grupoId: 1, maxSelecciones: 3, minSelecciones: 1 },  // 1-3 sabores
    { grupoId: 2, maxSelecciones: 2, minSelecciones: 0 },  // 0-2 toppings
    { grupoId: 3, maxSelecciones: 1, minSelecciones: 0 }   // 0-1 salsa
  ]
}
```

### **2. GrupoModificador**

```typescript
interface GrupoModificador {
  id: number;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  modificadores: Modificador[];
}
```

### **3. Modificador**

```typescript
interface Modificador {
  id: number;
  nombre: string;
  precio: number;
  estado: 'activo' | 'inactivo';
  grupo_id: number;
}
```

### **4. PasoModificador (Interno)**

```typescript
interface PasoModificador {
  titulo: string;
  descripcion: string;
  grupoId: number;
  grupoNombre: string;
  modificadores: Modificador[];
  maxSelecciones: number;
  minSelecciones: number;
  obligatorio: boolean;
}
```

### **5. ProductoPedido (Resultado Final)**

```typescript
interface ProductoPedido {
  id: number;
  nombre: string;
  precio: number;  // Precio base + modificadores
  cantidad: number;
  subtotal: number;
  personalizacion?: string;  // Texto descriptivo
  modificadores?: {
    grupoId: number;
    grupoNombre: string;
    modificadores: Modificador[];
  }[];
}
```

---

## 🔧 Componentes del Sistema

### **Variables de Estado (mesas.component.ts)**

```typescript
// Variables para productos especiales con grupos modificadores
productoEspecial: Producto | null = null;
pasoActual: number = 0;
pasosEspecial: PasoEspecial[] = [];
pasosModificadores: PasoModificador[] = [];
mostrarModalEspecial = false;

// Variables para grupos modificadores
gruposModificadores: GrupoModificador[] = [];
modificadoresSeleccionados: { [grupoId: number]: Modificador[] } = {};
```

**Explicación:**
- `productoEspecial`: Producto que se está personalizando
- `pasoActual`: Índice del paso actual (0, 1, 2, ...)
- `pasosEspecial`: Array de pasos para mostrar en el progreso
- `pasosModificadores`: Array con toda la configuración de cada paso
- `modificadoresSeleccionados`: Objeto que guarda las selecciones por grupo

---

## 🎬 Flujo de Usuario

### **Paso 1: Seleccionar Producto**

```typescript
seleccionarProducto(producto: Producto): void {
  if (producto.especial) {
    this.abrirModalEspecial(producto);  // ← Abre modal especial
  } else {
    this.agregarProductoAlPedido(producto);  // ← Agrega directo
  }
}
```

### **Paso 2: Abrir Modal Especial**

```typescript
abrirModalEspecial(producto: Producto): void {
  this.productoEspecial = producto;
  this.pasoActual = 0;
  this.modificadoresSeleccionados = {};
  
  // Crear pasos basados en los grupos modificadores del producto
  if (producto.gruposModificadores && producto.configuracionGrupos) {
    this.pasosModificadores = producto.configuracionGrupos.map(config => {
      const grupo = this.gruposModificadores.find(g => g.id === config.grupoId);
      if (grupo) {
        return {
          titulo: grupo.nombre,
          descripcion: grupo.descripcion,
          grupoId: grupo.id,
          grupoNombre: grupo.nombre,
          modificadores: grupo.modificadores,
          maxSelecciones: config.maxSelecciones,
          minSelecciones: config.minSelecciones,
          obligatorio: grupo.obligatorio
        };
      }
      return null;
    }).filter(paso => paso !== null) as PasoModificador[];
    
    // Agregar paso de confirmación
    this.pasosModificadores.push({
      titulo: 'Confirmar Pedido',
      descripcion: 'Revisa los detalles de tu pedido personalizado',
      grupoId: 0,
      grupoNombre: 'Confirmación',
      modificadores: [],
      maxSelecciones: 0,
      minSelecciones: 0,
      obligatorio: false
    });
    
    this.pasosEspecial = this.pasosModificadores.map(paso => ({
      titulo: paso.titulo,
      descripcion: paso.descripcion
    }));
  }
  
  this.mostrarModalEspecial = true;
}
```

**¿Qué hace este método?**
1. Guarda el producto seleccionado
2. Resetea el paso actual y selecciones
3. Crea un array de pasos basado en los grupos del producto
4. Agrega un paso final de confirmación
5. Abre el modal

### **Paso 3: Seleccionar Modificadores**

```typescript
toggleModificador(grupoId: number, modificador: Modificador): void {
  if (!this.modificadoresSeleccionados[grupoId]) {
    this.modificadoresSeleccionados[grupoId] = [];
  }
  
  const index = this.modificadoresSeleccionados[grupoId].findIndex(m => m.id === modificador.id);
  if (index > -1) {
    // Ya está seleccionado → Deseleccionar
    this.modificadoresSeleccionados[grupoId].splice(index, 1);
  } else {
    // No está seleccionado → Seleccionar (si no excede el máximo)
    const paso = this.pasosModificadores[this.pasoActual];
    if (paso && this.modificadoresSeleccionados[grupoId].length < paso.maxSelecciones) {
      this.modificadoresSeleccionados[grupoId].push(modificador);
    }
  }
}
```

### **Paso 4: Navegar Entre Pasos**

```typescript
pasoSiguiente(): void {
  if (this.puedeContinuar() && this.pasoActual < this.pasosEspecial.length - 1) {
    this.pasoActual++;
  }
}

pasoAnterior(): void {
  if (this.pasoActual > 0) {
    this.pasoActual--;
  }
}
```

### **Paso 5: Confirmar Producto**

```typescript
confirmarProductoEspecial(): void {
  if (this.productoEspecial) {
    let personalizacion = '';
    let precioTotal = this.productoEspecial.precio;
    let modificadores: any[] = [];
    
    // Procesar grupos modificadores
    this.pasosModificadores.forEach(paso => {
      if (paso.grupoId > 0) { // Excluir el paso de confirmación
        const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
        if (seleccionados.length > 0) {
          const grupoModificadores = seleccionados.map(m => ({
            grupoId: paso.grupoId,
            grupoNombre: paso.grupoNombre,
            modificadores: seleccionados
          }));
          modificadores.push(...grupoModificadores);
          
          // Calcular precio adicional
          const precioAdicional = seleccionados.reduce((sum, m) => sum + m.precio, 0);
          precioTotal += precioAdicional;
          
          personalizacion += `${paso.grupoNombre}: ${seleccionados.map(m => m.nombre).join(', ')}; `;
        }
      }
    });
    
    const productoPersonalizado: ProductoPedido = {
      id: this.productoEspecial.id,
      nombre: `${this.productoEspecial.nombre} (${personalizacion.trim()})`,
      precio: precioTotal,
      cantidad: 1,
      subtotal: precioTotal,
      personalizacion: personalizacion.trim(),
      modificadores: modificadores
    };
    
    this.pedidoActual.push(productoPersonalizado);
    this.cerrarModalEspecial();
  }
}
```

---

## ✅ Validaciones

### **1. Validar si puede continuar al siguiente paso**

```typescript
puedeContinuar(): boolean {
  if (this.pasosModificadores && this.pasosModificadores.length > 0) {
    if (this.pasoActual >= this.pasosModificadores.length - 1) {
      return true; // Último paso siempre se puede continuar
    }
    
    const paso = this.pasosModificadores[this.pasoActual];
    if (paso) {
      const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
      if (paso.obligatorio) {
        return seleccionados.length >= paso.minSelecciones && 
               seleccionados.length <= paso.maxSelecciones;
      } else {
        return seleccionados.length <= paso.maxSelecciones;
      }
    }
    return true;
  }
  return true;
}
```

### **2. Validar si puede seleccionar más modificadores**

```typescript
puedeSeleccionarModificador(grupoId: number | undefined): boolean {
  if (!grupoId) return false;
  const seleccionados = this.modificadoresSeleccionados[grupoId] || [];
  const paso = this.pasosModificadores[this.pasoActual];
  if (paso) {
    return seleccionados.length < paso.maxSelecciones;
  }
  return true;
}
```

### **3. Validar todos los grupos antes de confirmar**

```typescript
validarTodosLosModificadores(): boolean {
  if (!this.pasosModificadores || this.pasosModificadores.length === 0) {
    return true;
  }

  return this.pasosModificadores
    .filter(paso => paso.grupoId > 0)
    .every(paso => this.validarGrupoModificador(paso));
}

private validarGrupoModificador(paso: PasoModificador | undefined): boolean {
  if (!paso || paso.grupoId === 0) {
    return true;
  }

  const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
  const min = paso.minSelecciones ?? 0;
  const max = paso.maxSelecciones ?? 0;

  if (max > 0 && seleccionados.length > max) {
    return false;
  }

  if (paso.obligatorio || min > 0) {
    return seleccionados.length >= min;
  }

  return true;
}
```

---

## 🎨 Vista HTML (Modal Especial)

### **Estructura del Modal:**

```html
<div *ngIf="mostrarModalEspecial" class="modal-overlay">
  <div class="modal-content modal-especial">
    
    <!-- 1. Header con título -->
    <div class="modal-header">
      <h3>⭐ {{ productoEspecial?.nombre }}</h3>
      <button class="modal-close" (click)="cerrarModalEspecial()">✕</button>
    </div>
    
    <div class="modal-body">
      
      <!-- 2. Barra de progreso -->
      <div class="progreso-pasos">
        <div class="paso" 
             *ngFor="let paso of pasosEspecial; let i = index"
             [class.completado]="i < pasoActual"
             [class.actual]="i === pasoActual">
          <span class="paso-numero">{{ i + 1 }}</span>
          <span class="paso-titulo">{{ paso.titulo }}</span>
        </div>
      </div>

      <!-- 3. Contenido del paso actual -->
      <div class="paso-contenido">
        <h4>{{ pasosEspecial[pasoActual]?.titulo }}</h4>
        
        <!-- 3a. Grid de modificadores -->
        <div *ngIf="pasoActual < pasosModificadores.length - 1" class="paso-modificador">
          <div class="paso-descripcion">
            {{ pasosModificadores[pasoActual]?.descripcion }}
          </div>
          
          <!-- Información de selección -->
          <div class="seleccion-info">
            <span class="seleccion-texto">
              Selecciona {{ pasosModificadores[pasoActual]?.minSelecciones }} 
              a {{ pasosModificadores[pasoActual]?.maxSelecciones }} opciones
              <span *ngIf="pasosModificadores[pasoActual]?.obligatorio" class="obligatorio">*</span>
            </span>
          </div>
          
          <!-- Grid de modificadores -->
          <div class="modificadores-grid">
            <div class="modificador-item" 
                 *ngFor="let modificador of pasosModificadores[pasoActual]?.modificadores"
                 [class.seleccionado]="esModificadorSeleccionado(pasosModificadores[pasoActual]?.grupoId, modificador.id)"
                 [class.disabled]="!puedeSeleccionarModificador(pasosModificadores[pasoActual]?.grupoId, modificador.id)"
                 (click)="toggleModificador(pasosModificadores[pasoActual]?.grupoId, modificador)">
              <div class="modificador-icono">🍨</div>
              <div class="modificador-info">
                <div class="modificador-nombre">{{ modificador.nombre }}</div>
                <div class="modificador-precio">+${{ modificador.precio.toFixed(3) }}</div>
              </div>
              <div class="modificador-check" *ngIf="esModificadorSeleccionado(pasosModificadores[pasoActual]?.grupoId, modificador.id)">
                ✅
              </div>
            </div>
          </div>
          
          <!-- Contador de selecciones -->
          <div class="contador-selecciones">
            <span class="contador-texto">
              {{ obtenerCantidadSeleccionada(pasosModificadores[pasoActual]?.grupoId) }} 
              de {{ pasosModificadores[pasoActual]?.maxSelecciones }} seleccionados
            </span>
          </div>
        </div>

        <!-- 3b. Resumen final -->
        <div class="resumen-especial" *ngIf="pasoActual === pasosEspecial.length - 1">
          <h5>Resumen de tu Pedido Personalizado:</h5>
          
          <div class="resumen-modificadores">
            <div class="resumen-grupo" *ngFor="let paso of pasosModificadores.slice(0, -1)">
              <div class="resumen-grupo-titulo">{{ paso.grupoNombre }}:</div>
              <div class="resumen-grupo-items">
                <span *ngFor="let modificador of modificadoresSeleccionados[paso.grupoId]" class="resumen-item">
                  {{ modificador.nombre }} (+${{ modificador.precio.toFixed(3) }})
                </span>
                <span *ngIf="!modificadoresSeleccionados[paso.grupoId] || modificadoresSeleccionados[paso.grupoId].length === 0" class="resumen-vacio">
                  Ninguno seleccionado
                </span>
              </div>
            </div>
          </div>
          
          <div class="resumen-item total">
            <span class="resumen-label">Precio total:</span>
            <span class="resumen-valor">${{ calcularPrecioTotal().toFixed(3) }}</span>
          </div>
        </div>
      </div>

      <!-- 4. Botones de navegación -->
      <div class="especial-actions">
        <button class="btn-cancelar-especial" (click)="cerrarModalEspecial()">
          ❌ Cancelar
        </button>
        
        <button class="btn-anterior" 
                (click)="pasoAnterior()"
                *ngIf="pasoActual > 0">
          ⬅️ Anterior
        </button>
        
        <button class="btn-siguiente" 
                (click)="pasoSiguiente()"
                [disabled]="!puedeContinuar()"
                *ngIf="pasoActual < pasosEspecial.length - 1">
          Siguiente ➡️
        </button>
        
        <button class="btn-confirmar" 
                (click)="confirmarProductoEspecial()"
                [disabled]="!validarTodosLosModificadores()"
                *ngIf="pasoActual === pasosEspecial.length - 1">
          ✅ Confirmar
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 📝 Ejemplo Completo

### **Producto en Base de Datos:**

```json
{
  "id": 20,
  "nombre": "Hamburguesa Personalizada",
  "precio": 12.500,
  "categoria": "platos",
  "subcategoria": "Hamburguesa",
  "especial": true,
  "gruposModificadores": [5, 6, 7],
  "configuracionGrupos": [
    { "grupoId": 5, "maxSelecciones": 1, "minSelecciones": 1 },  // Tipo de carne (obligatorio)
    { "grupoId": 6, "maxSelecciones": 5, "minSelecciones": 0 },  // Ingredientes extras
    { "grupoId": 7, "maxSelecciones": 2, "minSelecciones": 0 }   // Salsas
  ]
}
```

### **Grupos Modificadores:**

```json
// Grupo 5: Tipo de Carne
{
  "id": 5,
  "nombre": "Tipo de Carne",
  "descripcion": "Elige el tipo de carne para tu hamburguesa",
  "obligatorio": true,
  "modificadores": [
    { "id": 50, "nombre": "Res", "precio": 0.000 },
    { "id": 51, "nombre": "Pollo", "precio": 0.000 },
    { "id": 52, "nombre": "Cerdo", "precio": 1.500 },
    { "id": 53, "nombre": "Vegetariana", "precio": 0.500 }
  ]
}

// Grupo 6: Ingredientes Extras
{
  "id": 6,
  "nombre": "Ingredientes Extras",
  "descripcion": "Agrega hasta 5 ingredientes adicionales",
  "obligatorio": false,
  "modificadores": [
    { "id": 60, "nombre": "Queso Extra", "precio": 1.000 },
    { "id": 61, "nombre": "Tocino", "precio": 2.000 },
    { "id": 62, "nombre": "Huevo", "precio": 1.500 },
    { "id": 63, "nombre": "Aguacate", "precio": 2.500 },
    { "id": 64, "nombre": "Jalapeños", "precio": 0.500 },
    { "id": 65, "nombre": "Cebolla Caramelizada", "precio": 1.000 }
  ]
}

// Grupo 7: Salsas
{
  "id": 7,
  "nombre": "Salsas",
  "descripcion": "Elige hasta 2 salsas",
  "obligatorio": false,
  "modificadores": [
    { "id": 70, "nombre": "Ketchup", "precio": 0.000 },
    { "id": 71, "nombre": "Mostaza", "precio": 0.000 },
    { "id": 72, "nombre": "Mayonesa", "precio": 0.000 },
    { "id": 73, "nombre": "BBQ", "precio": 0.500 },
    { "id": 74, "nombre": "Picante", "precio": 0.500 }
  ]
}
```

### **Flujo del Usuario:**

**Paso 1: Tipo de Carne (Obligatorio)**
- Usuario debe seleccionar 1 opción
- Selecciona: "Res" ($0.000)
- Botón "Siguiente" se habilita

**Paso 2: Ingredientes Extras (Opcional)**
- Usuario puede seleccionar 0-5 opciones
- Selecciona: "Queso Extra" ($1.000), "Tocino" ($2.000), "Aguacate" ($2.500)
- Botón "Siguiente" habilitado

**Paso 3: Salsas (Opcional)**
- Usuario puede seleccionar 0-2 opciones
- Selecciona: "BBQ" ($0.500), "Picante" ($0.500)
- Botón "Siguiente" habilitado

**Paso 4: Confirmación**
- Muestra resumen:
  ```
  Tipo de Carne: Res (+$0.000)
  Ingredientes Extras: Queso Extra (+$1.000), Tocino (+$2.000), Aguacate (+$2.500)
  Salsas: BBQ (+$0.500), Picante (+$0.500)
  
  Precio total: $19.000
  ```
- Usuario confirma

**Resultado Final:**

```typescript
{
  id: 20,
  nombre: "Hamburguesa Personalizada (Tipo de Carne: Res; Ingredientes Extras: Queso Extra, Tocino, Aguacate; Salsas: BBQ, Picante;)",
  precio: 19.000,
  cantidad: 1,
  subtotal: 19.000,
  personalizacion: "Tipo de Carne: Res; Ingredientes Extras: Queso Extra, Tocino, Aguacate; Salsas: BBQ, Picante;",
  modificadores: [
    {
      grupoId: 5,
      grupoNombre: "Tipo de Carne",
      modificadores: [{ id: 50, nombre: "Res", precio: 0.000 }]
    },
    {
      grupoId: 6,
      grupoNombre: "Ingredientes Extras",
      modificadores: [
        { id: 60, nombre: "Queso Extra", precio: 1.000 },
        { id: 61, nombre: "Tocino", precio: 2.000 },
        { id: 63, nombre: "Aguacate", precio: 2.500 }
      ]
    },
    {
      grupoId: 7,
      grupoNombre: "Salsas",
      modificadores: [
        { id: 73, nombre: "BBQ", precio: 0.500 },
        { id: 74, nombre: "Picante", precio: 0.500 }
      ]
    }
  ]
}
```

---

## 🎯 Cómo Aplicar a Nuevos Productos

### **1. Crear Grupos Modificadores en la BD**

Usa el componente `grupos-modificadores` para crear grupos y sus modificadores.

### **2. Crear Producto con Grupos**

En el componente `productos`, al crear/editar un producto:

1. Marca el checkbox "Producto Especial"
2. Selecciona los grupos modificadores
3. Configura min/max selecciones por grupo
4. Guarda el producto

### **3. El Sistema Automáticamente:**

✅ Detecta que es un producto especial  
✅ Carga los grupos modificadores asociados  
✅ Crea los pasos del wizard  
✅ Aplica las validaciones configuradas  
✅ Calcula el precio total  
✅ Guarda las selecciones en el pedido  

---

## 🔍 Debugging

### **Logs Útiles:**

```typescript
// Ver producto seleccionado
console.log('Producto especial:', this.productoEspecial);

// Ver pasos generados
console.log('Pasos modificadores:', this.pasosModificadores);

// Ver selecciones actuales
console.log('Modificadores seleccionados:', this.modificadoresSeleccionados);

// Ver paso actual
console.log('Paso actual:', this.pasoActual);

// Ver si puede continuar
console.log('Puede continuar:', this.puedeContinuar());
```

---

## ✅ Checklist de Implementación

- [x] Interfaces definidas
- [x] Servicio de grupos modificadores
- [x] Método `abrirModalEspecial()`
- [x] Método `toggleModificador()`
- [x] Método `confirmarProductoEspecial()`
- [x] Validaciones implementadas
- [x] Modal HTML completo
- [x] Estilos CSS aplicados
- [x] Integración con pedidos
- [x] Cálculo de precios
- [x] Resumen final

---

## 📚 Referencias

- **Archivo TypeScript:** `frontend/src/app/mesas/mesas.component.ts`
- **Archivo HTML:** `frontend/src/app/mesas/mesas.component.html` (líneas 381-530)
- **Servicio:** `frontend/src/app/services/grupo-modificador.service.ts`
- **Componente de Gestión:** `frontend/src/app/productos/grupos-modificadores/`

---

**¡El sistema está completamente funcional y listo para usar! 🎉**
