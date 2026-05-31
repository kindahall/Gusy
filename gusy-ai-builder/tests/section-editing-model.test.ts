import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addBlueprintSectionItem,
  duplicateBlueprintSectionItem,
  duplicateBlueprintSection,
  moveBlueprintSectionItem,
  patchBlueprintSection,
  patchBlueprintSectionItem,
  patchBlueprintSectionSettings,
  removeBlueprintSection,
  removeBlueprintSectionItem
} from '../src/admin/section-editing-model';
import type { GusyBlueprint, GusySection } from '../src/admin/types';

function section(id: string, type = 'features'): GusySection {
  return {
    id,
    type,
    variant: 'default',
    label: id,
    kicker: '',
    title: id,
    body: '',
    items: [
      { label: '01', title: 'First', body: 'One' },
      { label: '02', title: 'Second', body: 'Two' }
    ],
    settings: {
      background: 'plain',
      spacing: 'lg',
      columns: 2,
      accent: 'accent',
      width: 'wide',
      mobileStack: true
    }
  };
}

function blueprint(): GusyBlueprint {
  return {
    schemaVersion: '1.0',
    page: {
      title: 'Page',
      slug: 'page',
      language: 'en',
      seo: {
        metaTitle: 'Page',
        metaDescription: ''
      },
      designSystem: {},
      sections: [section('hero', 'hero'), section('features'), section('faq', 'faq'), section('header', 'header')]
    }
  };
}

describe('Gusy section editing model', () => {
  it('patches section fields and settings without mutating the source blueprint', () => {
    const source = blueprint();
    const patched = patchBlueprintSection(source, 'features', { title: 'Updated' });
    const styled = patchBlueprintSectionSettings(source, 'features', { background: 'soft', columns: 3 });

    assert.equal(source.page.sections[1].title, 'features');
    assert.equal(patched.page.sections[1].title, 'Updated');
    assert.equal(source.page.sections[1].settings.background, 'plain');
    assert.deepEqual(styled.page.sections[1].settings, {
      ...source.page.sections[1].settings,
      background: 'soft',
      columns: 3
    });
  });

  it('edits, adds and removes section items immutably', () => {
    const source = blueprint();
    const edited = patchBlueprintSectionItem(source, 'features', 1, { title: 'Changed' });
    const added = addBlueprintSectionItem(source, 'features');
    const addedFaq = addBlueprintSectionItem(source, 'faq');
    const addedHeader = addBlueprintSectionItem(source, 'header');
    const removed = removeBlueprintSectionItem(source, 'features', 0);
    const duplicatedItem = duplicateBlueprintSectionItem(source, 'features', 0);
    const unchangedDuplicate = duplicateBlueprintSectionItem(source, 'features', 99);
    const movedDown = moveBlueprintSectionItem(source, 'features', 0, 1);
    const movedUp = moveBlueprintSectionItem(source, 'features', 1, -1);
    const unchanged = moveBlueprintSectionItem(source, 'features', 0, -1);

    assert.equal(source.page.sections[1].items[1].title, 'Second');
    assert.equal(edited.page.sections[1].items[1].title, 'Changed');
    assert.equal(added.page.sections[1].items.length, 3);
    assert.deepEqual(added.page.sections[1].items[2], {
      label: '03',
      title: 'New item',
      body: 'Add a concrete benefit.'
    });
    assert.deepEqual(addBlueprintSectionItem(source, 'hero').page.sections[0].items[2], {
      label: 'Proof',
      title: 'New proof point',
      body: ''
    });
    const oneSection = (type: string) => ({
      ...source,
      page: { ...source.page, sections: [section(type, type)] }
    });
    assert.deepEqual(addBlueprintSectionItem(oneSection('pricing'), 'pricing').page.sections[0].items[2], {
      label: 'From EUR99',
      title: 'New offer',
      body: 'Describe what is included.'
    });
    assert.deepEqual(addBlueprintSectionItem(oneSection('testimonials'), 'testimonials').page.sections[0].items[2], {
      label: 'Client context',
      title: '"Add a credible customer quote."',
      body: 'Customer name'
    });
    assert.deepEqual(addBlueprintSectionItem(oneSection('logos'), 'logos').page.sections[0].items[2], {
      label: 'Logo',
      title: 'New partner',
      body: ''
    });
    assert.deepEqual(addedFaq.page.sections[2].items[2], {
      label: 'Question',
      title: 'New question',
      body: 'Add a helpful answer.'
    });
    assert.deepEqual(addedHeader.page.sections[3].items[2], {
      label: 'Link',
      title: 'New link',
      body: '#section'
    });
    assert.deepEqual(removed.page.sections[1].items.map((item) => item.title), ['Second']);
    assert.deepEqual(duplicatedItem.page.sections[1].items.map((item) => item.title), ['First', 'First', 'Second']);
    assert.deepEqual(unchangedDuplicate.page.sections[1].items.map((item) => item.title), ['First', 'Second']);
    assert.deepEqual(movedDown.page.sections[1].items.map((item) => item.title), ['Second', 'First']);
    assert.deepEqual(movedUp.page.sections[1].items.map((item) => item.title), ['Second', 'First']);
    assert.deepEqual(unchanged.page.sections[1].items.map((item) => item.title), ['First', 'Second']);
  });

  it('duplicates and removes sections while returning stable selection targets', () => {
    const source = blueprint();
    const duplicated = duplicateBlueprintSection(source, 'features', 'features-copy');
    const removed = removeBlueprintSection(source, 'hero');
    const missingDuplicate = duplicateBlueprintSection(source, 'missing', 'copy');

    assert.equal(duplicated.duplicatedId, 'features-copy');
    assert.deepEqual(duplicated.blueprint.page.sections.map((item) => item.id), ['hero', 'features', 'features-copy', 'faq', 'header']);
    assert.equal(duplicated.blueprint.page.sections[2].title, 'features');
    assert.deepEqual(source.page.sections.map((item) => item.id), ['hero', 'features', 'faq', 'header']);
    assert.deepEqual(removed.blueprint.page.sections.map((item) => item.id), ['features', 'faq', 'header']);
    assert.equal(removed.nextSelectedId, 'features');
    assert.equal(missingDuplicate.duplicatedId, null);
    assert.equal(missingDuplicate.blueprint, source);
  });
});
