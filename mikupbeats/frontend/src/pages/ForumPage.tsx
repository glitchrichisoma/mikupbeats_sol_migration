import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  Link2Off,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { PageType, UserRole } from "../backend";
import CreateThreadDialog from "../components/CreateThreadDialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteSection,
  useGetSections,
  useRecordSiteVisit,
} from "../hooks/useQueries";

export default function ForumPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const recordVisit = useRecordSiteVisit();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  const { data: sections = [], isLoading } = useGetSections();
  const deleteSectionMutation = useDeleteSection();

  const isAdmin = identity !== null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit to run once
  useEffect(() => {
    // Record site visit when page loads
    recordVisit.mutate(PageType.forum);
  }, []);

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;

    try {
      await deleteSectionMutation.mutateAsync(deleteSectionId);
      setDeleteSectionId(null);
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="skeleton-block h-10 w-64 mb-4" />
            <div className="skeleton-block h-4 w-80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <div
                key={k}
                className="rounded-lg border border-border bg-card p-5 space-y-3"
              >
                <div className="skeleton-block h-6 w-3/4" />
                <div className="skeleton-block h-4 w-full" />
                <div className="skeleton-block h-4 w-2/3" />
                <div className="skeleton-block h-3 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-purple-400">
              Community Forum
            </h1>
            {isAdmin && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Chat Room
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            Join the conversation in our interactive chat rooms
          </p>
        </div>

        {/* Sections Grid */}
        {sections.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No chat rooms yet</p>
              {isAdmin && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Chat Room
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Card
                key={section.id}
                className="bg-card border-border hover:border-purple-500/50 transition-all cursor-pointer group"
                onClick={() => navigate({ to: `/forum/section/${section.id}` })}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl text-purple-400 group-hover:text-purple-300 transition-colors">
                      {section.title}
                    </CardTitle>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSectionId(section.id);
                        }}
                        className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {section.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>
                        By{" "}
                        <span className="text-purple-400 font-medium">
                          {section.creatorName}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.linkSharingEnabled ? (
                        <>
                          <LinkIcon className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-400 text-xs">Links</span>
                        </>
                      ) : (
                        <>
                          <Link2Off className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">No links</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(
                      Number(section.createdAt) / 1000000,
                    ).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateThreadDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteSectionId}
        onOpenChange={() => setDeleteSectionId(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-purple-400">
              Delete Chat Room
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this chat room? All messages will
              be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
