import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useAdminList(fetcher) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [extra, setExtra] = useState({});

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const setExtraAndReset = useCallback((value) => {
    setExtra(value);
    setPage(1);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetcher({ page, limit: 15, search: debounced, ...extra });
      setItems(data.data.items || []);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.message || "Failed to load data.");
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, debounced, extra]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    setItems,
    pagination,
    loading,
    page,
    setPage,
    search,
    setSearch,
    extra,
    setExtra: setExtraAndReset,
    reload: load,
  };
}

export async function adminDelete(action, reload, successMsg = "Deleted successfully.") {
  try {
    await action();
    toast.success(successMsg);
    await reload();
  } catch (err) {
    toast.error(err.message || "Delete failed.");
  }
}
