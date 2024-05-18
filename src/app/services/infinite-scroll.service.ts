import { Injectable } from "@angular/core"
import { Observable, of } from "rxjs"
import { BaseApiService } from "src/app/services/base-api.service"
import { InputConf } from "../models/input-conf.interface"

@Injectable({
  providedIn: 'root'
})
export class InfiniteScrollService extends BaseApiService {
  public override apiConf = { baseApi: "" }

  public loadNext<T>(a_config: InputConf, a_items: T[]): Observable<T[]> {
    // if (a_items.length < a_config.params.nbr! * (a_config.params.page_nbr! - 1)) {
    //   return of([])
    // }
    return this.doPost<T[]>(a_config.service.apiConf.baseApi, a_config.params)
  }
}
