import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  annotationFromDraft,
  buildAnnotationInstruction,
  explicitAnnotationPatch,
  liveAnnotationsForSections,
  upsertAnnotation
} from '../src/admin/annotation-model';
import type { GusyAnnotation, GusySection } from '../src/admin/types';

function section(id: string, label = 'Hero'): GusySection {
  return {
    id,
    type: 'hero',
    variant: 'default',
    label,
    kicker: '',
    title: 'Old title',
    body: 'Old body',
    cta: { label: 'Old CTA', url: '#contact' },
    items: [],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    }
  };
}

function annotation(patch: Partial<GusyAnnotation> = {}): GusyAnnotation {
  return {
    id: 'a-1',
    sectionId: 'hero-1',
    sectionLabel: 'Hero',
    note: 'Change title to "New title"',
    status: 'open',
    createdAt: '2026-05-26T10:00:00.000Z',
    ...patch
  };
}

describe('Gusy annotation model', () => {
  it('keeps only annotations attached to existing sections', () => {
    const live = liveAnnotationsForSections(
      [annotation(), annotation({ id: 'a-2', sectionId: 'missing' })],
      [section('hero-1')]
    );

    assert.deepEqual(live.map((item) => item.id), ['a-1']);
  });

  it('turns a draft into a stable annotation record', () => {
    const result = annotationFromDraft({
      draft: { sectionId: 'hero-1', note: '  Change title to "Better headline"  ' },
      sections: [section('hero-1')],
      existingAnnotations: [],
      nextStatus: 'open',
      now: new Date('2026-05-26T11:00:00.000Z'),
      idFactory: () => 'a-new'
    });

    assert.equal(result.error, undefined);
    assert.equal(result.annotation?.id, 'a-new');
    assert.equal(result.annotation?.note, 'Change title to "Better headline"');
    assert.equal(result.annotation?.sectionLabel, 'Hero');
    assert.equal(result.annotation?.createdAt, '2026-05-26T11:00:00.000Z');
  });

  it('rejects incomplete drafts with actionable errors', () => {
    assert.equal(
      annotationFromDraft({
        draft: { sectionId: 'missing', note: 'Change something' },
        sections: [section('hero-1')],
        existingAnnotations: [],
        nextStatus: 'open'
      }).error,
      'Section missing'
    );

    assert.equal(
      annotationFromDraft({
        draft: { sectionId: 'hero-1', note: ' ' },
        sections: [section('hero-1')],
        existingAnnotations: [],
        nextStatus: 'open'
      }).error,
      'Write the annotation'
    );
  });

  it('upserts annotations without duplicating edited records', () => {
    const next = upsertAnnotation([annotation(), annotation({ id: 'a-2', note: 'Keep' })], annotation({ note: 'Updated' }));

    assert.equal(next.length, 2);
    assert.equal(next.find((item) => item.id === 'a-1')?.note, 'Updated');
  });

  it('builds deterministic patches for quoted direct edits', () => {
    assert.deepEqual(explicitAnnotationPatch(annotation({ note: 'Change title to "Better headline"' }), [section('hero-1')]), {
      title: 'Better headline'
    });
    assert.deepEqual(explicitAnnotationPatch(annotation({ note: 'Change button to "Book now"' }), [section('hero-1')]), {
      cta: { label: 'Book now', url: '#contact' }
    });
    assert.deepEqual(explicitAnnotationPatch(annotation({ note: 'Change text to "Sharper copy"' }), [section('hero-1')]), {
      body: 'Sharper copy'
    });
    assert.equal(explicitAnnotationPatch(annotation({ note: 'Make it more premium' }), [section('hero-1')]), null);
  });

  it('keeps the LLM instruction scoped to the annotated section', () => {
    const instruction = buildAnnotationInstruction(annotation({ sectionLabel: 'Pricing', note: 'Reduce to two plans.' }));

    assert.match(instruction, /Pricing/);
    assert.match(instruction, /Reduce to two plans/);
    assert.match(instruction, /directly to this section/);
  });
});
