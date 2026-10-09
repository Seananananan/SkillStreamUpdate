const channelName = "skillstream-active-tab";
const lockedKey = "skillstream-tab-locked";
const localStateEvent = "skillstream-tab-state";
let currentTabId: string | null = null;

function getCurrentTabId() {
  currentTabId ??= window.crypto.randomUUID();
  return currentTabId;
}

function broadcastActivation() {
  if (!("BroadcastChannel" in window)) return;

  const channel = new BroadcastChannel(channelName);
  channel.postMessage({ senderId: getCurrentTabId(), type: "activated" });
  channel.close();
}

export function activateThisTab() {
  window.sessionStorage.removeItem(lockedKey);
  window.dispatchEvent(new Event(localStateEvent));
  broadcastActivation();
}

export function subscribeToActiveTabState(onStoreChange: () => void) {
  const handleLocalState = () => onStoreChange();
  window.addEventListener(localStateEvent, handleLocalState);

  const channel =
    "BroadcastChannel" in window ? new BroadcastChannel(channelName) : null;
  const handleActivation = (event: MessageEvent<{ senderId?: string }>) => {
    if (event.data.senderId === getCurrentTabId()) return;
    window.sessionStorage.setItem(lockedKey, "true");
    onStoreChange();
  };
  channel?.addEventListener("message", handleActivation);

  return () => {
    window.removeEventListener(localStateEvent, handleLocalState);
    channel?.removeEventListener("message", handleActivation);
    channel?.close();
  };
}

export function isThisTabLocked() {
  return window.sessionStorage.getItem(lockedKey) === "true";
}
