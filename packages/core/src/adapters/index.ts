import { Portal, PortalAdapter } from '../types';
import { OnTheMarketAdapter } from './onthemarket.adapter';

const registry: Record<Portal, PortalAdapter | undefined> = {
  ONTHEMARKET: new OnTheMarketAdapter(),
  RIGHTMOVE: undefined,
  ZOOPLA: undefined,
};

/** Resolve the adapter for a portal. Adding a portal = implementing one interface. */
export function getAdapter(portal: Portal): PortalAdapter {
  const adapter = registry[portal];
  if (!adapter) {
    throw new Error(`No scraper adapter registered for portal "${portal}"`);
  }
  return adapter;
}

export { OnTheMarketAdapter };
