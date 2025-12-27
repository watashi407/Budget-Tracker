import { useState } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { Badge } from '@/presentation/components/ui/badge'
import { Users, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
    id: string
    full_name: string | null
    email: string
    role: 'admin' | 'user'
    currency: string | null
    created_at: string
}

interface AdminUserTableProps {
    users: UserProfile[]
    currentUserId: string
    onUserUpdated: (userId: string, newRole: 'admin' | 'user') => void
}

/**
 * AdminUserTable Component
 * Displays user list with search and role management.
 */
export function AdminUserTable({ users, currentUserId, onUserUpdated }: AdminUserTableProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedUser, setExpandedUser] = useState<string | null>(null)
    const [updatingRole, setUpdatingRole] = useState<string | null>(null)

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    async function toggleUserRole(userId: string, currentRole: 'admin' | 'user') {
        if (userId === currentUserId) {
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

            onUserUpdated(userId, newRole)
        } catch (error) {
            console.error('Failed to update role:', error)
            alert('Failed to update user role')
        } finally {
            setUpdatingRole(null)
        }
    }

    return (
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
                                        disabled={updatingRole === u.id || u.id === currentUserId}
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
    )
}
