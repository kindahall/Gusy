import { useEffect, useState } from 'react';
import { cleanPageSlug, cleanPageTitle, nextSlugAfterTitleChange, pageNameChanged } from './page-name-model';

export function PageNameEditor(props: {
  title: string;
  slug: string;
  busy: boolean;
  isSaved: boolean;
  onDraftChange: (title: string, slug?: string) => void;
  onSave: (title: string, slug?: string) => void;
}) {
  const [title, setTitle] = useState(props.title);
  const [slug, setSlug] = useState(props.slug);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    setTitle(props.title);
    setSlug(props.slug);
    setSlugTouched(false);
  }, [props.title, props.slug]);

  function changeTitle(value: string) {
    const nextSlug = nextSlugAfterTitleChange(value, slug, slugTouched);
    setTitle(value);
    setSlug(nextSlug);
    props.onDraftChange(cleanPageTitle(value), cleanPageSlug(nextSlug, value));
  }

  const cleanTitle = cleanPageTitle(title);
  const cleanSlug = cleanPageSlug(slug, title);
  const changed = pageNameChanged(props.title, props.slug, title, slug);

  return (
    <div className="gusy-page-name-editor">
      <label>
        <span>Page name</span>
        <input
          type="text"
          value={title}
          onChange={(event) => changeTitle(event.target.value)}
          onBlur={() => {
            if (!title.trim()) {
              changeTitle('Untitled page');
            }
          }}
        />
      </label>
      <label>
        <span>Slug</span>
        <input
          type="text"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            const nextSlug = event.target.value;
            setSlug(nextSlug);
            props.onDraftChange(cleanTitle, cleanPageSlug(nextSlug, title));
          }}
          onBlur={() => {
            setSlug(cleanSlug);
            props.onDraftChange(cleanTitle, cleanSlug);
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          props.onDraftChange(cleanTitle, cleanSlug);
          props.onSave(cleanTitle, cleanSlug);
        }}
        disabled={props.busy || !cleanTitle || (props.isSaved && !changed)}
      >
        {props.isSaved ? 'Save name' : 'Save page'}
      </button>
    </div>
  );
}
