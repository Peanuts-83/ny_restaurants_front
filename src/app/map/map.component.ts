import { AfterViewInit, Component, ElementRef, Input, OnDestroy, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core'
import { MapService } from '../services/map.service'
import { divIcon, LatLng, LeafletMouseEvent, Map, Marker, marker, latLng, icon, control, circle, Circle, tileLayer, gridLayer } from 'leaflet'
import { Subscription } from 'rxjs'
import { Restaurant } from '../models/restaurant.interface'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private subs: Subscription[] = []
  private map!: Map
  private _markers: Marker[] = []
  public oneMarker = false
  private _targetMarker!: Marker
  public set targetMarker(value: Marker) {
    this._targetMarker = value
    this.mapService.target.next(value)
  }
  public get targetMarker(): Marker {
    return this._targetMarker
  }
  public haloMarker!: Circle

  constructor(private mapService: MapService, private viewContainerRef: ViewContainerRef) { }

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<Map>

  @ViewChild('popupTemplate', { read: TemplateRef }) public popupTemplate!: TemplateRef<HTMLElement>

  public doSetPosition = false

  ngAfterViewInit() {
    this.mapService.initMap(this.mapContainer)
    this.subs.push(this.mapService.leafletMap$.subscribe(result => {
      this.map = result
      this.map.addEventListener('mouseup', (e: LeafletMouseEvent) => {
        if (this.doSetPosition) {
          this.doSetTarget(e)
        }
      })
    }))
    this.subs.push(this.mapService.targetHalo.subscribe(result => {
      if (result) {
        this.haloMarker?.setRadius(result)
        this.haloMarker?.addTo(this.map)
      }
    }))
    // initial marker for test
    this.createMarker(this.mapService.coordToLeaflet([-73.9762647707533, 40.76568709665095]), { tooltipContent: 'initial tooltip ;)' })
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe())
  }

  public restaurantValue?: Restaurant

  @Input() set restaurant(a_value: Restaurant) {
    if (!a_value) {
      this._markers && this._markers.forEach(m => {
        this.map.removeLayer(m)
        this.restaurantValue = undefined
      })
    } else {
      this.restaurantValue = a_value
      const l_grades: string[] = a_value.grades.length > 0 ? a_value.grades.map((grade, i, arr) => (`${grade.grade}`)) : ['- none -']
      // create restaurant marker with options
      this.createMarker(this.mapService.coordToLeaflet(a_value.address.coord),
        {
          tooltipContent: a_value.name,
          popupContent:
            `<div class='markerPopup'>
        <h3>${a_value.name}</h3>
        <div class='cuisine'>${a_value.cuisine}</div>
        <div class='score'><i class="fa-solid fa-star"></i><span>${l_grades.join(' - ')}</span></div>
        <div>${a_value.address.building} - ${a_value.address.street}</div>
        <div class='borough'>${a_value.borough}</div>
      </div>`
        })
      // move to restaurant map zone
      this.map.setView(this.mapService.coordToLeaflet(a_value.address.coord), 16)
    }
  }

  public doSetTarget(a_event: LeafletMouseEvent) {
    this.createTarget(a_event.latlng)
  }

  public createMarker(a_coord: LatLng, a_options?: { popupContent?: any, tooltipContent?: any }) {
    if (this.oneMarker) {
      this.removeMarker()
    }
    const l_marker = marker(a_coord).addTo(this.map)
    a_options?.popupContent && l_marker.bindPopup(a_options.popupContent).openPopup()
    a_options?.tooltipContent && l_marker.bindTooltip(a_options.tooltipContent)
    this._markers.push(l_marker)
  }

  public removeMarker(a_marker?: Marker) {
    if (!a_marker) {
      // remove all markers
      this._markers?.forEach(marker => this.map.removeLayer(marker))
      this._markers = []
    } else {
      // remove one marker
      this.map.removeLayer(a_marker)
      this._markers = this._markers?.filter(marker => marker.getLatLng() === a_marker.getLatLng())
    }
  }

  public createTarget(a_coord: LatLng, a_options?: { popupContent?: any, tooltipContent?: any }) {
    // remove initial target if exist
    this.targetMarker && this.removeMarker(this.targetMarker)
    this.haloMarker && this.map.removeLayer(this.haloMarker)
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
    if (this.doSetPosition) {
      this.haloMarker = circle(a_coord, {
        className: 'halo',
        radius: this.mapService.targetHalo.value,
        stroke: false,
        fillColor: 'green',
        fillOpacity: .4
      });
      this.haloMarker.addTo(this.map)
    }
    this.doSetPosition = false
  }
}
