import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Edit,
  Loader2,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddReplay,
  useAddUpcomingShow,
  useDeleteReplay,
  useDeleteUpcomingShow,
  useGetReplays,
  useGetUpcomingShows,
  useUpdateReplay,
  useUpdateUpcomingShow,
} from "../hooks/useQueries";

export default function LiveShowsManagement() {
  const { data: upcomingShows = [], isLoading: showsLoading } =
    useGetUpcomingShows();
  const { data: replays = [], isLoading: replaysLoading } = useGetReplays();

  const addShow = useAddUpcomingShow();
  const updateShow = useUpdateUpcomingShow();
  const deleteShow = useDeleteUpcomingShow();

  const addReplay = useAddReplay();
  const updateReplay = useUpdateReplay();
  const deleteReplay = useDeleteReplay();

  const [showDialog, setShowDialog] = useState(false);
  const [replayDialog, setReplayDialog] = useState(false);
  const [editingShow, setEditingShow] = useState<{
    id: string;
    title: string;
    date: string;
    time: string;
    description: string;
  } | null>(null);
  const [editingReplay, setEditingReplay] = useState<{
    id: string;
    title: string;
    description: string;
    replayUrl: string;
  } | null>(null);

  const [showForm, setShowForm] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
  });

  const [replayForm, setReplayForm] = useState({
    title: "",
    description: "",
    replayUrl: "",
  });

  const handleAddShow = async () => {
    if (
      !showForm.title ||
      !showForm.date ||
      !showForm.time ||
      !showForm.description
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const id = `show-${Date.now()}`;
      await addShow.mutateAsync({ id, ...showForm });
      toast.success("Upcoming show added successfully");
      setShowForm({ title: "", date: "", time: "", description: "" });
      setShowDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add upcoming show");
    }
  };

  const handleUpdateShow = async () => {
    if (
      !editingShow ||
      !showForm.title ||
      !showForm.date ||
      !showForm.time ||
      !showForm.description
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await updateShow.mutateAsync({ id: editingShow.id, ...showForm });
      toast.success("Upcoming show updated successfully");
      setShowForm({ title: "", date: "", time: "", description: "" });
      setEditingShow(null);
      setShowDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update upcoming show");
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this upcoming show?")) return;

    try {
      await deleteShow.mutateAsync(id);
      toast.success("Upcoming show deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete upcoming show");
    }
  };

  const handleAddReplay = async () => {
    if (!replayForm.title || !replayForm.description || !replayForm.replayUrl) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const id = `replay-${Date.now()}`;
      await addReplay.mutateAsync({ id, ...replayForm });
      toast.success("Replay added successfully");
      setReplayForm({ title: "", description: "", replayUrl: "" });
      setReplayDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add replay");
    }
  };

  const handleUpdateReplay = async () => {
    if (
      !editingReplay ||
      !replayForm.title ||
      !replayForm.description ||
      !replayForm.replayUrl
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await updateReplay.mutateAsync({ id: editingReplay.id, ...replayForm });
      toast.success("Replay updated successfully");
      setReplayForm({ title: "", description: "", replayUrl: "" });
      setEditingReplay(null);
      setReplayDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update replay");
    }
  };

  const handleDeleteReplay = async (id: string) => {
    if (!confirm("Are you sure you want to delete this replay?")) return;

    try {
      await deleteReplay.mutateAsync(id);
      toast.success("Replay deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete replay");
    }
  };

  const openEditShow = (show: any, index: number) => {
    const id = `show-${index}`;
    setEditingShow({ id, ...show });
    setShowForm({
      title: show.title,
      date: show.date,
      time: show.time,
      description: show.description,
    });
    setShowDialog(true);
  };

  const openEditReplay = (replay: any, index: number) => {
    const id = `replay-${index}`;
    setEditingReplay({ id, ...replay });
    setReplayForm({
      title: replay.title,
      description: replay.description,
      replayUrl: replay.replayUrl,
    });
    setReplayDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          Live Shows & Replays Management
        </h2>
        <p className="text-muted-foreground">
          Manage upcoming shows and archived stream replays
        </p>
      </div>

      <Tabs defaultValue="shows" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card">
          <TabsTrigger value="shows" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Shows
          </TabsTrigger>
          <TabsTrigger value="replays" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Replays
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shows" className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={showDialog && !editingShow}
              onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) {
                  setShowForm({
                    title: "",
                    date: "",
                    time: "",
                    description: "",
                  });
                  setEditingShow(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Upcoming Show
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30">
                <DialogHeader>
                  <DialogTitle>Add Upcoming Show</DialogTitle>
                  <DialogDescription>
                    Schedule a new upcoming livestream
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="show-title">Title</Label>
                    <Input
                      id="show-title"
                      value={showForm.title}
                      onChange={(e) =>
                        setShowForm({ ...showForm, title: e.target.value })
                      }
                      placeholder="Beat Making Session"
                      className="bg-background border-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="show-date">Date</Label>
                      <Input
                        id="show-date"
                        type="date"
                        value={showForm.date}
                        onChange={(e) =>
                          setShowForm({ ...showForm, date: e.target.value })
                        }
                        className="bg-background border-primary/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="show-time">Time</Label>
                      <Input
                        id="show-time"
                        type="time"
                        value={showForm.time}
                        onChange={(e) =>
                          setShowForm({ ...showForm, time: e.target.value })
                        }
                        className="bg-background border-primary/30"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="show-description">Description</Label>
                    <Textarea
                      id="show-description"
                      value={showForm.description}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Join me for a live beat-making session..."
                      rows={3}
                      className="bg-background border-primary/30"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddShow}
                    disabled={addShow.isPending}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {addShow.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Show
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {showsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : upcomingShows.length > 0 ? (
            <div className="grid gap-4">
              {upcomingShows.map((show, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: shows have no stable frontend id
                <Card key={index} className="border-primary/20 bg-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{show.title}</CardTitle>
                        <CardDescription>
                          {show.date} at {show.time}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Dialog
                          open={
                            showDialog && editingShow?.id === `show-${index}`
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setShowDialog(false);
                              setEditingShow(null);
                              setShowForm({
                                title: "",
                                date: "",
                                time: "",
                                description: "",
                              });
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditShow(show, index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-primary/30">
                            <DialogHeader>
                              <DialogTitle>Edit Upcoming Show</DialogTitle>
                              <DialogDescription>
                                Update show details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-show-title">Title</Label>
                                <Input
                                  id="edit-show-title"
                                  value={showForm.title}
                                  onChange={(e) =>
                                    setShowForm({
                                      ...showForm,
                                      title: e.target.value,
                                    })
                                  }
                                  className="bg-background border-primary/30"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-show-date">Date</Label>
                                  <Input
                                    id="edit-show-date"
                                    type="date"
                                    value={showForm.date}
                                    onChange={(e) =>
                                      setShowForm({
                                        ...showForm,
                                        date: e.target.value,
                                      })
                                    }
                                    className="bg-background border-primary/30"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-show-time">Time</Label>
                                  <Input
                                    id="edit-show-time"
                                    type="time"
                                    value={showForm.time}
                                    onChange={(e) =>
                                      setShowForm({
                                        ...showForm,
                                        time: e.target.value,
                                      })
                                    }
                                    className="bg-background border-primary/30"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="edit-show-description">
                                  Description
                                </Label>
                                <Textarea
                                  id="edit-show-description"
                                  value={showForm.description}
                                  onChange={(e) =>
                                    setShowForm({
                                      ...showForm,
                                      description: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="bg-background border-primary/30"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleUpdateShow}
                                disabled={updateShow.isPending}
                                className="bg-gradient-to-r from-primary to-accent"
                              >
                                {updateShow.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Update Show
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShow(`show-${index}`)}
                          disabled={deleteShow.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {show.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="bg-card border-primary/20">
              <AlertDescription className="text-center">
                No upcoming shows scheduled. Add your first show above!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="replays" className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={replayDialog && !editingReplay}
              onOpenChange={(open) => {
                setReplayDialog(open);
                if (!open) {
                  setReplayForm({ title: "", description: "", replayUrl: "" });
                  setEditingReplay(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Replay
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30">
                <DialogHeader>
                  <DialogTitle>Add Replay</DialogTitle>
                  <DialogDescription>
                    Add an archived stream replay
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="replay-title">Title</Label>
                    <Input
                      id="replay-title"
                      value={replayForm.title}
                      onChange={(e) =>
                        setReplayForm({ ...replayForm, title: e.target.value })
                      }
                      placeholder="Beat Making Session Replay"
                      className="bg-background border-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="replay-description">Description</Label>
                    <Textarea
                      id="replay-description"
                      value={replayForm.description}
                      onChange={(e) =>
                        setReplayForm({
                          ...replayForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Watch the full recording of this beat-making session..."
                      rows={3}
                      className="bg-background border-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="replay-url">Replay URL</Label>
                    <Input
                      id="replay-url"
                      value={replayForm.replayUrl}
                      onChange={(e) =>
                        setReplayForm({
                          ...replayForm,
                          replayUrl: e.target.value,
                        })
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      className="bg-background border-primary/30"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddReplay}
                    disabled={addReplay.isPending}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {addReplay.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Replay
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {replaysLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : replays.length > 0 ? (
            <div className="grid gap-4">
              {replays.map((replay, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: replays have no stable frontend id
                <Card key={index} className="border-primary/20 bg-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{replay.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {replay.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Dialog
                          open={
                            replayDialog &&
                            editingReplay?.id === `replay-${index}`
                          }
                          onOpenChange={(open) => {
                            if (!open) {
                              setReplayDialog(false);
                              setEditingReplay(null);
                              setReplayForm({
                                title: "",
                                description: "",
                                replayUrl: "",
                              });
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditReplay(replay, index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-primary/30">
                            <DialogHeader>
                              <DialogTitle>Edit Replay</DialogTitle>
                              <DialogDescription>
                                Update replay details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-replay-title">Title</Label>
                                <Input
                                  id="edit-replay-title"
                                  value={replayForm.title}
                                  onChange={(e) =>
                                    setReplayForm({
                                      ...replayForm,
                                      title: e.target.value,
                                    })
                                  }
                                  className="bg-background border-primary/30"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-replay-description">
                                  Description
                                </Label>
                                <Textarea
                                  id="edit-replay-description"
                                  value={replayForm.description}
                                  onChange={(e) =>
                                    setReplayForm({
                                      ...replayForm,
                                      description: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="bg-background border-primary/30"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-replay-url">
                                  Replay URL
                                </Label>
                                <Input
                                  id="edit-replay-url"
                                  value={replayForm.replayUrl}
                                  onChange={(e) =>
                                    setReplayForm({
                                      ...replayForm,
                                      replayUrl: e.target.value,
                                    })
                                  }
                                  className="bg-background border-primary/30"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleUpdateReplay}
                                disabled={updateReplay.isPending}
                                className="bg-gradient-to-r from-primary to-accent"
                              >
                                {updateReplay.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Update Replay
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReplay(`replay-${index}`)}
                          disabled={deleteReplay.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={replay.replayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      {replay.replayUrl}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="bg-card border-primary/20">
              <AlertDescription className="text-center">
                No replays available. Add your first replay above!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
