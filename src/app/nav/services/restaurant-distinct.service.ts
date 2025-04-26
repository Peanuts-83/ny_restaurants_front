import { Injectable } from "@angular/core"
import { BaseApiService } from "../../services/base-api.service"
import { API } from "../../services/http.service"

@Injectable({
  providedIn: 'root'
})
export class RestaurantDistinctService extends BaseApiService {
  public override apiConf = { baseApi: API.RestaurantApi.DISTINCT }


}
