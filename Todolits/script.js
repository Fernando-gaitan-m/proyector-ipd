document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const notesGrid = document.getElementById('notesGrid');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const editor = document.getElementById('editor');
  const editorBack = document.getElementById('editorBack');
  const editorTitle = document.getElementById('editorTitle');
  const editorContent = document.getElementById('editorContent');
  const editorDate = document.getElementById('editorDate');
  const editorDelete = document.getElementById('editorDelete');
  const toolbarBtns = document.querySelectorAll('.toolbar-btn');

  let notes = loadNotes();
  let activeNoteId = null;
  let saveTimeout = null;
  let isEditorDirty = false;

  function loadNotes() {
    try {
      const data = localStorage.getItem('notes');
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Ahora mismo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 172800000) return 'Ayer';
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }

  function stripHtml(html) {
    const t = document.createElement('div');
    t.innerHTML = html;
    return t.textContent || t.innerText || '';
  }

  function renderGrid() {
    if (notes.length === 0) {
      notesGrid.innerHTML = `
        <div class="notes-empty">
          <span class="notes-empty__icon">📝</span>
          No hay notas aún. ¡Crea una!
        </div>`;
      return;
    }
    notesGrid.innerHTML = notes.map(n => `
      <div class="note-card" data-id="${n.id}">
        <div class="note-card__title">${n.title || 'Sin título'}</div>
        <div class="note-card__preview">${stripHtml(n.content).slice(0, 120) || 'Nota vacía'}</div>
        <div class="note-card__date">${formatDate(n.updatedAt)}</div>
      </div>
    `).join('');
  }

  function openEditor(noteId) {
    activeNoteId = noteId;
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    editorTitle.value = note.title || '';
    editorContent.innerHTML = note.content || '';
    editorDate.textContent = `Creada: ${new Date(note.createdAt).toLocaleString('es')}  ·  Modificada: ${new Date(note.updatedAt).toLocaleString('es')}`;
    editor.classList.add('editor--open');
    isEditorDirty = false;

    setTimeout(() => {
      if (note.content) {
        editorContent.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorContent);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        editorContent.focus();
      }
    }, 350);
  }

  function closeEditor() {
    editor.classList.remove('editor--open');
    activeNoteId = null;
    renderGrid();
  }

  function saveCurrentNote() {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    const title = editorTitle.value.trim();
    const content = editorContent.innerHTML.trim();

    if (title === '' && (content === '' || content === '<br>')) {
      return;
    }

    note.title = title;
    note.content = content;
    note.updatedAt = Date.now();
    saveNotes();
    isEditorDirty = false;
  }

  function createNote() {
    const note = {
      id: generateId(),
      title: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    notes.unshift(note);
    saveNotes();
    renderGrid();
    openEditor(note.id);
  }

  function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    closeEditor();
  }

  function handleToolbarClick(e) {
    const btn = e.target.closest('.toolbar-btn');
    if (!btn) return;

    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val || null;

    editorContent.focus();

    if (cmd === 'formatBlock' && val) {
      document.execCommand('formatBlock', false, val);
    } else {
      document.execCommand(cmd, false, val);
    }

    btn.classList.toggle('toolbar-btn--active', document.queryCommandState(cmd));

    markDirty();
  }

  function markDirty() {
    isEditorDirty = true;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 600);
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  }

  let currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
  });

  addNoteBtn.addEventListener('click', createNote);

  notesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (card) openEditor(card.dataset.id);
  });

  editorBack.addEventListener('click', () => {
    if (isEditorDirty) saveCurrentNote();
    closeEditor();
  });

  editorTitle.addEventListener('input', markDirty);
  editorContent.addEventListener('input', markDirty);

  editorContent.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&emsp;&emsp;');
    }
  });

  editorDelete.addEventListener('click', () => {
    if (confirm('¿Eliminar esta nota?')) {
      deleteNote(activeNoteId);
    }
  });

  toolbarBtns.forEach(btn => {
    btn.addEventListener('click', handleToolbarClick);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editor.classList.contains('editor--open')) {
      if (isEditorDirty) saveCurrentNote();
      closeEditor();
    }
  });

  renderGrid();
});
