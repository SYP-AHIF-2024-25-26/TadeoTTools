// Client-side sorting of a table by one column; used with <app-sort-header>.

export type SortDirection = 'asc' | 'desc';

export type SortState<K extends string> = { key: K; direction: SortDirection };

// A click on the sorted column turns it around; another column starts with its
// first direction (counts are most useful largest first).
export function nextSort<K extends string>(
  current: SortState<K>,
  key: K,
  first: SortDirection = 'asc'
): SortState<K> {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { key, direction: first };
}

// Value of the column header's aria-sort attribute.
export function ariaSort<K extends string>(
  current: SortState<K>,
  key: K
): 'ascending' | 'descending' | 'none' {
  if (current.key !== key) return 'none';
  return current.direction === 'asc' ? 'ascending' : 'descending';
}

const collator = new Intl.Collator('de', {
  numeric: true,
  sensitivity: 'base',
});

// Sorts a copy; equal values keep their previous order.
export function sortBy<T, K extends string>(
  items: readonly T[],
  sort: SortState<K>,
  value: (item: T, key: K) => string | number
): T[] {
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const x = value(a, sort.key);
    const y = value(b, sort.key);
    const order =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : collator.compare(String(x), String(y));
    return sign * order;
  });
}
