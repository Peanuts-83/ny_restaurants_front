import { Component, Input, OnDestroy, OnInit, ViewChild, forwardRef, ViewEncapsulation, Injector } from '@angular/core'
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs'
import { FilterParams, SortParams } from 'src/app/models/filter-params.interface'
import { InputConf } from 'src/app/models/input-conf.interface'
import { InfiniteScrollService } from 'src/app/services/infinite-scroll.service'


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
export class InfiniteSelectComponent<T extends { name: string }> implements OnInit, OnDestroy, ControlValueAccessor {
  // select settings
  public value: T | null = null
  public control!: FormControl<T | null>
  public items!: T[] | null
  public isLoading = false
  public opened: boolean = false
  private endScroll = false

  // search items
  public searchItems!: T[] | null
  searchControl = new FormControl(null)
  searchSub$!: Subscription

  // infiniteScroll settings
  private nbr = 30
  private pageNbr = 1
  private filters: FilterParams | undefined = undefined
  private sort: SortParams = { field: 'name', way: 1 }

  constructor(private scrollService: InfiniteScrollService, private injector: Injector) { }

  // ControlValueAccessor implementation //
  onChange = (value: any) => { }
  onTouched = () => { }
  isDisabled = false

  writeValue(obj: T | null): void {
    this.value = obj
  }
  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn
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
  public name!: string

  private _config!: InputConf
  /**
   * Select config
   * @param service: ApiService.
   * @param params: AppHttpParams (nb/page_nbr/filters/sort)
   */
  @Input()
  set config(value: InputConf) {
    if (!value.params.nbr) {
      value.params.nbr = this.nbr
    }
    if (!value.params.page_nbr) {
      value.params.page_nbr = this.pageNbr
    }
    this._config = value
  }
  get config(): InputConf {
    return this._config
  }

  /** Select component */
  @ViewChild(MatSelect)
  selectInput!: MatSelect
  /** Search input component */
  @ViewChild(MatInput)
  searchInput!: MatInput


  ngOnInit(): void {
    // assign init values
    this.config.params['nbr'] = this.config.params.nbr || this.nbr
    this.config.params['page_nbr'] = this.config.params.page_nbr || this.pageNbr
    this.filters = this.config.params.filters || this.filters
    this.sort = this.config.params.sort || this.sort
    // search init
    this.searchControl.disable()
    this.doInitSearch()
    // get first items
    this.doInitItems()
  }

  /** get <nbr> first items on load */
  doInitItems() {
    this.isLoading = true
    this.scrollService.doPost<T[]>(this.config.service.apiConf.baseApi, this.config.params)
      .subscribe(result => {
        if (result) {
          this.items = result
          this.endScroll = result.length < this.nbr ? true : false
        }
        this.isLoading = false
      })
  }

  /** get <nbr> search items on searchInput.valueChanges  */
  doInitSearch() {
    this.searchSub$ = this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value: string | null) => {
        return this.scrollService.doPost<T[]>(this.config.service.apiConf.baseApi, {
          ...this.config.params,
          filters: {
            field: this.config.params.sort?.field!,
            value: value || "",
            operator_field: '$regex'
          }
        })
      })
    ).subscribe(result => {
      this.searchItems = result
    })
  }

  ngOnDestroy(): void {
    this.searchSub$.unsubscribe()
  }


  /** Watch scroll event on opened event */
  onSwitch(a_opened: boolean): void {
    if (a_opened) {
      this.doSwitchSearchInput(a_opened)
      this.selectInput.panel.nativeElement.addEventListener('scroll', this.onScroll.bind(this))
    } else {
      this.doSwitchSearchInput(a_opened)
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
      this.items = this.searchItems ? this.searchItems.slice() : this.items
    }
  }


  /**
   * Fire api call when reaches end of items
   * @param a_event
   */
  public onScroll(a_event: Event) {
    a_event.stopPropagation()
    if (!this.isLoading && !this.endScroll) {
      const l_select = a_event.target as HTMLElement
      this.isLoading = true
      this.scrollService.loadNext<T>(this.config, this.items!).subscribe(
        result => {
          setTimeout(() => {
            if (result) {
              this.items = this.items!.concat(result)
              // no more api call if length < this.nbr
              this.endScroll = result.length < this.nbr ? true : false
            }
            this.isLoading = false
          }, 500
          )
        })
    }
  }


}
