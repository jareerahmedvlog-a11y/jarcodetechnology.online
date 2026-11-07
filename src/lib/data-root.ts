import os from "os";
import path from "path";

/**
 * Writable app data root.
 * Vercel/serverless: cwd is read-only → use /tmp.
 * Local/dev: keep project `data/` folder.
 */
export function dataRoot(...parts: string[]) {
  const base =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? path.join(os.tmpdir(), "jarcode-data")
      : path.join(process.cwd(), "data");
  return parts.length ? path.join(base, ...parts) : base;
}
