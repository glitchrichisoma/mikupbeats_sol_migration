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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Coins, Link2Off, Send, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddMessage,
  useDeleteMessage,
  useDeleteSection,
  useGetForumRewardConfig,
  useGetMessages,
  useGetSection,
  useSetSectionLinkSharing,
} from "../hooks/useQueries";

// URL regex pattern for detecting links
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Sanitize URL to prevent XSS
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return "#";
  } catch {
    return "#";
  }
}

// Parse message text and convert URLs to clickable links
function parseMessageWithLinks(
  text: string,
  linkSharingEnabled: boolean,
): React.ReactNode {
  if (!linkSharingEnabled) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(URL_REGEX);

  match = regex.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const url = match[0];
    const sanitizedUrl = sanitizeUrl(url);
    parts.push(
      <a
        key={match.index}
        href={sanitizedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-purple-400 hover:text-purple-300 underline font-medium transition-colors"
        onClick={(e) => {
          if (sanitizedUrl === "#") {
            e.preventDefault();
          }
        }}
      >
        {url}
      </a>,
    );

    lastIndex = regex.lastIndex;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/** Format a token amount: up to 8 decimals, no scientific notation, trailing zeros trimmed */
function formatTokenAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "0";
  // Convert to fixed 8 decimals then strip trailing zeros
  const fixed = amount.toFixed(8);
  return fixed.replace(/\.?0+$/, "");
}

export default function SectionDetailPage() {
  const { sectionId } = useParams({ from: "/forum/section/$sectionId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [message, setMessage] = useState("");
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [showDeleteSectionDialog, setShowDeleteSectionDialog] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  // Per-session message count for reward cadence tracking
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  // Reward notification: null = hidden, number = amount earned
  const [rewardToast, setRewardToast] = useState<number | null>(null);
  const rewardToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: section, isLoading: sectionLoading } = useGetSection(sectionId);
  const {
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetMessages(sectionId);
  const addMessageMutation = useAddMessage();
  const deleteMessageMutation = useDeleteMessage();
  const deleteSectionMutation = useDeleteSection();
  const setLinkSharingMutation = useSetSectionLinkSharing();

  // Forum reward data
  const { data: forumRewardConfig } = useGetForumRewardConfig();

  const forumRewardsActive =
    forumRewardConfig?.isEnabled === true &&
    forumRewardConfig != null &&
    forumRewardConfig.tokensPerMessage > 0;

  const rewardEveryN = forumRewardConfig
    ? Number(forumRewardConfig.rewardEveryNMessages ?? 1n)
    : 1;

  const isAuthenticated = !!identity;
  const isAdmin = section?.creator === "admin";
  const linkSharingEnabled = section?.linkSharingEnabled ?? false;

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > previousMessageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length, previousMessageCount]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && previousMessageCount === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, previousMessageCount]);

  // Cleanup reward toast timer on unmount
  useEffect(() => {
    return () => {
      if (rewardToastTimerRef.current) {
        clearTimeout(rewardToastTimerRef.current);
      }
    };
  }, []);

  const showRewardNotification = (amount: number) => {
    if (rewardToastTimerRef.current) {
      clearTimeout(rewardToastTimerRef.current);
    }
    setRewardToast(amount);
    rewardToastTimerRef.current = setTimeout(() => {
      setRewardToast(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await addMessageMutation.mutateAsync({
        sectionId,
        id: messageId,
        message: message.trim(),
      });
      setMessage("");
      textareaRef.current?.focus();

      // Track session message count and show reward notification if applicable
      const newCount = sessionMessageCount + 1;
      setSessionMessageCount(newCount);

      if (
        forumRewardsActive &&
        forumRewardConfig != null &&
        rewardEveryN > 0 &&
        newCount % rewardEveryN === 0
      ) {
        showRewardNotification(forumRewardConfig.tokensPerMessage);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;
    try {
      await deleteMessageMutation.mutateAsync(deleteMessageId);
      setDeleteMessageId(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleDeleteSection = async () => {
    try {
      await deleteSectionMutation.mutateAsync(sectionId);
      navigate({ to: "/forum" });
    } catch (error) {
      console.error("Failed to delete section:", error);
    }
  };

  const handleToggleLinkSharing = async (enabled: boolean) => {
    try {
      await setLinkSharingMutation.mutateAsync({ id: sectionId, enabled });
    } catch (error) {
      console.error("Failed to update link sharing:", error);
    }
  };

  if (sectionLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Section not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-52">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/forum" })}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forum
          </Button>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-[#a970ff] mb-2">
                    {section.title}
                  </CardTitle>
                  <p className="text-muted-foreground">{section.description}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteSectionDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2Off className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor="link-sharing"
                        className="text-sm font-medium"
                      >
                        Enable Link Sharing
                      </Label>
                    </div>
                    <Switch
                      id="link-sharing"
                      checked={linkSharingEnabled}
                      onCheckedChange={handleToggleLinkSharing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    When enabled, URLs in messages will be converted to
                    clickable links
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-6">
          {messages.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No messages yet. Be the first to post!
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((msg, index) => {
              const isNewMessage =
                index >= previousMessageCount - 1 && previousMessageCount > 0;
              return (
                <Card
                  key={msg.id}
                  className={`bg-card border-border transition-all duration-500 ${
                    isNewMessage ? "animate-in slide-in-from-bottom-2" : ""
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-[#a970ff] truncate">
                            {msg.authorName || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              Number(msg.createdAt) / 1000000,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
                          {parseMessageWithLinks(
                            msg.message,
                            linkSharingEnabled,
                          )}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteMessageId(msg.id)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isAuthenticated ? (
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
            data-ocid="forum.message_input_panel"
          >
            <div className="container mx-auto max-w-4xl px-4 py-3">
              <form onSubmit={handleSubmit}>
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                    className="min-h-[60px] max-h-[200px] resize-none"
                    data-ocid="forum.message_input"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || addMessageMutation.isPending}
                    className="shrink-0"
                    data-ocid="forum.send_button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Forum reward info line — only shown when rewards are active */}
                {forumRewardsActive && forumRewardConfig && (
                  <p
                    className="mt-1.5 text-xs text-purple-400 flex items-center gap-1"
                    data-ocid="forum.reward_info"
                  >
                    <Coins className="h-3 w-3" />
                    Earn MIK97 for posting —{" "}
                    {formatTokenAmount(forumRewardConfig.tokensPerMessage)}{" "}
                    MIK97
                    {rewardEveryN > 1
                      ? ` every ${rewardEveryN} messages`
                      : " per message"}
                  </p>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
            <div className="container mx-auto max-w-4xl px-4 py-4 text-center">
              <p className="text-muted-foreground">
                Please log in to post messages
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reward toast notification — bottom-right, auto-dismisses after 3s */}
      {rewardToast !== null && (
        <div
          className="fixed bottom-24 right-4 z-50 bg-card border border-purple-500 rounded-lg px-4 py-3 shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300"
          data-ocid="forum.reward_toast"
        >
          <Coins className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="text-sm font-medium text-foreground">
            You earned{" "}
            <span className="text-purple-400">
              {formatTokenAmount(rewardToast)} MIK97
            </span>{" "}
            for this post
          </span>
        </div>
      )}

      {/* Delete Message Dialog */}
      <AlertDialog
        open={!!deleteMessageId}
        onOpenChange={() => setDeleteMessageId(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="forum.delete_msg.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive hover:bg-destructive/90"
              data-ocid="forum.delete_msg.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Section Dialog */}
      <AlertDialog
        open={showDeleteSectionDialog}
        onOpenChange={setShowDeleteSectionDialog}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire section? All messages
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="forum.delete_section.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive hover:bg-destructive/90"
              data-ocid="forum.delete_section.confirm_button"
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
