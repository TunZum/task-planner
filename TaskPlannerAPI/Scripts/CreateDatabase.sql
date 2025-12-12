-- ============================================
-- Создание базы данных и таблицы Tasks
-- Учебный проект "Планировщик задач"
-- ============================================

-- 1. Создание базы данных (если не существует)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TaskPlannerDB')
BEGIN
    CREATE DATABASE TaskPlannerDB;
    PRINT '✅ База данных TaskPlannerDB создана';
END
ELSE
    PRINT 'ℹ️ База данных TaskPlannerDB уже существует';
GO

-- 2. Использование созданной базы данных
USE TaskPlannerDB;
GO

-- 3. Создание таблицы Tasks (если не существует)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' and xtype='U')
BEGIN
    CREATE TABLE Tasks (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Title NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        CreatedDate DATETIME DEFAULT GETDATE(),
        IsCompleted BIT DEFAULT 0,
        CompletedDate DATETIME NULL
    );
    PRINT '✅ Таблица Tasks создана';
END
ELSE
    PRINT 'ℹ️ Таблица Tasks уже существует';
GO

-- 4. Создание индексов для оптимизации
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_IsCompleted')
BEGIN
    CREATE INDEX IX_Tasks_IsCompleted ON Tasks(IsCompleted);
    PRINT '✅ Индекс IX_Tasks_IsCompleted создан';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_CreatedDate')
BEGIN
    CREATE INDEX IX_Tasks_CreatedDate ON Tasks(CreatedDate DESC);
    PRINT '✅ Индекс IX_Tasks_CreatedDate создан';
END
GO

-- 5. Вставка тестовых данных (опционально)
PRINT '📝 Добавление тестовых данных...';

INSERT INTO Tasks (Title, Description, IsCompleted, CompletedDate) 
VALUES 
('Изучить ASP.NET Core', 'Освоить создание Web API и Entity Framework', 1, DATEADD(day, -2, GETDATE())),
('Разработать планировщик задач', 'Учебный проект по практике', 1, DATEADD(day, -1, GETDATE())),
('Написать отчет по практике', 'Описание реализации проекта', 0, NULL),
('Протестировать API через Swagger', 'Проверить все CRUD операции', 0, NULL),
('Настроить CORS для фронтенда', 'Разрешить доступ с localhost:8000', 1, GETDATE());

PRINT '✅ Добавлено ' + CAST(@@ROWCOUNT AS VARCHAR) + ' тестовых записей';
GO

-- 6. Проверка созданных данных
PRINT '🔍 Проверка данных...';
SELECT 
    Id,
    Title,
    CASE 
        WHEN LEN(Description) > 50 THEN LEFT(Description, 50) + '...'
        ELSE Description
    END AS Description,
    FORMAT(CreatedDate, 'dd.MM.yyyy HH:mm') AS CreatedDate,
    CASE IsCompleted 
        WHEN 1 THEN '✅ Выполнено'
        ELSE '⏳ В работе'
    END AS Status,
    FORMAT(CompletedDate, 'dd.MM.yyyy') AS CompletedDate
FROM Tasks 
ORDER BY CreatedDate DESC;
GO

PRINT '============================================';
PRINT '✅ Скрипт успешно выполнен!';
PRINT 'База данных: TaskPlannerDB';
PRINT 'Таблица: Tasks';
PRINT 'Количество записей: ' + CAST((SELECT COUNT(*) FROM Tasks) AS VARCHAR);
PRINT '============================================';