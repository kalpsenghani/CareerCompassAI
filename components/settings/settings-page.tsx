"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Palette, Upload } from "lucide-react"

export function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "Senior Software Engineer with 8+ years of experience in full-stack development.",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    weeklyReports: false,
  })

  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    shareAnalytics: true,
    allowDataExport: true,
  })

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy
        </TabsTrigger>
        <TabsTrigger value="appearance" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Appearance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="text-lg">JD</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
              />
            </div>

            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Job Alerts</h4>
                  <p className="text-sm text-gray-500">Get notified about new job matches</p>
                </div>
                <Switch
                  checked={notifications.jobAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, jobAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-gray-500">Receive weekly career progress reports</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                />
              </div>
            </div>

            <Button>Save Preferences</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="privacy">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Public Profile</h4>
                  <p className="text-sm text-gray-500">Make your profile visible to recruiters</p>
                </div>
                <Switch
                  checked={privacy.profilePublic}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, profilePublic: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Share Analytics</h4>
                  <p className="text-sm text-gray-500">Help improve our service with anonymous usage data</p>
                </div>
                <Switch
                  checked={privacy.shareAnalytics}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, shareAnalytics: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Data Export</h4>
                  <p className="text-sm text-gray-500">Allow exporting your data</p>
                </div>
                <Switch
                  checked={privacy.allowDataExport}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, allowDataExport: checked })}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Data Management</h4>
              <div className="flex gap-2">
                <Button variant="outline">Export Data</Button>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </div>

            <Button>Save Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Appearance Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Theme</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500">
                  <div className="w-full h-20 bg-white border rounded mb-2"></div>
                  <p className="text-sm text-center">Light</p>
                </div>
                <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500">
                  <div className="w-full h-20 bg-gray-900 border rounded mb-2"></div>
                  <p className="text-sm text-center">Dark</p>
                </div>
                <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500">
                  <div className="w-full h-20 bg-gradient-to-br from-white to-gray-900 border rounded mb-2"></div>
                  <p className="text-sm text-center">System</p>
                </div>
              </div>
            </div>

            <Button>Save Appearance</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
