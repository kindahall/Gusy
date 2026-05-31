export type GusyItem = {
  title: string;
  body: string;
  label?: string;
  image?: GusyBackgroundImage;
};

export type Device = 'desktop' | 'tablet' | 'mobile';
export type InspectorTab = 'content' | 'style' | 'layout' | 'motion';
export type LeftTab = 'pages' | 'themes' | 'blocks' | 'layers' | 'brand' | 'audit' | 'export' | 'migrate';
export type DropPlacement = 'before' | 'after';

export type ExportRecord = {
  name: string;
  type: string;
  destination: string;
  date: string;
  payload?: string;
};

export type AgentMessage = {
  id: string;
  role: 'user' | 'agent';
  text: string;
  actions?: GusyAgentAction[];
};

export type PendingAgentAction = {
  action: GusyAgentAction;
  summary: string;
};

export type CanvasMenuState = {
  x: number;
  y: number;
  sectionId?: string;
};

export type GusyAnnotation = {
  id: string;
  sectionId: string;
  sectionLabel: string;
  note: string;
  status: 'open' | 'applied';
  createdAt: string;
  updatedAt?: string;
};

export type AnnotationDraft = {
  id?: string;
  sectionId: string;
  note: string;
};

export type GusyBackgroundImage = {
  id: number;
  url: string;
  alt?: string;
  title?: string;
};

export type GusyBackgroundVideo = {
  id: number;
  url: string;
  title?: string;
  poster?: string;
  mime?: string;
};

export type GusySection = {
  id: string;
  type: string;
  variant: string;
  label: string;
  intent?: string;
  kicker: string;
  title: string;
  body: string;
  cta?: {
    label?: string;
    url?: string;
    secondaryLabel?: string;
    secondaryUrl?: string;
  };
  items: GusyItem[];
  settings: {
    background: string;
    spacing: string;
    columns: number;
    tabletColumns?: number;
    mobileColumns?: number;
    accent?: string;
    width?: string;
    textAlign?: 'left' | 'center' | 'right';
    headingScale?: 'compact' | 'standard' | 'display';
    textWidth?: 'narrow' | 'standard' | 'wide';
    bodyScale?: 'compact' | 'standard' | 'large';
    buttonStyle?: 'solid' | 'soft' | 'outline';
    buttonSize?: 'sm' | 'md' | 'lg';
    buttonShape?: 'pill' | 'rounded' | 'square';
    imageAspect?: 'landscape' | 'portrait' | 'square';
    imagePosition?: 'center' | 'top' | 'bottom';
    imageShape?: 'rounded' | 'square' | 'soft';
    backgroundImage?: GusyBackgroundImage;
    backgroundVideo?: GusyBackgroundVideo;
    videoMode?: 'inline' | 'background';
    mobileStack: boolean;
    interactive?: boolean;
    motionEnabled?: boolean;
    motionEntrance?: 'fade-up' | 'scale-in' | 'slide-in';
    motionDuration?: number;
  };
  notes?: string[];
};

export type GusyBlueprint = {
  schemaVersion: string;
  page: {
    title: string;
    slug: string;
    language: string;
    seo: {
      metaTitle: string;
      metaDescription: string;
      schemaJsonLd?: Record<string, unknown>;
    };
    designSystem: Record<string, unknown>;
    sections: GusySection[];
  };
};

export type GusyTemplate = {
  id: string;
  category: string;
  title: string;
  type: string;
  variant: string;
  intent: string;
  preview: string;
  section: GusySection;
};

export type GusyThemeLanguage = 'en' | 'fr';

export type GusyThemeKitPage = {
  type: string;
  label: string;
  slug: string;
  id: number;
  viewLink?: string;
  editLink?: string;
};

export type GusyThemeOffer = {
  title: string;
  body: string;
  label: string;
};

export type GusyThemeReview = {
  quote: string;
  person: string;
  role: string;
};

export type GusyThemeBusinessProfile = {
  businessName: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  primaryAction: string;
  secondaryAction: string;
  heroTitle: string;
  heroBody: string;
  menuPages: string[];
  offers: GusyThemeOffer[];
  reviews: GusyThemeReview[];
  heroImageUrl?: string;
  offerImages?: string[];
  reviewImages?: string[];
};

export type GusyThemeKit = {
  id: string;
  slug: string;
  language: GusyThemeLanguage;
  name: string;
  brand: string;
  title: string;
  body: string;
  location: string;
  primary: string;
  secondary: string;
  imageUrl: string;
  isPro?: boolean;
  locked?: boolean;
  gallery: Array<{
    src: string;
    label: string;
  }>;
  imageCount: number;
  pages: GusyThemeKitPage[];
  profile?: GusyThemeBusinessProfile;
  tokens: Record<string, unknown>;
};

export type GusyThemeSettings = {
  activeKit: string;
  language: GusyThemeLanguage;
  styleVariation: 'editorial' | 'luxe' | 'clean' | 'warm' | 'bold';
  density: 'compact' | 'comfortable' | 'editorial';
  buttonStyle: 'solid' | 'soft' | 'outline';
  imageTone: 'natural' | 'bright' | 'warm' | 'contrast';
  setHomeOnImport: boolean;
};

export type GusyThemeKitResponse = {
  available: boolean;
  message?: string;
  kits: GusyThemeKit[];
  settings: GusyThemeSettings;
};

export type GusyThemeImportResponse = {
  kit: GusyThemeKit;
  pages: Array<{
    id: number;
    type: string;
    title: string;
    viewLink?: string;
    editLink?: string;
    status: string;
  }>;
  settings: GusyThemeSettings;
};

export type GusyThemePreviewResponse = {
  kit: GusyThemeKit;
  page: {
    type: string;
    title: string;
    slug: string;
  };
  blueprint: GusyBlueprint;
  blockContent: string;
};

export type GusyThemeCustomizeResponse = GusyThemeImportResponse & {
  profile: GusyThemeBusinessProfile;
};

export type GusySettings = {
  restBase: string;
  nonce: string;
  templates: GusyTemplate[];
  brandKit: Record<string, unknown>;
  siteName: string;
  adminUrl: string;
  canPublish: boolean;
  pluginVersion: string;
  plan?: 'free' | 'pro';
  isPro?: boolean;
  features?: Record<string, boolean>;
  upgradeUrl?: string;
  locale?: string;
  initialPostId?: number | string;
  initialEdit?: boolean;
  llm?: GusyLLMSettings;
};

export type GusyLLMSettings = {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'gemini' | 'openai-compatible' | 'gateway' | 'codex';
  baseUrl: string;
  model: string;
  timeout: number;
  hasApiKey: boolean;
  apiKeyPreview: string;
  configured: boolean;
};

export type GusyLLMDraft = GusyLLMSettings & {
  apiKey: string;
  clearApiKey?: boolean;
};

declare global {
  interface Window {
    GusyBuilderSettings?: GusySettings;
    wp?: {
      media?: (options: {
        title?: string;
        button?: { text?: string };
        library?: { type?: string };
        multiple?: boolean;
      }) => {
        on: (event: string, callback: () => void) => void;
        open: () => void;
        state: () => {
          get: (key: 'selection') => {
            first: () => {
              toJSON: () => {
                id?: number;
                url?: string;
                alt?: string;
                title?: string;
                sizes?: Record<string, { url?: string }>;
              };
            } | undefined;
          };
        };
      };
    };
  }
}

export type GusySavedPage = {
  id: number;
  title: string;
  status: string;
  modifiedAt: string;
  editLink?: string;
  previewLink?: string;
  viewLink?: string;
};

export type GusyRevision = {
  id: number;
  title: string;
  createdAt: string;
  sectionCount: number;
  blueprint: GusyBlueprint;
};

export type GusyAudit = {
  summary: Record<string, string>;
  issues: string[];
  sectionCount: number;
  types: string[];
  score: number;
};

export type GusyElementorPage = {
  id: number;
  title: string;
  type: string;
  status: string;
  modifiedAt: string;
  editLink?: string;
  viewLink?: string;
  hasElementorData: boolean;
  source?: 'elementor' | 'wordpress';
  compatibility?: number;
  textCount?: number;
  widgetCount?: number;
  warnings?: string[];
};

export type MigrationPreview = {
  pageId: number;
  title: string;
  source: 'elementor' | 'wordpress';
  compatibility: number;
  textCount: number;
  widgetCount: number;
  warnings: string[];
  blueprint: GusyBlueprint;
  audit: GusyAudit;
  viewLink?: string;
  editLink?: string;
};

export type GusyAgentAction = {
  type: 'open_tab' | 'open_page_settings' | 'scan_elementor' | 'run_audit' | 'save_draft' | 'publish' | 'generate_page' | 'create_section' | 'transform_selected' | 'update_selected_style' | 'move_selected' | 'apply_theme_tokens' | 'start_mission' | 'finish_page' | 'save_project_memory' | 'build_brand_kit' | 'generate_local_seo' | 'critique_page' | 'preview_first_elementor' | 'set_homepage';
  target?: string;
  label: string;
  prompt?: string;
  sectionType?: string;
  direction?: 'up' | 'down';
  settings?: Partial<GusySection['settings']>;
};

export type GusyAgentResponse = {
  reply: string;
  intent: string;
  actions: GusyAgentAction[];
  source?: {
    type: string;
  };
};

export type GusyAgentContext = {
  activeTab: LeftTab;
  pageTitle: string;
  sectionCount: number;
  selectedType: string;
  auditScore: number;
  llmConfigured: boolean;
  canPublish: boolean;
  postId: number;
  memory: GusyAgentMemory;
};

export type GusyThemeContext = {
  name: string;
  template: string;
  stylesheet: string;
  version: string;
  blockTheme: boolean;
  tokens: Record<string, unknown>;
};

export type GusyAgentMemory = {
  business: string;
  audience: string;
  offer: string;
  tone: string;
  localMarket: string;
  brandVoice: string;
  primaryGoal: string;
  keywords: string[];
  notes: string;
  lastUpdatedAt?: string;
};
