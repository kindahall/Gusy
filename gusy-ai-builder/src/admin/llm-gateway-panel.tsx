import { PanelSection, UpgradeNotice } from './components';
import { LLM_PROVIDER_DEFAULTS, LLM_PROVIDER_LABELS } from './llm';
import type { GusyLLMDraft, GusyLLMSettings } from './types';

export function LLMGatewayPanel(props: {
  settings: GusyLLMSettings;
  draft: GusyLLMDraft;
  busy: boolean;
  status: string;
  onChange: (patch: Partial<GusyLLMDraft>) => void;
  onSave: () => void;
  onTest: () => void;
  locked?: boolean;
  onUpgrade?: () => void;
}) {
  function changeProvider(provider: GusyLLMSettings['provider']) {
    props.onChange({
      provider,
      baseUrl: LLM_PROVIDER_DEFAULTS[provider].baseUrl,
      model: LLM_PROVIDER_DEFAULTS[provider].model,
      apiKey: provider === 'codex' ? '' : props.draft.apiKey,
      clearApiKey: provider === 'codex'
    });
  }

  const isCodex = props.draft.provider === 'codex';
  const activeProviderLabel = LLM_PROVIDER_LABELS[props.settings.provider] ?? props.settings.provider;

  if (props.locked) {
    return (
      <PanelSection title="AI Connection">
        <UpgradeNotice
          title="LLM Gateway is Pro"
          body="Use OpenAI, Claude, Gemini, compatible gateways or Codex with the paid add-on."
          onUpgrade={props.onUpgrade || (() => undefined)}
        />
      </PanelSection>
    );
  }

  return (
    <PanelSection title="AI Connection">
      <div className="gusy-llm-state" data-ready={props.settings.configured ? 'true' : 'false'}>
        <strong>{props.settings.configured ? 'Connected' : 'Not connected'}</strong>
        <span>{activeProviderLabel} / {props.settings.model}</span>
      </div>
      <label className="gusy-switch-row">
        <span>Enabled</span>
        <input type="checkbox" checked={props.draft.enabled} onChange={(event) => props.onChange({ enabled: event.target.checked })} />
      </label>
      <label>
        <span>Provider</span>
        <select
          value={props.draft.provider}
          onChange={(event) => changeProvider(event.target.value as GusyLLMSettings['provider'])}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic Claude</option>
          <option value="gemini">Google Gemini</option>
          <option value="openai-compatible">OpenAI Compatible</option>
          <option value="gateway">LLM Gateway</option>
          <option value="codex">OpenAI Codex</option>
        </select>
      </label>
      <label>
        <span>{isCodex ? 'Codex CLI' : 'Base URL'}</span>
        <input
          value={props.draft.baseUrl}
          placeholder={isCodex ? 'codex or /Applications/Codex.app/Contents/Resources/codex' : 'https://api.example.com/v1'}
          onChange={(event) => props.onChange({ baseUrl: event.target.value })}
        />
      </label>
      <label>
        <span>Model</span>
        <input value={props.draft.model} onChange={(event) => props.onChange({ model: event.target.value })} />
      </label>
      {isCodex ? (
        <div className="gusy-codex-auth">
          <span>Auth</span>
          <strong>Codex login</strong>
          <button type="button" onClick={() => props.onChange({ baseUrl: LLM_PROVIDER_DEFAULTS.codex.baseUrl })}>Use Mac app</button>
        </div>
      ) : (
        <>
          <label>
            <span>API Key</span>
            <input
              type="password"
              value={props.draft.apiKey}
              placeholder={props.settings.hasApiKey ? props.settings.apiKeyPreview : 'sk-...'}
              onChange={(event) => props.onChange({ apiKey: event.target.value, clearApiKey: false })}
            />
          </label>
          {props.settings.hasApiKey && (
            <label className="gusy-switch-row">
              <span>Clear saved key</span>
              <input type="checkbox" checked={Boolean(props.draft.clearApiKey)} onChange={(event) => props.onChange({ clearApiKey: event.target.checked, apiKey: '' })} />
            </label>
          )}
        </>
      )}
      <label>
        <span>Timeout</span>
        <input type="number" min="10" max="120" value={props.draft.timeout} onChange={(event) => props.onChange({ timeout: Number(event.target.value) })} />
      </label>
      <div className="gusy-panel-actions">
        <button type="button" className="gusy-primary-wide" onClick={props.onSave} disabled={props.busy}>Save</button>
        <button type="button" onClick={props.onTest} disabled={props.busy}>Test</button>
      </div>
      <small className="gusy-panel-note">{props.busy ? 'Working' : props.status}</small>
    </PanelSection>
  );
}
