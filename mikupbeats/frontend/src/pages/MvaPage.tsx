import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Music, Pause, Play } from "lucide-react";
import { useEffect } from "react";
import { PageType } from "../backend";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useGetMvaPreview, useRecordSiteVisit } from "../hooks/useQueries";

export default function MvaPage() {
  const { data: mvaPreview, isLoading: loadingPreview } = useGetMvaPreview();
  const recordVisit = useRecordSiteVisit();
  const { currentAudio, isPlaying, play, pause } = useAudioPlayer();

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit to run once
  useEffect(() => {
    // Record site visit when page loads
    recordVisit.mutate(PageType.mva);
  }, []);

  const handlePlayPreview = () => {
    if (mvaPreview) {
      const url = mvaPreview.getDirectURL();
      if (currentAudio === url && isPlaying) {
        pause();
      } else {
        play(url);
      }
    }
  };

  const isPreviewPlaying =
    mvaPreview && currentAudio === mvaPreview.getDirectURL() && isPlaying;

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 text-[#a970ff]">
            M.v.A — Modular Verse Architect
          </h1>
          <p className="text-xl text-muted-foreground">
            A Proprietary Production Style by Malik Johnson
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction / Brand Statement */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-bold mb-4 text-[#a970ff]">
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <span className="text-[#a970ff] font-semibold">
                M.v.A (Modular Verse Architect)
              </span>{" "}
              is a proprietary hip-hop production style and creative framework
              developed by Malik Johnson.{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span> is
              built around the idea that{" "}
              <span className="text-[#a970ff] font-semibold">melody</span> and{" "}
              <span className="text-[#a970ff] font-semibold">rhythm</span> serve
              different purposes:{" "}
              <span className="text-[#a970ff] font-semibold">melody</span>{" "}
              provides identity and cohesion, while{" "}
              <span className="text-[#a970ff] font-semibold">
                drums and 808s
              </span>{" "}
              evolve to create new flow pockets throughout a track.{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span> is
              designed for artists who don't rap one way and want rhythmic
              variety without losing melodic consistency.
            </p>
          </section>

          <Separator className="my-8" />

          {/* Quote Block */}
          <div className="bg-card rounded-lg p-8 border border-[#a970ff]/30 text-center">
            <blockquote className="text-2xl font-medium italic text-foreground mb-3">
              "If the artist doesn't switch their flow, the beat will."
            </blockquote>
            <blockquote className="text-lg font-medium italic text-muted-foreground">
              "Built for artists who don't rap one way."
            </blockquote>
          </div>

          <Separator className="my-8" />

          {/* Core Philosophy / Framework */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-[#a970ff] text-center mb-6">
              Core Philosophy & Framework
            </h2>

            {/* What Is M.v.A? */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                What Is M.v.A?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                M.v.A (Modular Verse Architect) is a flow-driven hip-hop
                production system where a fixed melodic identity is preserved
                while verses evolve through modular drum, 808, and melodic
                modulation — without adding new instruments.
              </p>
            </div>

            {/* How M.v.A Beats Are Built */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                How M.v.A Beats Are Built
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every{" "}
                <span className="text-[#a970ff] font-semibold">M.v.A beat</span>{" "}
                follows a carefully designed{" "}
                <span className="text-[#a970ff] font-semibold">
                  modular architecture
                </span>{" "}
                where the{" "}
                <span className="text-[#a970ff] font-semibold">
                  melody stays constant
                </span>{" "}
                while the{" "}
                <span className="text-[#a970ff] font-semibold">
                  rhythm section (drums and 808)
                </span>{" "}
                evolves:
              </p>
              <ol className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] font-bold text-lg min-w-[2rem]">
                    1.
                  </span>
                  <div>
                    <strong className="text-[#a970ff]">Intro:</strong> Sets{" "}
                    <span className="text-[#a970ff] font-semibold">melody</span>{" "}
                    and mood with minimal{" "}
                    <span className="text-[#a970ff] font-semibold">
                      drums and 808
                    </span>
                    , establishing the sonic foundation that will remain
                    consistent throughout the track.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] font-bold text-lg min-w-[2rem]">
                    2.
                  </span>
                  <div>
                    <strong className="text-[#a970ff]">Chorus:</strong> Stable{" "}
                    <span className="text-[#a970ff] font-semibold">
                      drums + stable 808
                    </span>{" "}
                    create the anchor point. This is the{" "}
                    <span className="text-[#a970ff] font-semibold">
                      rhythmic home base
                    </span>{" "}
                    that listeners return to, providing familiarity and
                    structure.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] font-bold text-lg min-w-[2rem]">
                    3.
                  </span>
                  <div>
                    <strong className="text-[#a970ff]">Verse:</strong> Same{" "}
                    <span className="text-[#a970ff] font-semibold">
                      melodic identity
                    </span>{" "}
                    continues, but{" "}
                    <span className="text-[#a970ff] font-semibold">
                      drums and 808 change per module
                    </span>
                    . Each verse module introduces new rhythmic patterns while
                    maintaining the melodic thread, creating fresh energy
                    without losing cohesion.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] font-bold text-lg min-w-[2rem]">
                    4.
                  </span>
                  <div>
                    <strong className="text-[#a970ff]">Chorus Return:</strong>{" "}
                    <span className="text-[#a970ff] font-semibold">
                      Rhythm resets
                    </span>{" "}
                    back to the stable anchor pattern, providing a satisfying
                    return to the familiar groove.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] font-bold text-lg min-w-[2rem]">
                    5.
                  </span>
                  <div>
                    <strong className="text-[#a970ff]">Outro/Final:</strong>{" "}
                    Optional variation that may introduce subtle changes to
                    either{" "}
                    <span className="text-[#a970ff] font-semibold">melody</span>{" "}
                    or{" "}
                    <span className="text-[#a970ff] font-semibold">rhythm</span>{" "}
                    for a memorable conclusion.
                  </div>
                </li>
              </ol>
            </div>

            {/* NEW SECTION: Melody Modulation Rule */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                Melody Modulation Rule (Core M.v.A Constraint)
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A defining rule of M.v.A is{" "}
                <span className="text-[#a970ff] font-semibold">
                  melodic modulation without expansion
                </span>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Once the core melody and layers are established,{" "}
                <span className="text-[#a970ff] font-semibold">
                  no new melodic instruments are introduced
                </span>{" "}
                in verses or later sections. Instead, variation is created by
                modulating existing melodic material.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong className="text-[#a970ff]">
                  Allowed melodic modulation includes:
                </strong>
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4 ml-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Octave shifts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Register changes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    Filter movement (low-pass, high-pass, band shaping)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Automation (volume, pan, stereo width, texture)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Rhythmic re-spacing or emphasis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    Harmonic emphasis using existing notes or voicings
                  </span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong className="text-[#a970ff]">Not allowed:</strong>
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4 ml-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Adding new melodic instruments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Introducing new sound sources</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Replacing the core melodic identity</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This rule ensures the beat evolves internally rather than
                through expansion. The melody remains recognizable while
                adapting across verse modules.
              </p>
              <p className="text-muted-foreground leading-relaxed font-medium">
                <span className="text-[#a970ff] font-semibold">
                  M.v.A Rule:
                </span>{" "}
                Once melody and layers are laid down, variation comes from
                modulation — not addition.
              </p>
            </div>

            {/* NEW SECTION: Why M.v.A Uses Modulation Instead of New Instruments */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                Why M.v.A Uses Modulation Instead of New Instruments
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Traditional beat arrangements often rely on adding or removing
                instruments to create variation. M.v.A takes a different
                approach.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                By modulating existing melodic elements instead of introducing
                new ones, M.v.A:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-4 ml-4">
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Preserves melodic identity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Avoids over-arrangement</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Keeps verses adaptable for multiple flows</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>Maintains cohesion across the entire song</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                The beat evolves from within, allowing artists to move freely
                without the song losing its core identity.
              </p>
            </div>

            {/* Visual Diagram */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-6 text-[#a970ff] text-center">
                Modular Beat System Diagram
              </h3>
              <div className="flex justify-center">
                <img
                  src="/assets/generated/mva-structure-diagram.dim_800x600.png"
                  alt="M.v.A Modular Verse Architect Structure Diagram showing the production flow from Intro through Chorus, Verse Modules, Chorus Return, and Outro/Final sections"
                  className="w-full max-w-3xl h-auto rounded-lg border border-[#a970ff]/20 shadow-lg shadow-[#a970ff]/10"
                />
              </div>
            </div>

            {/* What Makes M.v.A Different */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                What Makes M.v.A Different
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Traditional beats often change everything at once or stay
                completely static.{" "}
                <span className="text-[#a970ff] font-semibold">M.v.A</span>{" "}
                takes a different approach by separating{" "}
                <span className="text-[#a970ff] font-semibold">melody</span>{" "}
                from{" "}
                <span className="text-[#a970ff] font-semibold">rhythm</span>:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    <strong className="text-[#a970ff]">
                      Melody Consistency:
                    </strong>{" "}
                    The melodic identity remains recognizable throughout the
                    track, even as it is modulated across sections.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    <strong className="text-[#a970ff]">
                      Rhythm Evolution:
                    </strong>{" "}
                    <span className="text-[#a970ff] font-semibold">
                      Drums and 808 patterns
                    </span>{" "}
                    change together during verse modules, creating fresh
                    rhythmic pockets for different flows
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    <strong className="text-[#a970ff]">
                      Flow Adaptability:
                    </strong>{" "}
                    Each{" "}
                    <span className="text-[#a970ff] font-semibold">
                      rhythmic module
                    </span>{" "}
                    offers new bounce and pocket options while maintaining the
                    melodic identity
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    <strong className="text-[#a970ff]">
                      Cohesive Variation:
                    </strong>{" "}
                    Changes feel intentional and connected rather than random or
                    disjointed
                  </span>
                </li>
              </ul>
            </div>

            {/* Who M.v.A Is For */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                Who M.v.A Is For
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <span className="text-[#a970ff] font-semibold">
                  M.v.A beats
                </span>{" "}
                are designed for{" "}
                <span className="text-[#a970ff] font-semibold">
                  versatile artists
                </span>{" "}
                who switch flows and cadences throughout their verses. If you're
                a rapper who doesn't stick to one delivery style, who likes to
                ride different pockets, or who wants{" "}
                <span className="text-[#a970ff] font-semibold">
                  rhythmic variety
                </span>{" "}
                without losing the song's{" "}
                <span className="text-[#a970ff] font-semibold">
                  melodic identity
                </span>
                , <span className="text-[#a970ff] font-semibold">M.v.A</span>{" "}
                provides the perfect foundation. These beats work for artists
                who value both consistency and evolution in their music.
              </p>
            </div>

            {/* How to Rap on M.v.A Beats */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                How to Rap on M.v.A Beats
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Approach{" "}
                <span className="text-[#a970ff] font-semibold">
                  M.v.A beats
                </span>{" "}
                by recognizing the{" "}
                <span className="text-[#a970ff] font-semibold">
                  two-layer structure
                </span>
                : the constant{" "}
                <span className="text-[#a970ff] font-semibold">melody</span> and
                the evolving{" "}
                <span className="text-[#a970ff] font-semibold">rhythm</span>.
                Use the melodic consistency as your anchor while exploring
                different flows with each rhythmic module:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    Lock into the{" "}
                    <span className="text-[#a970ff] font-semibold">melody</span>{" "}
                    first—it's your core reference point
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    Experiment with different{" "}
                    <span className="text-[#a970ff] font-semibold">flows</span>{" "}
                    as the{" "}
                    <span className="text-[#a970ff] font-semibold">
                      drums and 808
                    </span>{" "}
                    change in each verse module
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    Return to familiar cadences during{" "}
                    <span className="text-[#a970ff] font-semibold">
                      chorus sections
                    </span>{" "}
                    where the rhythm stabilizes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#a970ff] text-xl">•</span>
                  <span>
                    Let the{" "}
                    <span className="text-[#a970ff] font-semibold">
                      rhythmic changes
                    </span>{" "}
                    inspire new delivery styles while staying melodically
                    grounded
                  </span>
                </li>
              </ul>
            </div>

            {/* M.v.A Philosophy */}
            <div className="bg-card rounded-lg p-8 border border-border">
              <h3 className="text-2xl font-bold mb-4 text-[#a970ff]">
                M.v.A Philosophy
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The{" "}
                <span className="text-[#a970ff] font-semibold">
                  M.v.A philosophy
                </span>{" "}
                is built on the principle that{" "}
                <span className="text-[#a970ff] font-semibold">melody</span> and{" "}
                <span className="text-[#a970ff] font-semibold">rhythm</span>{" "}
                serve different purposes in hip-hop production.{" "}
                <span className="text-[#a970ff] font-semibold">Melody</span>{" "}
                provides identity and memorability, while{" "}
                <span className="text-[#a970ff] font-semibold">rhythm</span>{" "}
                creates pocket and flow opportunities. By preserving melodic
                identity while evolving drums, 808s, and melodic modulation,
                M.v.A provides cohesive flexibility for artists. This approach
                respects both the producer's vision and the artist's need for
                creative flexibility.
              </p>
            </div>

            {/* One-Line Definition */}
            <div className="bg-card rounded-lg p-8 border border-[#a970ff]/30">
              <h3 className="text-2xl font-bold mb-4 text-center text-[#a970ff]">
                One-Line Definition
              </h3>
              <p className="text-lg text-center text-foreground font-medium">
                M.v.A is a flow-driven hip-hop production style where a fixed
                melodic identity is preserved while verses evolve through
                modular drum, 808, and melodic modulation—without adding new
                instruments.
              </p>
            </div>
          </section>

          <Separator className="my-8" />

          {/* About the Creator */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-bold mb-4 text-[#a970ff]">
              About the Creator
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              <span className="text-[#a970ff] font-semibold">
                Malik Johnson
              </span>{" "}
              is a producer and creative architect who developed{" "}
              <span className="text-[#a970ff] font-semibold">
                M.v.A (Modular Verse Architect)
              </span>{" "}
              as a response to rigid, one-flow production styles in modern
              hip-hop. Rather than forcing artists into a single pocket, Malik
              designed{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span> to
              adapt to the artist — allowing{" "}
              <span className="text-[#a970ff] font-semibold">rhythm</span> to
              evolve while{" "}
              <span className="text-[#a970ff] font-semibold">melody</span>{" "}
              anchors the song's identity.{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span>{" "}
              represents more than a beat structure; it is a{" "}
              <span className="text-[#a970ff] font-semibold">
                creative system and philosophy
              </span>{" "}
              built for artists who don't rap one way, don't think one way, and
              refuse to be boxed into static production styles.
            </p>
          </section>

          <Separator className="my-8" />

          {/* M.v.A Preview Section */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-bold mb-6 text-[#a970ff] text-center">
              M.v.A Preview
            </h2>
            {loadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : mvaPreview ? (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-[#a970ff]/30 bg-card p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#a970ff]/20 shadow-lg shadow-[#a970ff]/20">
                      <Music className="h-10 w-10 text-[#a970ff]" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground mb-1">
                        Experience M.v.A Production
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Full-length beat preview showcasing the modular verse
                        architecture
                      </p>
                    </div>
                    <Button
                      onClick={handlePlayPreview}
                      size="lg"
                      className="gap-2 shadow-lg shadow-[#a970ff]/20 hover:shadow-[#a970ff]/30 transition-all bg-[#a970ff] hover:bg-[#a970ff]/90"
                    >
                      {isPreviewPlaying ? (
                        <>
                          <Pause className="h-5 w-5" />
                          Pause Preview
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Play Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No preview available at this time.
                </p>
              </div>
            )}
          </section>

          <Separator className="my-8" />

          {/* Trademark & Use Notice */}
          <section className="bg-card rounded-lg p-8 border border-border">
            <h2 className="text-2xl font-bold mb-4 text-[#a970ff]">
              Trademark & Use Notice
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <span className="text-[#a970ff] font-semibold">
                M.v.A (Modular Verse Architect)
              </span>{" "}
              is a proprietary production style and creative framework developed
              by{" "}
              <span className="text-[#a970ff] font-semibold">
                Malik Johnson
              </span>
              . The term{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span>, its
              associated methodology, and this framework are protected
              intellectual property.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-[#a970ff]">Authorized Use:</strong> Beats
              produced under the{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span>{" "}
              framework and purchased through this platform come with full usage
              rights as specified in your license agreement. You may use these
              beats for commercial and non-commercial purposes according to your
              purchased license tier.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-[#a970ff]">Unauthorized Use:</strong> The{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span> name,
              methodology, and framework may not be used, reproduced, or claimed
              by other producers or entities without explicit written permission
              from{" "}
              <span className="text-[#a970ff] font-semibold">
                Malik Johnson
              </span>
              . This includes but is not limited to: marketing beats as{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span> style,
              using the{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A</span> name
              in promotional materials, or claiming to produce{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A beats</span>{" "}
              without authorization.
            </p>
          </section>

          <Separator className="my-8" />

          {/* CTA / Browse Beats */}
          <section className="bg-gradient-to-br from-[#a970ff]/10 to-[#a970ff]/5 rounded-lg p-8 border border-[#a970ff]/30 text-center">
            <h2 className="text-3xl font-bold mb-4 text-[#a970ff]">
              Ready to Experience M.v.A?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Browse our collection of{" "}
              <span className="text-[#a970ff] font-semibold">M.v.A beats</span>{" "}
              and find the perfect foundation for your next track. Each beat is
              crafted with the{" "}
              <span className="text-[#a970ff] font-semibold">
                modular verse architecture
              </span>{" "}
              that gives you rhythmic freedom while maintaining melodic
              cohesion.
            </p>
            <Button
              size="lg"
              className="gap-2 shadow-lg shadow-[#a970ff]/20 hover:shadow-[#a970ff]/30 transition-all bg-[#a970ff] hover:bg-[#a970ff]/90"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <Music className="h-5 w-5" />
              Browse M.v.A Beats
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
