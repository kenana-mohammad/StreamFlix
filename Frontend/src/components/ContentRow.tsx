import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Content } from '@/types';
import ContentCard from './ContentCard';

interface Props {
  title: string;
  items: Content[];
  variant?: 'default' | 'wide' | 'continue';
  progressMap?: Record<string, number>;
}

export default function ContentRow({ title, items, variant = 'default', progressMap }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [items]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section className="relative group/row mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 px-4 sm:px-6 lg:px-12">{title}</h2>
      <div className="relative">
        {canLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center bg-gradient-to-r from-ink-950 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft size={32} className="text-white" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="row-scroll flex gap-3 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-12 pb-2"
        >
          {items.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              variant={variant}
              progress={progressMap?.[item.id] ?? 0}
            />
          ))}
        </div>
        {canRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center bg-gradient-to-l from-ink-950 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight size={32} className="text-white" />
          </button>
        )}
      </div>
    </section>
  );
}
