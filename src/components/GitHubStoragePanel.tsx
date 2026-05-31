import { Download, Github, LogOut, Settings, Upload } from 'lucide-react';
import type { GitHubStorageConfig } from '../types';

type GitHubStoragePanelProps = {
  config: GitHubStorageConfig;
  token: string;
  isOpen: boolean;
  isBusy: boolean;
  canSync: boolean;
  isDirty: boolean;
  storageStatus: string;
  onToggle: () => void;
  onConfigChange: (config: GitHubStorageConfig) => void;
  onTokenChange: (token: string) => void;
  onLoad: () => void;
  onSave: () => void;
  onDisconnect: () => void;
};

export function GitHubStoragePanel({
  config,
  token,
  isOpen,
  isBusy,
  canSync,
  isDirty,
  storageStatus,
  onToggle,
  onConfigChange,
  onTokenChange,
  onLoad,
  onSave,
  onDisconnect,
}: GitHubStoragePanelProps) {
  return (
    <section className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className="secondary-button min-w-0 flex-1 justify-start sm:flex-none" type="button" onClick={onToggle}>
          <Github size={18} />
          GitHub Storage
          {isDirty && <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">Unsaved</span>}
        </button>

        <div className="flex items-center gap-2">
          <button className="icon-button" type="button" onClick={onToggle} title="Storage settings">
            <Settings size={18} />
          </button>
          <button className="icon-button" type="button" onClick={onLoad} disabled={!canSync || isBusy} title="Load from GitHub">
            <Download size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onSave}
            disabled={!canSync || isBusy || !isDirty}
            title="Save to GitHub"
          >
            <Upload size={18} />
          </button>
        </div>
      </div>

      {storageStatus && <p className="mt-2 text-xs text-zinc-400">{storageStatus}</p>}

      {isOpen && (
        <div className="mt-3 grid gap-3 border-t border-zinc-800 pt-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="field-label">
            Owner
            <input
              className="field-input"
              value={config.owner}
              onChange={(event) => onConfigChange({ ...config, owner: event.target.value })}
            />
          </label>
          <label className="field-label">
            Repo
            <input
              className="field-input"
              value={config.repo}
              onChange={(event) => onConfigChange({ ...config, repo: event.target.value })}
            />
          </label>
          <label className="field-label">
            Branch
            <input
              className="field-input"
              value={config.branch}
              onChange={(event) => onConfigChange({ ...config, branch: event.target.value })}
            />
          </label>
          <label className="field-label">
            Data root
            <input
              className="field-input"
              placeholder="Repo root"
              value={config.dataRoot}
              onChange={(event) => onConfigChange({ ...config, dataRoot: event.target.value })}
            />
          </label>
          <label className="field-label">
            Token
            <input
              className="field-input"
              type="password"
              value={token}
              onChange={(event) => onTokenChange(event.target.value)}
              autoComplete="off"
            />
          </label>

          <div className="flex gap-2 md:col-span-2 xl:col-span-5">
            <button className="secondary-button flex-1" type="button" onClick={onLoad} disabled={!canSync || isBusy}>
              <Download size={18} />
              Load
            </button>
            <button
              className="primary-button flex-1"
              type="button"
              onClick={onSave}
              disabled={!canSync || isBusy || !isDirty}
            >
              <Upload size={18} />
              Save
            </button>
            <button className="icon-button" type="button" onClick={onDisconnect} title="Disconnect GitHub storage">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
