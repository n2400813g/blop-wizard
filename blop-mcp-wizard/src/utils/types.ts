export interface WizardOptions {
  blopPath?: string;
  ci?: boolean;
  cursorOnly?: boolean;
  includeClaude?: boolean;
  debug?: boolean;
}

export interface BootstrapOptions {
  blopPath: string;
  ci?: boolean;
  skipPlaywright?: boolean;
}

export interface EnvConfig {
  GOOGLE_API_KEY: string;
  APP_BASE_URL?: string;
  LOGIN_URL?: string;
  TEST_USERNAME?: string;
  TEST_PASSWORD?: string;
  BLOP_DB_PATH?: string;
  BLOP_HEADLESS?: string;
  BLOP_MAX_STEPS?: string;
}

export interface MCPClientResult {
  success: boolean;
  error?: string;
}

export type MCPServerConfig = Record<string, unknown>;

export interface DoctorOptions {
  blopPath?: string;
  verbose?: boolean;
}

