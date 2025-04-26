import { Injectable } from "@angular/core"
import { Observable } from "rxjs"
import { InputConf } from "../models/input-conf.interface"
import { BaseApiService, HTTPResponse } from "./base-api.service"

@Injectable({
  providedIn: 'root'
})
export class InfiniteScrollService extends BaseApiService {
  public override apiConf = { baseApi: "" }

  public loadNext<T>(a_config: InputConf, a_items: T[]): Observable<HTTPResponse<T[]>> {
    return this.doPost<T[]>(a_config.service.apiConf.baseApi, a_config.params)
  }
}
