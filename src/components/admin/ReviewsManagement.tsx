import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string | null;
  };
}

export const ReviewsManagement = () => {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, products:product_id (name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((review) => ({
        ...review,
        profiles: profilesMap.get(review.user_id) || { full_name: null },
      })) as Review[];
    },
  });

  const approveReviewMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: approved })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة التقييم");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التحديث");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف التقييم");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء الحذف");
    },
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );

  const pendingReviews = reviews.filter((r) => !r.is_approved);
  const approvedReviews = reviews.filter((r) => r.is_approved);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground">التقييمات المعلقة</h3>
            {pendingReviews.length > 0 && (
              <Badge variant="secondary">{pendingReviews.length}</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          {pendingReviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              لا توجد تقييمات معلقة
            </p>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-secondary/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{review.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        بواسطة: {review.profiles?.full_name || "مستخدم مجهول"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(review.created_at), "d MMM yyyy", { locale: ar })}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                  {review.comment && (
                    <p className="text-muted-foreground text-sm break-words">{review.comment}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        approveReviewMutation.mutate({ id: review.id, approved: true })
                      }
                      className="flex-1 sm:flex-none gap-1"
                    >
                      <Check className="w-4 h-4" />
                      قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteReviewMutation.mutate(review.id)}
                      className="flex-1 sm:flex-none gap-1"
                    >
                      <X className="w-4 h-4" />
                      رفض وحذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approved Reviews */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-foreground">التقييمات المعتمدة ({approvedReviews.length})</h3>
        </div>
        <div className="p-4">
          {approvedReviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              لا توجد تقييمات معتمدة
            </p>
          ) : (
            <div className="space-y-4">
              {approvedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-secondary/30 rounded-xl p-4 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{review.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {review.profiles?.full_name || "مستخدم مجهول"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => deleteReviewMutation.mutate(review.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-muted-foreground text-sm break-words">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
