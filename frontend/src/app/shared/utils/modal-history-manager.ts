export type ModalCloseDelegate = (modalId: string) => void;

export class ModalHistoryManager {
  private modalHistoryStack: string[] = [];
  private ignoreNextPopstate = false;
  private popStateHandler = (event: PopStateEvent) => {
    if (this.ignoreNextPopstate) {
      this.ignoreNextPopstate = false;
      return;
    }

    if (this.closeModalFromHistory()) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      return;
    }
  };

  constructor(private closeDelegate: ModalCloseDelegate, private baseStateId: string) {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.popStateHandler);
    }
  }

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.popStateHandler);
    }
  }

  registerModalOpen(id: string, isOpen: boolean): void {
    if (!isOpen) {
      this.pushModalHistory(id);
    }
  }

  removeModalHistoryEntry(id: string): void {
    if (!this.modalHistoryStack.length) {
      return;
    }

    const lastModal = this.modalHistoryStack[this.modalHistoryStack.length - 1];
    if (lastModal === id) {
      this.modalHistoryStack.pop();
      if (typeof window !== 'undefined' && typeof history !== 'undefined') {
        this.ignoreNextPopstate = true;
        history.back();
      }
      return;
    }

    const index = this.modalHistoryStack.lastIndexOf(id);
    if (index !== -1) {
      this.modalHistoryStack.splice(index, 1);
    }
  }

  private pushModalHistory(id: string): void {
    if (this.modalHistoryStack[this.modalHistoryStack.length - 1] === id) {
      return;
    }

    if (typeof history !== 'undefined') {
      history.pushState({ modal: id }, 'modal');
    }
    this.modalHistoryStack.push(id);
  }

  private closeModalFromHistory(): boolean {
    if (!this.modalHistoryStack.length) {
      return false;
    }

    const modalId = this.modalHistoryStack.pop()!;
    this.closeDelegate(modalId);
    return true;
  }
}
