
import { useState } from 'react'
import { useAuth } from '@/presentation/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { useToast } from '@/presentation/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select'
import { useCurrency } from '@/presentation/context/CurrencyContext'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
    const { user, updateProfile, updatePassword } = useAuth()
    const { currency, setCurrency, availableCurrencies } = useCurrency()
    const { toast } = useToast()

    const [fullName, setFullName] = useState(user?.fullName || '')
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return

        setIsUpdatingProfile(true)
        try {
            await updateProfile(user.id, { fullName })
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
        } finally {
            setIsUpdatingProfile(false)
        }
    }

    async function handleCurrencyChange(newCurrency: string) {
        if (!user) return

        // Immediately update local state for responsive UI
        setCurrency(newCurrency)
        setIsUpdatingCurrency(true)

        try {
            // Save to database for cross-device persistence
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
        } finally {
            setIsUpdatingCurrency(false)
        }
    }

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match.",
                variant: "destructive",
            })
            return
        }

        if (password.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters.",
                variant: "destructive",
            })
            return
        }

        setIsUpdatingPassword(true)
        try {
            await updatePassword(password)
            toast({
                title: "Password updated",
                description: "Your password has been changed successfully.",
            })
            setPassword('')
            setConfirmPassword('')
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update password. Please try again.",
                variant: "destructive",
            })
            console.error(error)
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-2xl px-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Update your public profile display name.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
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
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isUpdatingProfile}>
                            {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>
                        Customize your application experience. Changes sync across all devices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2" id="settings-currency">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                            value={currency}
                            onValueChange={handleCurrencyChange}
                            disabled={isUpdatingCurrency}
                        >
                            <SelectTrigger>
                                {isUpdatingCurrency ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Select currency" />
                                )}
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isUpdatingPassword}>
                            {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
