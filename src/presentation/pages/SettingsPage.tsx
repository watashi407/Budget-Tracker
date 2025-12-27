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
import { Loader2 } from 'lucide-react'

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
    const { toast } = useToast()

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

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-2xl px-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

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
                <CardContent className="space-y-4">
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
