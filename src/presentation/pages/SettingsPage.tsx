import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/presentation/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { useToast } from '@/presentation/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { useTimezone } from '@/presentation/context/TimezoneContext'
import { AI_PROVIDER_OPTIONS, aiApiKeyService, type AIProvider } from '@/data/services/AIApiKeyService'
import { useAIConfiguration } from '@/presentation/hooks/useAIConfiguration'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Globe, KeyRound, Loader2, Trash2 } from 'lucide-react'

// Validation schemas
const profileSchema = z.object({
    fullName: z.string().min(1, 'Name is required'),
})

const passwordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
    const { user, updateProfile, updatePassword } = useAuth()
    const { currency, setCurrency, availableCurrencies } = useCurrency()
    const { timezone, setTimezone, availableTimezones } = useTimezone()
    const aiStatus = useAIConfiguration()
    const { toast } = useToast()
    const [aiApiKeyInput, setAiApiKeyInput] = useState('')
    const [showAiApiKey, setShowAiApiKey] = useState(false)
    const [isSavingAiSettings, setIsSavingAiSettings] = useState(false)
    const [nvidiaTextModel, setNvidiaTextModel] = useState(aiStatus.textModel)
    const [nvidiaVisionModel, setNvidiaVisionModel] = useState(aiStatus.visionModel)

    // Profile form
    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { fullName: user?.fullName || '' },
    })

    // Password form
    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    })

    async function handleUpdateProfile(data: ProfileForm) {
        if (!user) return

        try {
            await updateProfile(user.id, { fullName: data.fullName })
            toast({
                title: "Profile updated",
                description: "Your profile information has been updated successfully.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            })
            console.error(error)
        }
    }

    async function handleCurrencyChange(newCurrency: string) {
        if (!user) return

        setCurrency(newCurrency)

        try {
            await updateProfile(user.id, { currency: newCurrency })
            toast({
                title: "Currency updated",
                description: `Currency changed to ${newCurrency}. This setting will sync across all your devices.`,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save currency preference. Please try again.",
                variant: "destructive",
            })
            console.error(error)
        }
    }

    async function handleTimezoneChange(newTimezone: string) {
        if (!user) return

        setTimezone(newTimezone)

        try {
            await updateProfile(user.id, { timezone: newTimezone })
            const tz = availableTimezones.find(t => t.value === newTimezone)
            toast({
                title: "Timezone updated",
                description: `Timezone changed to ${tz?.label || newTimezone}. Date filtering will use this timezone.`,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save timezone preference. Please try again.",
                variant: "destructive",
            })
            console.error(error)
        }
    }

    async function handleUpdatePassword(data: PasswordForm) {
        try {
            await updatePassword(data.password)
            toast({
                title: "Password updated",
                description: "Your password has been changed successfully.",
            })
            passwordForm.reset()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update password. Please try again.",
                variant: "destructive",
            })
            console.error(error)
        }
    }

    async function handleSaveAiApiKey(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const apiKey = aiApiKeyInput.trim()
        if (!apiKey && !aiStatus.hasKey) {
            toast({
                title: "API token required",
                description: `Paste a ${aiProviderLabel} API token before saving.`,
                variant: "destructive",
            })
            return
        }

        setIsSavingAiSettings(true)
        try {
            await aiApiKeyService.saveRemoteConfig({
                provider: aiStatus.provider,
                apiKey: apiKey || undefined,
                textModel: aiStatus.provider === 'nvidia' ? nvidiaTextModel : aiStatus.textModel,
                visionModel: aiStatus.provider === 'nvidia' ? nvidiaVisionModel : aiStatus.visionModel,
            })

            if (aiStatus.provider === 'nvidia') {
                aiApiKeyService.setNvidiaModels(nvidiaTextModel, nvidiaVisionModel)
            }

            setAiApiKeyInput('')
            setShowAiApiKey(false)
            toast({
                title: apiKey ? "BYOK saved securely" : "AI settings saved",
                description: `${aiProviderLabel} token is encrypted in Supabase and will power all AI features.`,
            })
        } catch (error) {
            toast({
                title: "AI settings failed",
                description: error instanceof Error ? error.message : "Failed to save AI settings.",
                variant: "destructive",
            })
        } finally {
            setIsSavingAiSettings(false)
        }
    }

    async function handleClearAiApiKey() {
        setIsSavingAiSettings(true)
        try {
            if (aiStatus.source === 'supabase') {
                await aiApiKeyService.clearRemoteConfig(aiStatus.provider)
            } else {
                aiApiKeyService.clearByokApiKey(aiStatus.provider)
            }

            setAiApiKeyInput('')
            toast({
                title: "BYOK token removed",
                description: "The saved AI token has been removed.",
            })
        } catch (error) {
            toast({
                title: "Remove failed",
                description: error instanceof Error ? error.message : "Failed to remove AI token.",
                variant: "destructive",
            })
        } finally {
            setIsSavingAiSettings(false)
        }
    }

    function handleAIProviderChange(provider: string) {
        aiApiKeyService.setProvider(provider as AIProvider)
        const nextStatus = aiApiKeyService.getStatus()
        if (nextStatus.provider === 'nvidia') {
            setNvidiaTextModel(nextStatus.textModel)
            setNvidiaVisionModel(nextStatus.visionModel)
        }
        setAiApiKeyInput('')
        setShowAiApiKey(false)
    }

    const aiProviderLabel = AI_PROVIDER_OPTIONS.find(option => option.value === aiStatus.provider)?.label || 'AI'
    const aiSourceLabel = aiStatus.source === 'byok'
        ? 'BYOK token'
        : aiStatus.source === 'supabase'
            ? 'Encrypted Supabase token'
        : aiStatus.source === 'environment'
            ? 'Environment token'
            : 'Not configured'
    const canSaveAISettings = !isSavingAiSettings && (Boolean(aiApiKeyInput.trim()) || (aiStatus.provider === 'nvidia' && aiStatus.hasKey))
    const byokSettingsCard = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Bring Your Own AI Key
                </CardTitle>
                <CardDescription>
                    Choose the AI provider and token used across every AI feature in the app.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveAiApiKey}>
                <CardContent className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="aiProvider">AI provider</Label>
                        <Select value={aiStatus.provider} onValueChange={handleAIProviderChange}>
                            <SelectTrigger id="aiProvider">
                                <SelectValue placeholder="Select AI provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {AI_PROVIDER_OPTIONS.map((provider) => (
                                    <SelectItem key={provider.value} value={provider.value}>
                                        {provider.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    {aiStatus.hasKey ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-warning" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{aiProviderLabel}: {aiSourceLabel}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {aiStatus.maskedKey
                                            ? `Active token: ${aiStatus.maskedKey}`
                                            : "Add a token to enable AI assistant, insights, forecasts, and document scanning."}
                                    </p>
                                </div>
                            </div>
                            {aiStatus.hasByokKey && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleClearAiApiKey}
                                    disabled={isSavingAiSettings}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="aiApiKey">{aiProviderLabel} API token</Label>
                        <div className="relative">
                            <Input
                                id="aiApiKey"
                                type={showAiApiKey ? 'text' : 'password'}
                                value={aiApiKeyInput}
                                onChange={(event) => setAiApiKeyInput(event.target.value)}
                                placeholder={aiStatus.hasByokKey ? 'Enter a new token to replace the saved one' : `Paste your ${aiProviderLabel} API token`}
                                autoComplete="off"
                                className="pr-11"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8"
                                onClick={() => setShowAiApiKey((isVisible) => !isVisible)}
                                aria-label={showAiApiKey ? 'Hide API token' : 'Show API token'}
                            >
                                {showAiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            BYOK is stored locally in this browser and takes priority over the app environment token.
                        </p>
                    </div>

                    {aiStatus.provider === 'nvidia' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="nvidiaTextModel">NVIDIA text model</Label>
                                <Input
                                    id="nvidiaTextModel"
                                    value={nvidiaTextModel}
                                    onChange={(event) => setNvidiaTextModel(event.target.value)}
                                    placeholder="nvidia/llama-3.3-nemotron-super-49b-v1"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nvidiaVisionModel">NVIDIA vision model</Label>
                                <Input
                                    id="nvidiaVisionModel"
                                    value={nvidiaVisionModel}
                                    onChange={(event) => setNvidiaVisionModel(event.target.value)}
                                    placeholder="nvidia/nemotron-nano-12b-v2-vl"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={!canSaveAISettings} className="gap-2">
                        {isSavingAiSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Save AI Settings
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-2xl px-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            {byokSettingsCard}

            {/* Profile Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Update your public profile display name.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user?.email || ''} disabled />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Email addresses cannot be changed directly.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                {...profileForm.register('fullName')}
                                placeholder="Enter your full name"
                            />
                            {profileForm.formState.errors.fullName && (
                                <p className="text-[0.8rem] text-destructive">
                                    {profileForm.formState.errors.fullName.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                            {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                        Customize your application experience. Changes sync across all devices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2" id="settings-currency">
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={currency} onValueChange={handleCurrencyChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCurrencies.map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                        {c.code} - {c.label} ({c.symbol})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                            This will be used to display all monetary values in the app.
                        </p>
                    </div>

                    <div className="grid gap-2" id="settings-timezone">
                        <Label htmlFor="timezone" className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Timezone
                        </Label>
                        <Select value={timezone} onValueChange={handleTimezoneChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTimezones.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label} ({tz.offset})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Used for date filtering in transactions and budgets.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Security / Password Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...passwordForm.register('password')}
                                placeholder="Enter new password"
                            />
                            {passwordForm.formState.errors.password && (
                                <p className="text-[0.8rem] text-destructive">
                                    {passwordForm.formState.errors.password.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...passwordForm.register('confirmPassword')}
                                placeholder="Confirm new password"
                            />
                            {passwordForm.formState.errors.confirmPassword && (
                                <p className="text-[0.8rem] text-destructive">
                                    {passwordForm.formState.errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
