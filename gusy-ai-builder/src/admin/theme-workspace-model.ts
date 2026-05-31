import type { UiLanguage } from './i18n';
import type { GusyThemeBusinessProfile, GusyThemeKit, GusyThemeLanguage } from './types';

export const THEME_PAGE_KEYS = ['home', 'offers', 'work', 'about', 'contact'];

export const THEME_PAGE_LABELS: Record<string, { en: string; fr: string }> = {
  home: { en: 'Home', fr: 'Accueil' },
  offers: { en: 'Offers', fr: 'Offres' },
  work: { en: 'Work', fr: 'Réalisations' },
  about: { en: 'About', fr: 'À propos' },
  contact: { en: 'Contact', fr: 'Contact' }
};

export type ThemeWorkspaceCopy = ReturnType<typeof themeWorkspaceCopy>;

export function visibleThemeKits(kits: GusyThemeKit[], language: GusyThemeLanguage): GusyThemeKit[] {
  return kits.filter((kit) => kit.language === language);
}

export function importedThemePageCount(kits: GusyThemeKit[]): number {
  return kits.reduce((count, kit) => count + kit.pages.filter((page) => page.id > 0).length, 0);
}

export function nextSelectedThemeKitId(kits: GusyThemeKit[], currentId: string): string {
  if (!kits.length) return '';
  return kits.some((kit) => kit.id === currentId) ? currentId : kits[0].id;
}

export function themeKitGallery(kit?: GusyThemeKit): Array<{ src: string; label: string }> {
  if (!kit) return [];
  return kit.gallery?.length ? kit.gallery : [{ src: kit.imageUrl, label: kit.brand || kit.name }];
}

export function themeKitPalette(kit?: GusyThemeKit): string[] {
  const tokenColors = kit?.tokens.colors;
  if (!tokenColors || typeof tokenColors !== 'object') return [];

  return Object.values(tokenColors as Record<string, unknown>)
    .filter((value): value is string => typeof value === 'string' && value.startsWith('#'))
    .slice(0, 5);
}

export function profileFromThemeKit(kit?: GusyThemeKit): GusyThemeBusinessProfile {
  const gallery = kit ? themeKitGallery(kit) : [];
  const profile = kit?.profile;

  return {
    businessName: profile?.businessName || kit?.brand || '',
    city: profile?.city || kit?.location || '',
    address: profile?.address || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    hours: profile?.hours || '',
    primaryAction: profile?.primaryAction || kit?.primary || '',
    secondaryAction: profile?.secondaryAction || kit?.secondary || '',
    heroTitle: profile?.heroTitle || kit?.title || '',
    heroBody: profile?.heroBody || kit?.body || '',
    menuPages: profile?.menuPages?.length ? profile.menuPages : THEME_PAGE_KEYS,
    offers: profile?.offers?.length ? profile.offers : [
      { title: '', body: '', label: '' },
      { title: '', body: '', label: '' },
      { title: '', body: '', label: '' }
    ],
    reviews: profile?.reviews?.length ? profile.reviews : [
      { quote: '', person: '', role: '' },
      { quote: '', person: '', role: '' },
      { quote: '', person: '', role: '' }
    ],
    heroImageUrl: profile?.heroImageUrl || gallery[0]?.src || kit?.imageUrl || '',
    offerImages: profile?.offerImages?.length ? profile.offerImages : gallery.slice(1, 4).map((image) => image.src),
    reviewImages: profile?.reviewImages?.length ? profile.reviewImages : gallery.slice(3, 6).map((image) => image.src)
  };
}

export function updateThemeProfileMenuPages(currentPages: string[], page: string, enabled: boolean): string[] {
  const next = enabled
    ? [...currentPages, page]
    : currentPages.filter((candidate) => candidate !== page);
  const menuPages = THEME_PAGE_KEYS.filter((candidate) => next.includes(candidate));
  return menuPages.length ? menuPages : ['home'];
}

export function themeWorkspaceCopy(uiLanguage: UiLanguage) {
  return uiLanguage === 'fr'
    ? {
      title: 'Thèmes Gusy',
      summary: 'démos métier',
      installedPages: 'pages installées',
      setHomepage: "Définir l'accueil",
      refresh: 'Actualiser',
      style: 'Style',
      density: 'Densité',
      buttons: 'Boutons',
      images: 'Images',
      importing: 'Importation',
      importFull: 'Importer le site',
      customizeFull: 'Créer le site personnalisé',
      homeOnly: 'Accueil seul',
      previewKit: 'Examiner',
      previewPage: 'Prévisualiser',
      installed: 'installée',
      notInstalled: 'à importer',
      includedPages: 'Pages incluses',
      mediaSet: 'Images incluses',
      palette: 'Palette',
      openHome: 'Ouvrir',
      view: 'Voir',
      editHome: "Modifier l'accueil",
      editWithGusy: 'Éditer avec Gusy',
      installToEdit: 'Installer pour éditer',
      pages: 'pages',
      photos: 'photos',
      readyFor: 'Pensé pour',
      noKits: 'Aucun kit disponible dans cette langue.',
      profile: 'Profil entreprise',
      navigation: 'Menu',
      offers: 'Offres',
      reviews: 'Avis clients',
      photosLabel: 'Photos',
      chooseImage: 'Choisir',
      preview: 'Prévisualisation',
      closePreview: 'Fermer',
      businessName: 'Nom',
      city: 'Ville',
      address: 'Adresse',
      phone: 'Téléphone',
      email: 'Email',
      hours: 'Horaires',
      heroTitle: 'Titre principal',
      heroBody: 'Texte principal',
      primaryAction: 'Action',
      secondaryAction: 'Action secondaire',
      offerTitle: 'Offre',
      offerBody: 'Détail',
      offerLabel: 'Prix',
      reviewQuote: 'Commentaire',
      reviewPerson: 'Prénom client',
      reviewRole: 'Contexte'
    }
    : {
      title: 'Gusy theme kits',
      summary: 'business demos',
      installedPages: 'installed pages',
      setHomepage: 'Set homepage',
      refresh: 'Refresh',
      style: 'Style',
      density: 'Density',
      buttons: 'Buttons',
      images: 'Images',
      importing: 'Importing',
      importFull: 'Import full site',
      customizeFull: 'Create tailored site',
      homeOnly: 'Home only',
      previewKit: 'Inspect',
      previewPage: 'Preview',
      installed: 'installed',
      notInstalled: 'to import',
      includedPages: 'Included pages',
      mediaSet: 'Included images',
      palette: 'Palette',
      openHome: 'Open',
      view: 'View',
      editHome: 'Edit home',
      editWithGusy: 'Edit with Gusy',
      installToEdit: 'Install to edit',
      pages: 'pages',
      photos: 'photos',
      readyFor: 'Built for',
      noKits: 'No kits available in this language.',
      profile: 'Business profile',
      navigation: 'Menu',
      offers: 'Offers',
      reviews: 'Customer reviews',
      photosLabel: 'Photos',
      chooseImage: 'Choose',
      preview: 'Preview',
      closePreview: 'Close',
      businessName: 'Name',
      city: 'City',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      hours: 'Hours',
      heroTitle: 'Main title',
      heroBody: 'Main text',
      primaryAction: 'Action',
      secondaryAction: 'Secondary action',
      offerTitle: 'Offer',
      offerBody: 'Detail',
      offerLabel: 'Price',
      reviewQuote: 'Review',
      reviewPerson: 'Customer name',
      reviewRole: 'Context'
    };
}
