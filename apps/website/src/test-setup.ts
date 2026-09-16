const ignore = () => {}

class StillMediaQueryList extends EventTarget implements MediaQueryList {
  matches = false
  onchange = null

  constructor(readonly media: string) {
    super()
  }

  addListener = ignore
  removeListener = ignore
}

window.matchMedia = (query: string) => {
  return new StillMediaQueryList(query)
}

HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '')
}

HTMLDialogElement.prototype.close = function close() {
  if (this.hasAttribute('open')) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
