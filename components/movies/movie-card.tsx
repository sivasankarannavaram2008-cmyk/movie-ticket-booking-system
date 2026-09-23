import React from "react";
import { Star, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface MovieCardProps {
  title: string;
  genre: string;
  rating: number;
  duration: string;
  posterUrl?: string;
  onBook?: () => void;
}

export function MovieCard({
  title,
  genre,
  rating,
  duration,
  posterUrl,
  onBook,
}: MovieCardProps) {
  return (
    <Card className="overflow-hidden group hover:border-zinc-700 transition-all duration-300 p-0">
      <div className="relative aspect-[2/3] w-full bg-zinc-800 overflow-hidden">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 font-medium">
            No Poster Available
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-xs font-semibold text-yellow-400">
          <Star className="w-3.5 h-3.5 fill-yellow-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h4 className="font-semibold text-white truncate text-base">{title}</h4>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{genre}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </span>
        </div>
        <Button size="sm" className="mt-2 w-full" onClick={onBook}>
          Book Tickets
        </Button>
      </div>
    </Card>
  );
}
