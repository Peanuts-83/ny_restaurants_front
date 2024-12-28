import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { Restaurant } from './models/restaurant.interface'
import { MapComponent } from './map/map.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = 'Hungrr';

  public restaurant!:Restaurant

  public showNav = true
  public showHalo!: boolean

  public updateHaloMarkers() {
    this.mapComp.doLoadHaloRestaurants()
  }

  @ViewChild(MapComponent)
  mapComp!: MapComponent
}
