export type RepoSource = "github" | "azure_devops" | "gitlab" | "bitbucket";
export type BugTrackerType = "jira" | "azure_boards" | "github_issues" | "linear";
export type ScanStatus =
  | "pending"
  | "cloning"
  | "analyzing"
  | "generating_tests"
  | "running_tests"
  | "filing_bugs"
  | "completed"
  | "failed";
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ScanRequest {
  repo_url: string;
  branch: string;
  repo_source: RepoSource;
  bug_tracker: BugTrackerType;
  run_static_analysis: boolean;
  run_ai_tests: boolean;
  file_bugs: boolean;
  include_patterns: string[];
  exclude_patterns: string[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  file_path: string;
  line_number: number | null;
  severity: Severity;
  source: "static_analysis" | "ai_test" | "test_failure";
  raw_output: string | null;
}

export interface TestResult {
  test_file: string;
  passed: boolean;
  output: string;
  error: string | null;
  duration_ms: number | null;
}

export interface GeneratedTest {
  file_path: string;
  test_code: string;
  target_file: string;
  language: string;
}

export interface ScanSummary {
  scan_id: string;
  repo_url: string;
  status: ScanStatus;
  started_at: string;
  completed_at: string | null;
  total_issues: number;
  tests_generated: number;
  tests_passed: number;
  tests_failed: number;
  bugs_filed: number;
  by_severity: Record<Severity, number>;
}

export interface ScanDetail {
  scan_id: string;
  status: ScanStatus;
  summary: ScanSummary;
  issues: Issue[];
  generated_tests: GeneratedTest[];
  test_results: TestResult[];
  bugs_filed: { tracker: string; url: string; issue_id: string }[];
  error: string | null;
}

export interface ConnectorStatus {
  type: BugTrackerType;
  connected: boolean;
}

export interface WSMessage {
  status: ScanStatus;
  message: string;
  summary?: ScanSummary;
  issues_count?: number;
  tests_generated?: number;
  tests_passed?: number;
  tests_failed?: number;
}
