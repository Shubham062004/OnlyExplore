export type ErrorCategory =
  | 'CONFIGURATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'PERMISSION'
  | 'RATE_LIMIT'
  | 'QUOTA'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'INVALID_REQUEST'
  | 'PROVIDER_ERROR'
  | 'DATABASE'
  | 'UNKNOWN';

export interface EnvVariableStatus {
  name: string;
  configured: boolean;
  maskedValue?: string;
  required: boolean;
  description: string;
}

export interface TestErrorInfo {
  code?: string;
  message: string;
  category: ErrorCategory;
  likelyCause?: string;
  fixSteps?: string[];
}

export interface NormalizedTestResult<T = any> {
  success: boolean;
  service: string;
  category: string;
  configured: boolean;
  authenticated: boolean;
  reachable: boolean;
  httpStatus: number;
  responseTimeMs: number;
  testedAt: string;
  resultSummary: string;
  data?: T;
  error?: TestErrorInfo | null;
  envStatus: EnvVariableStatus[];
  capabilities?: Record<string, 'supported' | 'unsupported' | 'conditional' | 'restricted'>;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  slug: string;
  category:
    | 'AI & Intelligence'
    | 'Maps & Location'
    | 'Media & Images'
    | 'Social Media'
    | 'Database & Cache'
    | 'Authentication & Security'
    | 'Communications'
    | 'Commerce & Financial';
  description: string;
  testEndpoint: string;
  detailRoute: string;
  envVars: string[];
  isSafeForBatch: boolean;
  stateModifying?: boolean;
}
