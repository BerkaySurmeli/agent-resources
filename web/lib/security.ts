// Security check types and report structure

export interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  details?: string;
  timestamp: string;
}

export interface SecurityReport {
  listingId: string;
  listingName: string;
  overallStatus: 'secure' | 'caution' | 'review' | 'pending';
  checks: SecurityCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    total: number;
  };
  generatedAt: string;
  reviewedBy?: string;
}

// Security check categories
export const securityCheckCategories = {
  code: {
    name: 'Code Security',
    checks: [
      {
        id: 'no-malicious-code',
        name: 'Malicious Code Scan',
        description: 'Scans for known malicious patterns, backdoors, and suspicious code'
      },
      {
        id: 'dependency-check',
        name: 'Dependency Audit',
        description: 'Checks for known vulnerabilities in dependencies'
      },
      {
        id: 'secrets-scan',
        name: 'Secrets Detection',
        description: 'Ensures no API keys, passwords, or tokens are exposed'
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Validates code structure and best practices'
      }
    ]
  },
  runtime: {
    name: 'Runtime Security',
    checks: [
      {
        id: 'sandbox-test',
        name: 'Sandbox Execution',
        description: 'Runs in isolated environment to test behavior'
      },
      {
        id: 'resource-limits',
        name: 'Resource Limits',
        description: 'Verifies CPU, memory, and network constraints'
      },
      {
        id: 'permission-check',
        name: 'Permission Audit',
        description: 'Validates requested permissions are appropriate'
      }
    ]
  },
  data: {
    name: 'Data Protection',
    checks: [
      {
        id: 'data-handling',
        name: 'Data Handling',
        description: 'Ensures proper handling of user data'
      },
      {
        id: 'privacy-compliance',
        name: 'Privacy Check',
        description: 'Validates privacy policy compliance'
      }
    ]
  }
};

// Generate a sample security report
export function generateSecurityReport(listingId: string, listingName: string): SecurityReport {
  const now = new Date().toISOString();
  
  return {
    listingId,
    listingName,
    overallStatus: 'secure',
    generatedAt: now,
    reviewedBy: 'Agent Resources Security Team',
    checks: [
      {
        id: 'no-malicious-code',
        name: 'Malicious Code Scan',
        description: 'Scans for known malicious patterns, backdoors, and suspicious code',
        status: 'passed',
        details: 'No malicious patterns detected. Code passed static analysis.',
        timestamp: now
      },
      {
        id: 'dependency-check',
        name: 'Dependency Audit',
        description: 'Checks for known vulnerabilities in dependencies',
        status: 'passed',
        details: 'All dependencies up to date. No known vulnerabilities found.',
        timestamp: now
      },
      {
        id: 'secrets-scan',
        name: 'Secrets Detection',
        description: 'Ensures no API keys, passwords, or tokens are exposed',
        status: 'passed',
        details: 'No hardcoded secrets detected in codebase.',
        timestamp: now
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Validates code structure and best practices',
        status: 'passed',
        details: 'Code follows best practices. Well structured and documented.',
        timestamp: now
      },
      {
        id: 'sandbox-test',
        name: 'Sandbox Execution',
        description: 'Runs in isolated environment to test behavior',
        status: 'passed',
        details: 'Executed successfully in sandbox. No unexpected behavior.',
        timestamp: now
      },
      {
        id: 'resource-limits',
        name: 'Resource Limits',
        description: 'Verifies CPU, memory, and network constraints',
        status: 'passed',
        details: 'Resource usage within acceptable limits.',
        timestamp: now
      },
      {
        id: 'permission-check',
        name: 'Permission Audit',
        description: 'Validates requested permissions are appropriate',
        status: 'warning',
        details: 'Permissions are appropriate for functionality. Minor note: Consider reducing file system access scope.',
        timestamp: now
      },
      {
        id: 'data-handling',
        name: 'Data Handling',
        description: 'Ensures proper handling of user data',
        status: 'passed',
        details: 'No unnecessary data collection. Data handling follows best practices.',
        timestamp: now
      }
    ],
    summary: {
      passed: 7,
      failed: 0,
      warnings: 1,
      total: 8
    }
  };
}

// Get status color and icon
export function getSecurityStatusConfig(status: SecurityReport['overallStatus']) {
  switch (status) {
    case 'secure':
      return {
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: 'shield-check',
        label: 'Security Verified'
      };
    case 'caution':
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        icon: 'shield-exclamation',
        label: 'Review Recommended'
      };
    case 'review':
      return {
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        icon: 'shield-exclamation',
        label: 'Under Review'
      };
    case 'pending':
      return {
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        icon: 'shield',
        label: 'Security Check Pending'
      };
  }
}
