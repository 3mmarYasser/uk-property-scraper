'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from './icons';
import { KeystoneMark } from './Logo';

export function Nav() {
  const pathname = usePathname();
  const isHealth = pathname.startsWith('/health');
  const isListings = !isHealth;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="Keystone home">
          <span className="brand-mark" aria-hidden>
            <KeystoneMark width={20} height={22} />
          </span>
          Keystone
        </Link>

        <nav className="tabs" aria-label="Primary">
          <Link href="/" className={`tab ${isListings ? 'active' : ''}`} aria-current={isListings ? 'page' : undefined}>
            Listings
          </Link>
          <Link href="/health" className={`tab ${isHealth ? 'active' : ''}`} aria-current={isHealth ? 'page' : undefined}>
            Pipeline
          </Link>
        </nav>

        <div className="topbar-right">
          <Link href="/health" className="live" title="Scraper status">
            <span className="pulse" aria-hidden />
            <Activity width={13} height={13} />
            Live
          </Link>
        </div>
      </div>
    </header>
  );
}
