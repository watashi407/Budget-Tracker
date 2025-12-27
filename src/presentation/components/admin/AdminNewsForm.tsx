import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Textarea } from '@/presentation/components/ui/textarea'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { useToast } from '@/presentation/components/ui/use-toast'
import { Plus, Send, ImagePlus, X, Loader2 } from 'lucide-react'

// Validation schema
const newsSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
})

type NewsForm = z.infer<typeof newsSchema>

interface AdminNewsFormProps {
    userId: string
    onNewsCreated: (news: NewsItem) => void
}

/**
 * AdminNewsForm Component
 * Handles creating new news posts with image upload support.
 */
export function AdminNewsForm({ userId, onNewsCreated }: AdminNewsFormProps) {
    const { toast } = useToast()
    const [selectedImages, setSelectedImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    const form = useForm<NewsForm>({
        resolver: zodResolver(newsSchema),
        defaultValues: { title: '', content: '' },
    })

    const { isSubmitting } = form.formState

    function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Limit to 5 images total
        const newFiles = [...selectedImages, ...files].slice(0, 5)
        setSelectedImages(newFiles)

        // Generate previews
        Promise.all(newFiles.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })
        })).then(setImagePreviews)
    }

    function removeImage(index: number) {
        setSelectedImages(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    function clearImages() {
        setSelectedImages([])
        setImagePreviews([])
    }

    async function onSubmit(data: NewsForm) {
        try {
            let imageUrls: string[] = []
            if (selectedImages.length > 0) {
                imageUrls = await NewsService.uploadNewsImages(selectedImages)
            }
            const newItem = await NewsService.createNews(data.title, data.content, userId, imageUrls)
            onNewsCreated(newItem)
            form.reset()
            clearImages()
            toast({
                title: 'News posted!',
                description: 'Your news update has been published successfully.',
            })
        } catch (error) {
            console.error('Failed to post news:', error)
            toast({
                title: 'Failed to post news',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-primary" />
                Post New Update
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Input
                        placeholder="Update Title"
                        className="w-full"
                        {...form.register('title')}
                    />
                    {form.formState.errors.title && (
                        <p className="text-destructive text-xs mt-1">
                            {form.formState.errors.title.message}
                        </p>
                    )}
                </div>
                <div>
                    <Textarea
                        placeholder="Update Content..."
                        className="min-h-[100px]"
                        {...form.register('content')}
                    />
                    {form.formState.errors.content && (
                        <p className="text-destructive text-xs mt-1">
                            {form.formState.errors.content.message}
                        </p>
                    )}
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                    {imagePreviews.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-lg border border-border/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedImages.length < 5 && (
                        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors w-fit">
                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {selectedImages.length === 0 ? 'Attach Images' : 'Add More'} ({selectedImages.length}/5)
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto gap-2">
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Post Update
                </Button>
            </form>
        </div>
    )
}
