import { supabase } from '@/lib/supabase'

export interface NewsItem {
    id: string
    title: string
    content: string
    images: string[]
    created_at: string
    author_id: string
}

// Simple cache for news data
let newsCache: { data: NewsItem[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_DURATION = 60000 // 1 minute

export const NewsService = {
    async getLatestNews(limit = 6, forceRefresh = false) {
        // Check cache first
        if (!forceRefresh && newsCache.data && Date.now() - newsCache.timestamp < CACHE_DURATION) {
            return newsCache.data.slice(0, limit)
        }

        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Parse images from JSONB
        const parsedData = (data || []).map(item => ({
            ...item,
            images: Array.isArray(item.images) ? item.images :
                (item.images ? JSON.parse(item.images) : [])
        })) as NewsItem[]

        // Update cache
        newsCache = { data: parsedData, timestamp: Date.now() }

        return parsedData
    },

    clearCache() {
        newsCache = { data: null, timestamp: 0 }
    },

    async createNews(title: string, content: string, authorId: string, images: string[] = []) {
        const { data, error } = await supabase
            .from('news')
            .insert({
                title,
                content,
                author_id: authorId,
                images: images
            })
            .select()
            .single()

        if (error) throw error

        // Clear cache after creating
        this.clearCache()

        return {
            ...data,
            images: Array.isArray(data.images) ? data.images : []
        } as NewsItem
    },

    async deleteNews(id: string) {
        // Get news item first to delete its images
        const { data: newsItem } = await supabase
            .from('news')
            .select('images')
            .eq('id', id)
            .single()

        // Delete associated images from storage
        if (newsItem?.images && Array.isArray(newsItem.images)) {
            for (const imageUrl of newsItem.images) {
                await this.deleteNewsImage(imageUrl)
            }
        }

        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id)

        if (error) throw error

        // Clear cache after deleting
        this.clearCache()
    },

    async uploadNewsImages(files: File[]): Promise<string[]> {
        const uploadPromises = files.map(async (file) => {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('news-images')
                .upload(fileName, file, {
                    cacheControl: '3600', // 1 hour cache
                    upsert: false
                })

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('news-images')
                .getPublicUrl(fileName)

            return data.publicUrl
        })

        return Promise.all(uploadPromises)
    },

    async deleteNewsImage(imageUrl: string) {
        try {
            const urlParts = imageUrl.split('/news-images/')
            if (urlParts.length < 2) return

            const filePath = urlParts[1].split('?')[0] // Remove query params
            await supabase.storage.from('news-images').remove([filePath])
        } catch (error) {
            console.error('Failed to delete image:', error)
        }
    }
}
