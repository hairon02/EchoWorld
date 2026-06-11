/**
 * GameEngine - single source of truth for game state
 * All mutations to game state should go through this module.
 */
class GameEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      players: {},
      world: {},
    };
  }

  /**
   * Get the full game state snapshot
   */
  getState() {
    return this.state;
  }

  /**
   * Apply a shallow patch to the state
   * @param {Object} patch
   */
  update(patch = {}) {
    Object.assign(this.state, patch);
    return this.state;
  }
}

module.exports = new GameEngine();
