'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Send, Paperclip, X, Bot, User, History } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useSupabaseUser } from '@/hooks/use-supabase-user';
import { useToast } from '@/hooks/use-toast';
import { escalateToHuman } from '@/ai/flows/help-chat-flow';
import { Loader } from '@/components/ui/loader';

type Attachment = {
  name: string;
  type: string;
  url: string;
};

type Message = {
  text: string;
  isUser: boolean;
  attachment?: Attachment;
  timestamp: number;
  userName?: string;
};

export default function HelpPage() {
  const { user, profile } = useSupabaseUser();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const [isEscalating, setIsEscalating] = useState(false);
  
  const [identifier, setIdentifier] = useState('');
  const [showIdentifierPrompt, setShowIdentifierPrompt] = useState(true);

  useEffect(() => {
    if (profile) {
      const id = profile.phone_number || profile.numeric_id || '';
      setIdentifier(id);
      setShowIdentifierPrompt(false);
      // Greet user
      setMessages([{
        text: `Hi ${profile.display_name}! How can I help you today?`,
        isUser: false,
        timestamp: Date.now()
      }]);
    } else {
        setMessages([{
            text: 'Welcome to the Help Center! To get started, please enter your phone number or User ID.',
            isUser: false,
            timestamp: Date.now()
        }]);
    }
  }, [profile]);


  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  const handleIdentifierSubmit = () => {
    if(identifier.trim()) {
        setShowIdentifierPrompt(false);
         setMessages(prev => [...prev, {
            text: `Hi! How can I help you today?`,
            isUser: false,
            timestamp: Date.now()
        }]);
    } else {
        toast({variant: 'destructive', title: 'Please enter an identifier.'});
    }
  }


  const handleSendMessage = () => {
    if (!input.trim() && !attachment) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: Date.now(),
      userName: profile?.display_name || 'User'
    };
    if (attachment) {
      userMessage.attachment = attachment;
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    if(fileInputRef.current) fileInputRef.current.value = "";

    // Basic AI response
    setTimeout(() => {
        setMessages(prev => [...prev, {
            text: "I am an AI assistant. For complex issues, you can talk to a human agent.",
            isUser: false,
            timestamp: Date.now(),
            userName: "AI"
        }]);
    }, 1000);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File is too large',
          description: 'Please upload a file smaller than 5MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setAttachment({ name: file.name, type: file.type, url });
        toast({ title: 'Attachment ready', description: file.name });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEscalate = async () => {
    setIsEscalating(true);
    const result = await escalateToHuman({
        uid: user?.id,
        enteredIdentifier: identifier,
        chatHistory: messages
    });

    if (result.success && result.chatId) {
        toast({ title: 'Request Sent!', description: 'A human agent will join the chat shortly.'});
        setMessages(prev => [...prev, {
            text: `Connecting you to a human agent. Your case ID is ${result.chatId}. An agent will be with you shortly. You can view your chat history in the "My" section.`,
            isUser: false,
            timestamp: Date.now(),
            userName: "System"
        }]);

    } else {
        toast({ variant: 'destructive', title: 'Failed to Connect', description: result.error });
    }
    setIsEscalating(false);
  };

  return (
    <div className="flex h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href={user ? "/my" : "/login"}>
            <ChevronLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Help Center</h1>
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/my/chat-history">
            <History className="h-5 w-5 text-muted-foreground" />
          </Link>
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4" ref={chatContentRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex items-end gap-2", msg.isUser ? "justify-end" : "justify-start")}>
              {!msg.isUser && (
                <Avatar className="h-8 w-8">
                   <AvatarFallback className="bg-primary text-primary-foreground">
                    {msg.userName === 'AI' ? <Bot className="h-5 w-5"/> : 'S'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col max-w-[75%]">
                <div className={cn("rounded-2xl px-3 py-2", msg.isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-white border rounded-bl-none shadow-sm")}>
                    {msg.attachment && (
                        <div className="mb-2">
                           {msg.attachment.type.startsWith('image/') ? (
                                <Image src={msg.attachment.url} alt={msg.attachment.name} width={200} height={200} className="rounded-lg"/>
                            ) : (
                                <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-secondary p-2 rounded-lg">
                                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-sm text-secondary-foreground truncate">{msg.attachment.name}</span>
                                </a>
                            )}
                        </div>
                    )}
                    {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                </div>
                 <p className={cn("text-xs text-muted-foreground px-1 pt-1", msg.isUser ? "text-right" : "text-left")}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                 </p>
              </div>
              {msg.isUser && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <footer className="bg-white p-2 border-t">
        {showIdentifierPrompt ? (
            <Card className="p-4 space-y-2">
                <Input placeholder="Enter Phone Number or User ID" value={identifier} onChange={e => setIdentifier(e.target.value)} />
                <Button className="w-full" onClick={handleIdentifierSubmit}>Start Chat</Button>
            </Card>
        ) : (
            <>
                {attachment && (
                    <div className="relative mx-2 mb-2 w-20 h-20">
                        <Image src={attachment.url} alt="preview" fill className="object-cover rounded-md" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setAttachment(null)}><X className="h-4 w-4" /></Button>
                    </div>
                )}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEscalate} disabled={isEscalating}>
                        {isEscalating ? <Loader size="xs"/> : "Human Agent"}
                    </Button>
                    <div className="relative flex-1">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <Button variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                        <Input 
                            placeholder="Type your message..." 
                            className="pl-10 pr-16" 
                            value={input} 
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8" onClick={handleSendMessage} disabled={!input && !attachment}><Send className="h-4 w-4"/></Button>
                    </div>
                </div>
            </>
        )}
      </footer>
    </div>
  );
}
