const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, shell } = require('electron')

const appHtml = path.join(__dirname, '..', 'dist', 'index.html')
const appUrl = new URL(pathToFileURL(appHtml).href)

function isAppPage(url) {
  try {
    const targetUrl = new URL(url)
    return targetUrl.protocol === 'file:' && targetUrl.pathname.toLowerCase() === appUrl.pathname.toLowerCase()
  } catch {
    return false
  }
}

function openExternal(url) {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') return
    void shell.openExternal(parsedUrl.href).catch((error) => {
      console.error('Unable to open external link:', error)
    })
  } catch (error) {
    console.error('Unable to open external link:', error)
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'app.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (isAppPage(url)) return
    event.preventDefault()
    openExternal(url)
  })

  window.loadFile(appHtml).catch((error) => {
    console.error('Unable to load the desktop app:', error)
    app.quit()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
