import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { AppHttpParams, SortWay } from "src/app/models/filter-params.interface"
import { Restaurant } from "src/app/models/restaurant.interface"
import { BaseApiService } from "src/app/services/base-api.service"
import { API } from "src/app/services/http.service"

@Injectable({
  providedIn: 'root'
})
export class RestaurantListService extends BaseApiService {
  public override apiConf = { baseApi: API.RestaurantApi.LIST }

  public listParams = new BehaviorSubject<AppHttpParams>({ sort: { field: 'name', way: SortWay.ASC } })

}
