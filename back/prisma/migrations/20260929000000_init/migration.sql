-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PernaBoa" AS ENUM ('DESTRA', 'CANHOTA', 'AMBIDESTRO');

-- CreateEnum
CREATE TYPE "StatusJogador" AS ENUM ('DISPONIVEL', 'EM_NEGOCIACAO', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA');

-- CreateTable
CREATE TABLE "posicoes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,

    CONSTRAINT "posicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogadores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "idade" SMALLINT NOT NULL,
    "nacionalidade" VARCHAR(40) NOT NULL,
    "clubeAtual" VARCHAR(60) NOT NULL,
    "pernaBoa" "PernaBoa" NOT NULL DEFAULT 'DESTRA',
    "valorPedido" DECIMAL(12,2) NOT NULL,
    "foto" TEXT NOT NULL,
    "videoDestaque" TEXT,
    "status" "StatusJogador" NOT NULL DEFAULT 'DISPONIVEL',
    "destaque" BOOLEAN NOT NULL DEFAULT true,
    "pontosFortes" TEXT,
    "pontosFracos" TEXT,
    "estiloDeJogo" TEXT,
    "jogadorComparavel" VARCHAR(80),
    "potencialMercado" VARCHAR(30),
    "analiseIA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "posicaoId" INTEGER NOT NULL,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubes" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "pais" VARCHAR(50) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "propostas" (
    "id" SERIAL NOT NULL,
    "valorOferta" DECIMAL(12,2) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "resposta" TEXT,
    "status" "StatusProposta" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jogadorId" INTEGER NOT NULL,
    "clubeId" TEXT NOT NULL,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubes_email_key" ON "clubes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- AddForeignKey
ALTER TABLE "jogadores" ADD CONSTRAINT "jogadores_posicaoId_fkey" FOREIGN KEY ("posicaoId") REFERENCES "posicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "clubes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
