import { AfterViewInit, Component, ElementRef, Input, OnDestroy, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core'
import { MapService } from '../services/map.service'
import { LatLng, Map, Marker, marker } from 'leaflet'
import { Subscription } from 'rxjs'
import { Restaurant } from '../models/restaurant.interface'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: Map
  private _mapSubscription!: Subscription
  private _markers: Marker[] = []
  public oneMarker = true


  constructor(private mapService: MapService) { }

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLElement>

  @ViewChild('popupTemplate', { read: TemplateRef }) public popupTemplate!: TemplateRef<HTMLElement>

  ngAfterViewInit() {
    this.mapService.initMap(this.mapContainer)
    this._mapSubscription = this.mapService.leafletMap$.subscribe(result => this.map = result)
    this.createMarker(this.mapService.coordToLeaflet([-73.9762647707533, 40.76568709665095]), { tooltipContent: 'initial tooltip ;)' })
  }

  ngOnDestroy(): void {
    this._mapSubscription.unsubscribe()
  }

  public restaurantValue?: Restaurant

  @Input() set restaurant(a_value: Restaurant) {
    if (!a_value) { return }
    this.restaurantValue = a_value
    const l_grades: string[] = a_value.grades.length>0 ? a_value.grades.map((grade,i,arr) => (`${grade.score}`)) : ['- none -']
    this.createMarker(this.mapService.coordToLeaflet(a_value.address.coord),
    {
      tooltipContent: a_value.name,
        popupContent: `<div class='markerPopup'>\
      <h3>${a_value?.name }</h3>\
      <div class='cuisine'>${a_value.cuisine}</div>\
      <div class='score'><i class="fa-solid fa-star"></i><span>${l_grades.join(' - ')}</span></div>\
      <div>${a_value.address.building} - ${a_value.address.street}</div>\
      <div class='borough'>${a_value.borough}</div>\
    </div>`
    })
    this.map.setView(this.mapService.coordToLeaflet(a_value.address.coord), 16)
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
      this._markers.forEach(marker => this.map.removeLayer(marker))
      this._markers = []
      return
    } else {
      // remove one marker
      this.map.removeLayer(a_marker)
      this._markers = this._markers.filter(marker => marker.getLatLng() === a_marker.getLatLng())
      return
    }
  }
}
