import { Injectable } from "@angular/core"
import { BaseApiService } from "src/app/services/base-api.service"
import { API } from "src/app/services/http.service"

/**
 * Service for distinct boroughs.
 *
 * Get name and centroid coordinates for each borough.
 *
 * @return obj: {coord: [-73.74708102620225, 40.63714303518571], name: "Airport"}
 */
@Injectable({
  providedIn: 'root'
})
export class BoroughDistinctService extends BaseApiService {
  public override apiConf = { baseApi: API.NeighborhoodApi.BRH_DISTINCT }

}
