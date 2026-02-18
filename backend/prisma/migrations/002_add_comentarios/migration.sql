-- AlterTable
ALTER TABLE "Orden" ADD COLUMN "comentarios" TEXT;

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipoComentario" TEXT NOT NULL DEFAULT 'GENERAL',
    "severidad" TEXT NOT NULL DEFAULT 'NORMAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comentario_ordenId_idx" ON "Comentario"("ordenId");

-- CreateIndex
CREATE INDEX "Comentario_tipoComentario_idx" ON "Comentario"("tipoComentario");

-- CreateIndex
CREATE INDEX "Comentario_severidad_idx" ON "Comentario"("severidad");

-- CreateIndex
CREATE INDEX "Comentario_activo_idx" ON "Comentario"("activo");

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
