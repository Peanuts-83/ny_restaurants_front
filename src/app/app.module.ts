import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { MapComponent } from './map/map.component'
import { NavComponent } from './nav/nav.component'
import { ReactiveFormsModule } from '@angular/forms'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { InfiniteSelectComponent } from './utils/inputs/infinite-select/infinite-select.component'
import { HttpClientModule } from '@angular/common/http'

import { MatSliderModule } from '@angular/material/slider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatCheckbox } from '@angular/material/checkbox'
import { MatProgressSpinner } from '@angular/material/progress-spinner'
import { MatInput } from '@angular/material/input'


@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    NavComponent,
    InfiniteSelectComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInput,
    MatSelectModule,
    MatSliderModule,
    MatCheckbox,
    MatProgressSpinner
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
