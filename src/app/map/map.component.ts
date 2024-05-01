import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MapService } from '../services/map.service'
import {Map} from 'leaflet'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.less']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!:Map
  private _mapSubscription!: Subscription

  constructor(private mapService:MapService) {
   }

  @ViewChild('mapContainer')
  mapContainer!: ElementRef<HTMLElement>

  ngAfterViewInit() {
    this.mapService.initMap(this.mapContainer)
    this._mapSubscription = this.mapService.leafletMap$.subscribe(result => this.map = result)
  }

  ngOnDestroy(): void {
    this._mapSubscription.unsubscribe()
  }
}
