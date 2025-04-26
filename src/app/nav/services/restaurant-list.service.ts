import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { BaseApiService } from "../../services/base-api.service"
import { API } from "../../services/http.service"
import { AppHttpParams, SortWay } from "../../models/filter-params.interface"

@Injectable({
  providedIn: 'root'
})
export class RestaurantListService extends BaseApiService {
  public override apiConf = { baseApi: API.RestaurantApi.LIST }

  public listParams = new BehaviorSubject<AppHttpParams>({ sort: { field: 'name', way: SortWay.ASC } })

}
