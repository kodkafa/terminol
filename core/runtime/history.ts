export class HistoryManager {
  private history: string[] = [];
  private pointer: number = -1;

  constructor(initialHistory: string[] = []) {
    this.history = [...initialHistory];
    this.pointer = this.history.length;
  }

  add(command: string) {
    if (!command.trim()) return;
    // Don't add if same as last command
    if (
      this.history.length > 0 &&
      this.history[this.history.length - 1] === command
    ) {
      this.pointer = this.history.length;
      return;
    }
    this.history.push(command);
    this.pointer = this.history.length;
  }

  getPrevious(): string | null {
    if (this.pointer > 0) {
      this.pointer--;
      return this.history[this.pointer];
    }
    return null;
  }

  getNext(): string | null {
    if (this.pointer < this.history.length - 1) {
      this.pointer++;
      return this.history[this.pointer];
    }
    this.pointer = this.history.length;
    return "";
  }

  getAll(): string[] {
    return [...this.history];
  }
}
