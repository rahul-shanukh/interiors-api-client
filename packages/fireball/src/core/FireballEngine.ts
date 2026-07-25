import { DatabaseAdapter } from '../adapter/DatabaseAdapter';

class FireballEngineClass {
  private adapter: DatabaseAdapter | null = null;

  init(adapter: DatabaseAdapter) {
    this.adapter = adapter;
  }

  getAdapter(): DatabaseAdapter {
    if (!this.adapter) {
      throw new Error('Fireball: call FireballEngine.init(adapter) before using models.');
    }
    return this.adapter;
  }
}

export const FireballEngine = new FireballEngineClass();