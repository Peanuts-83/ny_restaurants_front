import { Injectable } from "@angular/core"
import { BaseApiService } from "src/app/services/base-api.service"
import { API } from "src/app/services/http.service"

@Injectable({
  providedIn: 'root'
})
export class RestaurantListService extends BaseApiService {
  public override apiConf = { baseApi: API.RestaurantApi.LIST }


}
