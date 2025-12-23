import { Link } from '@tanstack/react-router'
import { Wallet, Twitter, Github, Linkedin } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

export function LandingFooter() {
    return (
        <footer className="relative border-t border-border/50 bg-background/50 backdrop-blur-md pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">

                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link to="/" className="flex items-center gap-3 w-fit">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25">
                                <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                Watashi Pocket
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Empowering your financial journey with AI-driven insights and smart budgeting.
                            Take control of your future today.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <SocialLink href="#" icon={Twitter} label="Twitter" />
                            <SocialLink href="#" icon={Github} label="GitHub" />
                            <SocialLink href="#" icon={Linkedin} label="LinkedIn" />
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <FooterLink href="#features">Features</FooterLink>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <FooterLink href="#about">About</FooterLink>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Stay Updated</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            Subscribe to our newsletter for the latest updates and financial tips.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Input placeholder="Enter your email" className="bg-background/50 border-white/10" />
                            <Button size="sm" className="w-full">Subscribe</Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Watashi Pocket. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
                        <Link to="/" className="hover:text-foreground transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function SocialLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-primary transition-all hover:scale-110"
        >
            <Icon className="h-4 w-4" />
        </a>
    )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <li>
            <a href={href} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                {children}
            </a>
        </li>
    )
}
