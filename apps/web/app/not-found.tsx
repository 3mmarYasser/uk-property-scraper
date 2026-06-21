import Link from 'next/link';
import { Inbox } from '../components/icons';

export default function NotFound() {
  return (
    <div className="panel rise-1" style={{ marginTop: 40 }}>
      <div className="panel-icon">
        <Inbox width={22} height={22} />
      </div>
      <h3>Listing not found</h3>
      <p>This property isn&apos;t in the database — it may have been removed, or never scraped.</p>
      <Link href="/" className="btn btn-primary sm" style={{ marginTop: 8 }}>
        Back to listings
      </Link>
    </div>
  );
}
