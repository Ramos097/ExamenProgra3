-- Crear la base de datos
CREATE DATABASE Gestion;
GO

-- Usar la base de datos
USE Gestion;
GO

-- Crear tabla Usuarios
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100),
    Email VARCHAR(100),
    Password VARCHAR(255)
);
GO

-- Crear índice único para Email
CREATE UNIQUE INDEX idx_email_unique ON Usuarios(Email);
GO

-- Crear tabla RegistrosReciclaje
CREATE TABLE RegistrosReciclaje (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Fecha DATE,
    Material VARCHAR(50),
    Cantidad FLOAT,
    UsuarioId INT,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id),
    CentroReciclaje VARCHAR(100)  -- Agregar la columna aquí
);
GO

-- Crear tabla Recompensas
CREATE TABLE Recompensas (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100),
    PuntosNecesarios INT
);
GO

-- Crear tabla CanjeRecompensas
CREATE TABLE CanjeRecompensas (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UsuarioId INT,
    RecompensaId INT,
    FechaCanje DATE,
    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id),
    FOREIGN KEY (RecompensaId) REFERENCES Recompensas(Id)
);
GO

