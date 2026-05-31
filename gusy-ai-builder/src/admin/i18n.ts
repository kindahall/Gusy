import { useEffect } from 'react';
import type { GusySettings } from './types';

export type UiLanguage = 'en' | 'fr';

export const UI_LANGUAGE_KEY = 'gusy.builder.ui.language.v2';

const FR_UI_TRANSLATIONS: Record<string, string> = {
  Ready: 'Prêt',
  Connected: 'Connecté',
  'Not connected': 'Non connecté',
  Working: 'En cours',
  Restored: 'Restauré',
  Redone: 'Rétabli',
  Updated: 'Mis à jour',
  'Page settings': 'Réglages de page',
  'Saving name': 'Nom enregistré',
  Pages: 'Pages',
  Start: 'Démarrer',
  Themes: 'Thèmes',
  'Theme kits': 'Thèmes',
  Blocks: 'Sections de page',
  'Add blocks': 'Ajouter',
  Layers: 'Modifier',
  Edit: 'Modifier',
  Brand: 'Marque',
  Design: 'Design',
  Audit: 'Audit',
  Export: 'Export',
  Backup: 'Sauvegarde',
  Migrate: 'Migrer',
  Import: 'Importer',
  Publish: 'Publier',
  Advanced: 'Avancé',
  Settings: 'Réglages',
  Undo: 'Annuler',
  Redo: 'Rétablir',
  View: 'Voir',
  Annotate: 'Annoter',
  'Save Draft': 'Enregistrer le brouillon',
  Agent: 'Agent',
  Assistant: 'Assistant',
  Commands: 'Commandes',
  'Publish to WordPress': 'Publier dans WordPress',
  Desktop: 'Ordinateur',
  Tablet: 'Tablette',
  Mobile: 'Mobile',
  'Desktop preview': 'Aperçu ordinateur',
  'Tablet preview': 'Aperçu tablette',
  'Mobile preview': 'Aperçu mobile',
  'Preview device': 'Appareil de prévisualisation',
  'Interface language': "Langue de l'interface",
  'Open pages': 'Ouvrir les pages',
  'Open theme kits': 'Ouvrir les thèmes',
  'Saved pages': 'Pages enregistrées',
  'No pages yet.': 'Aucune page pour le moment.',
  Revisions: 'Revisions',
  Latest: 'Dernière',
  'Create snapshot': 'Créer un instantané',
  Sections: 'Sections',
  Types: 'Types',
  Issues: 'Problèmes',
  'Run Audit': "Lancer l'audit",
  Report: 'Rapport',
  Content: 'Contenu',
  Style: 'Style',
  Layout: 'Mise en page',
  Motion: 'Mouvement',
  'Page editor': 'Éditeur de page',
  Canvas: 'Éditeur de page',
  'Gusy Base Theme': 'Thème de base Gusy',
  'Set homepage': "Définir l'accueil",
  'Theme settings saved': 'Réglages du thème enregistrés',
  'Theme settings failed': 'Erreur de réglages du thème',
  'Theme kits unavailable': 'Thèmes indisponibles',
  'Could not load theme kits': 'Chargement des thèmes impossible',
  'Import full site': 'Importer le site',
  'Home only': 'Accueil seul',
  'Importing': 'Importation',
  'Refresh': 'Actualiser',
  'Density': 'Densité',
  'Buttons': 'Boutons',
  'Images': 'Images',
  installed: 'installées',
  pages: 'pages',
  photos: 'photos',
  Elementor: 'Elementor',
  'Start building': 'Commencer',
  'Page ready': 'Page prête',
  'Continue your site': 'Continuer le site',
  'Start with a professional base': 'Partir d’une base pro',
  'Open canvas': 'Modifier la page',
  'Edit page': 'Modifier la page',
  'Add section': 'Ajouter une section',
  'Add sections': 'Ajouter des sections',
  'Change theme': 'Changer de thème',
  'Improve with AI': "Améliorer avec l'IA",
  Regenerate: 'Régénérer',
  Build: 'Construire',
  'Build with AI': "Créer avec l'IA",
  'Import Elementor': 'Importer Elementor',
  'Create page': 'Créer la page',
  'Build Page': 'Créer la page',
  'Create with AI': "Créer avec l'IA",
  'Blank page': 'Page vierge',
  'Blank canvas': 'Page vierge',
  'Annotate canvas': 'Annoter la page',
  'Add page notes': 'Ajouter des notes',
  'Load saved pages': 'Charger les pages',
  'Open blocks': 'Ajouter des sections',
  'Open layers': 'Modifier la page',
  'Open brand kit': 'Ouvrir le style',
  'Open site style': 'Ouvrir le style',
  'Run audit': "Lancer l'audit",
  'Export JSON': 'Exporter JSON',
  'Scan Elementor': 'Scanner Elementor',
  'Save draft': 'Enregistrer le brouillon',
  Header: 'Navigation',
  Hero: 'Hero',
  Services: 'Services',
  Pricing: 'Tarifs',
  Form: 'Formulaire',
  FAQ: 'FAQ',
  'AI Block': 'Bloc IA',
  All: 'Tous',
  Navigation: 'Navigation',
  Product: 'Produit',
  Conversion: 'Conversion',
  Trust: 'Preuve',
  Commerce: 'Commerce',
  Local: 'Local',
  Support: 'Support',
  Media: 'Media',
  'Search blocks...': 'Rechercher des blocs...',
  'Site style': 'Style du site',
  'Brand Kit': 'Style du site',
  'Save style': 'Enregistrer le style',
  'Save Kit': 'Enregistrer le style',
  'Use theme style': 'Utiliser le thème',
  'Use Theme': 'Utiliser le thème',
  'AI style': 'Style IA',
  'AI Kit': 'Style IA',
  'Page empty': 'Page vide',
  'Section library': 'Bibliothèque de sections',
  'Add Sections': 'Ajouter des sections',
  'Edit Page': 'Modifier la page',
  'Build Site Style': 'Créer le style du site',
  Presets: 'Présélections',
  Colors: 'Couleurs',
  Type: 'Typo',
  Shape: 'Forme',
  Spacing: 'Espacement',
  Preview: 'Aperçu',
  Home: 'Accueil',
  Proof: 'Preuve',
  Launch: 'Lancement',
  'Choose a base': 'Choisir une base',
  'Edit content': 'Modifier le contenu',
  'Check quality': 'Vérifier',
  'Choose theme': 'Choisir un thème',
  'Run check': 'Vérifier',
  Published: 'Publié',
  'Launch a page that feels native to this site.': 'Lancer une page qui semble native pour ce site.',
  'Gusy Agent': 'Agent Gusy',
  'Gusy Assistant': 'Assistant Gusy',
  'No project memory yet': 'Aucune mémoire projet',
  'Thinking...': 'Réflexion...',
  Apply: 'Appliquer',
  Cancel: 'Annuler',
  Send: 'Envoyer',
  Shorten: 'Raccourcir',
  Tone: 'Ton',
  Scan: 'Scanner',
  Finish: 'Finaliser',
  Kit: 'Kit',
  Theme: 'Theme',
  Improve: 'Ameliorer',
  'Ask about Gusy...': 'Demander a Gusy...',
  'Describe the brand to generate...': 'Décrivez la marque à générer...',
  'Change the selected section...': 'Modifiez la section sélectionnée...',
  'Tell Gusy what to build or fix...': 'Dites à Gusy quoi créer ou corriger...',
  'Ask me what to do next in Gusy. I can guide setup, blocks, audit, migration, export and publishing.': "Demandez-moi quoi faire ensuite dans Gusy. Je peux guider la configuration, les blocs, l'audit, la migration, l'export et la publication."
};

const EN_UI_TRANSLATIONS = Object.entries(FR_UI_TRANSLATIONS).reduce(
  (translations, [english, french]) => {
    translations[french] ||= english;
    return translations;
  },
  {} as Record<string, string>
);

export function normalizeUiLanguage(locale?: string): UiLanguage {
  return locale?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function getInitialUiLanguage(_settings: GusySettings): UiLanguage {
  try {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(UI_LANGUAGE_KEY);
      if (stored === 'en' || stored === 'fr') return stored;
    }
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }

  return 'en';
}

export function translateUiValue(value: string, language: UiLanguage): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const dictionary = language === 'fr' ? FR_UI_TRANSLATIONS : EN_UI_TRANSLATIONS;
  let translated = dictionary[trimmed];

  if (!translated && language === 'fr' && trimmed.startsWith('Annotate ')) {
    translated = `Annoter ${trimmed.slice('Annotate '.length)}`;
  }
  if (!translated && language === 'en' && trimmed.startsWith('Annoter ')) {
    translated = `Annotate ${trimmed.slice('Annoter '.length)}`;
  }

  return translated ? value.replace(trimmed, translated) : value;
}

function translateUiRoot(root: HTMLElement, language: UiLanguage): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let current = walker.nextNode();

  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach((node) => {
    const next = translateUiValue(node.nodeValue || '', language);
    if (next !== node.nodeValue) node.nodeValue = next;
  });

  root.querySelectorAll<HTMLElement>('[placeholder], [title], [aria-label]').forEach((element) => {
    (['placeholder', 'title', 'aria-label'] as const).forEach((attribute) => {
      const currentValue = element.getAttribute(attribute);
      if (!currentValue) return;
      const next = translateUiValue(currentValue, language);
      if (next !== currentValue) element.setAttribute(attribute, next);
    });
  });
}

export function useUiTranslation(language: UiLanguage): void {
  useEffect(() => {
    const root = document.getElementById('gusy-app');
    if (!root) return;

    let frame = 0;
    const apply = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        translateUiRoot(root, language);
        frame = 0;
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language]);
}
