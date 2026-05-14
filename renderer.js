window.addEventListener("DOMContentLoaded", async () => {
  const textarea = document.getElementById("note");
  const saveBtn = document.getElementById("save");
  const statusEl = document.getElementById("save_status");

  const savedNote = await window.electronAPI.loadNote();
  textarea.value = savedNote;
  let lastSavedText = textarea.value;
  let currentFilePath = null;
  let debounceTimer;

  async function saveNote() {
    const currentText = textarea.value;
    if (currentText === lastSavedText) {
      statusEl.textContent = "No changes to save";
      return;
    }

    try {
      const result = await window.electronAPI.saveNote(currentText, currentFilePath);
      lastSavedText = currentText;
      if (result.filePath) {
        currentFilePath = result.filePath;
      }
      const now = new Date().toLocaleTimeString();
      statusEl.textContent = `Saved at ${now}`;
    } catch (err) {
      console.error("Save failed:", err);
      statusEl.textContent = "Save error!";
    }
  }

  saveBtn.addEventListener("click", saveNote);

  textarea.addEventListener("input", () => {
    statusEl.textContent = "Change detected - auto-saving in 5s...";
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveNote, 5000);
  });

  const saveAsBtn = document.getElementById("save-as");

  saveAsBtn.addEventListener("click", async () => {
    const result = await window.electronAPI.saveAs(textarea.value);
    if (result.success) {
      lastSavedText = textarea.value;
      currentFilePath = result.filePath;
      statusEl.textContent = `Saved to: ${result.filePath}`;
    } else {
      statusEl.textContent = "Save as cancelled.";
    }
  });

  const newNoteBtn = document.getElementById("new-note");
  newNoteBtn.addEventListener("click", async () => {
    if (textarea.value === lastSavedText) {
      textarea.value = "";
      lastSavedText = "";
      currentFilePath = null;
      statusEl.textContent = "New note started.";
      return;
    }
    const result = await window.electronAPI.newNote();
    if (result.confirmed) {
      textarea.value = "";
      lastSavedText = "";
      currentFilePath = null;
      statusEl.textContent = "New note started.";
    } else {
      statusEl.textContent = "New note cancelled.";
    }
  });

  async function openFile() {
    const result = await window.electronAPI.openFile();
    if (result.success) {
      textarea.value = result.content;
      lastSavedText = result.content;
      currentFilePath = result.filePath;
      statusEl.textContent = `Opened: ${result.filePath}`;
    } else {
      statusEl.textContent = "Open cancelled.";
    }
  }

  window.electronAPI.onMenuAction("menu-new-note", () => {
    newNoteBtn.click();
  });

  window.electronAPI.onMenuAction("menu-open-file", () => {
    openFile();
  });

  window.electronAPI.onMenuAction("menu-save", () => {
    saveBtn.click();
  });

  window.electronAPI.onMenuAction("menu-save-as", () => {
    saveAsBtn.click();
  });
});
