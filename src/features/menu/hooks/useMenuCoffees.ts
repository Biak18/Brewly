// src/features/menu/hooks/useMenuCoffees.ts
import { fetchMenuCoffees, MenuSort } from "@/services/coffees";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

export function useMenuCoffees(
  categoryId: string | null,
  search: string,
  sort: MenuSort,
) {
  return useInfiniteQuery({
    queryKey: ["menu-coffees", categoryId, search, sort],
    queryFn: ({ pageParam }) =>
      fetchMenuCoffees({
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
