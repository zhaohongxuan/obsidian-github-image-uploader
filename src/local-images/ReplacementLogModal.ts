import { App, Modal, setIcon } from 'obsidian';
import type { ReplacementLogEntry } from '../main';

/**
 * Modal to display replacement log entries
 */
export class ReplacementLogModal extends Modal {
  private logs: ReplacementLogEntry[] = [];

  constructor(
    app: App,
    logs: ReplacementLogEntry[]
  ) {
    super(app);
    this.logs = logs;
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    modalEl.addClass('replacement-log-modal');

    modalEl.style.width = '700px';
    modalEl.style.maxWidth = '90vw';
    modalEl.style.maxHeight = '80vh';

    const header = contentEl.createEl('div', { cls: 'replacement-log-header' });
    header.createEl('h2', { text: '替换日志' });

    const closeBtn = header.createEl('button', { cls: 'replacement-log-close-btn' });
    setIcon(closeBtn, 'x');
    closeBtn.addEventListener('click', () => this.close());

    const listEl = contentEl.createEl('div', { cls: 'replacement-log-list' });

    if (this.logs.length === 0) {
      const emptyEl = listEl.createEl('div', { cls: 'replacement-log-empty' });
      setIcon(emptyEl.createSpan({ cls: 'replacement-log-empty-icon' }), 'check-circle');
      emptyEl.createSpan({ text: '暂无替换记录' });
      return;
    }

    // Sort by timestamp descending (most recent first)
    const sortedLogs = [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    for (const log of sortedLogs) {
      const itemEl = listEl.createEl('div', { cls: 'replacement-log-item' });

      // Status icon
      const statusIcon = itemEl.createSpan({ cls: 'replacement-log-status-icon' });
      setIcon(statusIcon, log.success ? 'check-circle' : 'x-circle');

      // Content
      const content = itemEl.createEl('div', { cls: 'replacement-log-content' });

      // Local to remote
      const pathEl = content.createEl('div', { cls: 'replacement-log-paths' });
      pathEl.createEl('span', { cls: 'replacement-log-local', text: log.localPath });
      pathEl.createEl('span', { cls: 'replacement-log-arrow', text: ' → ' });
      pathEl.createEl('span', { cls: 'replacement-log-remote', text: log.remoteUrl });

      // Timestamp
      const timeEl = content.createEl('div', { cls: 'replacement-log-time' });
      timeEl.textContent = log.timestamp.toLocaleString('zh-CN');

      // Affected notes
      if (log.affectedNotes.length > 0) {
        const notesEl = content.createEl('div', { cls: 'replacement-log-notes' });
        notesEl.createEl('span', { cls: 'replacement-log-notes-label', text: `影响笔记 (${log.affectedNotes.length}):` });

        const notesList = notesEl.createEl('div', { cls: 'replacement-log-notes-list' });
        for (const note of log.affectedNotes) {
          notesList.createEl('span', {
            cls: 'replacement-log-note-item',
            text: note.basename,
          });
        }
      }

      // Error message
      if (log.error) {
        const errorEl = content.createEl('div', { cls: 'replacement-log-error' });
        errorEl.textContent = log.error;
      }
    }
  }
}
