// src/features/menu/hooks/useMenuCoffees.ts
import { fetchMenuCoffees, MenuSort } from "@/services/coffees";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export function useMenuCoffees(
  storeId: string,
  categoryId: string | null,
  search: string,
  sort: MenuSort,
) {
  return useInfiniteQuery({
    queryKey: ["menu-coffees", storeId, categoryId, search, sort],
    queryFn: ({ pageParam }) =>
      fetchMenuCoffees({
        storeId,
        categoryId,
        search,
        sort,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    placeholderData: keepPreviousData,
  });
}
