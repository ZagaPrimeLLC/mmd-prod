/** Read ordered result pages without mistaking the API row cap for the end. */
export async function readAll<T>(page: (from: number, to: number) => PromiseLike<{
  data: T[] | null; error: { message: string } | null;
}>): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (;;) {
    const result = await page(rows.length, rows.length + 499);
    if (result.error) return { data: [], error: result.error };
    if (!result.data?.length) return { data: rows, error: null };
    rows.push(...result.data);
  }
}
