

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { createClient } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const defaultAvatarUrl = "https://gfpzygqegzakluihhkkr.supabase.co/storage/v1/object/sign/Lg%20pay/IMG_20260402_224703_814.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9jMWRjNDIxNy1iODI0LTQ4ZjEtODQ3ZS04OWU1NWI3YzdhMjEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMZyBwYXkvSU1HXzIwMjYwNDAyXzIyNDcwM184MTQuanBnIiwiaWF0IjoxNzc1MTUwMzMxLCJleHAiOjE4MDY2ODYzMzF9.o5z7uxui9h2o-GVKG9znk4TKBAoK4WMsLKY6NPZ8_1o";

export default function SettingsPage() {
  const { profile: userProfile, loading: profileLoading } = useSupabaseUser();
  const supabase = createClient();
  const { toast } = useToast();

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'UID Copied!' });
    });
  };

  const handleNameChange = async () => {
    if (!userProfile || !newName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: newName })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Your name has been updated.' });
      setIsNameDialogOpen(false);
    } catch (error) {
      console.error("Error updating name: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update name.' });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my">
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-grow space-y-6 p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Basic Information</h2>
        {profileLoading ? (
             <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
            <div className="space-y-px overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <span className="font-medium">Avatar</span>
                    <div className="flex items-center gap-2">
                    <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={defaultAvatarUrl} alt={userProfile?.display_name} />
                        <AvatarFallback className="bg-yellow-400 text-yellow-900 font-bold text-lg">
                            {userProfile?.display_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                        </Avatar>
                    </div>
                    </div>
                </div>
                <div className="mx-4 border-b"></div>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => { if (!isSaving) { setNewName(userProfile?.display_name || ''); setIsNameDialogOpen(true); } }}>
                    <span className="font-medium">Nickname</span>
                    <div className="flex items-center gap-2">
                    <span className="font-semibold text-muted-foreground">{userProfile?.display_name || '...'}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
                <div className="mx-4 border-b"></div>
                <div className="flex items-center justify-between p-4">
                    <span className="font-medium">UID</span>
                    <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">{userProfile?.numeric_id || '...'}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => userProfile && copyToClipboard(userProfile.numeric_id)}>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    </div>
                </div>
            </div>
        )}
      </main>

      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Nickname</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNameDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleNameChange} disabled={isSaving}>
              {isSaving && <Loader size="xs" className="mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
