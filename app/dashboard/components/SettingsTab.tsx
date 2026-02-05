'use client';

interface SettingsTabProps {
  escalationKeywords: string;
  autoEscalate: boolean;
  setEscalationKeywords: (keywords: string) => void;
  setAutoEscalate: (autoEscalate: boolean) => void;
  saveSettings: (e: React.FormEvent) => void;
}

export default function SettingsTab({
  escalationKeywords,
  autoEscalate,
  setEscalationKeywords,
  setAutoEscalate,
  saveSettings,
}: SettingsTabProps) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-8">Settings</h3>
      <form onSubmit={saveSettings} className="space-y-8">
        <div className="pb-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-escalate sensitive messages</h4>
              <p className="text-sm text-gray-500 mt-1">
                Flag messages containing escalation keywords
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoEscalate}
                onChange={(e) => setAutoEscalate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>
        </div>
        <div className="pb-8 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="block text-base font-medium text-gray-900">
                Escalation keywords
              </label>
              <p className="text-sm text-gray-500 mt-1">Comma-separated keywords</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEscalationKeywords(
                  'refund, compensation, discount, injury, safety, police, legal, lawsuit, chargeback'
                )
              }
              className="text-sm text-gray-700 hover:text-gray-900 underline"
            >
              Reset
            </button>
          </div>
          <textarea
            value={escalationKeywords}
            onChange={(e) => setEscalationKeywords(e.target.value)}
            rows={4}
            placeholder="refund, compensation, discount..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            {escalationKeywords.split(',').filter((k) => k.trim()).length} keywords
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3">How it works</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• AI analyzes messages for escalation keywords</li>
            <li>• Flagged messages show a warning banner</li>
            <li>• AI generates drafts but you must review before sending</li>
            <li>• All drafts are copy-paste only</li>
          </ul>
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
