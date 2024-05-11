import { SortWay } from './../models/filter-params.interface'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { InputConf } from '../models/input-conf.interface'
import { BoroughDistinctService } from './services/borough.service'
import { RestaurantDistinctService } from './services/restaurant-distinct.service'

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.less']
})
export class NavComponent implements OnInit {
  public form!: FormGroup

  /**
   * Select configs
   */
  public restaurantConf: InputConf = { service: this.restaurantDistinctService, params: { sort: { field: 'name', way: SortWay.ASC } }, formControl: 'restaurant' }
  public boroughConf: InputConf = { service: this.boroughDistinctService, params: { sort: { field: 'name', way: SortWay.ASC } }, formControl: 'borouhg' }
  public streetConf: InputConf = { service: this.restaurantDistinctService, params: { sort: { field: 'address.street', way: SortWay.ASC } }, formControl: 'street' }
  public cuisineConf: InputConf = { service: this.restaurantDistinctService, params: { sort: { field: 'cuisine', way: SortWay.ASC } }, formControl: 'cuisine' }

  constructor(private fb: FormBuilder, public boroughDistinctService: BoroughDistinctService, public restaurantDistinctService: RestaurantDistinctService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      restaurant: [null],
      borough: [null],
      street: [null],
      distance: [null, Validators.pattern('^[0-9]+$')], // depuis la position de user
      cuisine: [null],
      grades: [null] // from A to F... to Z (Others)
    })
  }

  public onSubmit() {

  }
}
