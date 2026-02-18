# 🚀 Guía Rápida - Componente de Mesas

## 📱 Cómo Usar el Sistema

### **1. Ver Mesas Disponibles**
- Las mesas verdes (🟢) están disponibles
- Las mesas naranjas (🟠) están ocupadas
- Haz clic en cualquier mesa para ver detalles

### **2. Iniciar un Pedido**
```
1. Clic en mesa disponible (verde)
2. Clic en "Iniciar Pedido"
3. Selecciona categoría de productos
4. Agrega productos al carrito
5. Agrega comentarios si es necesario
6. Clic en "Confirmar Pedido"
✅ Mesa ahora está ocupada (naranja)
```

### **3. Agregar Más Productos**
```
1. Clic en mesa ocupada (naranja)
2. Clic en "Agregar Productos"
3. Verás los productos actuales
4. Agrega más productos
5. Clic en "Confirmar Pedido"
✅ Productos se agregan al pedido existente
```

### **4. Cerrar Cuenta (Total)**
```
1. Clic en mesa ocupada
2. Clic en "Cerrar Cuenta"
3. Todos los productos están seleccionados
4. Selecciona método de pago:
   - Efectivo: Elige denominación recibida
   - Transferencia: Directo
5. Clic en "Confirmar Cobro"
✅ Mesa se libera (disponible)
```

### **5. Cobro Parcial**
```
1. Clic en mesa ocupada
2. Clic en "Cerrar Cuenta"
3. Deselecciona productos que NO vas a cobrar
4. Selecciona método de pago
5. Clic en "Confirmar Cobro"
✅ Mesa sigue ocupada con productos restantes
```

### **6. Transferir Productos**
```
1. Clic en mesa ocupada (origen)
2. Clic en "Transferir Mesa"
3. Selecciona productos a transferir
4. Selecciona mesa destino
5. Clic en "Confirmar Transferencia"
✅ Productos se mueven a la mesa destino
```

---

## 🎯 Atajos y Tips

### **Modo Edición**
- Clic en "Modo Edición" para gestionar mesas
- Puedes crear, editar, eliminar mesas
- Arrastra mesas para reorganizarlas
- Clic en "Salir Edición" para volver al modo normal

### **Comentarios Rápidos**
- Usa los chips de comentarios preestablecidos
- Clic en un chip para seleccionarlo
- O escribe un comentario personalizado
- Los comentarios se guardan por producto

### **Cálculo de Cambio**
- Selecciona una denominación preestablecida
- El cambio se calcula automáticamente
- Si es negativo, el botón se deshabilita
- Verás el cambio en rojo si es insuficiente

### **Productos Especiales**
- Algunos productos tienen personalización
- Sigue los pasos para seleccionar opciones
- El precio se actualiza automáticamente
- Revisa el resumen antes de confirmar

---

## ⚠️ Validaciones Importantes

### **No Puedes:**
- ❌ Confirmar pedido sin productos
- ❌ Cobrar con denominación insuficiente
- ❌ Transferir sin seleccionar productos
- ❌ Transferir sin seleccionar mesa destino
- ❌ Editar mesa ocupada sin cerrar pedido

### **Siempre Puedes:**
- ✅ Agregar productos a mesa ocupada
- ✅ Hacer cobro parcial
- ✅ Transferir productos entre mesas
- ✅ Ver productos comandados en cualquier momento
- ✅ Cancelar operaciones antes de confirmar

---

## 🆘 Solución de Problemas

### **"No se pudieron cargar las mesas"**
- Verifica que el backend esté corriendo (puerto 3000)
- Verifica la conexión a internet
- Revisa la consola del navegador para más detalles

### **"No se pudo guardar el pedido"**
- Verifica que hay productos en el carrito
- Verifica la conexión con el backend
- Intenta nuevamente en unos segundos

### **"No se encontró un pedido activo"**
- La mesa puede haberse cerrado desde otro dispositivo
- Refresca la página para actualizar el estado
- Inicia un nuevo pedido si es necesario

### **Los productos no aparecen**
- Verifica que hay productos activos en la base de datos
- Verifica que las categorías están configuradas
- Revisa la consola para errores de carga

---

## 📊 Estados de las Mesas

| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| Disponible | Verde | 🟢 | Mesa libre, lista para usar |
| Ocupado | Naranja | 🟠 | Mesa con pedido activo |

---

## 🔔 Notificaciones

### **Éxito (Verde)**
- ✅ "Pedido confirmado"
- ✅ "Cuenta cerrada"
- ✅ "Transferencia completada"
- ✅ "Mesa creada"

### **Error (Rojo)**
- ❌ "No se pudo guardar el pedido"
- ❌ "Denominación insuficiente"
- ❌ "Error al cerrar cuenta"
- ❌ "No se pudieron cargar las mesas"

---

## 💡 Mejores Prácticas

1. **Siempre agrega comentarios** cuando el cliente tenga preferencias especiales
2. **Verifica el total** antes de cerrar la cuenta
3. **Usa cobro parcial** cuando varios comensales pagan por separado
4. **Transfiere productos** en lugar de crear pedidos duplicados
5. **Reorganiza mesas** en modo edición para optimizar el espacio
6. **Revisa los productos** antes de confirmar el pedido

---

## 🎓 Flujo Típico de Trabajo

```
📍 Cliente llega
   ↓
🟢 Seleccionar mesa disponible
   ↓
📝 Iniciar pedido
   ↓
🍽️ Agregar productos
   ↓
💬 Agregar comentarios
   ↓
✅ Confirmar pedido
   ↓
🟠 Mesa ocupada
   ↓
⏰ Cliente consume
   ↓
💳 Cerrar cuenta
   ↓
🟢 Mesa disponible nuevamente
```

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:
1. Revisa la documentación completa en `MEJORAS_IMPLEMENTADAS.md`
2. Consulta los logs en la consola del navegador
3. Verifica el estado del backend
4. Contacta al equipo de desarrollo

---

**¡Listo para usar! 🎉**
