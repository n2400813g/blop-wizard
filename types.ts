export type InstallSource = 'pypi' | 'local';

export interface WizardOptions {
  installSource?: InstallSource;
  runtimePath?: string;
  blopPath?: string;
  projectPath?: string;
  packageName?: string;
  packageVersion?: string;
  ci?: boolean;
  targets?: string[];
  cursorOnly?: boolean;
  includeClaude?: boolean;
  debug?: boolean;
  skipPlaywright?: boolean;
}

export interface BootstrapOptions {
  installSource: InstallSource;
  runtimePath: string;
  localSourcePath?: string;
  packageSpec?: string;
  ci?: boolean;
  skipPlaywright?: boolean;
}

export interface EnvConfig {
  GOOGLE_API_KEY: string;
  BLOP_LLM_PROVIDER?: string;
  BLOP_LLM_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  APP_BASE_URL?: string;
  LOGIN_URL?: string;
  TEST_USERNAME?: string;
  TEST_PASSWORD?: string;
  BLOP_ENV?: string;
  BLOP_DB_PATH?: string;
  BLOP_RUNS_DIR?: string;
  BLOP_DEBUG_LOG?: string;
  BLOP_REQUIRE_ABSOLUTE_PATHS?: string;
  BLOP_CAPABILITIES_PROFILE?: string;
  BLOP_ENABLE_COMPAT_TOOLS?: string;
  BLOP_ALLOW_INTERNAL_URLS?: string;
  BLOP_HEADLESS?: string;
  BLOP_MAX_STEPS?: string;
  BLOP_RUN_TIMEOUT_SECS?: string;
  BLOP_STEP_TIMEOUT_SECS?: string;
  BLOP_MAX_CONCURRENT_RUNS?: string;
  BLOP_ALLOW_SCREENSHOT_LLM?: string;
}

export interface MCPClientResult {
  success: boolean;
  error?: string;
}

export type MCPServerConfig = Record<string, unknown>;

export interface DoctorOptions {
  installSource?: InstallSource;
  runtimePath?: string;
  blopPath?: string;
  packageName?: string;
  packageVersion?: string;
  verbose?: boolean;
  skipPlaywright?: boolean;
}

export interface RepairOptions {
  installSource?: InstallSource;
  runtimePath?: string;
  blopPath?: string;
  projectPath?: string;
  packageName?: string;
  packageVersion?: string;
  ci?: boolean;
  targets?: string[];
  cursorOnly?: boolean;
  includeClaude?: boolean;
  skipPlaywright?: boolean;
}

export interface DoctorRow {
  label: string;
  ok: boolean;
  detail?: string;
}
