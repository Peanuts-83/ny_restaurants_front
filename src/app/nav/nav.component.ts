import { InfiniteSelectComponent } from './../utils/inputs/infinite-select/infinite-select.component'
import { SortWay } from './../models/filter-params.interface'
import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild, viewChild } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { InputConf } from '../models/input-conf.interface'
import { BoroughDistinctService } from './services/borough-distinct.service'
import { RestaurantDistinctService } from './services/restaurant-distinct.service'
import { RestaurantListService } from './services/restaurant-list.service'
import { Restaurant } from '../models/restaurant.interface'
import { Distinct } from '../models/distinct.interface'

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.less']
})
export class NavComponent implements OnInit, AfterViewInit {
  public form!: FormGroup
  restaurantControl = new FormControl<Restaurant|null>(null)
  boroughControl = new FormControl<Distinct|null>(null)
  streetControl = new FormControl<any|null>(null)
  distanceControl = new FormControl<number|null>(null, Validators.pattern('^[0-9]+$'))
  cuisineControl = new FormControl<Distinct|null>(null)
  gradesControl = new FormControl<any|null>(null)

  /**
   * Select configs
   */
  public restaurantConf: InputConf = { service: this.restaurantListService, params: { sort: { field: 'name', way: SortWay.ASC } }, formControl: 'restaurant' }
  public boroughConf: InputConf = { service: this.restaurantDistinctService, params: { sort: { field: 'borough', way: SortWay.ASC } }, formControl: 'borough' }
  public streetConf: InputConf = { service: this.restaurantDistinctService, params: { sort: { field: 'address.street', way: SortWay.ASC } }, formControl: 'street' }
  public cuisineConf: InputConf = { service: this.restaurantDistinctService, params: { sort: { field: 'cuisine', way: SortWay.ASC } }, formControl: 'cuisine' }

  constructor(private fb: FormBuilder, public boroughDistinctService: BoroughDistinctService, public restaurantDistinctService: RestaurantDistinctService, public restaurantListService:RestaurantListService ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      restaurant: this.restaurantControl,
      borough: this.boroughControl,
      street: this.streetControl,
      distance: this.distanceControl, // depuis la position de user
      cuisine: this.cuisineControl,
      grades: this.gradesControl // from A to F... to Z (Others)
    })
    this.form.get('restaurant')!.valueChanges.subscribe(control => {
      this.onRestaurantChange.emit(this.form.get('restaurant')!.value)
      if (control!==null) {
        this.form.patchValue({
          borough: {name: control.borough},
          street: {name: control.address.street},
          cuisine: {name: control.cuisine},
        })
      }
    })
  }

  @Output() onRestaurantChange = new EventEmitter<Restaurant>()
  @Output() onToggleNav = new EventEmitter<boolean>()

  @ViewChild('restaurantSelect') restaurantSelect!: InfiniteSelectComponent<any>
  @ViewChild('cuisineSelect') cuisineSelect!: InfiniteSelectComponent<any>
  @ViewChild('boroughSelect') boroughSelect!: InfiniteSelectComponent<any>
  @ViewChild('streetSelect') streetSelect!: InfiniteSelectComponent<any>
  public selects!: InfiniteSelectComponent<any>[]

  ngAfterViewInit(): void {
    this.selects = [this.restaurantSelect, this.cuisineSelect, this.boroughSelect, this.streetSelect]
    // for (let select of selects) {
    //   select.onChange()
    // }
  }

  public onChangeSelectValue(a_value: any) {
    const blankSelects = this.selects.filter(sel => sel.label!==a_value['name'])
  }

  public onSubmit() {

  }

  public toggleNav(a_event: MouseEvent) {
    a_event.stopPropagation()
    this.onToggleNav.emit(true)
  }
}
