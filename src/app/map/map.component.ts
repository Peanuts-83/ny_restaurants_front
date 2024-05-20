import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { MapService } from '../services/map.service'
import {Map, Marker, latLng, marker} from 'leaflet'
import { Subscription } from 'rxjs'
import { Restaurant } from '../models/restaurant.interface'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!:Map
  private _mapSubscription!: Subscription

  public marker!: Marker

  constructor(private mapService:MapService) {
   }

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLElement>

  ngAfterViewInit() {
    this.mapService.initMap(this.mapContainer)
    this._mapSubscription = this.mapService.leafletMap$.subscribe(result => this.map = result)
    // this.marker = marker([40.76568709665095, -73.9762647707533]).addTo(this.map)
  }

  ngOnDestroy(): void {
    this._mapSubscription.unsubscribe()
  }

  private _restaurant!:Restaurant
  @Input() set restaurant(value:Restaurant) {
    this._restaurant = value
    this.marker = marker(this.mapService.coordToLeaflet(value.address.coord))
      .addTo(this.map)
      // .bindPopup(template)
      .bindTooltip(value.name)
    this.map.setView(this.mapService.coordToLeaflet(value.address.coord),18)
  }
}
