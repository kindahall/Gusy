import type { UiLanguage } from './i18n';
import {
  THEME_PAGE_KEYS,
  THEME_PAGE_LABELS,
  type ThemeWorkspaceCopy,
  updateThemeProfileMenuPages
} from './theme-workspace-model';
import type { GusyThemeBusinessProfile } from './types';

type ThemeProfileImageKind = 'hero' | 'offer' | 'review';

export function ThemeProfileEditor(props: {
  copy: ThemeWorkspaceCopy;
  profile: GusyThemeBusinessProfile;
  uiLanguage: UiLanguage;
  onChange: (profile: GusyThemeBusinessProfile) => void;
  onChooseImage: (kind: ThemeProfileImageKind, index?: number) => void;
}) {
  function updateProfileField(key: keyof GusyThemeBusinessProfile, value: string) {
    props.onChange({ ...props.profile, [key]: value });
  }

  function updateOffer(index: number, key: keyof GusyThemeBusinessProfile['offers'][number], value: string) {
    const offers = [...props.profile.offers];
    offers[index] = { ...(offers[index] || { title: '', body: '', label: '' }), [key]: value };
    props.onChange({ ...props.profile, offers });
  }

  function updateReview(index: number, key: keyof GusyThemeBusinessProfile['reviews'][number], value: string) {
    const reviews = [...props.profile.reviews];
    reviews[index] = { ...(reviews[index] || { quote: '', person: '', role: '' }), [key]: value };
    props.onChange({ ...props.profile, reviews });
  }

  function updateImageList(key: 'offerImages' | 'reviewImages', index: number, value: string) {
    const images = [...(props.profile[key] || [])];
    images[index] = value;
    props.onChange({ ...props.profile, [key]: images });
  }

  function updateMenuPage(page: string, enabled: boolean) {
    props.onChange({
      ...props.profile,
      menuPages: updateThemeProfileMenuPages(props.profile.menuPages, page, enabled)
    });
  }

  return (
    <>
      <div className="gusy-theme-profile-grid">
        <label><span>{props.copy.businessName}</span><input value={props.profile.businessName} onChange={(event) => updateProfileField('businessName', event.target.value)} /></label>
        <label><span>{props.copy.city}</span><input value={props.profile.city} onChange={(event) => updateProfileField('city', event.target.value)} /></label>
        <label><span>{props.copy.address}</span><input value={props.profile.address} onChange={(event) => updateProfileField('address', event.target.value)} /></label>
        <label><span>{props.copy.phone}</span><input value={props.profile.phone} onChange={(event) => updateProfileField('phone', event.target.value)} /></label>
        <label><span>{props.copy.email}</span><input value={props.profile.email} onChange={(event) => updateProfileField('email', event.target.value)} /></label>
        <label><span>{props.copy.hours}</span><input value={props.profile.hours} onChange={(event) => updateProfileField('hours', event.target.value)} /></label>
        <label><span>{props.copy.primaryAction}</span><input value={props.profile.primaryAction} onChange={(event) => updateProfileField('primaryAction', event.target.value)} /></label>
        <label><span>{props.copy.secondaryAction}</span><input value={props.profile.secondaryAction} onChange={(event) => updateProfileField('secondaryAction', event.target.value)} /></label>
        <label className="is-wide"><span>{props.copy.heroTitle}</span><input value={props.profile.heroTitle} onChange={(event) => updateProfileField('heroTitle', event.target.value)} /></label>
        <label className="is-wide"><span>{props.copy.heroBody}</span><textarea value={props.profile.heroBody} rows={3} onChange={(event) => updateProfileField('heroBody', event.target.value)} /></label>
      </div>

      <div className="gusy-theme-menu-picker">
        <strong>{props.copy.navigation}</strong>
        <div>
          {THEME_PAGE_KEYS.map((page) => (
            <label key={page}>
              <input
                type="checkbox"
                checked={props.profile.menuPages.includes(page)}
                onChange={(event) => updateMenuPage(page, event.target.checked)}
              />
              <span>{THEME_PAGE_LABELS[page][props.uiLanguage]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="gusy-theme-edit-lists">
        <section>
          <strong>{props.copy.offers}</strong>
          {props.profile.offers.slice(0, 3).map((offer, index) => (
            <div className="gusy-theme-edit-row" key={`offer-${index}`}>
              <input aria-label={props.copy.offerTitle} value={offer.title} onChange={(event) => updateOffer(index, 'title', event.target.value)} />
              <input aria-label={props.copy.offerLabel} value={offer.label} onChange={(event) => updateOffer(index, 'label', event.target.value)} />
              <textarea aria-label={props.copy.offerBody} value={offer.body} rows={2} onChange={(event) => updateOffer(index, 'body', event.target.value)} />
            </div>
          ))}
        </section>
        <section>
          <strong>{props.copy.reviews}</strong>
          {props.profile.reviews.slice(0, 3).map((review, index) => (
            <div className="gusy-theme-edit-row" key={`review-${index}`}>
              <input aria-label={props.copy.reviewPerson} value={review.person} onChange={(event) => updateReview(index, 'person', event.target.value)} />
              <input aria-label={props.copy.reviewRole} value={review.role} onChange={(event) => updateReview(index, 'role', event.target.value)} />
              <textarea aria-label={props.copy.reviewQuote} value={review.quote} rows={2} onChange={(event) => updateReview(index, 'quote', event.target.value)} />
            </div>
          ))}
        </section>
      </div>

      <div className="gusy-theme-image-fields">
        <strong>{props.copy.photosLabel}</strong>
        <label className="is-wide">
          <span>Hero</span>
          {props.profile.heroImageUrl && <img src={props.profile.heroImageUrl} alt="" loading="lazy" />}
          <input value={props.profile.heroImageUrl || ''} onChange={(event) => updateProfileField('heroImageUrl', event.target.value)} />
          <button type="button" onClick={() => props.onChooseImage('hero')}>{props.copy.chooseImage}</button>
        </label>
        {(props.profile.offerImages || []).slice(0, 3).map((url, index) => (
          <label key={`offer-image-${index}`}>
            <span>{props.copy.offers} {index + 1}</span>
            {url && <img src={url} alt="" loading="lazy" />}
            <input value={url} onChange={(event) => updateImageList('offerImages', index, event.target.value)} />
            <button type="button" onClick={() => props.onChooseImage('offer', index)}>{props.copy.chooseImage}</button>
          </label>
        ))}
        {(props.profile.reviewImages || []).slice(0, 3).map((url, index) => (
          <label key={`review-image-${index}`}>
            <span>{props.copy.reviews} {index + 1}</span>
            {url && <img src={url} alt="" loading="lazy" />}
            <input value={url} onChange={(event) => updateImageList('reviewImages', index, event.target.value)} />
            <button type="button" onClick={() => props.onChooseImage('review', index)}>{props.copy.chooseImage}</button>
          </label>
        ))}
      </div>
    </>
  );
}
