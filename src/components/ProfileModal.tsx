"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, Download, CreditCard, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ProfileModal({ children }: { children: React.ReactNode }) {
    const { data: session, update } = useSession();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial state from session
    const initialName = session?.user?.name || "";
    const initialImage = session?.user?.image || "";
    const initialEmail = session?.user?.email || "";
    const initialPhone = (session?.user as any)?.phone || "";
    const emailVerified = (session?.user as any)?.emailVerified || false;
    const phoneVerified = (session?.user as any)?.phoneVerified || false;
    const role = (session?.user as any)?.role || "free";
    const plan = (session?.user as any)?.plan || "free";
    const initialTwoFactorEnabled = (session?.user as any)?.twoFactorEnabled || false;
    const initialTwoFactorMethods = (session?.user as any)?.twoFactorMethods || [];

    // Form states
    const [name, setName] = useState(initialName);
    const [image, setImage] = useState(initialImage);
    const [email, setEmail] = useState(initialEmail);
    const [phone, setPhone] = useState(initialPhone);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Verification state
    const [otpDialogData, setOtpDialogData] = useState<{ isOpen: boolean; type: "email" | "phone" | null; identifier: string }>({ isOpen: false, type: null, identifier: "" });
    const [verificationOtp, setVerificationOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    // 2FA states
    const [email2FA, setEmail2FA] = useState(initialTwoFactorMethods.includes("email"));
    const [phone2FA, setPhone2FA] = useState(initialTwoFactorMethods.includes("phone"));

    // Billing States
    const [invoices, setInvoices] = useState<any[]>([]);
    const [nextBillingDate, setNextBillingDate] = useState<number | null>(null);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [showBillingHistory, setShowBillingHistory] = useState(false);
    const [isManagingBilling, setIsManagingBilling] = useState(false);
    const subscriptionStatus = (session?.user as any)?.subscriptionStatus || "inactive";

    const fetchInvoices = async () => {
        setIsLoadingInvoices(true);
        try {
            const res = await fetch("/api/stripe/invoices");
            const data = await res.json();
            if (data.invoices) {
                setInvoices(data.invoices);
            }
            if (data.nextBillingDate) {
                setNextBillingDate(data.nextBillingDate);
            }
            if (data.error && !data.invoices) {
                toast({ variant: "destructive", title: "Error", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch invoices" });
        } finally {
            setIsLoadingInvoices(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsManagingBilling(true);
        try {
            const endpoint = plan === "pro" ? "/api/stripe/customer-portal" : "/api/stripe/checkout";
            const res = await fetch(endpoint, { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({ variant: "destructive", title: "Error", description: data.error || "Failed to load portal" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Network error" });
        } finally {
            setIsManagingBilling(false);
        }
    };

    const toggleBillingHistory = () => {
        if (!showBillingHistory && invoices.length === 0) {
            fetchInvoices();
        }
        setShowBillingHistory(!showBillingHistory);
    };

    // Fetch invoices on open for pro users
    useEffect(() => {
        if (isOpen && plan === "pro" && invoices.length === 0) {
            fetchInvoices();
        }
    }, [isOpen, plan]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset state mapping
    useEffect(() => {
        if (isOpen) {
            setName(session?.user?.name || "");
            setImage(session?.user?.image || "");
            setEmail(session?.user?.email || "");
            setPhone((session?.user as any)?.phone || "");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setEmail2FA(initialTwoFactorMethods.includes("email"));
            setPhone2FA(initialTwoFactorMethods.includes("phone"));
        }
    }, [isOpen, session, initialTwoFactorMethods]);

    const isDirty = name !== initialName ||
        image !== initialImage ||
        currentPassword !== "" ||
        newPassword !== "" ||
        confirmPassword !== "" ||
        email2FA !== initialTwoFactorMethods.includes("email") ||
        phone2FA !== initialTwoFactorMethods.includes("phone");

    const validatePassword = (password: string) => {
        const rules = [
            /.{8,}/, // 8+ chars
            /[A-Z]/, // Uppercase
            /[a-z]/, // Lowercase
            /[0-9]/, // Number
            /[^A-Za-z0-9]/ // Special char
        ];
        return rules.every(rule => rule.test(password));
    };

    const handleVerifyAction = async (type: "email" | "phone") => {
        const identifier = type === "email" ? email : phone;
        if (!identifier) return;

        setIsVerifying(true);
        try {
            const res = await fetch("/api/profile/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send", type, identifier })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");
            toast({ title: "OTP Sent", description: `Check your ${type} for the verification code.` });
            setOtpDialogData({ isOpen: true, type, identifier });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleConfirmVerify = async () => {
        if (!otpDialogData.type || !verificationOtp) return;
        setIsVerifying(true);
        try {
            const res = await fetch("/api/profile/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", type: otpDialogData.type, identifier: otpDialogData.identifier, otp: verificationOtp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Verification failed");
            toast({ title: "Success", description: `${otpDialogData.type} verified successfully!` });

            await update(); // Force session update

            setOtpDialogData({ isOpen: false, type: null, identifier: "" });
            setVerificationOtp("");
        } catch (err: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: err.message });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSave = async () => {
        if (!isDirty) return;

        // Validations
        if (newPassword) {
            if (newPassword === currentPassword) {
                toast({ variant: "destructive", title: "Error", description: "New password cannot be the same as the old password." });
                return;
            }
            if (newPassword !== confirmPassword) {
                toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
                return;
            }
            if (!validatePassword(newPassword)) {
                toast({ variant: "destructive", title: "Invalid Password", description: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." });
                return;
            }
        }

        // Image validation (basic URL format)
        if (image && !/^https?:\/\/.+\..+/.test(image)) {
            toast({ variant: "destructive", title: "Invalid Image URL", description: "Please enter a valid URL." });
            return;
        }

        setIsLoading(true);
        try {
            // Setup methods array
            const newMethods = [];
            if (email2FA) newMethods.push("email");
            if (phone2FA) newMethods.push("phone");

            const newTwoFactorEnabled = newMethods.length > 0;

            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    image,
                    twoFactorEnabled: newTwoFactorEnabled,
                    twoFactorMethods: newMethods,
                    ...(newPassword ? { currentPassword, newPassword } : {})
                }),
            });

            if (res.status === 401) {
                toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
                setIsOpen(false);
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            // Update session optimistically
            await update({
                name,
                image: image || session?.user?.image,
                twoFactorEnabled: newTwoFactorEnabled,
                twoFactorMethods: newMethods
            });

            toast({ title: "Success", description: "Profile updated successfully." });

            // Clean state manually
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsOpen(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Network failure." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && isDirty) {
            if (!window.confirm("Unsaved changes will be lost. Continue?")) {
                return;
            }
        }
        setIsOpen(open);
    };

    const handleInteractOutside = (e: Event) => {
        if (isDirty && !window.confirm("Unsaved changes will be lost. Continue?")) {
            e.preventDefault();
        }
    };

    const handleEscapeKeyDown = (e: KeyboardEvent) => {
        if (isDirty && !window.confirm("Unsaved changes will be lost. Continue?")) {
            e.preventDefault();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[425px] backdrop-blur-md bg-white/95 dark:bg-zinc-950/95"
                onInteractOutside={handleInteractOutside}
                onEscapeKeyDown={handleEscapeKeyDown}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Profile Settings</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">

                    {/* Contact Verification */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label className="flex justify-between items-center">
                                Email
                                {emailVerified && email === initialEmail && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                            </Label>
                            <div className="flex gap-2">
                                <Input value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading || isVerifying} />
                                {(email !== initialEmail || !emailVerified) && email && (
                                    <Button type="button" variant="outline" className="px-3" onClick={() => handleVerifyAction("email")} disabled={isVerifying}>
                                        Verify
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="flex justify-between items-center">
                                Phone
                                {phoneVerified && phone === initialPhone && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                            </Label>
                            <div className="flex gap-2">
                                <Input value={phone} onChange={e => setPhone(e.target.value)} disabled={isLoading || isVerifying} placeholder="+123456789" />
                                {(phone !== initialPhone || !phoneVerified) && phone && (
                                    <Button type="button" variant="outline" className="px-3" onClick={() => handleVerifyAction("phone")} disabled={isVerifying}>
                                        Verify
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Billing Section */}
                    <div className="pt-4 border-t border-border mt-4">
                        <h4 className="text-sm font-semibold mb-3 tracking-tight flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Subscription & Billing
                        </h4>
                        <div className="bg-muted/30 p-4 border border-border/50 rounded-lg space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <div className="text-sm font-semibold uppercase bg-background border px-3 py-2 rounded-md">
                                        {role}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Plan</Label>
                                    <div className="text-sm font-semibold uppercase text-amber-500 bg-background border px-3 py-2 rounded-md whitespace-nowrap overflow-hidden text-ellipsis">
                                        {plan}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <div className="text-sm font-semibold capitalize bg-background border px-3 py-2 rounded-md whitespace-nowrap overflow-hidden text-ellipsis">
                                        {subscriptionStatus || 'Inactive'}
                                    </div>
                                </div>
                                {plan === "pro" && nextBillingDate && (
                                    <div className="grid gap-2">
                                        <Label className="truncate">Next Billing Date</Label>
                                        <div className="text-sm font-semibold bg-background border px-3 py-2 rounded-md whitespace-nowrap overflow-hidden text-ellipsis">
                                            {new Date(nextBillingDate * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button onClick={handleManageSubscription} disabled={isManagingBilling} className="w-full flex justify-between items-center bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200">
                                    <span>{plan === "pro" ? "Manage Subscription" : "Upgrade to Pro"}</span>
                                    {isManagingBilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                </Button>

                                {plan === "pro" && (
                                    <Button variant="outline" type="button" onClick={toggleBillingHistory} className="w-full flex justify-between items-center">
                                        <span>{showBillingHistory ? "Hide Billing History" : "View Billing History"}</span>
                                        <FileText className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {showBillingHistory && (
                                <div className="mt-4 overflow-x-auto border rounded-md bg-background">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingInvoices ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : invoices.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                        No invoices found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                invoices.map((invoice) => (
                                                    <TableRow key={invoice.id}>
                                                        <TableCell className="whitespace-nowrap">
                                                            {new Date(invoice.created * 1000).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            ${(invoice.amount_paid / 100).toFixed(2)} {invoice.currency?.toUpperCase()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${invoice.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                                {invoice.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            <div className="flex justify-end gap-2">
                                                                {invoice.hosted_invoice_url && (
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(invoice.hosted_invoice_url, '_blank')} title="View">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {invoice.invoice_pdf && (
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(invoice.invoice_pdf, '_blank')} title="Download">
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editable Info */}
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Image URL</Label>
                        <Input
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            disabled={isLoading}
                            placeholder="https://example.com/avatar.png"
                        />
                    </div>

                    {/* Authentication & Security Settings */}
                    <div className="pt-4 border-t border-border mt-4">
                        <h4 className="text-sm font-semibold mb-3 tracking-tight">Security Settings</h4>
                        <div className="space-y-4">
                            <div className="bg-muted/30 p-4 border border-border/50 rounded-lg">
                                <h5 className="text-sm font-medium mb-2">Two-Factor Authentication</h5>
                                <div className="space-y-3 mt-3">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={email2FA}
                                            onChange={(e) => setEmail2FA(e.target.checked)}
                                            disabled={isLoading}
                                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                        />
                                        <span className="text-sm">Enable Email Verification</span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={phone2FA}
                                            onChange={(e) => setPhone2FA(e.target.checked)}
                                            disabled={isLoading}
                                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                                        />
                                        <span className="text-sm">Enable Phone Verification</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="pt-4 border-t border-border mt-4">
                        <h4 className="text-sm font-semibold mb-3">Change Password</h4>
                        <div className="space-y-3">
                            <div className="grid gap-2">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-background/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {isDirty && (
                    <div className="pt-4 flex justify-end gap-2 border-t border-border">
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? "Saving..." : "Save changes"}
                        </Button>
                    </div>
                )}
            </DialogContent>

            <Dialog open={otpDialogData.isOpen} onOpenChange={(open) => !open && setOtpDialogData({ isOpen: false, type: null, identifier: "" })}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Verify {otpDialogData.type === "email" ? "Email" : "Phone"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            We've sent a 6-digit code to <strong>{otpDialogData.identifier}</strong>. Please enter it below.
                        </p>
                        <div className="grid gap-2">
                            <Label>Verification Code</Label>
                            <Input
                                value={verificationOtp}
                                onChange={(e) => setVerificationOtp(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                disabled={isVerifying}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOtpDialogData({ isOpen: false, type: null, identifier: "" })} disabled={isVerifying}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmVerify} disabled={isVerifying || verificationOtp.length !== 6}>
                            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
