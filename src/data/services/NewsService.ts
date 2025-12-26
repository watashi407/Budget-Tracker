import { supabase } from '@/lib/supabase'

export interface NewsItem {
    id: string
    title: string
    content: string
    image_url?: string
    created_at: string
    author_id: string
}

export const NewsService = {
    async getLatestNews(limit = 3) {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data as NewsItem[]
    },

    async createNews(title: string, content: string, authorId: string, imageUrl?: string) {
        const { data, error } = await supabase
            .from('news')
            .insert({
                title,
                content,
                author_id: authorId,
                image_url: imageUrl
            })
            .select()
            .single()

        if (error) throw error
        return data as NewsItem
    },

    async deleteNews(id: string) {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async uploadNewsImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('news-images')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
            .from('news-images')
            .getPublicUrl(filePath)

        return data.publicUrl
    },

    async deleteNewsImage(imageUrl: string) {
        // Extract file path from URL
        const urlParts = imageUrl.split('/news-images/')
        if (urlParts.length < 2) return

        const filePath = urlParts[1]
        await supabase.storage.from('news-images').remove([filePath])
    }
}
