// 2. support children change through DOM manipulation or events to set or add rows(?)
// 3. support 'items' attribute

// BUG NOTI:
// - Se si scorre troppo velocemente, la sliding window non sembra essere aggiornata correttamente
//   risultando in una tabella mezza vuota

import { fromHTML } from "@/lib/fromHtml"
import SlidingWindow from "@/lib/sliding-window"

class VirtualizedTable extends HTMLTableElement {
  private N_BUFFER_ROWS = 1
  private ROW_HEIGHT = 45

  private _rows: HTMLTableRowElement[] = []
  private _sliding_window!: SlidingWindow<HTMLTableRowElement>
  
  private _visibile_rows = 0
  private _parent_height = 0
  private _start_obs = new IntersectionObserver(this._on_last_rows_start.bind(this))
  private _end_obs = new IntersectionObserver(this._on_last_rows_end.bind(this))

  constructor() {
    super()
    // TODO: remove demo from here
    const tbody = document.querySelector("table tbody")!
    for(let i = 0; i < 100; i++) {
      tbody.appendChild(fromHTML(`<tr><td>cell ${i}</td></tr>`) as HTMLElement)
    }
  }z

  connectedCallback() {
    try {
      this._rows = [...this.querySelectorAll("tbody tr").values()] as HTMLTableRowElement[]

      this.N_BUFFER_ROWS = Number(this.getAttribute("buffer"))
      this.ROW_HEIGHT = Number(this.getAttribute("row-height"))

      this._init_parent_observation()
      this._visibile_rows = Math.ceil(this.#parent_height / this.ROW_HEIGHT)
      
      // The sliding window is made of a portion of rows that is always visible inside the table and a
      // 'buffer' on the top and bottom side that are not visible.
      // To these rows, two more are needed. These rows should avoid the possibility that the
      // observers on each side of the table are triggered sequentially and indefinitely.
      const _window_size = this._visibile_rows + (2 * this.N_BUFFER_ROWS) + 2
      this._sliding_window = new SlidingWindow(
        this._rows,
        _window_size,
        { on_change: this._on_slide.bind(this), immediate: true }
      )

    } catch (e) {
      this._onError(e)
    }
  }

  private _on_last_rows_start([entry]: IntersectionObserverEntry[]) {
    if (entry.isIntersecting) {
      this._sliding_window.slide_left(this.N_BUFFER_ROWS)
    }
  }
  
  private _on_last_rows_end([entry]: IntersectionObserverEntry[]) {
    if (entry.isIntersecting) {
      this._sliding_window.slide_right(this.N_BUFFER_ROWS)
    }
  }

  private _init_parent_observation() {
    const _parent = this.parentElement
    if (!_parent) throw "Virtualized table has no parent."
    const _parentObserver = new ResizeObserver(this._on_parent_resize)
    _parentObserver.observe(_parent)
    this.#parent_height = _parent.clientHeight
  }

  set #parent_height(height: number) {
    this._parent_height = height
  }
 
  get #parent_height() {
    return this._parent_height
  }

  private _on_slide(new_elems: HTMLTableRowElement[]) {
    this._replace_table_rows(new_elems)

    this._start_obs.disconnect()
    if (this._sliding_window.has_left_items()) {
      // update observer for start of sliding window
      const _observee_i = Math.ceil(this.N_BUFFER_ROWS / 2)
      this._start_obs.observe(new_elems[_observee_i - 1])
    }
    
    this._end_obs.disconnect()
    if (this._sliding_window.has_right_items()) {
      // update observer for end of sliding window
      const _observee_i = new_elems.length - Math.floor(this.N_BUFFER_ROWS / 2)
      this._end_obs.observe(new_elems[_observee_i - 1])
    }
  }

  private _replace_table_rows(elems: HTMLTableRowElement[]) {
    const _first_tr = fromHTML(`<tr style="height: ${this._sliding_window.left * this.ROW_HEIGHT}px"></tr>`) as Element
    const _last_tr = fromHTML(`<tr style="height: ${(this._rows.length - this._sliding_window.right) * this.ROW_HEIGHT}px"></tr>`) as Element

    const _elems = [_first_tr, ...elems, _last_tr]
    this.tBodies[0].replaceChildren(..._elems)
  }

  private _on_parent_resize([entry]: ResizeObserverEntry[]) {
    // TODO: when this changes, n_rows and thus sliding_window should change
    this._parent_height = entry.contentBoxSize[0].blockSize
  }

  private _onError(message: unknown) {
    // TODO
    // this.dispatchEvent(new Event("error"))
    console.error(message)
  }
}

customElements.define("virtualized-table", VirtualizedTable, { extends: "table" });
