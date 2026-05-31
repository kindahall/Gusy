import type { GusyAnnotation } from './types';

export function CanvasAnnotationMarkers(props: {
  annotations: GusyAnnotation[];
  annotationNumbers: Map<string, number>;
  onOpenAnnotation: (annotationId: string) => void;
}) {
  if (props.annotations.length === 0) return null;

  return (
    <div className="gusy-annotation-markers" onClick={(event) => event.stopPropagation()}>
      {props.annotations.map((annotation) => (
        <button
          key={annotation.id}
          type="button"
          className="gusy-annotation-marker"
          data-status={annotation.status}
          onClick={() => props.onOpenAnnotation(annotation.id)}
          title={annotation.note}
        >
          {props.annotationNumbers.get(annotation.id)}
        </button>
      ))}
    </div>
  );
}
