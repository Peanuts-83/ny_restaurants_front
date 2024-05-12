import { control } from 'leaflet'
import { Component, Input, OnDestroy, OnInit, ViewChild, forwardRef, ViewEncapsulation, Output, EventEmitter } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms'
import { MatInput } from '@angular/material/input'
import { MatSelect } from '@angular/material/select'
import { Observable, Subscription, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs'
import { FilterParams, SortParams } from 'src/app/models/filter-params.interface'
import { InputConf } from 'src/app/models/input-conf.interface'
import { InfiniteScrollService } from 'src/app/services/infinite-scroll.service'


export interface BaseDistinct {
  name: string
}

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
export class InfiniteSelectComponent<T extends { name: string }> implements OnInit, OnDestroy {
  public items!: T[]|null
  public isLoading = false
  public opened: boolean = false
  private endScroll = false
  @Input()
  public formControl!: FormControl<T|null>
  @Output()
  formControlChange = new EventEmitter<FormControl<T|null>>()

  // search items
  public searchItems!: T[]|null
  searchControl = new FormControl(null)
  searchRequest$!: Observable<T[]|null>

  doSearch(a_event: Event) {
    a_event.stopPropagation()
  }

  private subscriptions: Subscription[] = []

  // InfiniteScroll settings
  private nbr = 30
  private pageNbr = 1
  private filters: FilterParams | null = null
  private sort: SortParams = { field: 'name', way: 1 }

  @Input()
  label!: string
  @Input()
  public form!: FormGroup
  @Input()
  public name!: string

  private _config!: InputConf
  /**
   * Select config.
   * @param service: ApiService.
   * @param params: AppHttpParams (nb/page_nbr/filters/sort)
   */
  @Input()
  public set config(value: InputConf) {
    if (!value.params.nbr) {
      value.params.nbr = this.nbr
    }
    if (!value.params.page_nbr) {
      value.params.page_nbr = this.pageNbr
    }
    this._config = value
  }
  public get config(): InputConf {
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
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((value: string|null) => {
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

    // get first items
    this.doInitItems()
  }

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
      this.searchInput.focus()
    } else {
      this.items = [...this.searchItems!]
      this.searchInput.value = ""
      this.searchItems = null
      this.doInitItems()
    }
  }


  /** Destroy eventListener */
  ngOnDestroy(): void {
    this.selectInput?.panel?.nativeElement.removeEventListener('scroll', this.onScroll.bind(this))
  }

  constructor(private scrollService: InfiniteScrollService, private fb: FormBuilder) { }

  /**
   * Fire api call when reaches end of items
   * @param a_event
   */
  public onScroll(a_event: Event) {
    a_event.stopPropagation()
    if (!this.isLoading && !this.endScroll) {
      const l_select = a_event.target as HTMLElement
      this.debugg = l_select.scrollTop + l_select.clientHeight >= l_select.scrollHeight / 1.1
      if (l_select.scrollTop + l_select.clientHeight >= l_select.scrollHeight / 1.1) {
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


  // to be removed
  debugg: any
}
