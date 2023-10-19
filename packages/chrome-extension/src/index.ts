interface Recording {}

let latestRecording: Recording

let view: chrome.devtools.recorder.RecorderView

const getView = async () => {
  if (view) {
    return view
  }

  // eslint-disable-next-line
  view = await chrome.devtools.recorder.createView('Perfsee', 'replay.html')

  view.onShown.addListener(() => {
    // Recorder has shown the view. Send additional data to the view if needed.
    void chrome.runtime.sendMessage(JSON.stringify(latestRecording))
  })

  view.onHidden.addListener(() => {
    // Recorder has hidden the view.
  })

  return view
}

class PerfseeRecorderPlugin {
  async replay(recording: Recording) {
    latestRecording = recording
    ;(await getView()).show()
  }
}

chrome.devtools.recorder.registerRecorderExtensionPlugin(
  new PerfseeRecorderPlugin() as any as chrome.devtools.recorder.RecorderExtensionPlugin,
  'Perfsee',
  'application/json',
)

chrome.devtools.panels.create('Perfsee', '', './lab.html')
