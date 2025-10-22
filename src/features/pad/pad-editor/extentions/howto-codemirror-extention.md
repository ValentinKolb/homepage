# CodeMirror 6 Extensions Guide

## Core Concepts

### When to Use What

**Decoration.replace()** - Complete replacement of content
- Use for: Block elements (tables, images, code blocks)
- Pros: Full control over rendering
- Cons: Original text position lost, cursor issues

**Decoration.mark()** - Style/wrap existing text
- Use for: Inline formatting (bold, links, inline math)
- Pros: Preserves text position, click handling works
- Cons: Limited to styling, can't completely replace

**Decoration.widget()** - Insert element without replacing
- Use for: Buttons, indicators, additional UI
- Side: -1 (before), 0 (at position), 1 (after)
- Block: true for new line, false for inline

**Decoration.line()** - Style entire lines
- Use for: Line backgrounds, indentation
- Can hide lines with CSS

### State Management

**StateField** - Store and update decoration state
```typescript
StateField.define<DecorationSet>({
  create(state) { /* initial */ },
  update(value, tr) { /* on change */ },
  provide(field) { /* expose decorations */ }
})
```

**ViewPlugin** - Access to EditorView, handle DOM events
```typescript
ViewPlugin.fromClass(class {
  constructor(view) { /* init */ }
  update(update) { /* on change */ }
}, { decorations: v => v.decorations })
```

### Common Patterns

**Cursor-based Toggle** (tables, images)
```typescript
if (cursor.from >= node.from && cursor.to <= node.to) {
  return false; // Skip decoration when cursor inside
}
```

**Debouncing** (expensive operations)
```typescript
const timers = new Map();
clearTimeout(timers.get(id));
timers.set(id, setTimeout(() => render(), 300));
```

**Caching** (prevent flicker)
```typescript
const cache = new Map();
if (cache.has(key)) showCached();
renderAsync().then(result => cache.set(key, result));
```

### Performance Tips

1. Use `syntaxTree(state).iterate()` instead of regex when possible
2. Cache expensive computations
3. Debounce rapid updates
4. Use `requestAnimationFrame()` for DOM updates
5. Limit decoration count with `RangeSet.of(decorations, true)`

### Event Handling

**Click on decorations**
```typescript
EditorView.domEventHandlers({
  mousedown(event, view) {
    if (target.closest('.my-widget')) {
      const pos = view.posAtDOM(target);
      view.dispatch({ selection: { anchor: pos } });
      return true; // Prevent default
    }
  }
})
```

### Important Gotchas

1. **!m-0** on block widgets prevents margin issues
2. **view.requestMeasure()** after DOM changes in widgets
3. **atomic ranges** can cause "f is not a function" errors
4. **Decoration.replace()** creates empty lines at boundaries
5. **Line numbers** stack when using `display: none`

### Extension Composition

```typescript
export const myExtension = (): Extension => {
  return [
    stateField,      // Decorations
    viewPlugin,      // DOM access
    theme,           // CSS styles
    eventHandlers,   // User interaction
    keymap.of([...]) // Keyboard shortcuts
  ];
};
```
