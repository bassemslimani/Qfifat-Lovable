import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Favorite {
  id: string;
  product_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });

  const favoriteProductIds = favorites.map((f) => f.product_id);

  const isFavorite = useCallback(
    (productId: string) => favoriteProductIds.includes(productId),
    [favoriteProductIds]
  );

  const addFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase.from("favorites").insert({
        product_id: productId,
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("تمت الإضافة للمفضلة");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("تمت الإزالة من المفضلة");
    },
    onError: () => {
      toast.error("حدث خطأ");
    },
  });

  const toggleFavorite = useCallback(
    (productId: string) => {
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      if (isFavorite(productId)) {
        removeFavoriteMutation.mutate(productId);
      } else {
        addFavoriteMutation.mutate(productId);
      }
    },
    [user, isFavorite, addFavoriteMutation, removeFavoriteMutation]
  );

  return {
    favorites,
    favoriteProductIds,
    isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
};
