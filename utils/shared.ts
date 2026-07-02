import { MockEndpoint } from "./db";
import { setThemeSetting, TabStore, Theme } from "./storage";

/**
 * manually toggle theme via data attribute in DOM.
 * update/save theme in storage.
 * 
 * @param theme dark, light, system.
 */
export const toggleTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    setThemeSetting(theme);
};

/**
 * wrapper to debug console based on Mode.
 * 
 * @param msg string message to display.
 * @param data any data to pair with the messaging.
 */
export function logging(ctx: string, msg: string, data?: unknown) {
    if (import.meta.env.MODE === 'development') {
        console.debug(`[${ctx}] ${msg}`, data);
    }
}

/**
 * Attempts to format JSON serializable string.
 * 
 * @param text JSON string to try and format.
 * @returns formatted string or original string.
 */
export function tryPrettyPrint(text: string): string {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
}

/**
 * Returns the tabId of the currently active tab.
 * Used for instances outside of devtools. see {@link getInspectedTabId}.
 * 
 * @returns tabId of the current tab.
 */
export async function getActiveTabId() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab.id;
}

/**
 * Calculates which mock should be used next. 
 * Selection is based first on call order, it will choose the mock that has not been called yet.
 * Second on priority order, it will choose the mock with the highest priority.
 * Lastly on list order, mocks maintain list order via fractional indexing.
 * 
 * Note: Order matters in both mockHistory and in available mocks.
 * 
 * @param mockHistory list of mocks that have been called in call order.
 * @param availableMocks list of mocks that could be next.
 * @returns The calculated next mock or null.
 */
export function getNextMock(mockHistory: Array<MockEndpoint>, availableMocks: Array<MockEndpoint>): MockEndpoint | null {
    const lastSeen = new Map(mockHistory.map((m,i) => [m.id, i]));

    const sortedAvailableMocks = [...availableMocks].sort((a, b) => {
      const aLastSeen = lastSeen.has(a.id) ? lastSeen.get(a.id)! : -1;
      const bLastSeen = lastSeen.has(b.id) ? lastSeen.get(b.id)! : -1;

      // most recently mocked -> least recently mocked
      if (aLastSeen !== bLastSeen) {
        return aLastSeen - bLastSeen; 
      }

      // both a and b have not been mocked
      // highest priority -> lowest priority
      if (a.priorityOrder !== b.priorityOrder) {
        return a.priorityOrder - b.priorityOrder;
      }

      // by their sequential order in the list maintained by listOrder
      return a.listOrder < b.listOrder ? -1 : 1;
    });

    return sortedAvailableMocks.length > 0 ? sortedAvailableMocks[0] : null;
  }

/**
 * Update the extensions Icon asset to reflect the state of the extension for a specific tab.
 * @param tabId Unique identifier of the target tab.
 */
export async function setExtensionIconStateActive(tabId: number) {
    // TODO: handle runtime error
    await browser.action.setIcon({
        tabId: tabId,
        path: {
            48: `/icons/active/48.png`
        }
    });
}

export async function setExtensionIconStateDisabled(tabId: number) {
    // TODO: handle runtime error
    await browser.action.setIcon({
        tabId: tabId,
        path: {
            48: `/icons/default/48.png`
        }
    });
}

/**
 * Utility for dynamically updating badge content.
 * Default: mocking has not been enabled or disabled, badge text hasn't been set yet,
 * Mocking enabled: background() and color() w/BADGE_ACTIVE, set() for every fulfilled mock, 
 * Mocking disabled: background() and color() w/BADGE_INACTIVE, do not override or change set(),
 */
export const BADGE_INACTIVE = {background: '#D1D5DB', text: '#374151'};
export const BADGE_ACTIVE = {background: '#2B2D42', text: '#FFFFFF'};
export const BadgeManager = {
    set: async (tabId: number, text: string) => await browser.action.setBadgeText({text: text, tabId: tabId}),
    get: async (tabId: number) => await browser.action.getBadgeText({ tabId: tabId }),
    background: async (tabId: number, color: string) => await browser.action.setBadgeBackgroundColor({color: color, tabId: tabId}),
    color: async (tabId: number, color: string) => await browser.action.setBadgeTextColor({color: color, tabId: tabId}),
};