import { Card } from "@/components/ui/card";

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  organization: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "GrantLedger cut our month-end close from 3 days to 3 hours. The AI categorization is shockingly accurate, and the CFR citations give our auditors exactly what they need.",
    name: "Sarah Mitchell",
    title: "Director of Finance",
    organization: "Community Health Partners",
    rating: 5,
  },
  {
    quote: "We manage 12 federal grants simultaneously. Before GrantLedger, tracking which OMB thresholds applied to which grant was a nightmare. Now it's automatic.",
    name: "David Chen",
    title: "CFO",
    organization: "Pacific Education Foundation",
    rating: 5,
  },
  {
    quote: "Our last single audit was the smoothest we've ever had. The auditors were impressed with the CFR citations attached to every expense. GrantLedger paid for itself in one audit cycle.",
    name: "Maria Gonzalez",
    title: "Controller",
    organization: "Southwest Family Services",
    rating: 5,
  },
  {
    quote: "As a small nonprofit with only two finance staff, we couldn't afford mistakes on our HHS grants. GrantLedger's confidence ratings help us focus our review time where it matters most.",
    name: "Priya Patel",
    title: "Finance Manager",
    organization: "Riverside Arts Collective",
    rating: 5,
  },
  {
    quote: "The dual-framework compliance saved us from a costly error. We had pre- and post-October 2024 grants with different equipment thresholds — GrantLedger caught the discrepancy automatically.",
    name: "James Okonkwo",
    title: "Grants Accountant",
    organization: "Green Valley Environmental",
    rating: 5,
  },
  {
    quote: "Importing from QuickBooks and having expenses auto-categorized with CFR citations was a game-changer. Our workforce development grants are finally audit-ready without the scramble.",
    name: "Lisa Thornton",
    title: "VP of Finance",
    organization: "Metro Workforce Alliance",
    rating: 4,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-slate-200 dark:text-slate-500"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <Card padding="lg" className="flex flex-col">
      <div className="flex items-center justify-between">
        <svg className="h-8 w-8 text-primary-200" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
        <StarRating rating={t.rating} />
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.title}, {t.organization}</p>
      </div>
    </Card>
  );
}

interface TestimonialsProps {
  className?: string;
  featured?: boolean;
}

export function Testimonials({ className = "", featured = false }: TestimonialsProps) {
  if (featured) {
    const [first, ...rest] = testimonials;
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Featured testimonial */}
        <Card padding="lg" className="border-l-4 border-l-primary-500 md:p-8">
          <div className="flex items-center justify-between">
            <svg className="h-10 w-10 text-primary-200" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>
            <StarRating rating={first.rating} />
          </div>
          <blockquote className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;{first.quote}&rdquo;
          </blockquote>
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{first.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{first.title}, {first.organization}</p>
          </div>
        </Card>

        {/* Grid of remaining */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {testimonials.map((t) => (
        <TestimonialCard key={t.name} t={t} />
      ))}
    </div>
  );
}
