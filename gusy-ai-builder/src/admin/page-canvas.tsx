import { useEffect, useState, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { BLOCK_DRAG_MIME, SECTION_DRAG_MIME } from './builder-options';
import { CanvasAnnotationMarkers } from './canvas-annotation-markers';
import { EmptyCanvas, CanvasToolbelt } from './canvas-block-palette';
import { dragTypesFromList, placementFromVerticalPoint } from './canvas-dnd';
import { CanvasSectionControls } from './canvas-section-controls';
import { CanvasBackgroundVideo, canvasSectionStyle } from './canvas-section-media';
import { GusySymbol } from './components';
import { getColors } from './schema';
import { RenderSection } from './section-renderer';
import type { Device, DropPlacement, GusyAnnotation, GusyBlueprint, GusySection } from './types';

export function PageCanvas(props: {
  blueprint: GusyBlueprint;
  selectedId: string;
  device: Device;
  annotations: GusyAnnotation[];
  annotationMode: boolean;
  onSelect: (id: string) => void;
  onOpenBlocks: () => void;
  onQuickAdd: (type: string, targetId?: string, placement?: DropPlacement) => void;
  onReorder: (draggedId: string, targetId: string, placement?: DropPlacement) => void;
  onGeneratePage: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onTransform: (instruction: string) => void;
  onUpdateSection: (sectionId: string, patch: Partial<GusyBlueprint['page']['sections'][number]>) => void;
  onUpdateItem: (sectionId: string, itemIndex: number, patch: Partial<GusyBlueprint['page']['sections'][number]['items'][number]>) => void;
  onUpdateSectionSettings: (sectionId: string, patch: Partial<GusySection['settings']>, message?: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onChooseBackgroundImage: (sectionId: string) => void;
  onAnnotate: (sectionId: string) => void;
  onOpenAnnotation: (annotationId: string) => void;
  onContextMenu: (event: ReactMouseEvent, sectionId?: string) => void;
}) {
  const sections = props.blueprint.page.sections;
  const colors = getColors(props.blueprint);
  const annotationNumbers = new Map(props.annotations.map((annotation, index) => [annotation.id, index + 1]));
  const [draggingSectionId, setDraggingSectionId] = useState('');
  const [draggingKind, setDraggingKind] = useState<'section' | 'block' | ''>('');
  const [dropTarget, setDropTarget] = useState<{ sectionId: string; placement: DropPlacement } | null>(null);
  const [pointerDrag, setPointerDrag] = useState<{ sectionId: string; pointerId: number } | null>(null);

  function resetDragState() {
    setDraggingSectionId('');
    setDraggingKind('');
    setDropTarget(null);
    setPointerDrag(null);
  }

  function dragBlock(event: ReactDragEvent, type: string) {
    event.dataTransfer.setData(BLOCK_DRAG_MIME, type);
    event.dataTransfer.setData('text/plain', type);
    event.dataTransfer.effectAllowed = 'copy';
    setDraggingKind('block');
  }

  function placementFromEvent(event: ReactDragEvent<HTMLElement>): DropPlacement {
    const rect = event.currentTarget.getBoundingClientRect();
    return placementFromVerticalPoint(event.clientY, rect.top, rect.height);
  }

  function dragTypes(event: ReactDragEvent) {
    return dragTypesFromList(event.dataTransfer.types);
  }

  function resolvePointerDrop(clientX: number, clientY: number, draggedId: string) {
    const target = document
      .elementsFromPoint(clientX, clientY)
      .map((element) => (element instanceof HTMLElement ? element.closest<HTMLElement>('.gusy-page-section') : null))
      .find((element): element is HTMLElement => Boolean(element?.dataset.sectionId && element.dataset.sectionId !== draggedId));

    if (!target?.dataset.sectionId) return null;

    const rect = target.getBoundingClientRect();
    return {
      sectionId: target.dataset.sectionId,
      placement: placementFromVerticalPoint(clientY, rect.top, rect.height)
    };
  }

  function updatePointerDrop(clientX: number, clientY: number, draggedId: string) {
    setDropTarget(resolvePointerDrop(clientX, clientY, draggedId));
  }

  useEffect(() => {
    if (!pointerDrag) return;

    const move = (event: PointerEvent) => {
      event.preventDefault();
      updatePointerDrop(event.clientX, event.clientY, pointerDrag.sectionId);
    };

    const finish = (event: PointerEvent | MouseEvent) => {
      const finalTarget = resolvePointerDrop(event.clientX, event.clientY, pointerDrag.sectionId) ?? dropTarget;
      if (finalTarget) {
        props.onReorder(pointerDrag.sectionId, finalTarget.sectionId, finalTarget.placement);
      }
      resetDragState();
    };

    const cancel = () => resetDragState();

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('mouseup', finish);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('mouseup', finish);
    };
  }, [pointerDrag, dropTarget]);

  function dropOnCanvas(event: ReactDragEvent, targetId?: string, placement: DropPlacement = 'after') {
    event.preventDefault();
    const draggedSectionId = event.dataTransfer.getData(SECTION_DRAG_MIME);
    const blockType = event.dataTransfer.getData(BLOCK_DRAG_MIME) || event.dataTransfer.getData('text/plain');

    if (draggedSectionId && targetId) {
      props.onReorder(draggedSectionId, targetId, placement);
      resetDragState();
      return;
    }

    if (draggedSectionId && !targetId && sections.length) {
      props.onReorder(draggedSectionId, sections[sections.length - 1].id, 'after');
      resetDragState();
      return;
    }

    if (blockType && !draggedSectionId) {
      props.onQuickAdd(blockType, targetId, placement);
    }

    resetDragState();
  }

  return (
    <section
      className={`gusy-canvas-workspace is-${props.device}`}
      data-annotating={props.annotationMode ? 'true' : 'false'}
      data-dragging={draggingKind || 'false'}
    >
      <CanvasToolbelt onDragBlock={dragBlock} onResetDrag={resetDragState} onQuickAdd={props.onQuickAdd} />
      <div
        className="gusy-page-frame"
        onContextMenu={props.onContextMenu}
        onDragOver={(event) => {
          event.preventDefault();
          setDropTarget(null);
          event.dataTransfer.dropEffect = dragTypes(event).section ? 'move' : 'copy';
        }}
        onDrop={(event) => dropOnCanvas(event)}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) {
            setDropTarget(null);
          }
        }}
      >
        <button type="button" className="gusy-canvas-plus is-top" onClick={props.onOpenBlocks}>+</button>
        <header className="gusy-page-header">
          <GusySymbol />
          <strong>{props.blueprint.page.title}</strong>
          <span>{props.blueprint.page.slug}</span>
        </header>
        {sections.length === 0 && (
          <EmptyCanvas
            onDragBlock={dragBlock}
            onResetDrag={resetDragState}
            onQuickAdd={props.onQuickAdd}
            onOpenBlocks={props.onOpenBlocks}
            onGeneratePage={props.onGeneratePage}
          />
        )}
        {sections.map((section, index) => {
          const sectionAnnotations = props.annotations.filter((annotation) => annotation.sectionId === section.id);
          const isDropTarget = dropTarget?.sectionId === section.id;
          return (
            <section
              key={section.id}
              data-section-id={section.id}
              data-background={section.settings.background || 'plain'}
              data-spacing={section.settings.spacing || 'lg'}
              data-width={section.settings.width || 'wide'}
              data-columns={section.settings.columns || 2}
              data-tablet-columns={section.settings.tabletColumns || Math.min(section.settings.columns || 2, 2)}
              data-mobile-columns={section.settings.mobileColumns || 1}
              data-accent={section.settings.accent || 'accent'}
              data-text-align={section.settings.textAlign || 'left'}
              data-heading-scale={section.settings.headingScale || 'standard'}
              data-text-width={section.settings.textWidth || 'standard'} data-body-scale={section.settings.bodyScale || 'standard'}
              data-button-style={section.settings.buttonStyle || 'solid'}
              data-button-size={section.settings.buttonSize || 'md'}
              data-button-shape={section.settings.buttonShape || 'pill'}
              data-image-aspect={section.settings.imageAspect || 'landscape'}
              data-image-position={section.settings.imagePosition || 'center'}
              data-image-shape={section.settings.imageShape || 'rounded'}
              data-video-mode={section.settings.videoMode || 'inline'}
              data-has-background-video={section.settings.backgroundVideo?.url ? 'true' : 'false'}
              data-motion-enabled={section.settings.motionEnabled ? 'true' : 'false'}
              data-motion-entrance={section.settings.motionEntrance || 'fade-up'}
              data-has-background-image={section.settings.backgroundImage?.url ? 'true' : 'false'}
              style={canvasSectionStyle(section, colors)}
              className={`gusy-page-section is-${section.type} ${props.selectedId === section.id ? 'is-selected' : ''} ${sectionAnnotations.length ? 'has-annotations' : ''} ${draggingSectionId === section.id ? 'is-dragging' : ''} ${isDropTarget ? `is-drop-${dropTarget.placement}` : ''}`}
              draggable={!props.annotationMode && !pointerDrag}
              onDragStart={(event) => {
                event.dataTransfer.setData(SECTION_DRAG_MIME, section.id);
                event.dataTransfer.effectAllowed = 'move';
                setDraggingSectionId(section.id);
                setDraggingKind('section');
                props.onSelect(section.id);
              }}
              onDragEnd={resetDragState}
              onDragOver={(event) => {
                event.preventDefault();
                const types = dragTypes(event);
                event.dataTransfer.dropEffect = types.section ? 'move' : 'copy';
                if ((types.section || types.block) && draggingSectionId !== section.id) {
                  setDropTarget({ sectionId: section.id, placement: placementFromEvent(event) });
                }
              }}
              onDrop={(event) => {
                event.stopPropagation();
                const placement = dropTarget?.sectionId === section.id ? dropTarget.placement : placementFromEvent(event);
                dropOnCanvas(event, section.id, placement);
              }}
              onClick={() => {
                if (props.annotationMode) {
                  props.onAnnotate(section.id);
                  return;
                }
                props.onSelect(section.id);
              }}
              onContextMenu={(event) => props.onContextMenu(event, section.id)}
            >
              {!props.annotationMode && (
                <button
                  type="button"
                  className="gusy-section-grip"
                  aria-label={`Move ${section.label}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setPointerDrag({ sectionId: section.id, pointerId: event.pointerId });
                    setDraggingSectionId(section.id);
                    setDraggingKind('section');
                    props.onSelect(section.id);
                  }}
                  onPointerMove={(event) => {
                    if (pointerDrag?.sectionId !== section.id) return;
                    event.preventDefault();
                    updatePointerDrop(event.clientX, event.clientY, section.id);
                  }}
                  onPointerUp={(event) => {
                    if (pointerDrag?.sectionId !== section.id) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const finalTarget = resolvePointerDrop(event.clientX, event.clientY, section.id) ?? dropTarget;
                    if (finalTarget) {
                      props.onReorder(section.id, finalTarget.sectionId, finalTarget.placement);
                    }
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    resetDragState();
                  }}
                  onPointerCancel={resetDragState}
                >
                  Move
                </button>
              )}
              {props.selectedId === section.id && (
                <CanvasSectionControls
                  section={section}
                  index={index}
                  sectionCount={sections.length}
                  onOpenBlocks={props.onOpenBlocks}
                  onQuickAdd={props.onQuickAdd}
                  onAnnotate={props.onAnnotate}
                  onUpdateSectionSettings={props.onUpdateSectionSettings}
                  onMoveSection={props.onMoveSection}
                  onTransform={props.onTransform}
                  onChooseBackgroundImage={props.onChooseBackgroundImage}
                  onDuplicate={props.onDuplicate}
                  onRemove={props.onRemove}
                />
              )}
              <CanvasAnnotationMarkers annotations={sectionAnnotations} annotationNumbers={annotationNumbers} onOpenAnnotation={props.onOpenAnnotation} />
              <button type="button" className="gusy-canvas-plus" onClick={(event) => { event.stopPropagation(); props.onOpenBlocks(); }}>+</button>
              <CanvasBackgroundVideo section={section} />
              <RenderSection
                section={section}
                index={index}
                editable={!props.annotationMode}
                onSectionTextChange={props.onUpdateSection}
                onItemTextChange={props.onUpdateItem}
              />
            </section>
          );
        })}
      </div>
    </section>
  );
}
