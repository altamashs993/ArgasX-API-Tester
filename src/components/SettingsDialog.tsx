import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { StorageService } from '@/services/storageService';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings>({
    httpVersion: 'HTTP/1.x',
    maxResponseSize: 50,
    theme: 'dark'
  });

  useEffect(() => {
    if (open) {
      const savedSettings = StorageService.getSettings();
      setSettings(savedSettings);
    }
  }, [open]);

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      theme: theme
    };
    StorageService.saveSettings(updatedSettings);
    onOpenChange(false);
  };

  const handleMaxResponseSizeChange = (value: string) => {
    const size = parseFloat(value);
    if (!isNaN(size) && size > 0) {
      setSettings(prev => ({
        ...prev,
        maxResponseSize: size
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your ARGASX API Tester preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HTTP Settings</CardTitle>
                <CardDescription>
                  Configure HTTP protocol settings for requests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="http-version">HTTP Version</Label>
                  <Select
                    value={settings.httpVersion}
                    onValueChange={(value: 'HTTP/1.x' | 'HTTP/2') => 
                      setSettings(prev => ({ ...prev, httpVersion: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HTTP/1.x">HTTP/1.x</SelectItem>
                      <SelectItem value="HTTP/2">HTTP/2</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the HTTP version to use for sending requests.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Settings</CardTitle>
                <CardDescription>
                  Configure response handling preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-response-size">Maximum Response Size (MB)</Label>
                  <Input
                    id="max-response-size"
                    type="number"
                    min="1"
                    step="0.1"
                    value={settings.maxResponseSize}
                    onChange={(e) => handleMaxResponseSizeChange(e.target.value)}
                    placeholder="50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Set the maximum size of a response to download. Set to 0 for unlimited size.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="theme" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of your API tester.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme or sync with your system settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}