import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

export default function AccountSetupPage() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setIsCreator(userProfile.isCreator);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim(), isCreator });
      toast.success("Profile saved successfully!");
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center justify-center gap-3">
            <User className="h-10 w-10" />
            Account Setup
          </h1>
          <p className="text-muted-foreground">
            Configure your profile information
          </p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              {userProfile
                ? "Update your profile details"
                : "Complete your registration to access all features"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCreator"
                  checked={isCreator}
                  onCheckedChange={(checked) =>
                    setIsCreator(checked as boolean)
                  }
                />
                <Label
                  htmlFor="isCreator"
                  className="text-sm font-normal cursor-pointer"
                >
                  I am a creator/artist (allows you to submit showcases)
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={saveProfile.isPending}
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
