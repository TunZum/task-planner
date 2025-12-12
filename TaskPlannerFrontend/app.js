const API_URL = 'https://localhost:7068/api/tasks'; // НЕ ЗАБУДЬ Поменять порт!

let currentFilter = 'all';

$(document).ready(function() {
    loadTasks();
    
    // Обработка Enter в поле ввода
    $('#taskTitle').keypress(function(e) {
        if (e.which === 13) addTask();
    });
});

// Загрузка задач
function loadTasks() {
    let url = API_URL;
    
    if (currentFilter === 'active') {
        url += '?completed=false';
    } else if (currentFilter === 'completed') {
        url += '?completed=true';
    }

    $.ajax({
        url: url,
        method: 'GET',
        success: function(tasks) {
            displayTasks(tasks);
            updateStats(tasks);
            toggleEmptyState(tasks.length === 0);
        },
        error: function(xhr, status, error) {
            showError('Ошибка загрузки задач: ' + error);
            $('#tasksList').html('<div class="alert alert-danger">Не удалось загрузить задачи. Проверьте подключение к серверу.</div>');
        }
    });
}

// Отображение задач
function displayTasks(tasks) {
    if (tasks.length === 0) {
        $('#tasksList').html('');
        return;
    }

    let html = '';
    tasks.forEach(task => {
        const createdDate = new Date(task.createdDate).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const completedDate = task.completedDate 
            ? new Date(task.completedDate).toLocaleDateString('ru-RU')
            : '—';

        html += `
        <div class="task-card ${task.isCompleted ? 'task-completed' : ''} ${task.isCompleted ? 'completed' : ''}" 
             id="task-${task.id}">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h5 class="mb-2">
                        ${escapeHtml(task.title)}
                        <span class="status-badge ${task.isCompleted ? 'badge-completed' : 'badge-active'}">
                            ${task.isCompleted ? '<i class="bi bi-check-circle me-1"></i>Выполнено' : '<i class="bi bi-clock me-1"></i>Активно'}
                        </span>
                    </h5>
                    
                    ${task.description ? `
                    <p class="mb-3 text-muted">
                        <i class="bi bi-card-text me-2"></i>
                        ${escapeHtml(task.description)}
                    </p>` : ''}
                    
                    <div class="task-dates">
                        <small class="me-4">
                            <i class="bi bi-calendar-plus me-1"></i>Создано: ${createdDate}
                        </small>
                        ${task.completedDate ? `
                        <small>
                            <i class="bi bi-calendar-check me-1"></i>Завершено: ${completedDate}
                        </small>` : ''}
                    </div>
                    
                    <div class="task-actions mt-3">
                        ${!task.isCompleted ? 
                            `<button class="btn btn-success btn-sm" onclick="completeTask(${task.id})" title="Отметить выполненной">
                                <i class="bi bi-check-lg me-1"></i>Выполнить
                            </button>` : 
                            `<button class="btn btn-warning btn-sm" onclick="uncompleteTask(${task.id})" title="Вернуть в работу">
                                <i class="bi bi-arrow-counterclockwise me-1"></i>В работу
                            </button>`
                        }
                        <button class="btn btn-outline-primary btn-sm" onclick="editTask(${task.id})" title="Редактировать">
                            <i class="bi bi-pencil me-1"></i>Изменить
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})" title="Удалить">
                            <i class="bi bi-trash me-1"></i>Удалить
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    });

    $('#tasksList').html(html);
}

// Обновление статистики
function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const active = total - completed;
    
    $('#totalTasks').text(total);
    $('#activeTasks').text(active);
    $('#completedTasks').text(completed);
}

// Показать/скрыть сообщение "нет задач"
function toggleEmptyState(isEmpty) {
    if (isEmpty) {
        $('#emptyState').show();
        $('#tasksList').hide();
    } else {
        $('#emptyState').hide();
        $('#tasksList').show();
    }
}

// Фильтрация задач
function filterTasks(filter) {
    currentFilter = filter;
    
    // Обновляем активную кнопку
    $('.filter-buttons .btn').removeClass('active');
    $(`.filter-buttons .btn:contains(${getFilterText(filter)})`).addClass('active');
    
    loadTasks();
}

function getFilterText(filter) {
    switch(filter) {
        case 'all': return 'Все задачи';
        case 'active': return 'Активные';
        case 'completed': return 'Выполненные';
        default: return 'Все задачи';
    }
}

// Добавление задачи
function addTask() {
    const title = $('#taskTitle').val().trim();
    const description = $('#taskDescription').val().trim();

    if (!title) {
        showError('Введите название задачи');
        $('#taskTitle').focus();
        return;
    }

    const newTask = {
        title: title,
        description: description,
        isCompleted: false
    };

    $.ajax({
        url: API_URL,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newTask),
        success: function() {
            $('#taskTitle').val('');
            $('#taskDescription').val('');
            loadTasks();
            showSuccess('Задача добавлена!');
        },
        error: function(xhr, status, error) {
            showError('Ошибка при добавлении задачи: ' + error);
        }
    });
}

// Отметить выполненной
function completeTask(id) {
    updateTaskStatus(id, true);
}

// Вернуть в работу
function uncompleteTask(id) {
    updateTaskStatus(id, false);
}

// Обновление статуса задачи
function updateTaskStatus(id, isCompleted) {
    $.ajax({
        url: `${API_URL}/${id}`,
        method: 'GET',
        success: function(task) {
            task.isCompleted = isCompleted;
            
            $.ajax({
                url: `${API_URL}/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(task),
                success: function() {
                    loadTasks();
                    showSuccess(isCompleted ? 'Задача выполнена!' : 'Задача возвращена в работу');
                },
                error: function(xhr, status, error) {
                    showError('Ошибка обновления: ' + error);
                }
            });
        },
        error: function(xhr, status, error) {
            showError('Не удалось загрузить задачу: ' + error);
        }
    });
}

// Редактирование задачи
function editTask(id) {
    $.ajax({
        url: `${API_URL}/${id}`,
        method: 'GET',
        success: function(task) {
            const newTitle = prompt('Введите новое название задачи:', task.title);
            if (newTitle === null) return;
            
            const newDescription = prompt('Введите новое описание:', task.description || '');
            
            if (!newTitle.trim()) {
                showError('Название не может быть пустым');
                return;
            }

            task.title = newTitle.trim();
            task.description = newDescription ? newDescription.trim() : null;

            $.ajax({
                url: `${API_URL}/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(task),
                success: function() {
                    loadTasks();
                    showSuccess('Задача обновлена!');
                },
                error: function(xhr, status, error) {
                    showError('Ошибка обновления: ' + error);
                }
            });
        },
        error: function(xhr, status, error) {
            showError('Не удалось загрузить задачу: ' + error);
        }
    });
}

// Удаление задачи
function deleteTask(id) {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    $.ajax({
        url: `${API_URL}/${id}`,
        method: 'DELETE',
        success: function() {
            $(`#task-${id}`).fadeOut(300, function() {
                $(this).remove();
                loadTasks(); // Обновляем список и статистику
            });
            showSuccess('Задача удалена');
        },
        error: function(xhr, status, error) {
            showError('Ошибка удаления: ' + error);
        }
    });
}

// Утилиты
function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    // Можно заменить на toast-уведомление
    console.log('✅ ' + message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}