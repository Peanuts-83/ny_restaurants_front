import { Injectable } from "@angular/core"
import { Observable, of } from "rxjs"
import { BaseApiService } from "src/app/services/base-api.service"
import { InputConf } from "../models/input-conf.interface"
import { CombinedFilter, Operator, OpField, SingleFilter } from "../models/filter-params.interface"

@Injectable({
  providedIn: 'root'
})
export class InfiniteScrollService extends BaseApiService {
  public override apiConf = { baseApi: "" }

  public loadNext<T>(a_config: InputConf, a_items: T[]): Observable<T[]> {
    return this.doPost<T[]>(a_config.service.apiConf.baseApi, a_config.params)
  }
}
