document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('todoForm');
  const input = document.getElementById('todoInput');
  const list = document.getElementById('todoList');
  const itemCount = document.getElementById('itemCount');
  const footer = document.getElementById('todoFooter');
  const clearBtn = document.getElementById('clearCompleted');
  const filterBtns = document.querySelectorAll('.todoapp__filter');

  let todos = loadTodos();
  let currentFilter = 'all';

  function loadTodos() {
    try {
      const data = localStorage.getItem('todos');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getFilteredTodos() {
    if (currentFilter === 'active') return todos.filter(t => !t.completed);
    if (currentFilter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }

  function getActiveCount() {
    return todos.filter(t => !t.completed).length;
  }

  function render() {
    const filtered = getFilteredTodos();
    list.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todoapp__empty';
      empty.textContent = currentFilter === 'all'
        ? 'No hay tareas aún. ¡Agrega una!'
        : currentFilter === 'active'
          ? '¡No hay tareas pendientes!'
          : 'No hay tareas completadas.';
      list.appendChild(empty);
    } else {
      filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.dataset.id = todo.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-item__checkbox';
        checkbox.checked = todo.completed;
        checkbox.setAttribute('aria-label', `Marcar "${todo.text}" como ${todo.completed ? 'pendiente' : 'completada'}`);

        const span = document.createElement('span');
        span.className = `todo-item__text${todo.completed ? ' todo-item__text--completed' : ''}`;
        span.textContent = todo.text;

        const delBtn = document.createElement('button');
        delBtn.className = 'todo-item__delete';
        delBtn.textContent = '✕';
        delBtn.setAttribute('aria-label', `Eliminar "${todo.text}"`);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    }

    const count = getActiveCount();
    itemCount.textContent = `${count} tarea${count !== 1 ? 's' : ''} pendiente${count !== 1 ? 's' : ''}`;
    footer.classList.toggle('todoapp__footer--hidden', todos.length === 0);
  }

  function addTodo(text) {
    todos.push({
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    });
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      saveTodos();
      render();
    }
  }

  function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
  }

  function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    render();
  }

  function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('todoapp__filter--active', isActive);
    });
    render();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addTodo(text);
      input.value = '';
      input.focus();
    }
  });

  list.addEventListener('change', (e) => {
    if (e.target.classList.contains('todo-item__checkbox')) {
      const li = e.target.closest('.todo-item');
      toggleTodo(li.dataset.id);
    }
  });

  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('todo-item__delete')) {
      const li = e.target.closest('.todo-item');
      deleteTodo(li.dataset.id);
    }
  });

  clearBtn.addEventListener('click', clearCompleted);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  render();
});
