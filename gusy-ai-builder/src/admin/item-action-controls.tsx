export function ItemActionControls(props: {
  index: number;
  count: number;
  moveSelectedItem: (index: number, direction: -1 | 1) => void;
  duplicateSelectedItem: (index: number) => void;
}) {
  return (
    <div className="gusy-item-action-controls">
      <button type="button" onClick={() => props.moveSelectedItem(props.index, -1)} disabled={props.index === 0}>Move up</button>
      <button type="button" onClick={() => props.moveSelectedItem(props.index, 1)} disabled={props.index >= props.count - 1}>Move down</button>
      <button type="button" onClick={() => props.duplicateSelectedItem(props.index)}>Duplicate</button>
    </div>
  );
}
