import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Milestone } from "../backend";
import { useGetMilestones } from "../hooks/useQueries";

export default function InteractiveTimeline() {
  const { data: milestones = [], isLoading } = useGetMilestones();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [checkScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Milestones
          </h2>
          <div className="text-center text-muted-foreground">
            Loading milestones...
          </div>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return null;
  }

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-gradient-shift">
          Milestones
        </h2>

        {/* Desktop: Horizontal Timeline */}
        <div className="hidden lg:block relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full p-3 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full p-3 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Timeline Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="overflow-x-auto scrollbar-hide scroll-smooth px-12"
          >
            <div className="relative flex items-center gap-8 pb-8 min-w-max">
              {/* Connecting Line */}
              <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />

              {milestones.map((milestone) => (
                <div
                  key={milestone.title}
                  className="relative flex flex-col items-center w-80 flex-shrink-0"
                >
                  {/* Timeline Marker */}
                  <div className="relative z-10 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary shadow-[0_0_20px_rgba(168,85,247,0.6)] flex items-center justify-center animate-pulse-glow">
                      <Calendar className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Milestone Card */}
                  <Card className="w-full border-primary/30 bg-card/80 backdrop-blur-sm hover:border-primary/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300 group">
                    <CardContent className="p-6 space-y-4">
                      {milestone.media && (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden border border-primary/20 group-hover:border-primary/40 transition-colors">
                          <img
                            src={milestone.media.getDirectURL()}
                            alt={milestone.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {milestone.date}
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical Timeline */}
        <div className="lg:hidden space-y-8">
          {milestones.map((milestone, index) => (
            <div key={milestone.title} className="relative flex gap-6">
              {/* Vertical Line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/30 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
              )}

              {/* Timeline Marker */}
              <div className="relative z-10 flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary shadow-[0_0_20px_rgba(168,85,247,0.6)] flex items-center justify-center animate-pulse-glow">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>

              {/* Milestone Card */}
              <Card className="flex-1 border-primary/30 bg-card/80 backdrop-blur-sm hover:border-primary/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  {milestone.media && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-primary/20">
                      <img
                        src={milestone.media.getDirectURL()}
                        alt={milestone.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {milestone.date}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
