const assert = require("assert");
const React = require("react");
const $ = require("react").createElement;
const { mount, shallow } = require("./helpers/component_helpers");
const View = require("../lib/view");
const ViewRegistry = require("../lib/view_registry");

suite("View", () => {
  test("basic rendering", () => {
    const viewRegistry = new ViewRegistry();
    viewRegistry.addComponent("comp-1", props => $("div", {}, props.text));
    viewRegistry.addComponent("comp-2", props => $("label", {}, props.text));
    viewRegistry.update({
      updated: [
        { component_name: "comp-1", view_id: 1, props: { text: "text-1" } },
        { component_name: "comp-2", view_id: 2, props: { text: "text-2" } }
      ],
      removed: []
    });

    // Initial rendering
    const view = shallow($(View, { id: 1 }), {
      context: { viewRegistry }
    });
    assert.equal(view.html(), "<div>text-1</div>");

    // Changing view id
    view.setProps({ id: 2 });
    assert.equal(view.html(), "<label>text-2</label>");

    // Updating view props
    viewRegistry.update({
      updated: [
        { component_name: "comp-2", view_id: 2, props: { text: "text-3" } }
      ],
      removed: []
    });
    view.update();
    assert.equal(view.html(), "<label>text-3</label>");
  });

  test("action dispatching", () => {
    const actions = [];
    const viewRegistry = new ViewRegistry({ onAction: a => actions.push(a) });
    viewRegistry.update({
      updated: [{ component_name: "component", view_id: 42, props: {} }],
      removed: []
    });

    let dispatch;
    viewRegistry.addComponent("component", props => {
      dispatch = props.dispatch;
      return $("div");
    });

    const view = shallow($(View, { id: 42 }), {
      context: { viewRegistry }
    });
    assert.equal(view.html(), "<div></div>");

    dispatch({ type: "foo" });
    dispatch({ type: "bar" });
    assert.deepEqual(actions, [
      { view_id: 42, action: { type: "foo" } },
      { view_id: 42, action: { type: "bar" } }
    ]);
  });

  test("focus", () => {
    const focusedViewIds = [];
    const viewRegistry = new ViewRegistry({
      onAction: a => focusedViewIds.push(a.view_id)
    });

    class TestComponent extends React.Component {
      render() {
        return $("div");
      }

      focus() {
        this.props.dispatch({});
      }
    }
    viewRegistry.addComponent("component", TestComponent);
    viewRegistry.update({
      updated: [
        { component_name: "component", view_id: 1, props: {} },
        { component_name: "component", view_id: 2, props: {} }
      ],
      removed: [],
      focused: 1
    });

    mount($(View, { id: 1 }), { context: { viewRegistry } });
    mount($(View, { id: 2 }), { context: { viewRegistry } });
    assert.deepEqual(focusedViewIds, [1]);

    viewRegistry.update({ updated: [], removed: [], focused: 2 });
    assert.deepEqual(focusedViewIds, [1, 2]);

    viewRegistry.update({ updated: [], removed: [], focused: 1 });
    assert.deepEqual(focusedViewIds, [1, 2, 1]);
  });
});
