const assert = require("assert");

module.exports = class ViewRegistry {
  constructor({ onAction } = {}) {
    this.onAction = onAction;
    this.componentsByName = new Map();
    this.viewsById = new Map();
    this.propListenersByViewId = new Map();
    this.focusListenersByViewId = new Map();
  }

  addComponent(name, component) {
    assert(!this.componentsByName.has(name));
    this.componentsByName.set(name, component);
  }

  getComponent(id) {
    const view = this.viewsById.get(id);
    assert(view);
    const component = this.componentsByName.get(view.component_name);
    assert(component);
    return component;
  }

  removeComponent(name) {
    this.componentsByName.delete(name);
  }

  update({ updated, removed, focused }) {
    for (let i = 0; i < updated.length; i++) {
      const view = updated[i];
      this.viewsById.set(view.view_id, view);

      const listeners = this.propListenersByViewId.get(view.view_id);
      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i]();
        }
      }
    }

    for (var i = 0; i < removed.length; i++) {
      const viewId = removed[i];
      this.viewsById.delete(viewId);
      this.propListenersByViewId.delete(viewId);
    }

    if (focused != null) {
      const focusListener = this.focusListenersByViewId.get(focused);
      if (focusListener) {
        this.pendingFocus = null;
        focusListener();
      } else {
        this.pendingFocus = focused;
      }
    }
  }

  getProps(id) {
    const view = this.viewsById.get(id);
    assert(view);
    return view.props;
  }

  watchProps(id, callback) {
    assert(this.viewsById.has(id));

    let listeners = this.propListenersByViewId.get(id);
    if (!listeners) {
      listeners = [];
      this.propListenersByViewId.set(id, listeners);
    }

    listeners.push(callback);

    return () => {
      const callbackIndex = listeners.indexOf(callback);
      if (callbackIndex !== -1) listeners.splice(callbackIndex, 1);
    };
  }

  watchFocus(id, callback) {
    assert(!this.focusListenersByViewId.has(id));

    this.focusListenersByViewId.set(id, callback);
    if (this.pendingFocus === id) {
      this.pendingFocus = null;
      callback();
    }

    return () => this.focusListenersByViewId.delete(id);
  }

  dispatchAction(id, action) {
    assert(this.viewsById.has(id));
    this.onAction({ view_id: id, action });
  }
};
