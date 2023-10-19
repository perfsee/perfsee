const perfseeIframe = document.querySelector<HTMLIFrameElement>('#perfsee')!

chrome.runtime.onMessage.addListener((_request, _sender, _sendResponse) => {
  perfseeIframe.contentWindow?.postMessage({
    type: 'create-e2e',
  })

  return undefined
})
