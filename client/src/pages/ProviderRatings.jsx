import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import moment from "moment";
import * as ratingApi from "@/api/ratingApi";

export default function ProviderRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ratingApi.getProviderRatings();
        setRatings(res.data || []);
      } catch (err) {
        setRatings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  const avg =
    ratings.length
      ? (ratings.reduce((s, r) => s + (r.rating || r.stars || 0), 0) /
          ratings.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ratings & Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">{ratings.length} reviews received</p>
      </div>

      <Card className="p-6 border border-gray-100 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{avg}</p>
          <div className="flex items-center gap-0.5 mt-1 justify-center">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{ratings.length} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map(star => {
            const count = ratings.filter(r => (r.rating || r.stars) === star).length;
            const pct = ratings.length ? (count / ratings.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-500">{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-xs text-gray-400 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-3">
        {ratings.map(r => (
          <Card key={r.id} className="p-4 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{r.from_name || "Anonymous"}</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= (r.rating || r.stars || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                </div>
                {r.feedback && <p className="text-sm text-gray-500 mt-1">{r.feedback}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{moment(r.created_date || r.createdAt).fromNow()}</span>
            </div>
          </Card>
        ))}
        {ratings.length === 0 && (
          <Card className="p-12 text-center">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No ratings yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}