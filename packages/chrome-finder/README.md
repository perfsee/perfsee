# `@perfsee/chrome-finder`

Find local installed Google Chrome(Chromium) executable path or download it.

## Usage

```
const { findChrome } = require('chrome-finder');

findChrome(({ executablePath, browser }) => {
  // absolute path to the chrome executable
  console.log(executablePath)
  // result of `chrome --version`, e.g. `Google Chrome xx.xx.xx.xx`
  console.log(browser)
})
```

## Credits

This package is a fork of [mbalabash/find-chrome-bin](https://github.com/mbalabash/find-chrome-bin) which only works with `node>=16` (specified in engines)
