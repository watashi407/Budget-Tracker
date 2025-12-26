import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { format } from 'date-fns'
import {
    Shield,
    Users,
    Wallet,
    TrendingUp,
    Loader2,
    Search,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Send,
    ImagePlus,
    X
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'

interface UserProfile {
    id: string
    full_name: string | null
    email: string
    role: 'admin' | 'user'
    currency: string | null
    created_at: string
}

interface Stats {
    totalUsers: number
    totalBudgets: number
    totalTransactions: number
    adminCount: number
}

/**
 * AdminDashboard Page
 * Admin-only page for managing users and viewing system statistics.
 */
export function AdminDashboard() {
    const { user } = useAuth()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedUser, setExpandedUser] = useState<string | null>(null)
    const [updatingRole, setUpdatingRole] = useState<string | null>(null)

    // News State
    const [news, setNews] = useState<NewsItem[]>([])
    const [newsLoading, setNewsLoading] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newContent, setNewContent] = useState('')
    const [postingNews, setPostingNews] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
        fetchNews()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            // Fetch all profiles with their auth email
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, role, currency, updated_at')
                .order('updated_at', { ascending: false })

            if (profilesError) throw profilesError

            // Get user emails from auth (admin only via Edge Function or manual mapping)
            // For now, we'll show user IDs and names
            const usersWithEmail: UserProfile[] = (profiles || []).map(p => ({
                id: p.id,
                full_name: p.full_name,
                email: `${p.id.slice(0, 8)}...`, // Show truncated ID as placeholder
                role: p.role || 'user',
                currency: p.currency,
                created_at: p.updated_at,
            }))

            setUsers(usersWithEmail)

            // Fetch stats
            const [budgetCount, transactionCount] = await Promise.all([
                supabase.from('budgets').select('id', { count: 'exact', head: true }),
                supabase.from('transactions').select('id', { count: 'exact', head: true }),
            ])

            setStats({
                totalUsers: usersWithEmail.length,
                totalBudgets: budgetCount.count || 0,
                totalTransactions: transactionCount.count || 0,
                adminCount: usersWithEmail.filter(u => u.role === 'admin').length,
            })
        } catch (error) {
            console.error('Failed to fetch admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchNews() {
        setNewsLoading(true)
        try {
            const data = await NewsService.getLatestNews(50) // Get more for admin
            setNews(data)
        } catch (error) {
            console.error('Failed to fetch news:', error)
        } finally {
            setNewsLoading(false)
        }
    }

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    function clearImage() {
        setSelectedImage(null)
        setImagePreview(null)
    }

    async function handlePostNews(e: FormEvent) {
        e.preventDefault()
        if (!user || !newTitle.trim() || !newContent.trim()) return

        setPostingNews(true)
        try {
            let imageUrl: string | undefined
            if (selectedImage) {
                imageUrl = await NewsService.uploadNewsImage(selectedImage)
            }
            const newItem = await NewsService.createNews(newTitle, newContent, user.id, imageUrl)
            setNews([newItem, ...news])
            setNewTitle('')
            setNewContent('')
            clearImage()
        } catch (error) {
            console.error('Failed to post news:', error)
            alert('Failed to post news')
        } finally {
            setPostingNews(false)
        }
    }

    async function handleDeleteNews(id: string) {
        if (!confirm('Are you sure you want to delete this news item?')) return

        try {
            await NewsService.deleteNews(id)
            setNews(news.filter(n => n.id !== id))
        } catch (error) {
            console.error('Failed to delete news:', error)
            alert('Failed to delete news')
        }
    }

    async function toggleUserRole(userId: string, currentRole: 'admin' | 'user') {
        if (userId === user?.id) {
            alert('You cannot change your own role!')
            return
        }

        setUpdatingRole(userId)
        const newRole = currentRole === 'admin' ? 'user' : 'admin'

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ))

            if (stats) {
                setStats({
                    ...stats,
                    adminCount: stats.adminCount + (newRole === 'admin' ? 1 : -1),
                })
            }
        } catch (error) {
            console.error('Failed to update role:', error)
            alert('Failed to update user role')
        } finally {
            setUpdatingRole(null)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Manage users and view system statistics</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Total Users</span>
                        </div>
                        <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-orange-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Admins</span>
                        </div>
                        <p className="text-2xl font-bold mt-2">{stats.adminCount}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Total Budgets</span>
                        </div>
                        <p className="text-2xl font-bold mt-2">{stats.totalBudgets}</p>
                    </div>
                    <div className="p-6 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Total Transactions</span>
                        </div>
                        <p className="text-2xl font-bold mt-2">{stats.totalTransactions}</p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList className="bg-card border border-border/50">
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="w-4 h-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="news" className="gap-2">
                        Manage News
                    </TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                    <div className="rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4 flex-wrap">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                User Management
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-sm rounded-lg bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-border/50">
                            {filteredUsers.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No users found
                                </div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <div key={u.id} className="p-4">
                                        <div
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-primary">
                                                        {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{u.full_name || 'Unnamed User'}</p>
                                                    <p className="text-xs text-muted-foreground">{u.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                    {u.role}
                                                </Badge>
                                                {expandedUser === u.id ? (
                                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>

                                        {expandedUser === u.id && (
                                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">
                                                    <p>Currency: {u.currency || 'USD'}</p>
                                                    <p>User ID: {u.id}</p>
                                                </div>
                                                <Button
                                                    variant={u.role === 'admin' ? 'destructive' : 'default'}
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleUserRole(u.id, u.role)
                                                    }}
                                                    disabled={updatingRole === u.id || u.id === user?.id}
                                                >
                                                    {updatingRole === u.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : u.role === 'admin' ? (
                                                        'Remove Admin'
                                                    ) : (
                                                        'Make Admin'
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* News Tab */}
                <TabsContent value="news" className="space-y-6">
                    {/* Create News Form */}
                    <div className="rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm p-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Plus className="w-5 h-5 text-primary" />
                            Post New Update
                        </h2>
                        <form onSubmit={handlePostNews} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Update Title"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                />
                            </div>
                            <div>
                                <textarea
                                    placeholder="Update Content..."
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                                    required
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                {imagePreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="max-w-xs max-h-40 rounded-lg border border-border/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors w-fit">
                                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Attach Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            <Button type="submit" disabled={postingNews} className="w-full sm:w-auto gap-2">
                                {postingNews ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Post Update
                            </Button>
                        </form>
                    </div>

                    {/* News List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Recent Updates</h2>
                        {newsLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                            </div>
                        ) : news.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No updates posted yet.</p>
                        ) : (
                            news.map((item) => (
                                <div key={item.id} className="rounded-xl bg-card border border-border/50 p-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{format(new Date(item.created_at), 'PPP')}</span>
                                        </div>
                                        <h3 className="text-xl font-bold">{item.title}</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                        onClick={() => handleDeleteNews(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
