import type { TerminolPlugin } from "../types";

export class CommandRegistry {
  private plugins: Map<string, TerminolPlugin> = new Map();

  constructor(plugins: TerminolPlugin[] = []) {
    plugins.forEach((p) => {
      this.register(p);
    });
  }

  register(plugin: TerminolPlugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.aliases?.forEach((alias) => {
      this.plugins.set(alias, plugin);
    });
  }

  resolve(commandName: string): TerminolPlugin | undefined {
    return this.plugins.get(commandName);
  }

  getAll(): TerminolPlugin[] {
    // Return unique plugins (deduplicate aliases)
    const unique = new Set<TerminolPlugin>();
    this.plugins.forEach((p) => {
      unique.add(p);
    });
    return Array.from(unique);
  }
}
