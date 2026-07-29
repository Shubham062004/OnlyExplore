"use client";

import React, { useState } from "react";
import {
  X, Copy, Check, Share2, Mail, Shield, UserCheck, Clock, Eye, Edit3, Lock, Globe, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareTripModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
}

const SOCIAL_PLATFORMS = [
  {
    name: "WhatsApp",
    color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    getShareUrl: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my trip to ${title} on OnlyExplore: ${url}`)}`,
  },
  {
    name: "X (Twitter)",
    color: "bg-black hover:bg-zinc-800 text-white border border-zinc-700",
    getShareUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Exploring ${title} with OnlyExplore!`)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    color: "bg-blue-600 hover:bg-blue-700 text-white",
    getShareUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    color: "bg-sky-500 hover:bg-sky-600 text-white",
    getShareUrl: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`My ${title} Trip Plan`)}`,
  },
  {
    name: "Email",
    color: "bg-zinc-700 hover:bg-zinc-800 text-white",
    getShareUrl: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(`OnlyExplore Trip: ${title}`)}&body=${encodeURIComponent(`Here is the travel plan for ${title}: ${url}`)}`,
  },
];

export function ShareTripModal({ trip, isOpen, onClose }: ShareTripModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [permission, setPermission] = useState<"Public" | "View Only" | "Editable" | "Private">("Public");
  const [emailInput, setEmailInput] = useState("");
  const [sentInvites, setSentInvites] = useState<Array<{ email: string; role: string }>>([
    { email: "collaborator@onlyexplore.app", role: "Editor" },
  ]);

  if (!isOpen || !trip) return null;

  const title = trip.title || trip.destination || "Travel Destination";
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/destination/${encodeURIComponent((trip.destination || title).toLowerCase())}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSentInvites([...sentInvites, { email: emailInput.trim(), role: permission === "Editable" ? "Editor" : "Viewer" }]);
    setEmailInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black font-headline uppercase leading-none">Share Travel Plan</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Selector Bar */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
            Access Permissions & Privacy
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "Public", label: "Public", icon: Globe },
              { id: "View Only", label: "View Only", icon: Eye },
              { id: "Editable", label: "Editable", icon: Edit3 },
              { id: "Private", label: "Private", icon: Lock },
            ].map((p) => {
              const Icon = p.icon;
              const isSel = permission === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPermission(p.id as any)}
                  className={`p-2 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    isSel
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase">{p.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground font-bold px-1 pt-1">
            <span>Link Expiration: <strong>Never (Active)</strong></span>
            <span className="text-emerald-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Live Syncing</span>
          </div>
        </div>

        {/* Social Platforms Row */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
            Share directly to Social Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_PLATFORMS.map((platform) => (
              <a
                key={platform.name}
                href={platform.getShareUrl(shareUrl, title)}
                target="_blank"
                rel="noreferrer"
                className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 ${platform.color}`}
              >
                {platform.name}
              </a>
            ))}
          </div>
        </div>

        {/* Copy Shareable Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
            Shareable URL
          </label>
          <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-2xl border border-border/40">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-3 text-xs font-mono text-foreground focus:outline-none truncate"
            />
            <Button size="sm" onClick={handleCopyLink} className="rounded-xl text-[10px] font-black uppercase px-4 h-9">
              {copiedLink ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </Button>
          </div>
        </div>

        {/* Invite Collaborators */}
        <form onSubmit={handleSendInvite} className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
            Invite via Email
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="email"
                placeholder="colleague@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-muted/40 border border-border/40 rounded-2xl pl-10 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-primary"
              />
            </div>
            <Button type="submit" size="sm" className="rounded-2xl text-[10px] font-black uppercase px-4 h-9">
              Invite
            </Button>
          </div>
        </form>

        {/* Collaborators List */}
        <div className="space-y-2 pt-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            People with Access
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">You (Owner)</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Owner
              </span>
            </div>
            {sentInvites.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground truncate">{member.email}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
