import { ElementRef, Injectable } from '@angular/core';
import { Browser, LatLng, Map, control, map, tileLayer } from 'leaflet'
import { BehaviorSubject } from 'rxjs'
import {environment} from 'src/environments/environment'

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private _initConf = {
    lng:0,
    lat:0,
    zoom:10
  }

  public leafletMap$!:BehaviorSubject<Map>

  constructor() { }

  /**
   * Crée la map dans un BehaviourSubject et l'assigne au container providé.
   * @param a_container
   */
  public initMap(a_container: ElementRef) {
    const l_map: Map = map(a_container.nativeElement).setView(
      [this._initConf.lng, this._initConf.lat], this._initConf.zoom
    )
    const isRetina = Browser.retina
    const apiKey:string = environment['GEOAPIFY_KEY']!
    const baseUrl =
      `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`;
    const retinaUrl =
      `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${apiKey}`;

    // Création de la map (TileLayer)
    tileLayer(isRetina ? retinaUrl : baseUrl, {
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors',
      // Get your Geoapify API key on https://www.geoapify.com/get-started-with-maps-api
      accessToken: apiKey,
      maxZoom: 20,
      id: 'osm-bright'}).addTo(l_map)

    // Controls en bas a droite
    l_map.zoomControl.remove()
    control.zoom({position: 'bottomright'}).addTo(l_map)

    // center on Manhattan
    l_map.setView(new LatLng(40.765744828087435, -73.97910823752092), 15)

    this.leafletMap$ = new BehaviorSubject(l_map)
  }
}
