import type { LandingFeature } from '@/constants/landingPageData'

interface FeatureCardProps {
    feature: LandingFeature
    index: number
}

/**
 * FeatureCard Component
 * Renders a single feature card with icon, title, and description.
 */
export function FeatureCard({ feature, index }: FeatureCardProps) {
    const Icon = feature.icon

    return (
        <div
            className="group relative p-6 rounded-2xl bg-card/60 backdrop-blur-lg border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
            </p>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    )
}
