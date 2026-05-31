import apiFetch from './api';
import { auditErrorMessage, auditSuccessStatus } from './audit-workflow-model';
import type { GusyAudit, GusyBlueprint, LeftTab } from './types';

type UseAuditWorkflowOptions = {
  blueprint: GusyBlueprint;
  setAudit: (audit: GusyAudit | null) => void;
  setBusy: (busy: boolean) => void;
  setLeftTab: (tab: LeftTab) => void;
  setStatus: (status: string) => void;
};

export function useAuditWorkflow({
  blueprint,
  setAudit,
  setBusy,
  setLeftTab,
  setStatus
}: UseAuditWorkflowOptions) {
  async function runAudit() {
    setBusy(true);
    setStatus('Auditing');
    try {
      const response = await apiFetch<{ audit: GusyAudit }>({
        path: '/gusy/v1/page/audit',
        method: 'POST',
        data: { blueprint }
      });
      setAudit(response.audit);
      setLeftTab('audit');
      setStatus(auditSuccessStatus(response.audit.score));
    } catch (error) {
      setStatus(auditErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return { runAudit };
}
