export const INSTAGRAM_SORT_ORDER_STEP = 10;

/** 画面上の並びから sort_order を 10, 20, 30... に再計算 */
export function applySortOrderFromDom(postList: HTMLElement) {
  const items = postList.querySelectorAll(".instagram-admin-item");

  items.forEach((item, index) => {
    const sortOrder = (index + 1) * INSTAGRAM_SORT_ORDER_STEP;
    item.dataset.sortOrder = String(sortOrder);

    const input = item.querySelector(".edit-sort-order");
    if (input instanceof HTMLInputElement) {
      input.value = String(sortOrder);
    }
  });
}

export function collectSortOrderUpdates(postList: HTMLElement) {
  const updates: { id: string; sort_order: number }[] = [];

  for (const item of postList.querySelectorAll(".instagram-admin-item")) {
    const id = item.getAttribute("data-id");
    const input = item.querySelector(".edit-sort-order");

    if (!id || !(input instanceof HTMLInputElement)) continue;

    const raw = input.value.trim();
    if (raw === "") {
      throw new Error("表示順をすべて入力してください。");
    }

    const sort_order = Number.parseInt(raw, 10);
    if (!Number.isFinite(sort_order)) {
      throw new Error("表示順は整数で入力してください。");
    }

    updates.push({ id, sort_order });
  }

  return updates;
}

function getSortOrderSnapshot(postList: HTMLElement) {
  const rows = [...postList.querySelectorAll(".instagram-admin-item")].map((item) => {
    const id = item.getAttribute("data-id") ?? "";
    const input = item.querySelector(".edit-sort-order");
    const sort_order =
      input instanceof HTMLInputElement ? Number.parseInt(input.value.trim(), 10) : NaN;

    return { id, sort_order };
  });

  return JSON.stringify(rows);
}

function getDragAfterElement(container: HTMLElement, y: number) {
  const items = [
    ...container.querySelectorAll<HTMLElement>(
      ".instagram-admin-item:not(.is-dragging)"
    ),
  ];

  return items.reduce<{ offset: number; element: HTMLElement | null }>(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function moveItem(item: HTMLElement, direction: "up" | "down") {
  const list = item.parentElement;
  if (!list) return false;

  if (direction === "up") {
    const previous = item.previousElementSibling;
    if (!(previous instanceof HTMLElement)) return false;
    list.insertBefore(item, previous);
    return true;
  }

  const next = item.nextElementSibling;
  if (!(next instanceof HTMLElement)) return false;
  list.insertBefore(item, next.nextElementSibling);
  return true;
}

export type InstagramSortReorderController = {
  refreshSavedSnapshot: () => void;
  clearUnsavedNotice: () => void;
};

const listListenerAbortMap = new WeakMap<HTMLElement, AbortController>();

function bindItemDragListeners(postList: HTMLElement) {
  for (const item of postList.querySelectorAll<HTMLElement>(".instagram-admin-item")) {
    item.draggable = true;

    item.addEventListener("dragstart", (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".instagram-sort-handle")) {
        event.preventDefault();
        return;
      }

      item.classList.add("is-dragging");
      event.dataTransfer?.setData("text/plain", item.dataset.id ?? "");
      event.dataTransfer!.effectAllowed = "move";
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("is-dragging");
      for (const el of postList.querySelectorAll(".instagram-admin-item.is-drop-target")) {
        el.classList.remove("is-drop-target");
      }
    });
  }
}

export function initInstagramSortReorder(
  postList: HTMLElement,
  unsavedNotice: HTMLElement | null
): InstagramSortReorderController {
  let savedSnapshot = getSortOrderSnapshot(postList);

  function updateUnsavedNotice() {
    if (!unsavedNotice) return;

    const dirty = getSortOrderSnapshot(postList) !== savedSnapshot;
    unsavedNotice.textContent = dirty
      ? "未保存の変更があります。「表示順を保存」で反映してください。"
      : "";
    unsavedNotice.classList.toggle("is-hidden", !dirty);
    unsavedNotice.classList.toggle("is-warning", dirty);
  }

  function afterReorder() {
    applySortOrderFromDom(postList);
    updateUnsavedNotice();
  }

  bindItemDragListeners(postList);

  let listAbort = listListenerAbortMap.get(postList);
  if (listAbort) listAbort.abort();
  listAbort = new AbortController();
  listListenerAbortMap.set(postList, listAbort);
  const { signal } = listAbort;

  postList.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";

    const dragging = postList.querySelector(".instagram-admin-item.is-dragging");
    if (!dragging) return;

    const after = getDragAfterElement(postList, event.clientY);

    for (const el of postList.querySelectorAll(".instagram-admin-item.is-drop-target")) {
      el.classList.remove("is-drop-target");
    }

    if (after) {
      after.classList.add("is-drop-target");
    } else {
      const last = postList.querySelector(".instagram-admin-item:last-child");
      last?.classList.add("is-drop-target");
    }
  }, { signal });

  postList.addEventListener("dragleave", (event) => {
    if (event.target !== postList) return;
    for (const el of postList.querySelectorAll(".instagram-admin-item.is-drop-target")) {
      el.classList.remove("is-drop-target");
    }
  }, { signal });

  postList.addEventListener("drop", (event) => {
    event.preventDefault();

    const id = event.dataTransfer?.getData("text/plain");
    if (!id) return;

    const dragged = postList.querySelector<HTMLElement>(
      `.instagram-admin-item[data-id="${CSS.escape(id)}"]`
    );
    if (!dragged) return;

    const after = getDragAfterElement(postList, event.clientY);

    if (after) {
      postList.insertBefore(dragged, after);
    } else {
      postList.append(dragged);
    }

    for (const el of postList.querySelectorAll(".instagram-admin-item.is-drop-target")) {
      el.classList.remove("is-drop-target");
    }

    afterReorder();
  }, { signal });

  postList.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("button");
    if (!button || !postList.contains(button)) return;

    const item = button.closest<HTMLElement>(".instagram-admin-item");
    if (!item) return;

    if (button.classList.contains("instagram-sort-move-up")) {
      if (moveItem(item, "up")) afterReorder();
      return;
    }

    if (button.classList.contains("instagram-sort-move-down")) {
      if (moveItem(item, "down")) afterReorder();
    }
  }, { signal });

  postList.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("edit-sort-order")) {
      return;
    }

    const item = target.closest<HTMLElement>(".instagram-admin-item");
    if (item && target.value.trim() !== "") {
      item.dataset.sortOrder = target.value.trim();
    }

    updateUnsavedNotice();
  }, { signal });

  updateUnsavedNotice();

  return {
    refreshSavedSnapshot() {
      savedSnapshot = getSortOrderSnapshot(postList);
      updateUnsavedNotice();
    },
    clearUnsavedNotice() {
      savedSnapshot = getSortOrderSnapshot(postList);
      if (unsavedNotice) {
        unsavedNotice.textContent = "";
        unsavedNotice.classList.add("is-hidden");
        unsavedNotice.classList.remove("is-warning");
      }
    },
  };
}
