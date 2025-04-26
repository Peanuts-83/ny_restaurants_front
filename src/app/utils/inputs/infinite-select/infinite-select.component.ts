import { Component, Input, OnDestroy, OnInit, ViewChild, forwardRef, ViewEncapsulation, Injector, Output, EventEmitter } from '@angular/core'
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { BehaviorSubject, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs'
import { FilterParams, OpField, SortParams } from '../../../models/filter-params.interface'
import { SelectConf } from '../../../models/input-conf.interface'
import { BaseApiService, HTTPResponse } from '../../../services/base-api.service'
import { InfiniteScrollService } from '../../../services/infinite-scroll.service'


/**
 * Custom Select input
 *
 * @property infiniteScroll:
 * Loads <config.params.nbr> items each time the user scrolls close to the end of select panel.
 *
 * @property search items:
 * Search text input is implemented and focused to on select opening. Text input value filters items with a new api query.
 */
@Component({
  selector: 'app-infinite-select',
  templateUrl: './infinite-select.component.html',
  styleUrl: './infinite-select.component.less',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InfiniteSelectComponent),
      multi: true
    }
  ]
})
export class InfiniteSelectComponent<T extends { name: string, borough?: string, [key: string]: any }> implements OnInit, OnDestroy, ControlValueAccessor {
  // select settings
  public value: T | null = null
  public control!: FormControl<T | null>
  public items!: T[] | null
  public isLoading = false
  public opened: boolean = false
  private endScroll = false
  public multi?: boolean

  @Input()
  parentForm!: FormGroup

  // search items
  searchControl = new FormControl(null)
  subscriptions: Subscription[] = []
  searchSub$!: Subscription

  // infiniteScroll settings
  private nbr = new BehaviorSubject<number>(30)
  private pageNbr = new BehaviorSubject<number>(1)
  private filters = new BehaviorSubject<FilterParams | undefined>(undefined)
  private sort = new BehaviorSubject<SortParams | undefined>({ field: 'name', way: 1 })

  constructor(private scrollService: InfiniteScrollService, private injector: Injector, private apiService: BaseApiService) { }

  @Output() onChangeValue = new EventEmitter()

  // ControlValueAccessor implementation //
  public onChange(value: any) {
    this.onChangeValue.emit(value)
  }
  onTouched = () => { }
  isDisabled = false

  // write value programatically
  writeValue(obj: T | null): void {
    if (this.control && this.control.value !== obj) {
      if (obj!==null && !this.items?.some(item => Object.keys(obj).every(k => obj[k]===item[k]))) {
        this.items?.push(obj)
      }
      this.control.setValue(obj, { emitEvent: false })
      this.control.markAsDirty()
    } else {
      this.value = obj
    }
  }
  // Validate value from items list
  compareControlValues(obj1: any, obj2: any): boolean {
    return obj1 && obj2 && Object.keys(obj1).every(k => obj1[k] === obj2[k])
  }
  registerOnChange(fn: (value: any) => void): void {
    // this.onChange = fn
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled
  }

  // setup control form
  ngAfterViewInit(): void {
    const ngControl = this.injector.get(NgControl, null)
    if (ngControl) {
      setTimeout(() => this.control = Object.assign(new FormControl(), ngControl.control) as FormControl)
    }
  }

  @Input()
  public label!: string

  @Input()
  public formControlName!: string

  private _config!: SelectConf
  /**
   * Select config
   * @param service: ApiService.
   * @param params: AppHttpParams (nb/page_nbr/filters/sort)
   */
  @Input()
  set config(value: SelectConf) {
    if (value && this._config!==value) {
      this._config = value
      this.nbr.next(this.config.params.nbr || 10)
      this.pageNbr.next(this.config.params.page_nbr || 1)
      this.filters.next(this.config.params.filters)
      this.sort.next(this.config.params.sort)
      this.multi = value.isMulti
    }
  }
  get config(): SelectConf {
    return this._config
  }

  /** Select component */
  @ViewChild(MatSelect)
  selectInput!: MatSelect
  /** Search input component */
  @ViewChild(MatInput)
  searchInput!: MatInput


  ngOnInit(): void {
    // update config.params on params
    this.subscriptions.concat([
      this.nbr.subscribe(result => this.config.params.nbr = result),
      this.pageNbr.subscribe(result => this.config.params.page_nbr = result),
      this.filters.subscribe(result => {
        this.config.params.filters = result
        this._doNext()
      }),
      this.sort.subscribe(result => this.config.params.sort = result)
    ])
    // search init
    this.searchControl.disable()
    this.doInitSearch()
    // get first items
    this.doInitItems()
  }

  /** get <nbr> first items on load */
  doInitItems() {
    this.isLoading = true
    this._doNext()
  }

  private _doNext() {
    this.scrollService.doPost<T[]>(this.config.service.apiConf.baseApi, this.config.params)
      .subscribe(result => {
        if (result && result.data.length > 0) {
          this.items = result.data
          if (result.data.length < this.nbr.value) {
            this.endScroll = true
          } else {
            this.endScroll = false
            this.pageNbr.next(result.page_nbr! + 1)
          }
        } else {
          this.items = []
          this.endScroll = true
        }
        this.isLoading = false
      })
  }

  private _unsetControl() {
    this.control.setValue(null)
    this.onChange(null)
  }

  /** get <nbr> search items on searchInput.valueChanges  */
  doInitSearch() {
    this.searchSub$ = this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value: string | null) => {
        this._unsetControl()
        if (value && value.length > 0) {
          this.filters.next({
            field: this.config.params.sort?.field!,
            value: value || "",
            operator_field: OpField.CONTAIN
          })
          this.pageNbr.next(1)
          return this.scrollService.doPost<T[]>(this.config.service.apiConf.baseApi, this.config.params)
        }
        return of(null)
      })
    ).subscribe(result => {
      if (result !== null) {
        this.items = result.data
      } else if (this.filters.value) {
        // back to items without search filter
        // this.filters.next(undefined)
        this.pageNbr.next(1)
        this._unsetControl()
        this.doInitItems()
      }
    })
  }

  ngOnDestroy(): void {
    this.searchSub$.unsubscribe()
  }

  /** Watch scroll event on opened event */
  onSwitch(a_opened: boolean): void {
    if (a_opened) {
      this.doSwitchSearchInput(a_opened) // true
      this.selectInput.panel.nativeElement.addEventListener('scroll', this.onScroll.bind(this))
    } else {
      this.doSwitchSearchInput(a_opened) // false
    }
  }

  /** Show/hide search input and label */
  doSwitchSearchInput(a_show: boolean) {
    this.opened = a_show
    if (a_show) {
      this.searchControl.enable()
      this.searchInput.focus()
    } else {
      this.searchControl.disable()
    }
  }


  /**
   * Fire api call when reaches end of items
   * @param a_event
   */
  public onScroll(a_event: Event) {
    a_event.stopPropagation()
    const l_select = a_event.target as HTMLElement
    // Check for scroll at the end of items list
    if (!this.isLoading && !this.endScroll && (l_select.scrollTop + l_select.clientHeight >= l_select.scrollHeight / 1.1)) {
      this.isLoading = true
      this.scrollService.loadNext<T>(this.config, this.items!).subscribe(
        (result: HTTPResponse<T[]>) => {
          if (result) {
            this.items = this.items!.concat(result.data)
            // no more api call if length < this.nbr
            if (result.data.length < this.nbr.value) {
              this.endScroll = true
            } else {
              this.endScroll = false
              this.pageNbr.next(this.pageNbr.value + 1)
            }
          }
          this.isLoading = false
        })
    }
  }


}
