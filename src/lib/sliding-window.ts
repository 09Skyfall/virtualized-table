type SlidingWindowOptions<T> = {
  on_change?: ((newValue: T[]) => void),
  immediate?: boolean
}

class SlidingWindow<T>{
  private _underlying: T[]
  private _window_size: number
  private _sliding_window!: T[]
  private _left_i: number // inclusive
  private _right_i: number // exclusive
  private _on_change: SlidingWindowOptions<T>["on_change"]

  constructor(underlying: T[], window_size: number, options: SlidingWindowOptions<T>) {
    this._underlying = underlying
    this._window_size = window_size
    this._on_change = options.on_change

    this._sliding_window = this._underlying.slice(0, window_size)
    this._left_i = 0
    this._right_i = window_size
    
    if (this._on_change && options.immediate) {
      // Calling setTimeout to avoid problems when the reference to an instance of this class
      // is used inside the _on_change function. Since we're still inside the constructor, that
      // reference would be undefined
      setTimeout(() => this._on_change!(this._sliding_window), 0)
    }
  }

  public slide_right(n: number): number {
    const _n_to_slide = this._right_i !== this._underlying.length 
      ? Math.min(n, this._underlying.length - this._right_i)
      : 0

    this._left_i += _n_to_slide
    this._right_i += _n_to_slide

    console.assert(this._left_i <= this._underlying.length - this._window_size)
    console.assert(this._right_i <= this._underlying.length)

    if (_n_to_slide > 0) {
      this.#sliding_window = this._underlying.slice(this._left_i, this._right_i)
    }
    return _n_to_slide
  }

  public slide_left(n: number): number {
    const _n_to_slide = this._left_i !== 0
      ? Math.min(n, this._left_i)
      : 0

    this._left_i -= _n_to_slide
    this._right_i -= _n_to_slide

    console.assert(this._left_i >= 0)
    console.assert(this._right_i >= this._window_size)

    if (_n_to_slide > 0) {
      this.#sliding_window = this._underlying.slice(this._left_i, this._right_i)
    }
    return _n_to_slide
  }

  public has_left_items(): boolean {
    return this._left_i !== 0
  }

  public has_right_items(): boolean {
    return this._right_i !== this._underlying.length
  }

  public get left(): number {
    return this._left_i
  }
  
  public get right(): number {
    return this._right_i
  }

  set #sliding_window(value: T[]) {
    this._sliding_window = value
    // TODO: deepcopy?
    if (this._on_change) this._on_change(value)
  }
}

export default SlidingWindow