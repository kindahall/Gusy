import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sectionIcon } from '../src/admin/section-renderer';
import type { GusySection } from '../src/admin/types';

function section(type: string, label = type): GusySection {
  return {
    id: type,
    type,
    variant: 'default',
    label,
    kicker: '',
    title: label,
    body: '',
    items: [],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      mobileStack: true
    }
  };
}

describe('Gusy section renderer', () => {
  it('maps section types to stable canvas icons', () => {
    assert.equal(sectionIcon(section('hero')), 'H');
    assert.equal(sectionIcon(section('features')), 'F');
    assert.equal(sectionIcon(section('pricing')), '$');
    assert.equal(sectionIcon(section('faq')), '?');
    assert.equal(sectionIcon(section('form')), 'I');
    assert.equal(sectionIcon(section('custom', 'Blocks')), 'B');
  });

  it('keeps CTA labels editable in the visual editor source', () => {
    const source = readFileSync(new URL('../src/admin/section-renderer.tsx', import.meta.url), 'utf8');

    assert.match(source, /const ctaText =/);
    assert.match(source, /function EditableButton/);
    assert.match(source, /data-gusy-editable-button/);
    assert.match(source, /querySelector<HTMLElement>\('\[data-gusy-editable="true"\]'\)/);
    assert.match(source, /onCommit=\{ctaText\('label'\)\}/);
    assert.match(source, /onCommit=\{ctaText\('secondaryLabel'\)\}/);
  });

  it('keeps form fields editable instead of rendering static mock labels', () => {
    const source = readFileSync(new URL('../src/admin/section-renderer.tsx', import.meta.url), 'utf8');

    assert.match(source, /function formFields/);
    assert.match(source, /DEFAULT_FORM_FIELDS/);
    assert.match(source, /tag="i"/);
    assert.match(source, /onCommit=\{itemText\(itemIndex, 'title'\)\}/);
    assert.doesNotMatch(source, /<i>Name<\/i>/);
    assert.doesNotMatch(source, /<i>Email<\/i>/);
    assert.doesNotMatch(source, /<i>Project<\/i>/);
  });

  it('keeps motion controls connected to persisted section settings', () => {
    const source = readFileSync(new URL('../src/admin/inspector-panels.tsx', import.meta.url), 'utf8');

    assert.match(source, /motionEnabled/);
    assert.match(source, /motionEntrance/);
    assert.match(source, /motionDuration/);
    assert.doesNotMatch(source, /defaultValue=/);
  });
});
