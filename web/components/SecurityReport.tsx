import { SecurityReport, getSecurityStatusConfig } from '../lib/security';

interface SecurityReportProps {
  report: SecurityReport;
}

export default function SecurityReportCard({ report }: SecurityReportProps) {
  const config = getSecurityStatusConfig(report.overallStatus);
  const passedPercentage = Math.round((report.summary.passed / report.summary.total) * 100);

  return (
    <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            report.overallStatus === 'secure' ? 'bg-green-500' : 
            report.overallStatus === 'caution' ? 'bg-yellow-500' :
            report.overallStatus === 'review' ? 'bg-orange-500' : 'bg-gray-400'
          }`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {report.overallStatus === 'secure' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Security Report</h3>
            <p className={`text-sm font-medium ${config.textColor}`}>{config.label}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">{passedPercentage}%</div>
          <p className="text-sm text-slate-500">Checks Passed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              report.overallStatus === 'secure' ? 'bg-green-500' :
              report.overallStatus === 'caution' ? 'bg-yellow-500' :
              report.overallStatus === 'review' ? 'bg-orange-500' : 'bg-gray-400'
            }`}
            style={{ width: `${passedPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-green-600 font-medium">{report.summary.passed} Passed</span>
          {report.summary.warnings > 0 && (
            <span className="text-yellow-600 font-medium">{report.summary.warnings} Warnings</span>
          )}
          {report.summary.failed > 0 && (
            <span className="text-red-600 font-medium">{report.summary.failed} Failed</span>
          )}
        </div>
      </div>

      {/* Checks list */}
      <div className="space-y-3">
        {report.checks.map((check) => (
          <div 
            key={check.id}
            className="bg-white rounded-xl p-4 border border-slate-100"
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                check.status === 'passed' ? 'bg-green-100' :
                check.status === 'warning' ? 'bg-yellow-100' :
                check.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {check.status === 'passed' ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : check.status === 'warning' ? (
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : check.status === 'failed' ? (
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-slate-900">{check.name}</h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    check.status === 'passed' ? 'bg-green-100 text-green-700' :
                    check.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    check.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{check.description}</p>
                {check.details && (
                  <p className={`text-sm mt-2 ${
                    check.status === 'passed' ? 'text-green-600' :
                    check.status === 'warning' ? 'text-yellow-600' :
                    check.status === 'failed' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {check.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Report generated: {new Date(report.generatedAt).toLocaleDateString()}</span>
          {report.reviewedBy && (
            <span>Reviewed by: {report.reviewedBy}</span>
          )}
        </div>
      </div>
    </div>
  );
}
