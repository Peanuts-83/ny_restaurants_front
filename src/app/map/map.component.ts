import { FilterParams } from 'src/app/models/filter-params.interface'
import { RestaurantListService } from './../nav/services/restaurant-list.service'
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core'
import { MapService } from '../services/map.service'
import { LatLng, LeafletMouseEvent, Map, Marker, marker, icon, circle, Circle } from 'leaflet'
import { BehaviorSubject, Subscription } from 'rxjs'
import { optionMarker, Restaurant } from '../models/restaurant.interface'
import { AppHttpParams, OpField, SingleFilter } from '../models/filter-params.interface'
import { __asyncValues } from 'tslib'
import { HttpService } from '../services/http.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private subs: Subscription[] = []
  private map!: Map

  private _restaurantList: Restaurant[] = []
  /** restaurant list selected by user */
  public get restaurantList(): Restaurant[] {
    return this._restaurantList
  }
  public set restaurantList(value: Restaurant[]) {
    if (value !== this._restaurantList) {
      let diff: Restaurant[] = []
      if (value?.length > this._restaurantList.length) {
        diff = this.getDiff(value, this._restaurantList)
        diff.forEach((restaurant, i, arr) => this.doCreateMarker(restaurant, i === arr.length - 1))
      } else {
        this.doRemoveMarker()
      }
      this._restaurantList = value
    }
  }

  /** markers list selected by user */
  private _markers: Marker[] = []

  /** map option */
  public oneMarker = false

  private _targetMarker!: Marker|undefined
  /** target for user position */
  public set targetMarker(value: Marker|undefined) {
    this._targetMarker = value
    this.mapService.target.next(value)
  }
  public get targetMarker(): Marker|undefined {
    return this._targetMarker
  }

  /** halo marker joined to target marker */
  public haloMarkerCircle = new BehaviorSubject<Circle | undefined>(undefined)

  private _haloRestaurantList: Restaurant[] = []
  /** restaurants corresponding to filters IN halo area */
  public set haloRestaurantList(value: Restaurant[]) {
    if (value !== this._haloRestaurantList) {
      this._haloRestaurantList = value
    }
  }
  public get haloRestaurantList(): Restaurant[] {
    return this._haloRestaurantList
  }

  /** markers list for restaurants corresponding to filters IN halo area */
  private _haloMarkerList: Marker[] = []

  /** target & halo shown? */
  public canSetPosition = false
  public positionActive = false

  private _canShowHalo = false
  @Input()
  set canShowHalo(value: boolean) {
    if (value !== this._canShowHalo) {
      this._canShowHalo = value
      this.canShowHaloChange.emit(value)
      if (this.haloMarkerCircle.value) {
        const coord = this.haloMarkerCircle.value.getLatLng()
        this.map.removeLayer(this.haloMarkerCircle.value!)
        this.haloMarkerCircle.next(circle(coord, {
          className: 'halo',
          radius: this.mapService.targetHalo.value,
          stroke: false,
          fillColor: 'green',
          fillOpacity: value ? .4 : 0
        }))
        this.haloMarkerCircle.value?.addTo(this.map)
      }
      if (!value) {
        this.doToggleHalo()
        this.doRemoveMarker(undefined,true)
      }
    }
  }
  public get canShowHalo(): boolean {
    return this._canShowHalo
  }
  @Output()
  canShowHaloChange = new EventEmitter<boolean>()

  /**
   * Filter missing restaurants
   * @param big Restaurant[]
   * @param small Restaurant[]
   * @returns Restaurant[]
   */
  public getDiff(big: Restaurant[], small: Restaurant[]): Restaurant[] {
    const l_small = small.map(rest => JSON.stringify(rest))
    return big.filter(restB => l_small.every(restS => restS !== JSON.stringify(restB)))
  }

  @ViewChild('mapContainer')
  public mapContainer!: ElementRef<Map>

  @ViewChild('popupTemplate', { read: TemplateRef })
  public popupTemplate!: TemplateRef<HTMLElement>


  constructor(private mapService: MapService, private viewContainerRef: ViewContainerRef, public restaurantListService: RestaurantListService, public httpService: HttpService) { }


  ngAfterViewInit() {
    this.mapService.initMap(this.mapContainer)
    // mouseUp event on map to set target
    this.subs.push(this.mapService.leafletMap$.subscribe(result => {
      this.map = result
      this.map.addEventListener('mouseup', (e: LeafletMouseEvent) => {
        if (this.canSetPosition) {
          this.doSetTarget(e)
        }
      })
    }))
    // halo radius & halo zone restaurants shown
    this.subs.push(this.mapService.targetHalo.subscribe(result => {
      if (result) {
        this.haloMarkerCircle.value?.setRadius(result)
        this.haloMarkerCircle.value?.addTo(this.map)
        if (this.restaurantList?.length === 0 && this.canShowHalo) {
          this.doLoadHaloRestaurants()
        }
      }
    }))
    // halo show and corresponding restaurants show
    this.haloMarkerCircle.subscribe(result => {
      if (result) {
        if (this.haloRestaurantList?.length > 0) {
          this.haloRestaurantList.forEach(restaurant => this.doCreateMarker(restaurant, false, true))
        } else {
          this.doRemoveMarker(undefined, true)
        }
        if (this.restaurantList?.length === 0 && this.canShowHalo) {
          this.doLoadHaloRestaurants()
        }
      } else {
        this.doRemoveMarker(undefined, true)
      }
    })
  }

  /**
   * Loads all restaurants in halo zone matching restaurantListService.listParams
   * if no restaurant is selected by user.
   */
  public doLoadHaloRestaurants() {
    const apiService = this.restaurantListService
    const apiParams: AppHttpParams = {
      ...apiService.listParams.value,
      nbr: 0, // get all
      page_nbr: 1,
      filters: this.httpService.setFilter(Object.values(this.haloMarkerCircle.value!.getLatLng()).reverse(), this.haloMarkerCircle.value?.getRadius()!, OpField.GEO, this.restaurantListService.listParams.value.filters)
    }
    apiService.doPost<Restaurant[]>(apiService.apiConf.baseApi, apiParams).subscribe(result => {
      this.haloRestaurantList = result.data
      this.doRemoveMarker(undefined, true)
      this.haloRestaurantList.forEach(restaurant => this.doCreateMarker(restaurant, false, true))
    })
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe())
  }

  /** add some restaurant */
  @Input() set restaurant(a_value: Restaurant) {
    if (a_value && !this.restaurantList.map(r => JSON.stringify(r)).includes(JSON.stringify(a_value))) {
      this.restaurantList = [...this.restaurantList, a_value]
      // move to restaurant map zone > passer à un mode de visualisation englobant tous les restaurants affichés
      this.map.setView(this.mapService.coordToLeaflet(a_value.address.coord), 16)
    } else {
      this.restaurantList = []
    }
  }

  /**
   * Build tooltip & popver for a marker
   * @param a_value
   * @returns optionMarker
   */
  public optionMarkerBuilder(a_value: Restaurant): optionMarker {
    const l_grades: string[] = a_value.grades.length > 0 ? a_value.grades.map((grade, i, arr) => (`${grade.grade}`)) : ['- none -']
    return ({
      popupContent:
        `<div class='markerPopup'>
          <h3>${a_value.name}</h3>
          <div class='cuisine'>${a_value.cuisine}</div>
          <div class='score'><i class="fa-solid fa-star"></i><span>${l_grades.join(' - ')}</span></div>
          <div>${a_value.address.building} - ${a_value.address.street}</div>
          <div class='borough'>${a_value.borough}</div>
          </div>`
      ,
      tooltipContent: `<div>${a_value.name}</div>`
    })
  }

  /**
   * Create marker || haloMarker for a restaurant
   * @param a_value
   * @param isHalo
   */
  public doCreateMarker(a_value: Restaurant, showPopup?: boolean, isHalo?: boolean) {
    if (this.oneMarker) {
      this.doRemoveMarker(this._markers[0])
    }
    const l_coord: LatLng = this.mapService.coordToLeaflet(a_value.address.coord)
    const l_options: optionMarker = this.optionMarkerBuilder(a_value)
    const l_marker = marker(l_coord).addTo(this.map)
    l_options?.popupContent && showPopup && l_marker.bindPopup(l_options.popupContent).openPopup() || l_marker.bindPopup(l_options.popupContent)
    l_options?.tooltipContent && l_marker.bindTooltip(l_options.tooltipContent)
    if (isHalo) {
      this._haloMarkerList.push(l_marker)
    } else {
      this._markers.push(l_marker)
    }
  }

  /**
   * Remove a marker || haloMarker.
   * Can remove all if no marker provided.
   * @param a_marker
   * @param isHalo
   */
  public doRemoveMarker(a_marker?: Marker, isHalo?: boolean) {
    if (!a_marker) {
      // remove all markers
      if (isHalo) {
        this._haloMarkerList.forEach(m => this.map.removeLayer(m))
        this._haloMarkerList = []
      } else {
        this._markers.forEach(m => this.map.removeLayer(m))
        this._markers = []
      }
    } else {
      // remove one marker
      this.map.removeLayer(a_marker)
    }
  }

  public doToggleTarget(a_event?:MouseEvent) {
    a_event?.stopPropagation()
    if (this.targetMarker) {
      this.map.removeLayer(this.targetMarker)
      this.doRemoveMarker(undefined, true)
      this.targetMarker = undefined
      this.positionActive = false
      this.canSetPosition = false
      this.doToggleHalo()
    } else {
      this.canSetPosition = true
    }
  }

  public doToggleHalo() {
    this.map?.removeLayer(this.haloMarkerCircle.value!)
    this.haloRestaurantList = []
  }

  /**
   * Map click event for user position simulation
   * @param a_event
   */
  public doSetTarget(a_event: LeafletMouseEvent) {
    this.doCreateTarget(a_event.latlng)
  }

  /**
   * Create target on map
   * @param a_coord
   * @param a_options
   */
  public doCreateTarget(a_coord: LatLng) {
    // remove initial target if exist
    this.targetMarker && this.doRemoveMarker(this.targetMarker)
    this.haloMarkerCircle.value && this.map.removeLayer(this.haloMarkerCircle.value!)
    const targetIcon = icon({
      className: 'target-icon',
      iconUrl: '../../assets/img/target-icon.png',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
    this.targetMarker = marker(
      a_coord,
      {
        icon: targetIcon,
        title: 'target',
        pane: 'overlayPane'
      }).addTo(this.map)
      this.positionActive = true
    if (this.canSetPosition) {
      this.haloMarkerCircle.next(circle(a_coord, {
        className: 'halo',
        radius: this.mapService.targetHalo.value,
        stroke: false,
        fillColor: 'green',
        fillOpacity: this.canShowHalo ? .4 : 0
      }))
      this.haloMarkerCircle.value!.addTo(this.map)
    }
    this.canSetPosition = false
  }
}
