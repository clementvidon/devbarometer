export function isJsonResponse(res: Response): boolean {
  const contentType: string = res.headers.get('content-type') ?? '';
  return contentType.includes('application/json');
}
