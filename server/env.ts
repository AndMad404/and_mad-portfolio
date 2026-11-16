export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  PANEL_ORIGIN: string;
  ACCESS_TEAM: string;
  ACCESS_AUDIENCE: string;
  OWNER_EMAIL: string;
  GITHUB_REPOSITORY: string;
  GITHUB_REF: string;
  SOURCE_REVISION: string;
  GITHUB_TOKEN: string;
  DEPLOY_TOKEN: string;
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const now = () => Math.floor(Date.now() / 1000);
export const uid = () => crypto.randomUUID();
export function requireValue(
  value: unknown,
  status: number,
  message: string,
): asserts value {
  if (!value) throw new HttpError(status, message);
}
