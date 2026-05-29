export type PaginatedListController = {
  applySearch: (query: string) => number;
  clearSearchFilter: () => void;
};

export type PaginatedListOptions = {
  listEl: HTMLElement | null;
  loadMoreBtn: HTMLElement | null;
  emptyMessageEl: HTMLElement | null;
  itemSelector: string;
  getSearchText: (item: Element) => string;
  pageSize?: number;
};

export function initPaginatedList(options: PaginatedListOptions): PaginatedListController | null {
  const { listEl, loadMoreBtn, emptyMessageEl, itemSelector, getSearchText, pageSize = 10 } = options;
  if (!listEl) return null;

  const items = [...listEl.querySelectorAll(itemSelector)];
  let visibleCount = pageSize;
  let searchActive = false;

  function updatePagination() {
    items.forEach((item, index) => {
      item.classList.toggle("is-list-hidden", index >= visibleCount);
    });

    if (loadMoreBtn) {
      loadMoreBtn.classList.toggle("is-hidden", visibleCount >= items.length);
    }
  }

  function clearSearchFilter() {
    searchActive = false;
    items.forEach((item) => {
      item.classList.remove("is-search-hidden");
    });
    emptyMessageEl?.classList.add("is-hidden");
    listEl.classList.remove("is-hidden");
    updatePagination();
  }

  function applySearch(query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      clearSearchFilter();
      return items.length;
    }

    searchActive = true;
    let matchCount = 0;

    items.forEach((item) => {
      const searchText = getSearchText(item);
      const matches = searchText.includes(normalizedQuery);
      item.classList.toggle("is-search-hidden", !matches);
      item.classList.remove("is-list-hidden");
      if (matches) matchCount += 1;
    });

    loadMoreBtn?.classList.add("is-hidden");

    if (emptyMessageEl) {
      emptyMessageEl.classList.toggle("is-hidden", matchCount > 0);
    }

    listEl.classList.toggle("is-hidden", matchCount === 0);

    return matchCount;
  }

  updatePagination();

  loadMoreBtn?.addEventListener("click", () => {
    if (searchActive) return;
    visibleCount += pageSize;
    updatePagination();
  });

  return { applySearch, clearSearchFilter };
}
