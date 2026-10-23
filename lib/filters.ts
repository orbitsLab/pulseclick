/**
 * Smart filter query model.
 *
 * TickTick exposes "Filter: Use smart filters to focus on what matters most."
 * A filter is stored as JSON on the `Filter` model and translated into a
 * Prisma `where` fragment by `buildFilterWhere`.
 */

export interface FilterQuery {
  /** 1 = low, 2 = medium, 3 = high */
  priorities?: number[];
  /** Tag names (not ids) so a filter survives tag re-creation */
  tags?: string[];
  /** List ids; the literal "inbox" targets tasks without a list */
  listIds?: string[];
  /** Inclusive ISO date range on the due date */
  dueFrom?: string | null;
  dueTo?: string | null;
  /** "open" | "completed" | "any" */
  status?: "open" | "completed" | "any";
  /** Restrict to tasks that have (or do not have) a description */
  hasDescription?: boolean;
  /** Restrict to tasks that have (or do not have) subtasks */
  hasSubtasks?: boolean;
  /** Restrict to pinned tasks */
  pinned?: boolean;
  /** Free text matched against title and description */
  keyword?: string;
}

export const EMPTY_FILTER_QUERY: FilterQuery = {};

export function parseFilterQuery(raw: string | null | undefined): FilterQuery {
  if (!raw) return { ...EMPTY_FILTER_QUERY };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_FILTER_QUERY };
    return { ...EMPTY_FILTER_QUERY, ...parsed };
  } catch {
    return { ...EMPTY_FILTER_QUERY };
  }
}

export function serializeFilterQuery(query: FilterQuery): string {
  const clean: FilterQuery = {};
  if (query.priorities?.length) clean.priorities = query.priorities;
  if (query.tags?.length) clean.tags = query.tags;
  if (query.listIds?.length) clean.listIds = query.listIds;
  if (query.dueFrom) clean.dueFrom = query.dueFrom;
  if (query.dueTo) clean.dueTo = query.dueTo;
  if (query.status && query.status !== "open") clean.status = query.status;
  if (query.hasDescription) clean.hasDescription = true;
  if (query.hasSubtasks) clean.hasSubtasks = true;
  if (query.pinned) clean.pinned = true;
  if (query.keyword?.trim()) clean.keyword = query.keyword.trim();
  return JSON.stringify(clean);
}

export function isEmptyFilterQuery(query: FilterQuery): boolean {
  return Object.keys(serializeFilterQuery(query) ? JSON.parse(serializeFilterQuery(query)) : {}).length === 0;
}

/**
 * Translate a filter query into a Prisma `where` fragment for the Task model.
 * The returned object is merged with the owning user's base scope.
 */
export function buildFilterWhere(query: FilterQuery): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (query.priorities?.length) {
    where.priority = { in: query.priorities };
  }

  if (query.tags?.length) {
    and.push({ tags: { some: { tag: { name: { in: query.tags } } } } });
  }

  if (query.listIds?.length) {
    const concrete = query.listIds.filter((id) => id !== "inbox");
    const clauses: Record<string, unknown>[] = [];
    if (concrete.length) clauses.push({ listId: { in: concrete } });
    if (query.listIds.includes("inbox")) clauses.push({ listId: null });
    if (clauses.length) and.push({ OR: clauses });
  }

  if (query.dueFrom || query.dueTo) {
    const range: Record<string, string> = {};
    if (query.dueFrom) range.gte = query.dueFrom;
    if (query.dueTo) range.lte = query.dueTo;
    where.dueDate = range;
  }

  if (query.status === "completed") where.completed = true;
  else if (query.status === "open" || !query.status) where.completed = false;

  if (query.hasDescription) {
    where.description = { not: null };
  }

  if (query.hasSubtasks) {
    and.push({ subtasks: { some: {} } });
  }

  if (query.pinned) {
    where.isPinned = true;
  }

  if (query.keyword?.trim()) {
    const keyword = query.keyword.trim();
    and.push({
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ],
    });
  }

  if (and.length) where.AND = and;

  return where;
}
