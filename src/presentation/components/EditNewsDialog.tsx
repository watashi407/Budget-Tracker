import { useState, useEffect, type FormEvent } from 'react'
import { NewsService, type NewsItem } from '@/data/services/NewsService'
import { Button } from '@/presentation/components/ui/button'
import { X, Loader2, Save, ImagePlus } from 'lucide-react'

interface EditNewsDialogProps {
    newsItem: NewsItem
    onClose: () => void
    onSaved: (updated: NewsItem) => void
}

export function EditNewsDialog({ newsItem, onClose, onSaved }: EditNewsDialogProps) {
    const [title, setTitle] = useState(newsItem.title)
    const [content, setContent] = useState(newsItem.content)
    const [existingImages, setExistingImages] = useState<string[]>(newsItem.images || [])
    const [newImages, setNewImages] = useState<File[]>([])
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [onClose])

    function handleNewImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const allowedNew = Math.max(0, 5 - existingImages.length - newImages.length)
        const filesToAdd = files.slice(0, allowedNew)

        if (filesToAdd.length === 0) return

        const updatedFiles = [...newImages, ...filesToAdd]
        setNewImages(updatedFiles)

        // Generate previews
        Promise.all(updatedFiles.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
            })
        })).then(setNewImagePreviews)
    }

    function removeExistingImage(index: number) {
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    function removeNewImage(index: number) {
        setNewImages(prev => prev.filter((_, i) => i !== index))
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        setSaving(true)
        try {
            // Upload new images
            let uploadedUrls: string[] = []
            if (newImages.length > 0) {
                uploadedUrls = await NewsService.uploadNewsImages(newImages)
            }

            // Combine existing and new images
            const allImages = [...existingImages, ...uploadedUrls]

            const updated = await NewsService.updateNews(newsItem.id, {
                title: title.trim(),
                content: content.trim(),
                images: allImages
            })

            onSaved(updated)
        } catch (error) {
            console.error('Failed to update news:', error)
            alert('Failed to update news')
        } finally {
            setSaving(false)
        }
    }

    const totalImages = existingImages.length + newImages.length

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Edit News</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-160px)]">
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]"
                            required
                        />
                    </div>

                    {/* Images */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium">Images ({totalImages}/5)</label>

                        {/* Existing + New Images Grid */}
                        {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                            <div className="flex flex-wrap gap-3">
                                {/* Existing Images */}
                                {existingImages.map((url, index) => (
                                    <div key={`existing-${index}`} className="relative">
                                        <img
                                            src={url}
                                            alt={`Image ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {/* New Image Previews */}
                                {newImagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative">
                                        <img
                                            src={preview}
                                            alt={`New ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border-2 border-primary border-dashed"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/80"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add More Button */}
                        {totalImages < 5 && (
                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors w-fit">
                                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Add Images</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleNewImageSelect}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
