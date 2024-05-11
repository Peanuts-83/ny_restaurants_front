import { Injectable } from "@angular/core"
import { HttpService } from "./http.service"
import { AppHttpParams } from "../models/filter-params.interface"
import { Observable } from "rxjs"

@Injectable()
export abstract class BaseApiService {
  public abstract apiConf: { baseApi: string }

  constructor(public httpService: HttpService) {}

  public doPost<T>(url:string, params:AppHttpParams): Observable<T> {
    return this.httpService.post<T>(url, params)
  }
}
