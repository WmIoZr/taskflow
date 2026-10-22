export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function hasErrorCode(err: unknown, code: string) {
  return err instanceof Error && "code" in err && err.code === code;
}
