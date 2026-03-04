# Script para detener completamente cualquier Node.js en puerto 3001 y reiniciar el servidor

Write-Output "⏹️  Deteniendo todos los procesos Node.js..."
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Output "⏳ Esperando a que se libere el puerto..."
Start-Sleep -Seconds 2

Write-Output "🔄 Recompilando TypeScript..."
npm run build

Write-Output "🚀 Iniciando el servidor..."
npm start
