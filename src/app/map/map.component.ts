import { RestaurantListService } from './../nav/services/restaurant-list.service'
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core'
import { MapService } from '../services/map.service'
import * as L from "leaflet"
import { LatLng, LeafletMouseEvent, Map, Marker, marker, icon, circle, Circle } from 'leaflet'
import { BehaviorSubject, Subscription } from 'rxjs'
import { optionMarker, Restaurant } from '../models/restaurant.interface'
import { AppHttpParams, OpField } from '../models/filter-params.interface'
import { __asyncValues } from 'tslib'
import { HttpService } from '../services/http.service'
// import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine"

const lineOptions: L.Routing.LineOptions = {
  styles: [{ color: 'green', opacity: 1, weight: 3, stroke: true, className: 'route-path', lineCap: 'round', lineJoin: 'round', dashArray: [3, 7], bubblingMouseEvents: true }],
  addWaypoints: true,
  extendToWaypoints: true,
  missingRouteTolerance: 3
}


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnDestroy, OnInit {
  private subs: Subscription[] = []
  private map!: Map
  private routePath!: L.Routing.Control

  private colorAccent = '#FF80AB'

  ngOnInit(): void {
    L.Icon.Default.imagePath = "assets/leaflet/"
  }

  /** markers list selected by user */
  private _markers: Marker[] = []

  /** map option */
  public oneMarker = true

  private _targetMarker!: Marker | undefined
  /** target for user position */
  public set targetMarker(value: Marker | undefined) {
    this._targetMarker = value
    this.mapService.target.next(value)
  }
  public get targetMarker(): Marker | undefined {
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
  public canSetPosition = true
  public positionActive = true

  private _showNav!: boolean
  @Input()
  set showNav(value: boolean) {
    this._showNav = value
    const routingContainer: HTMLDivElement[] = this.elementRef.nativeElement.getElementsByClassName('leaflet-routing-container')
    this.doSetRoutingLevel(routingContainer, value)
  }
  get showNav(): boolean {
    return this._showNav
  }

  private doSetRoutingLevel(container: HTMLDivElement[], showNav?: boolean) {
    if (container?.length > 0) {
      if (!showNav) {
        container[0].className = 'leaflet-routing-container leaflet-bar leaflet-control leaflet-up'
      } else {
        container[0].className = 'leaflet-routing-container leaflet-bar leaflet-control'
      }
    }
  }

  private _canShowHalo = false
  @Input()
  set canShowHalo(value: boolean) {
    if (value !== this._canShowHalo) {
      this._canShowHalo = value
      this.canShowHaloChange.emit(value)
      if (this.haloMarkerCircle.value) {
        const coord = this.haloMarkerCircle.value?.getLatLng()
        if (coord) {
          this.map.removeLayer(this.haloMarkerCircle.value!)
          this.haloMarkerCircle.next(circle(coord, {
            className: 'halo',
            radius: this.mapService.targetHalo.value,
            stroke: false,
            fillColor: this.colorAccent,
            fillOpacity: value ? .3 : 0
          }))
          this.haloMarkerCircle.value?.addTo(this.map)
        }
      }
    }
    if (!value) {
      this.doToggleHalo()
      this.doRemoveMarker(undefined, true)
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


  constructor(private mapService: MapService, private elementRef: ElementRef, public restaurantListService: RestaurantListService, public httpService: HttpService) { }


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
        this.doLoadHaloRestaurants()
      }
    }))
    // halo show and corresponding restaurants show
    this.subs.push(this.haloMarkerCircle.subscribe(result => {
      if (result) {
        if (this.haloRestaurantList?.length > 0) {
          this.haloRestaurantList.forEach(restaurant => this.doCreateMarker(restaurant, false, true))
        } else {
          this.doRemoveMarker(undefined, true)
        }
        this.doLoadHaloRestaurants()
      } else {
        this.doRemoveMarker(undefined, true)
      }
    }))
    // Load target by default
    this.doSetTarget((<LeafletMouseEvent>{ latlng: { lat: 40.766032966124875, lng: -73.97706260143013 } }))
    this.mapService.targetHalo.next(250)
  }

  /**
   * Loads all restaurants in halo zone matching restaurantListService.listParams
   * if no restaurant is selected by user.
   */
  public doLoadHaloRestaurants() {
    if (this.canShowHalo && this.haloMarkerCircle?.value && this.haloMarkerCircle.value.getRadius() > 0) {
      const apiService = this.restaurantListService
      const apiParams: AppHttpParams = {
        ...apiService.listParams.value,
        nbr: 0, // get all
        page_nbr: 1,
        filters: this.httpService.setFilter(Object.values(this.haloMarkerCircle.value.getLatLng()).reverse(), this.haloMarkerCircle.value.getRadius()!, OpField.GEO, this.restaurantListService.listParams.value.filters)
      }
      apiService.doPost<Restaurant[]>(apiService.apiConf.baseApi, apiParams).subscribe(result => {
        this.haloRestaurantList = result.data
        this.doRemoveMarker(undefined, true)
        this.haloRestaurantList.forEach(restaurant => this.doCreateMarker(restaurant, false, true))
      })
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe())
  }

  /** selected restaurant */
  @Input() set restaurant(a_value: Restaurant) {
    if (a_value) {
      this.doRemoveMarker()
      this.map.setView(this.mapService.coordToLeaflet(a_value.address.coord), 16)
      this.doCreateMarker(a_value, true)
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
    const l_marker = marker(l_coord, {
      icon: icon({
        className: 'marker-icon',
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        iconUrl: 'assets/leaflet/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        pane: 'overlayPane',
      }),
      title: a_value.name,
      pane: 'overlayPane',
      draggable: false,
      riseOnHover: true
    }).addTo(this.map)
    // l_options?.popupContent && showPopup && l_marker.bindPopup(l_options.popupContent).openPopup() ||
    l_marker.bindPopup(l_options.popupContent)
    l_options?.tooltipContent && l_marker.bindTooltip(l_options.tooltipContent)
    // make route to target on click
    l_marker.addEventListener('mouseup', (e: LeafletMouseEvent) => {
      if (l_marker.getTooltip()?.isOpen()) {
        l_marker.closePopup()
      } else {
        l_marker.openPopup()
      }
      this.doRouteMarker(e.latlng)
    })
    if (isHalo) {
      this._haloMarkerList.push(l_marker)
    } else {
      this._markers.push(l_marker)
      this.doRouteMarker(this._markers[0].getLatLng())
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


  /**
   * Make route from/to
   * @param a_to
   * @param a_from
   */
  public doRouteMarker(a_to: LatLng, a_from?: LatLng) {
    if (a_from || this.targetMarker) {
      // remove previous route
      this.routePath && this.map.removeControl(this.routePath)
      a_from = a_from || this.targetMarker!.getLatLng()
      this.routePath = L.Routing.control({
        waypoints: [
          L.latLng(a_from),
          L.latLng(a_to)
        ],
        routeWhileDragging: true,
        collapsible: true,
        lineOptions
      })
      this.routePath.addTo(this.map)
      this.routePath.getPlan()
      this.doSetRoutingLevel(this.elementRef.nativeElement.getElementsByClassName('leaflet-routing-container'), this.showNav)
    }
  }

  /**
   * Target on/off
   * @param a_event
   */
  public doToggleTarget(a_event?: MouseEvent) {
    a_event?.stopPropagation()
    if (this.targetMarker) {
      this.positionActive = false
      this.canSetPosition = false
      this.doToggleHalo()
      this.doSetTarget()
    } else {
      this.canSetPosition = true
    }
  }

  // Halo on/off
  public doToggleHalo() {
    this.haloMarkerCircle?.value && this.map?.removeLayer(this.haloMarkerCircle.value!)
    this.haloRestaurantList = []
  }

  /**
   * Map click event for user position simulation
   * @param a_event
   */
  public doSetTarget(a_event?: LeafletMouseEvent) {
    if (a_event) {
      this.canShowHalo = true
      this.doCreateTarget(a_event.latlng)
      this.canShowHalo = true
    } else if (!this.positionActive) {
      this.doRemoveTarget()
    }
  }

  /**
   * Remove target user position from map
   */
  doRemoveTarget() {
    if (this.targetMarker && !this.positionActive) {
      this.doRemoveMarker(this.targetMarker)
      this.routePath && this.map.removeControl(this.routePath)
      this.map.removeLayer(this.targetMarker)
      this.doRemoveMarker(undefined, true)
      this.targetMarker = undefined
    }
  }

  /**
   * Create target user position on map
   * @param a_coord
   * @param a_options
   */
  public doCreateTarget(a_coord: LatLng) {
    // remove initial target if exist
    this.doRemoveTarget()
    this.haloMarkerCircle.value && this.map?.removeLayer(this.haloMarkerCircle.value!)
    const targetIcon = icon({
      className: 'target-icon',
      iconUrl: 'assets/img/target-icon.png',
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
        fillColor: this.colorAccent,
        fillOpacity: this.canShowHalo ? .3 : 0
      }))
      this.haloMarkerCircle.value!.addTo(this.map)
    }
    this.canSetPosition = false
    // make route to target if restaurant selected
    if (this._markers?.length > 0) {
      this.doRouteMarker(this._markers[0].getLatLng())
    }
  }
}
