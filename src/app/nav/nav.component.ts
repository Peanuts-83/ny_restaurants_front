import { InfiniteSelectComponent } from './../utils/inputs/infinite-select/infinite-select.component'
import { SortWay } from './../models/filter-params.interface'
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { SelectConf } from '../models/input-conf.interface'
import { BoroughDistinctService } from './services/borough-distinct.service'
import { RestaurantDistinctService } from './services/restaurant-distinct.service'
import { RestaurantListService } from './services/restaurant-list.service'
import { Restaurant } from '../models/restaurant.interface'
import { Distinct } from '../models/distinct.interface'
import { MapService } from '../services/map.service'
import { MatSlider } from '@angular/material/slider'
import { Marker } from 'leaflet'
import { Subscription } from 'rxjs'
import { HttpService } from '../services/http.service'

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.less']
})
export class NavComponent implements OnInit, OnDestroy, AfterViewInit {
  private subs: Subscription[] = []
  public form!: FormGroup
  restaurantControl = new FormControl<Restaurant | null>(null)
  boroughControl = new FormControl<Distinct | null>(null)
  distanceControl = new FormControl<number | null>(200, Validators.pattern('^[0-9]+$'))
  cuisineControl = new FormControl<Distinct | null>(null)
  gradesControl = new FormControl<any | null>(null)

  target?: Marker
  @Input() canShowHalo = true
  @Output() canShowHaloChange = new EventEmitter<boolean>()
  @Input() showHalo!: boolean
  @Output() showHaloChange = new EventEmitter<boolean>()

  /**
   * Select configs
   */
  public restaurantConf: SelectConf = { service: this.restaurantListService, params: this.restaurantListService.listParams.value /**{ sort: { field: 'name', way: SortWay.ASC } }*/, formControl: 'restaurant'}
  public boroughConf: SelectConf = { service: this.restaurantDistinctService, params: { sort: { field: 'borough', way: SortWay.ASC } }, formControl: 'borough' }
  public cuisineConf: SelectConf = { service: this.restaurantDistinctService, params: { sort: { field: 'cuisine', way: SortWay.ASC } }, formControl: 'cuisine' }

  constructor(private fb: FormBuilder, public boroughDistinctService: BoroughDistinctService, public restaurantDistinctService: RestaurantDistinctService, public restaurantListService: RestaurantListService, public mapService: MapService, private httpService: HttpService) {
    this.subs.push(this.mapService.target.subscribe(result => {
      if (this.distanceSlider) {
        if (result) {
          this.target = result
        } else {
          this.target = undefined
        }
      }
    }))
    this.subs.push(this.restaurantListService.listParams.subscribe(result => {
      this.restaurantConf.params = result
    }))
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      restaurant: this.restaurantControl,
      borough: this.boroughControl,
      distance: this.distanceControl, // depuis la position de user
      cuisine: this.cuisineControl,
      grades: this.gradesControl // from A to F... to Z (Others)
    })
    this.subs.push(this.form.get('restaurant')!.valueChanges.subscribe(control => {
      this.onRestaurantChange.emit(control)
    }))
  }

  ngOnDestroy(): void {
    this.subs && this.subs.forEach(s => s.unsubscribe())
  }

  @Output() onRestaurantChange = new EventEmitter<Restaurant>()
  @Output() onToggleNav = new EventEmitter<boolean>()
  @Output() onFilterChange = new EventEmitter<null>()

  @ViewChild('restaurantSelect') restaurantSelect!: InfiniteSelectComponent<any>
  @ViewChild('cuisineSelect') cuisineSelect!: InfiniteSelectComponent<any>
  @ViewChild('boroughSelect') boroughSelect!: InfiniteSelectComponent<any>
  @ViewChild('streetSelect') streetSelect!: InfiniteSelectComponent<any>
  @ViewChild('distanceSlider') distanceSlider!: MatSlider
  public inputs!: (InfiniteSelectComponent<any> | MatSlider)[]

  ngAfterViewInit(): void {
    this.inputs = [this.restaurantSelect, this.cuisineSelect, this.boroughSelect, this.streetSelect, this.distanceSlider]
  }

  public onChangeSelectValue(a_value: any, origin: string) {
    if (origin !== 'restaurant') {
      switch (origin) {
        case 'cuisine':
        case 'borough':
          this.form.get('restaurant')?.setValue(null)
          this.restaurantSelect.searchControl.setValue(null)
          if (a_value?.name) {
            this.restaurantListService.listParams.next({ ...this.restaurantListService.listParams.value, page_nbr: 1, filters: this.httpService.setFilter(origin, a_value.name, undefined, this.restaurantConf.params.filters) })
          } else if (this.httpService.isFilter(origin, this.restaurantListService.listParams.value.filters)) {
            this.restaurantListService.listParams.next({ ...this.restaurantListService.listParams.value, page_nbr: 1, filters: this.httpService.unsetFilter(origin, this.restaurantConf.params.filters) })
          }
          this.restaurantConf = { ...this.restaurantConf }
          this.onFilterChange.emit()
          break
        case 'distance':
          if (this.target) {
            this.mapService.targetHalo.next(this.distanceControl.value!)
          }
      }
    }
    // set search of empty select to null
    if (a_value === undefined && origin !== 'distance') {
      const selects: {[key:string]: InfiniteSelectComponent<any>} = {
        restaurant: this.restaurantSelect,
        cuisine: this.cuisineSelect,
        borough: this.boroughSelect
      };
      selects[origin].searchInput.value = null
    }
  }



  public onSubmit() { }

  public toggleNav(a_event: MouseEvent) {
    a_event.stopPropagation()
    this.onToggleNav.emit(true)
  }
}
