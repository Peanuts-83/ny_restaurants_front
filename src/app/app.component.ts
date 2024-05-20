import { Component, ViewEncapsulation } from '@angular/core';
import { Restaurant } from './models/restaurant.interface'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = 'Hungrr';

  public restaurant!:Restaurant
}
