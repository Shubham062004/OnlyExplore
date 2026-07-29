"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, Mail, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareTripModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareTripModal({ trip, isOpen, onClose }: ShareTripModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState<"Viewer" | "Editor">("Viewer");
  const [sentInvites, setSentInvites] = useState<Array<{ email: string; role: string }>>([
    { email: "collaborator@onlyexplore.app", role: "Editor" },
  ]);

  if (!isOpen || !trip) return null;

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/trip/${trip.shareKey || trip._id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSentInvites([...sentInvites, { email: emailInput.trim(), role }]);
    setEmailInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black font-headline uppercase leading-none">Share Trip</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{trip.title || trip.destination}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Shareable Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
            Shareable Link
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

        {/* Invite by Email & Permissions */}
        <form onSubmit={handleSendInvite} className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
            Invite Collaborators by Email
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
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="bg-muted/40 border border-border/40 rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              <option value="Viewer">Viewer</option>
              <option value="Editor">Editor</option>
            </select>
            <Button type="submit" size="sm" className="rounded-2xl text-[10px] font-black uppercase px-4 h-9">
              Invite
            </Button>
          </div>
        </form>

        {/* Members List */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            People with Access
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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
