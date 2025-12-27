import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/presentation/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { format } from 'date-fns'
import {
    Shield,
    Users,
    Wallet,
    TrendingUp,
    Loader2,
    Trash2,
    Pencil
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs'
import { EditNewsDialog } from '@/presentation/components/EditNewsDialog'
import { useToast } from '@/presentation/components/ui/use-toast'
import { AdminNewsForm } from '@/presentation/components/admin/AdminNewsForm'
import { AdminUserTable } from '@/presentation/components/admin/AdminUserTable'

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
    const { toast } = useToast()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [news, setNews] = useState<NewsItem[]>([])
    const [newsLoading, setNewsLoading] = useState(false)
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null)

    useEffect(() => {
        fetchData()
        fetchNews()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, role, currency, updated_at')
                .order('updated_at', { ascending: false })

            if (profilesError) throw profilesError

            const usersWithEmail: UserProfile[] = (profiles || []).map(p => ({
                id: p.id,
                full_name: p.full_name,
                email: `${p.id.slice(0, 8)}...`,
                role: p.role || 'user',
                currency: p.currency,
                created_at: p.updated_at,
            }))

            setUsers(usersWithEmail)

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
            const data = await NewsService.getLatestNews(50)
            setNews(data)
        } catch (error) {
            console.error('Failed to fetch news:', error)
        } finally {
            setNewsLoading(false)
        }
    }

    async function handleDeleteNews(id: string) {
        if (!confirm('Are you sure you want to delete this news item?')) return

        try {
            await NewsService.deleteNews(id)
            setNews(news.filter(n => n.id !== id))
            toast({
                title: 'News deleted',
                description: 'The news item has been removed.',
            })
        } catch (error) {
            console.error('Failed to delete news:', error)
            toast({
                title: 'Failed to delete news',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            })
        }
    }

    function handleUserUpdated(userId: string, newRole: 'admin' | 'user') {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, role: newRole } : u
        ))
        if (stats) {
            setStats({
                ...stats,
                adminCount: stats.adminCount + (newRole === 'admin' ? 1 : -1),
            })
        }
    }

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
                    <AdminUserTable
                        users={users}
                        currentUserId={user?.id || ''}
                        onUserUpdated={handleUserUpdated}
                    />
                </TabsContent>

                {/* News Tab */}
                <TabsContent value="news" className="space-y-6">
                    {/* Create News Form */}
                    {user && (
                        <AdminNewsForm
                            userId={user.id}
                            onNewsCreated={(newItem) => setNews([newItem, ...news])}
                        />
                    )}

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
                                            {item.images && item.images.length > 0 && (
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                                    {item.images.length} image{item.images.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold">{item.title}</h3>
                                        <p className="text-muted-foreground whitespace-pre-wrap line-clamp-2">{item.content}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="hover:bg-primary/10 hover:text-primary"
                                            onClick={() => setEditingNews(item)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDeleteNews(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit News Dialog */}
            {editingNews && (
                <EditNewsDialog
                    newsItem={editingNews}
                    onClose={() => setEditingNews(null)}
                    onSaved={(updated) => {
                        setNews(news.map(n => n.id === updated.id ? updated : n))
                        setEditingNews(null)
                    }}
                />
            )}
        </div>
    )
}
