import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Send, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ProductReviewsProps {
  productId: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((review) => ({
        ...review,
        profiles: profilesMap.get(review.user_id) || null,
      })) as Review[];
    },
  });

  const { data: userReview } = useQuery({
    queryKey: ["userReview", productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      
      const { error } = await supabase.from("reviews").upsert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        is_approved: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إرسال تقييمك وسيتم مراجعته قريباً");
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["userReview", productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= (interactive ? hoverRating || rating : value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer transition-colors" : ""}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">التقييمات والمراجعات</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-sm text-muted-foreground">
                ({averageRating.toFixed(1)}) - {reviews.length} تقييم
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Review Form */}
        {user ? (
          userReview ? (
            <div className="bg-secondary/50 p-4 rounded-xl">
              <p className="text-muted-foreground text-sm">
                لقد قمت بتقييم هذا المنتج بالفعل 
                {!userReview.is_approved && " (في انتظار الموافقة)"}
              </p>
            </div>
          ) : (
            <div className="bg-secondary/50 p-4 rounded-xl space-y-4">
              <h4 className="font-medium text-foreground">أضف تقييمك</h4>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">تقييمك:</span>
                {renderStars(rating, true)}
              </div>
              <Textarea
                placeholder="اكتب تعليقك هنا (اختياري)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={() => submitReviewMutation.mutate()}
                disabled={rating === 0 || submitReviewMutation.isPending}
                className="w-full sm:w-auto gap-2"
              >
                <Send className="w-4 h-4" />
                إرسال التقييم
              </Button>
            </div>
          )
        ) : (
          <div className="bg-secondary/50 p-4 rounded-xl text-center">
            <p className="text-muted-foreground text-sm">
              يجب تسجيل الدخول لإضافة تقييم
            </p>
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-secondary/30 rounded-xl p-4">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                      <span className="font-medium text-foreground text-sm truncate">
                        {review.profiles?.full_name || "مستخدم مجهول"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "d MMMM yyyy", { locale: ar })}
                      </span>
                    </div>
                    {renderStars(review.rating)}
                    {review.comment && (
                      <p className="mt-2 text-sm text-muted-foreground break-words">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!</p>
          </div>
        )}
      </div>
    </div>
  );
};
